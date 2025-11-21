/**
 * Gate validation utilities
 * Provides functions to check gate completion, validate progression, and calculate gate status
 */

import type { PartnerRecord, GateId, GateStatus, GateProgress } from '../types/partner';
import type { QuestionnaireSubmission, SubmissionStatus } from '../types/submission';
import gatesConfig from '../config/gates.json';

/**
 * Gate progression order
 */
const GATE_ORDER: GateId[] = [
    'pre-contract',
    'gate-0',
    'gate-1',
    'gate-2',
    'gate-3',
    'post-launch'
];

/**
 * Get the index of a gate in the progression order
 */
function getGateIndex(gateId: GateId): number {
    return GATE_ORDER.indexOf(gateId);
}

/**
 * Get the previous gate in the progression order
 */
function getPreviousGate(gateId: GateId): GateId | null {
    const index = getGateIndex(gateId);
    if (index <= 0) {
        return null;
    }
    return GATE_ORDER[index - 1];
}

/**
 * Get the next gate in the progression order
 */
function getNextGate(gateId: GateId): GateId | null {
    const index = getGateIndex(gateId);
    if (index < 0 || index >= GATE_ORDER.length - 1) {
        return null;
    }
    return GATE_ORDER[index + 1];
}

/**
 * Check if a gate is complete based on its status
 */
export function isGateComplete(gateProgress: GateProgress): boolean {
    return gateProgress.status === 'passed';
}

/**
 * Check if all required questionnaires for a gate have been submitted and passed
 */
export function areAllQuestionnairesComplete(
    gateProgress: GateProgress,
    submissions: Record<string, QuestionnaireSubmission>
): boolean {
    const gateConfig = gatesConfig.gates.find(g => g.id === gateProgress.gateId);
    if (!gateConfig) {
        return false;
    }

    // Check if all required questionnaires have submissions
    const requiredQuestionnaires = gateConfig.questionnaires;
    if (requiredQuestionnaires.length === 0) {
        // No questionnaires required for this gate (e.g., post-launch)
        return true;
    }

    for (const questionnaireId of requiredQuestionnaires) {
        const submissionId = gateProgress.questionnaires[questionnaireId];
        if (!submissionId) {
            // Missing submission for required questionnaire
            return false;
        }

        const submission = submissions[submissionId];
        if (!submission) {
            // Submission not found
            return false;
        }

        // Check if submission passed
        if (submission.overallStatus !== 'pass') {
            return false;
        }
    }

    return true;
}

/**
 * Calculate the status of a gate based on questionnaire submissions
 * @param gateProgress - The gate progress record
 * @param submissions - Map of submission IDs to submission objects
 * @returns The calculated gate status
 */
export function calculateGateStatus(
    gateProgress: GateProgress,
    submissions: Record<string, QuestionnaireSubmission>
): GateStatus {
    const gateConfig = gatesConfig.gates.find(g => g.id === gateProgress.gateId);
    if (!gateConfig) {
        return 'not-started';
    }

    // If gate has no questionnaires (e.g., post-launch), check if it's been started
    if (gateConfig.questionnaires.length === 0) {
        return gateProgress.startedDate ? 'passed' : 'not-started';
    }

    // Check if any questionnaires have been started
    const hasAnySubmissions = Object.keys(gateProgress.questionnaires).length > 0;
    if (!hasAnySubmissions) {
        return 'not-started';
    }

    // Check if all questionnaires are complete and passed
    const allComplete = areAllQuestionnairesComplete(gateProgress, submissions);
    if (allComplete) {
        return 'passed';
    }

    // Check if any questionnaires have failed
    let hasFailures = false;
    let hasPartial = false;

    for (const questionnaireId of gateConfig.questionnaires) {
        const submissionId = gateProgress.questionnaires[questionnaireId];
        if (!submissionId) {
            continue;
        }

        const submission = submissions[submissionId];
        if (!submission) {
            continue;
        }

        if (submission.overallStatus === 'fail') {
            hasFailures = true;
        } else if (submission.overallStatus === 'partial' || submission.overallStatus === 'pending') {
            hasPartial = true;
        }
    }

    if (hasFailures) {
        return 'failed';
    }

    // Gate is in progress
    return 'in-progress';
}

/**
 * Check if a partner can progress to a specific gate
 * @param partner - The partner record
 * @param targetGate - The gate to check progression to
 * @param submissions - Map of submission IDs to submission objects
 * @returns Object with canProgress boolean and optional reason
 */
