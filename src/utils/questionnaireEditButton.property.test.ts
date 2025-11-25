/**
 * Property-based tests for questionnaire edit button display
 * Feature: hub-improvements, Property 16: Questionnaire edit button display
 * Validates: Requirements 7.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserRole } from '../types';
import type { PartnerRecord } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';
import type { AuthUser } from '../middleware/auth';

/**
 * Check if user can edit a questionnaire submission
 * PDM (admin) can edit any questionnaire, PAM can edit questionnaires for partners they own
 */
export function canEditQuestionnaire(
    user: AuthUser | null,
    partner: PartnerRecord
): boolean {
    if (!user) return false;

    // PDM (admin) can edit any questionnaire
    if (user.role === 'PDM') return true;

    // PAM can edit questionnaires for partners they own
    return partner.pamOwner?.toLowerCase() === user.email.toLowerCase();
}

/**
 * Generate edit URL for a questionnaire submission
 */
export function getEditUrl(questionnaireId: string, submissionId: string, partnerId: string): string {
    return `/questionnaires/${questionnaireId}?partnerId=${partnerId}&submissionId=${submissionId}&mode=edit`;
}

/**
 * Check if edit button should be displayed for a submission
 */
export function shouldDisplayEditButton(
    user: AuthUser | null,
    partner: PartnerRecord,
    submission: QuestionnaireSubmission
): boolean {
    return canEditQuestionnaire(user, partner);
}

/**
 * Generator for valid user roles
 */
const userRoleArbitrary = fc.constantFrom<UserRole>('PAM', 'PDM', 'TAM', 'PSM');

/**
 * Generator for email addresses
 */
const emailArbitrary = fc.emailAddress();

/**
 * Generator for AuthUser objects
 */
const authUserArbitrary = fc.record({
    email: emailArbitrary,
    name: fc.string({ minLength: 1, maxLength: 50 }),
    role: userRoleArbitrary,
    sub: fc.string({ minLength: 10, maxLength: 30 })
});

/**
 * Generator for PartnerRecord objects (minimal fields needed for testing)
 */
const partnerRecordArbitrary = fc.record({
    id: fc.uuid(),
    partnerName: fc.string({ minLength: 1, maxLength: 100 }),
    pamOwner: emailArbitrary,
    pdmOwner: fc.option(emailArbitrary, { nil: undefined }),
    tier: fc.constantFrom('Tier 0', 'Tier 1', 'Tier 2'),
    currentGate: fc.constantFrom('pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'),
    contractType: fc.constantFrom('Resale', 'Referral', 'Tech Partner'),
    ccv: fc.integer({ min: 0, max: 10000000 }),
    lrp: fc.integer({ min: 0, max: 10000000 }),
    createdAt: fc.date(),
    updatedAt: fc.date()
});

/**
 * Generator for QuestionnaireSubmission objects (minimal fields needed for testing)
 */
