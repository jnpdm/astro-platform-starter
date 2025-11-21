/**
 * Gate 0: Onboarding Kickoff Questionnaire Wrapper
 * 
 * This component wraps the QuestionnaireForm and adds:
 * - Section status calculation based on pass/fail criteria
 * - Signature capture integration
 * - Automatic qualification logic for Tier 0 partners (CCV ≥$50M)
 * - Block progression if fewer than 4 criteria met
 * - Submission to API
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useState } from 'react';
import QuestionnaireForm from './QuestionnaireForm';
import { SignatureCapture } from './SignatureCapture';
import SectionStatus from './SectionStatus';
import type { QuestionnaireConfig } from '../../types/questionnaire';
import type { SubmissionData, SectionStatus as SectionStatusType } from '../../types/submission';
import type { Signature } from '../../types/signature';

interface Gate0QuestionnaireProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode: 'edit' | 'view';
}

export default function Gate0Questionnaire({
    config,
    existingData,
    partnerId,
    mode,
}: Gate0QuestionnaireProps) {
    const [showSignature, setShowSignature] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState<SubmissionData | null>(null);
    const [signature, setSignature] = useState<Signature | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [calculatedStatuses, setCalculatedStatuses] = useState<Record<string, SectionStatusType>>({});

    /**
     * Calculate section status based on pass/fail criteria
     */
    const calculateSectionStatus = (
        sectionId: string,
        fields: Record<string, any>
    ): SectionStatusType => {
        const section = config.sections.find((s) => s.id === sectionId);
        if (!section || !section.passFailCriteria) {
            return { result: 'pending' };
        }

        const { passFailCriteria } = section;

        // Manual evaluation - always pending until manually reviewed
        if (passFailCriteria.type === 'manual') {
            return { result: 'pending' };
        }

        // Automatic evaluation based on rules
        if (passFailCriteria.type === 'automatic' && passFailCriteria.rules) {
            const failureReasons: string[] = [];
            let allRulesPassed = true;

            for (const rule of passFailCriteria.rules) {
                // Support both 'field' and 'fieldId' for backwards compatibility
                const fieldId = (rule as any).fieldId || (rule as any).field;
                const fieldValue = fields[fieldId];
                let rulePassed = false;

                switch (rule.operator) {
                    case 'equals':
                        rulePassed = fieldValue === rule.value;
                        break;
                    case 'notEquals':
                        rulePassed = fieldValue !== rule.value;
                        break;
                    case 'greaterThan':
                        rulePassed = Number(fieldValue) > Number(rule.value);
                        break;
                    case 'lessThan':
                        rulePassed = Number(fieldValue) < Number(rule.value);
                        break;
                    case 'contains':
                        if (Array.isArray(fieldValue)) {
                            rulePassed = fieldValue.includes(rule.value);
                        } else {
                            rulePassed = String(fieldValue).includes(String(rule.value));
                        }
                        break;
                    case 'notContains':
                        if (Array.isArray(fieldValue)) {
                            rulePassed = !fieldValue.includes(rule.value);
                        } else {
                            rulePassed = !String(fieldValue).includes(String(rule.value));
                        }
                        break;
                    case 'in':
                        if (Array.isArray(rule.value)) {
                            rulePassed = rule.value.includes(fieldValue);
                        } else {
                            rulePassed = false;
                        }
                        break;
                }

                if (!rulePassed) {
                    allRulesPassed = false;
                    const defaultMessage = `${section.title}: Required criteria not met`;
                    failureReasons.push(rule.failureMessage || defaultMessage);
                }
            }

            return {
                result: allRulesPassed ? 'pass' : 'fail',
                evaluatedAt: new Date(),
                failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
            };
        }

        return { result: 'pending' };
    };

    /**
     * Check if partner qualifies for white-glove onboarding
     * Tier 0 partners (CCV ≥ $50M) automatically qualify
     * Other partners must meet at least 4 of 6 criteria
     */
    const checkQualification = (statuses: Record<string, SectionStatusType>, allFields: Record<string, any>): {
        qualifies: boolean;
        reason: string;
        isTier0: boolean;
        passedSections: number;
    } => {
        // Check if Tier 0 partner
        const ccvAmount = Number(allFields['ccv-amount']) || 0;
        const isTier0 = ccvAmount >= 50000000;

        // Count passing sections
        const passedSections = Object.values(statuses).filter((s) => s.result === 'pass').length;
        const totalSections = Object.keys(statuses).length;

        if (isTier0) {
            return {
                qualifies: true,
                reason: 'Tier 0 partner (CCV ≥ $50M) automatically qualifies for white-glove onboarding',
                isTier0: true,
                passedSections,
            };
        }

        // Non-Tier 0 partners must meet at least 4 of 6 criteria
        const qualifies = passedSections >= 4;
        const reason = qualifies
            ? `Partner meets ${passedSections} of ${totalSections} criteria (minimum 4 required)`
            : `Partner only meets ${passedSections} of ${totalSections} criteria. Minimum 4 required for white-glove onboarding.`;

        return {
            qualifies,
            reason,
            isTier0: false,
            passedSections,
        };
    };

    /**
     * Handle form submission - show signature capture
     */
    const handleFormSubmit = async (data: SubmissionData) => {
        // Calculate section statuses
        const statuses: Record<string, SectionStatusType> = {};
        const allFields: Record<string, any> = {};

        data.sections.forEach((section) => {
            statuses[section.sectionId] = calculateSectionStatus(section.sectionId, section.fields);
            Object.assign(allFields, section.fields);
        });

        setCalculatedStatuses(statuses);
        setPendingSubmission(data);
        setShowSignature(true);
        setSubmitError(null);
    };

    /**
     * Handle signature capture
     */
    const handleSignature = async (sig: Signature) => {
        if (!pendingSubmission) return;

        setSignature(sig);
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Collect all fields for qualification check
            const allFields: Record<string, any> = {};
            pendingSubmission.sections.forEach((section) => {
                Object.assign(allFields, section.fields);
            });

            // Check qualification
            const qualification = checkQualification(calculatedStatuses, allFields);

            // Determine overall status
            const overallStatus = qualification.qualifies ? 'pass' : 'fail';

            // Prepare submission payload
            const submissionPayload = {
                questionnaireId: config.id,
                version: config.version,
                partnerId: partnerId,
                sections: pendingSubmission.sections.map((section) => ({
                    ...section,
                    status: calculatedStatuses[section.sectionId] || { result: 'pending' },
                })),
                sectionStatuses: calculatedStatuses,
                overallStatus: overallStatus,
                signature: sig,
                submittedBy: sig.signerEmail,
                submittedByRole: 'PDM', // Default to PDM for Gate 0
                submittedAt: new Date().toISOString(),
                metadata: {
                    qualification: qualification,
                },
            };

            // Submit to API
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit questionnaire');
            }

            const result = await response.json();
            console.log('Submission successful:', result);

            setSubmitSuccess(true);
            setShowSignature(false);

            // Redirect to success page or dashboard after a delay
            setTimeout(() => {
                window.location.href = `/?success=true&submissionId=${result.data.id}`;
            }, 2000);
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit questionnaire');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Cancel signature and go back to form
     */
    const handleCancelSignature = () => {
        setShowSignature(false);
        setPendingSubmission(null);
        setSignature(null);
    };

    // Show success message
    if (submitSuccess) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <svg
                            className="w-16 h-16 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-900 mb-2">
                        Questionnaire Submitted Successfully!
                    </h2>
                    <p className="text-green-700 mb-4">
                        Your Gate 0: Onboarding Kickoff questionnaire has been submitted and saved.
                    </p>
                    <p className="text-sm text-green-600">
                        Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // Show signature capture
    if (showSignature && pendingSubmission) {
        // Collect all fields for qualification check
        const allFields: Record<string, any> = {};
        pendingSubmission.sections.forEach((section) => {
            Object.assign(allFields, section.fields);
        });

        const qualification = checkQualification(calculatedStatuses, allFields);

        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Review and Sign</h2>

                    {/* Section Status Summary */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Section Status Summary</h3>
                        <div className="space-y-3">
                            {config.sections.map((section) => {
                                const status = calculatedStatuses[section.id];
                                return (
                                    <div key={section.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{section.title}</p>
                                        </div>
                                        <div>
                                            {status && <SectionStatus sectionId={section.id} status={status} mode="detailed" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Qualification Status */}
                    <div className={`mb-6 p-4 border rounded-md ${qualification.qualifies
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <p className="text-sm font-medium mb-2 ${
                            qualification.qualifies ? 'text-green-900' : 'text-red-900'
                        }">
                            White-Glove Onboarding Qualification
                        </p>
                        <p className={`text-sm ${qualification.qualifies ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {qualification.qualifies ? '✓' : '✗'} {qualification.reason}
                        </p>
                        {qualification.isTier0 && (
                            <p className="text-xs text-green-700 mt-2">
                                🌟 Tier 0 Partner - Automatic Qualification
                            </p>
                        )}
                        {!qualification.qualifies && (
                            <p className="text-xs text-red-700 mt-2">
                                ⚠️ Partner does not qualify for white-glove onboarding. Additional criteria must be met.
                            </p>
                        )}
                    </div>

                    {/* Overall Status */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-2">Overall Assessment</p>
                        <p className="text-sm text-blue-800">
                            Passed {qualification.passedSections} of {config.sections.length} sections.
                            {qualification.qualifies
                                ? ' Partner qualifies for white-glove onboarding support.'
                                : ' Partner does not meet minimum requirements for white-glove onboarding.'}
                        </p>
                    </div>

                    {/* Signature Capture */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Digital Signature Required</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide your digital signature to confirm the accuracy of this submission.
                            Your signature will be recorded with a timestamp and IP address for audit purposes.
                        </p>
                        <SignatureCapture onSignature={handleSignature} disabled={isSubmitting} />
                    </div>

                    {/* Error Message */}
                    {submitError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{submitError}</p>
                        </div>
                    )}

                    {/* Cancel Button */}
                    <div className="flex justify-start">
                        <button
                            type="button"
                            onClick={handleCancelSignature}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Back to Form
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show questionnaire form
    return (
        <div>
            <QuestionnaireForm
                config={config}
                existingData={existingData}
                mode={mode}
                onSubmit={handleFormSubmit}
                partnerId={partnerId}
            />
        </div>
    );
}