export function canProgressToGate(
    partner: PartnerRecord,
    targetGate: GateId,
    submissions: Record<string, QuestionnaireSubmission>
): { canProgress: boolean; reason?: string } {
    const targetIndex = getGateIndex(targetGate);

    if (targetIndex < 0) {
        return {
            canProgress: false,
            reason: 'Invalid gate ID'
        };
    }

    // Can always access pre-contract
    if (targetGate === 'pre-contract') {
        return { canProgress: true };
    }

    // Check if all previous gates are complete
    const previousGate = getPreviousGate(targetGate);
    if (!previousGate) {
        return { canProgress: true };
    }

    const previousGateProgress = partner.gates[previousGate];
    if (!previousGateProgress) {
        return {
            canProgress: false,
            reason: `Previous gate (${previousGate}) has not been started`
        };
    }

    // Calculate the status of the previous gate
    const previousGateStatus = calculateGateStatus(previousGateProgress, submissions);

    if (previousGateStatus !== 'passed') {
        const gateConfig = gatesConfig.gates.find(g => g.id === previousGate);
        const gateName = gateConfig?.name || previousGate;
        return {
            canProgress: false,
            reason: `Previous gate "${gateName}" must be completed before progressing to ${targetGate}`
        };
    }

    return { canProgress: true };
}

/**
 * Update partner record when a gate is completed
 * @param partner - The partner record to update
 * @param gateId - The gate that was completed
 * @param approvedBy - The user who approved the gate
 * @param approvedByRole - The role of the approving user
 * @param signature - The approval signature
 * @returns Updated partner record
 */
export function completeGate(
    partner: PartnerRecord,
    gateId: GateId,
    approvedBy: string,
    approvedByRole: string,
    signature: { type: 'typed' | 'drawn'; data: string },
    notes?: string
): PartnerRecord {
    const updatedPartner = { ...partner };
    const gateProgress = updatedPartner.gates[gateId];

    if (!gateProgress) {
        throw new Error(`Gate ${gateId} not found in partner record`);
    }

    // Update gate progress
    gateProgress.status = 'passed';
    gateProgress.completedDate = new Date();

    // Add approval
    gateProgress.approvals.push({
        approvedBy,
        approvedByRole: approvedByRole as any,
        approvedAt: new Date(),
        signature,
        notes
    });

    // Clear any blockers
    gateProgress.blockers = [];

    // Update current gate to next gate if available
    const nextGate = getNextGate(gateId);
    if (nextGate) {
        updatedPartner.currentGate = nextGate;

        // Initialize next gate if not already present
        if (!updatedPartner.gates[nextGate]) {
            updatedPartner.gates[nextGate] = {
                gateId: nextGate,
                status: 'not-started',
                questionnaires: {},
                approvals: []
            };
        }
    }

    // Update metadata
    updatedPartner.updatedAt = new Date();

    return updatedPartner;
}

/**
 * Block a gate with specific reasons
 * @param partner - The partner record to update
 * @param gateId - The gate to block
 * @param blockers - Array of reasons why the gate is blocked
 * @returns Updated partner record
 */
export function blockGate(
    partner: PartnerRecord,
    gateId: GateId,
    blockers: string[]
): PartnerRecord {
    const updatedPartner = { ...partner };
    const gateProgress = updatedPartner.gates[gateId];

    if (!gateProgress) {
        throw new Error(`Gate ${gateId} not found in partner record`);
    }

    gateProgress.status = 'blocked';
    gateProgress.blockers = blockers;
    updatedPartner.updatedAt = new Date();

    return updatedPartner;
}

/**
 * Get all blockers preventing progression to a gate
 * @param partner - The partner record
 * @param targetGate - The gate to check
 * @param submissions - Map of submission IDs to submission objects
 * @returns Array of blocker descriptions
 */
export function getGateBlockers(
    partner: PartnerRecord,
    targetGate: GateId,
    submissions: Record<string, QuestionnaireSubmission>
): string[] {
    const blockers: string[] = [];

    // Check if can progress
    const { canProgress, reason } = canProgressToGate(partner, targetGate, submissions);
    if (!canProgress && reason) {
        blockers.push(reason);
    }

    // Check current gate's blockers
    const gateProgress = partner.gates[targetGate];
    if (gateProgress?.blockers) {
        blockers.push(...gateProgress.blockers);
    }

    return blockers;
}

/**
 * Get the completion percentage for a gate
 * @param gateProgress - The gate progress record
 * @param submissions - Map of submission IDs to submission objects
 * @returns Percentage (0-100)
 */
export function getGateCompletionPercentage(
    gateProgress: GateProgress,
    submissions: Record<string, QuestionnaireSubmission>
): number {
    const gateConfig = gatesConfig.gates.find(g => g.id === gateProgress.gateId);
    if (!gateConfig || gateConfig.questionnaires.length === 0) {
        return gateProgress.status === 'passed' ? 100 : 0;
    }

    const totalQuestionnaires = gateConfig.questionnaires.length;
    let completedQuestionnaires = 0;

    for (const questionnaireId of gateConfig.questionnaires) {
        const submissionId = gateProgress.questionnaires[questionnaireId];
        if (!submissionId) {
            continue;
        }

        const submission = submissions[submissionId];
        if (submission && submission.overallStatus === 'pass') {
            completedQuestionnaires++;
        }
    }

    return Math.round((completedQuestionnaires / totalQuestionnaires) * 100);
}

/**
 * Initialize a new gate progress record
 * @param gateId - The gate ID
 * @returns New gate progress record
 */
export function initializeGateProgress(gateId: GateId): GateProgress {
    return {
        gateId,
        status: 'not-started',
        questionnaires: {},
        approvals: []
    };
}
