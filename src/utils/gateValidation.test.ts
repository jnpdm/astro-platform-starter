/**
 * Tests for gate validation utilities
 */

import { describe, test, expect } from 'vitest';
import type { PartnerRecord, GateProgress } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';
import {
    isGateComplete,
    areAllQuestionnairesComplete,
    calculateGateStatus,
    canProgressToGate,
    completeGate,
    blockGate,
    getGateBlockers,
    getGateCompletionPercentage,
    initializeGateProgress
} from './gateValidation';

// Helper function to create a mock partner
function createMockPartner(overrides?: Partial<PartnerRecord>): PartnerRecord {
    return {
        id: 'partner-1',
        partnerName: 'Test Partner',
        pamOwner: 'john.doe@example.com',
        contractType: 'PPA',
        tier: 'tier-1',
        ccv: 5000000,
        lrp: 10000000,
        currentGate: 'pre-contract',
        gates: {},
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        ...overrides
    };
}

// Helper function to create a mock gate progress
function createMockGateProgress(gateId: string, overrides?: Partial<GateProgress>): GateProgress {
    return {
        gateId,
        status: 'not-started',
        questionnaires: {},
        approvals: [],
        ...overrides
    };
}

// Helper function to create a mock submission
function createMockSubmission(
    id: string,
    questionnaireId: string,
    overallStatus: 'pass' | 'fail' | 'partial' | 'pending' = 'pass'
): QuestionnaireSubmission {
    return {
        id,
        questionnaireId,
        version: '1.0.0',
        partnerId: 'partner-1',
        sections: [],
        sectionStatuses: {},
        overallStatus,
        signature: {
            type: 'typed',
            data: 'John Doe',
            signerName: 'John Doe',
            signerEmail: 'john.doe@example.com',
            timestamp: new Date(),
            ipAddress: '127.0.0.1'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
        submittedBy: 'john.doe@example.com',
        submittedByRole: 'PAM',
        ipAddress: '127.0.0.1'
    };
}

describe('isGateComplete', () => {
    test('returns true when gate status is passed', () => {
        const gateProgress = createMockGateProgress('gate-0', { status: 'passed' });
        expect(isGateComplete(gateProgress)).toBe(true);
    });

    test('returns false when gate status is not passed', () => {
        const statuses: Array<'not-started' | 'in-progress' | 'failed' | 'blocked'> = [
            'not-started',
            'in-progress',
            'failed',
            'blocked'
        ];

        statuses.forEach(status => {
            const gateProgress = createMockGateProgress('gate-0', { status });
            expect(isGateComplete(gateProgress)).toBe(false);
        });
    });
});

describe('areAllQuestionnairesComplete', () => {
    test('returns true when all required questionnaires are submitted and passed', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass')
        };

        expect(areAllQuestionnairesComplete(gateProgress, submissions)).toBe(true);
    });

    test('returns false when questionnaire submission is missing', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {}
        });

        const submissions = {};

        expect(areAllQuestionnairesComplete(gateProgress, submissions)).toBe(false);
    });

    test('returns false when questionnaire submission failed', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'fail')
        };

        expect(areAllQuestionnairesComplete(gateProgress, submissions)).toBe(false);
    });

    test('returns true for gates with no required questionnaires', () => {
        const gateProgress = createMockGateProgress('post-launch', {
            questionnaires: {}
        });

        const submissions = {};

        expect(areAllQuestionnairesComplete(gateProgress, submissions)).toBe(true);
    });
});

describe('calculateGateStatus', () => {
    test('returns not-started when no submissions exist', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {}
        });

        const submissions = {};

        expect(calculateGateStatus(gateProgress, submissions)).toBe('not-started');
    });

    test('returns passed when all questionnaires are complete and passed', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass')
        };

        expect(calculateGateStatus(gateProgress, submissions)).toBe('passed');
    });

    test('returns failed when any questionnaire failed', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'fail')
        };

        expect(calculateGateStatus(gateProgress, submissions)).toBe('failed');
    });

    test('returns in-progress when questionnaires are partial or pending', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'partial')
        };

        expect(calculateGateStatus(gateProgress, submissions)).toBe('in-progress');
    });

    test('returns passed for post-launch gate when started', () => {
        const gateProgress = createMockGateProgress('post-launch', {
            startedDate: new Date()
        });

        const submissions = {};

        expect(calculateGateStatus(gateProgress, submissions)).toBe('passed');
    });
});