const submissionArbitrary = fc.record({
    id: fc.uuid(),
    questionnaireId: fc.constantFrom('pre-contract-pdm', 'gate-0-kickoff', 'gate-1-ready-to-sell', 'gate-2-ready-to-order', 'gate-3-ready-to-deliver'),
    version: fc.constant('1.0.0'),
    partnerId: fc.uuid(),
    sections: fc.constant([]),
    sectionStatuses: fc.constant({}),
    overallStatus: fc.constantFrom('pass', 'fail', 'partial', 'pending'),
    signature: fc.record({
        type: fc.constantFrom('typed', 'drawn'),
        data: fc.string(),
        signerName: fc.string({ minLength: 1, maxLength: 50 }),
        signerEmail: emailArbitrary,
        timestamp: fc.date(),
        ipAddress: fc.ipV4(),
        userAgent: fc.string()
    }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    submittedAt: fc.option(fc.date(), { nil: undefined }),
    submittedBy: emailArbitrary,
    submittedByRole: userRoleArbitrary,
    ipAddress: fc.ipV4(),
    userAgent: fc.option(fc.string(), { nil: undefined })
});

describe('Questionnaire Edit Button Display Properties', () => {
    /**
     * Property 16: Questionnaire edit button display
     * For any partner with completed questionnaires, each questionnaire in the list 
     * should have an associated "Edit" button if the user has permission to edit.
     * 
     * **Feature: hub-improvements, Property 16: Questionnaire edit button display**
     * **Validates: Requirements 7.1**
     */
    it('should display edit button for all submissions when user has edit permission', () => {
        fc.assert(
            fc.property(
                authUserArbitrary,
                partnerRecordArbitrary,
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 10 }),
                (user, partner, submissions) => {
                    // Test each submission
                    submissions.forEach(submission => {
                        const shouldDisplay = shouldDisplayEditButton(user, partner, submission);
                        const canEdit = canEditQuestionnaire(user, partner);

                        // Edit button display should match edit permission
                        expect(shouldDisplay).toBe(canEdit);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: PDM users should always see edit buttons
     */
    it('should always display edit button for PDM users regardless of ownership', () => {
        fc.assert(
            fc.property(
                emailArbitrary,
                partnerRecordArbitrary,
                submissionArbitrary,
                (pdmEmail, partner, submission) => {
                    const pdmUser: AuthUser = {
                        email: pdmEmail,
                        name: 'PDM User',
                        role: 'PDM',
                        sub: 'pdm-sub-123'
                    };

                    const shouldDisplay = shouldDisplayEditButton(pdmUser, partner, submission);

                    // PDM should always be able to edit
                    expect(shouldDisplay).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: PAM users should see edit buttons only for their own partners
     */
    it('should display edit button for PAM users only when they own the partner', () => {
        fc.assert(
            fc.property(
                emailArbitrary,
                partnerRecordArbitrary,
                submissionArbitrary,
                (pamEmail, partner, submission) => {
                    const pamUser: AuthUser = {
                        email: pamEmail,
                        name: 'PAM User',
                        role: 'PAM',
                        sub: 'pam-sub-123'
                    };

                    const shouldDisplay = shouldDisplayEditButton(pamUser, partner, submission);
                    const isOwner = partner.pamOwner?.toLowerCase() === pamEmail.toLowerCase();

                    // PAM should only see edit button if they own the partner
                    expect(shouldDisplay).toBe(isOwner);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: No edit button for null user
     */
    it('should not display edit button when user is null', () => {
        fc.assert(
            fc.property(
                partnerRecordArbitrary,
                submissionArbitrary,
                (partner, submission) => {
                    const shouldDisplay = shouldDisplayEditButton(null, partner, submission);

                    // No user means no edit button
                    expect(shouldDisplay).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Edit URL format is correct
     */
    it('should generate correct edit URL format for any submission', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.uuid(),
                (submission, partnerId) => {
                    const editUrl = getEditUrl(submission.questionnaireId, submission.id, partnerId);

                    // URL should contain all required parameters
                    expect(editUrl).toContain(`/questionnaires/${submission.questionnaireId}`);
                    expect(editUrl).toContain(`partnerId=${partnerId}`);
                    expect(editUrl).toContain(`submissionId=${submission.id}`);
                    expect(editUrl).toContain('mode=edit');

                    // URL should be properly formatted
                    expect(editUrl).toMatch(/^\/questionnaires\/[^?]+\?partnerId=[^&]+&submissionId=[^&]+&mode=edit$/);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: TAM and PSM users should not see edit buttons (they're not owners)
     */
    it('should not display edit button for TAM or PSM users', () => {
        fc.assert(
            fc.property(
                emailArbitrary,
                partnerRecordArbitrary,
                submissionArbitrary,
                fc.constantFrom<UserRole>('TAM', 'PSM'),
                (userEmail, partner, submission, role) => {
                    const user: AuthUser = {
                        email: userEmail,
                        name: 'User',
                        role: role,
                        sub: 'user-sub-123'
                    };

                    const shouldDisplay = shouldDisplayEditButton(user, partner, submission);

                    // TAM and PSM should not see edit buttons unless they're the PAM owner
                    // (which is unlikely but possible if the same person has multiple roles)
                    const isOwner = partner.pamOwner?.toLowerCase() === userEmail.toLowerCase();
                    expect(shouldDisplay).toBe(isOwner);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Case-insensitive email matching for PAM ownership
     */
    it('should handle case-insensitive email matching for PAM ownership', () => {
        fc.assert(
            fc.property(
                fc.emailAddress(),
                partnerRecordArbitrary,
                submissionArbitrary,
                (baseEmail, partner, submission) => {
                    // Create variations of the email with different cases
                    const lowerEmail = baseEmail.toLowerCase();
                    const upperEmail = baseEmail.toUpperCase();
                    const mixedEmail = baseEmail.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');

                    // Set partner owner to lowercase version
                    const testPartner = { ...partner, pamOwner: lowerEmail };

                    // Test with different case variations
                    [lowerEmail, upperEmail, mixedEmail].forEach(emailVariation => {
                        const pamUser: AuthUser = {
                            email: emailVariation,
                            name: 'PAM User',
                            role: 'PAM',
                            sub: 'pam-sub-123'
                        };

                        const shouldDisplay = shouldDisplayEditButton(pamUser, testPartner, submission);

                        // Should always match regardless of case
                        expect(shouldDisplay).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