describe('canProgressToGate', () => {
    test('allows progression to pre-contract without prerequisites', () => {
        const partner = createMockPartner();
        const submissions = {};

        const result = canProgressToGate(partner, 'pre-contract', submissions);
        expect(result.canProgress).toBe(true);
    });

    test('blocks progression when previous gate not started', () => {
        const partner = createMockPartner({
            gates: {}
        });
        const submissions = {};

        const result = canProgressToGate(partner, 'gate-0', submissions);
        expect(result.canProgress).toBe(false);
        expect(result.reason).toContain('has not been started');
    });

    test('blocks progression when previous gate not passed', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'in-progress',
                    questionnaires: {
                        'pre-contract-pdm': 'submission-1'
                    }
                })
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'partial')
        };

        const result = canProgressToGate(partner, 'gate-0', submissions);
        expect(result.canProgress).toBe(false);
        expect(result.reason).toContain('must be completed');
    });

    test('allows progression when previous gate is passed', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'passed',
                    questionnaires: {
                        'pre-contract-pdm': 'submission-1'
                    }
                })
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass')
        };

        const result = canProgressToGate(partner, 'gate-0', submissions);
        expect(result.canProgress).toBe(true);
    });

    test('validates entire gate chain', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'passed',
                    questionnaires: {
                        'pre-contract-pdm': 'submission-1'
                    }
                }),
                'gate-0': createMockGateProgress('gate-0', {
                    status: 'passed',
                    questionnaires: {
                        'gate-0-kickoff': 'submission-2'
                    }
                })
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass'),
            'submission-2': createMockSubmission('submission-2', 'gate-0-kickoff', 'pass')
        };

        const result = canProgressToGate(partner, 'gate-1', submissions);
        expect(result.canProgress).toBe(true);
    });
});

describe('completeGate', () => {
    test('marks gate as passed and adds approval', () => {
        const partner = createMockPartner({
            currentGate: 'pre-contract',
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'in-progress',
                    questionnaires: {
                        'pre-contract-pdm': 'submission-1'
                    }
                })
            }
        });

        const signature = { type: 'typed' as const, data: 'John Doe' };
        const updatedPartner = completeGate(
            partner,
            'pre-contract',
            'john.doe@example.com',
            'PAM',
            signature,
            'All criteria met'
        );

        expect(updatedPartner.gates['pre-contract'].status).toBe('passed');
        expect(updatedPartner.gates['pre-contract'].completedDate).toBeDefined();
        expect(updatedPartner.gates['pre-contract'].approvals).toHaveLength(1);
        expect(updatedPartner.gates['pre-contract'].approvals[0].approvedBy).toBe('john.doe@example.com');
        expect(updatedPartner.gates['pre-contract'].approvals[0].notes).toBe('All criteria met');
    });

    test('advances current gate to next gate', () => {
        const partner = createMockPartner({
            currentGate: 'pre-contract',
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'in-progress'
                })
            }
        });

        const signature = { type: 'typed' as const, data: 'John Doe' };
        const updatedPartner = completeGate(
            partner,
            'pre-contract',
            'john.doe@example.com',
            'PAM',
            signature
        );

        expect(updatedPartner.currentGate).toBe('gate-0');
        expect(updatedPartner.gates['gate-0']).toBeDefined();
        expect(updatedPartner.gates['gate-0'].status).toBe('not-started');
    });

    test('clears blockers when gate is completed', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'blocked',
                    blockers: ['Missing executive sponsorship']
                })
            }
        });

        const signature = { type: 'typed' as const, data: 'John Doe' };
        const updatedPartner = completeGate(
            partner,
            'pre-contract',
            'john.doe@example.com',
            'PAM',
            signature
        );

        expect(updatedPartner.gates['pre-contract'].blockers).toEqual([]);
    });

    test('throws error when gate not found', () => {
        const partner = createMockPartner({
            gates: {}
        });

        const signature = { type: 'typed' as const, data: 'John Doe' };
        expect(() => {
            completeGate(partner, 'pre-contract', 'john.doe@example.com', 'PAM', signature);
        }).toThrow('Gate pre-contract not found');
    });
});

describe('blockGate', () => {
    test('marks gate as blocked with reasons', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'in-progress'
                })
            }
        });

        const blockers = ['Missing executive sponsorship', 'CCV below threshold'];
        const updatedPartner = blockGate(partner, 'pre-contract', blockers);

        expect(updatedPartner.gates['pre-contract'].status).toBe('blocked');
        expect(updatedPartner.gates['pre-contract'].blockers).toEqual(blockers);
    });

    test('throws error when gate not found', () => {
        const partner = createMockPartner({
            gates: {}
        });

        expect(() => {
            blockGate(partner, 'pre-contract', ['Test blocker']);
        }).toThrow('Gate pre-contract not found');
    });
});

describe('getGateBlockers', () => {
    test('returns empty array when no blockers exist', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'passed',
                    questionnaires: {
                        'pre-contract-pdm': 'submission-1'
                    }
                })
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass')
        };

        const blockers = getGateBlockers(partner, 'gate-0', submissions);
        expect(blockers).toEqual([]);
    });

    test('returns progression blockers', () => {
        const partner = createMockPartner({
            gates: {}
        });

        const submissions = {};

        const blockers = getGateBlockers(partner, 'gate-0', submissions);
        expect(blockers.length).toBeGreaterThan(0);
        expect(blockers[0]).toContain('has not been started');
    });

    test('returns gate-specific blockers', () => {
        const partner = createMockPartner({
            gates: {
                'pre-contract': createMockGateProgress('pre-contract', {
                    status: 'blocked',
                    blockers: ['Missing documentation', 'Incomplete questionnaire']
                })
            }
        });

        const submissions = {};

        const blockers = getGateBlockers(partner, 'pre-contract', submissions);
        expect(blockers).toContain('Missing documentation');
        expect(blockers).toContain('Incomplete questionnaire');
    });
});

describe('getGateCompletionPercentage', () => {
    test('returns 0 for not-started gate', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            status: 'not-started',
            questionnaires: {}
        });

        const submissions = {};

        const percentage = getGateCompletionPercentage(gateProgress, submissions);
        expect(percentage).toBe(0);
    });

    test('returns 100 for passed gate', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            status: 'passed',
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'pass')
        };

        const percentage = getGateCompletionPercentage(gateProgress, submissions);
        expect(percentage).toBe(100);
    });

    test('returns 50 for gate with one of two questionnaires complete', () => {
        const gateProgress = createMockGateProgress('gate-1', {
            status: 'in-progress',
            questionnaires: {
                'gate-1-ready-to-sell': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'gate-1-ready-to-sell', 'pass')
        };

        const percentage = getGateCompletionPercentage(gateProgress, submissions);
        expect(percentage).toBe(100); // gate-1 only has one questionnaire
    });

    test('returns 0 for gate with submissions but none passed', () => {
        const gateProgress = createMockGateProgress('pre-contract', {
            status: 'in-progress',
            questionnaires: {
                'pre-contract-pdm': 'submission-1'
            }
        });

        const submissions = {
            'submission-1': createMockSubmission('submission-1', 'pre-contract-pdm', 'fail')
        };

        const percentage = getGateCompletionPercentage(gateProgress, submissions);
        expect(percentage).toBe(0);
    });
});

describe('initializeGateProgress', () => {
    test('creates new gate progress with default values', () => {
        const gateProgress = initializeGateProgress('gate-0');

        expect(gateProgress.gateId).toBe('gate-0');
        expect(gateProgress.status).toBe('not-started');
        expect(gateProgress.questionnaires).toEqual({});
        expect(gateProgress.approvals).toEqual([]);
        expect(gateProgress.startedDate).toBeUndefined();
        expect(gateProgress.completedDate).toBeUndefined();
        expect(gateProgress.blockers).toBeUndefined();
    });
});
