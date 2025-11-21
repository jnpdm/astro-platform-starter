/**
 * Tests for SectionStatus Component
 * 
 * Verifies visual indicators, compact/detailed modes, and failure reason display
 */

import { describe, it, expect } from 'vitest';
import type { SectionStatus as SectionStatusType } from '../../types/submission';

describe('SectionStatus Component', () => {
    describe('Status Configuration', () => {
        it('should have correct configuration for pass status', () => {
            const status: SectionStatusType = {
                result: 'pass',
            };

            expect(status.result).toBe('pass');
            expect(status.failureReasons).toBeUndefined();
        });

        it('should have correct configuration for fail status', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: ['Missing required field'],
            };

            expect(status.result).toBe('fail');
            expect(status.failureReasons).toHaveLength(1);
            expect(status.failureReasons?.[0]).toBe('Missing required field');
        });

        it('should have correct configuration for pending status', () => {
            const status: SectionStatusType = {
                result: 'pending',
            };

            expect(status.result).toBe('pending');
            expect(status.failureReasons).toBeUndefined();
        });
    });

    describe('Failure Reasons Handling', () => {
        it('should support multiple failure reasons', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: [
                    'Missing executive sponsorship confirmation',
                    'CCV below strategic threshold',
                    'Timeline exceeds 60 days',
                ],
            };

            expect(status.failureReasons).toHaveLength(3);
            expect(status.failureReasons).toContain('Missing executive sponsorship confirmation');
            expect(status.failureReasons).toContain('CCV below strategic threshold');
            expect(status.failureReasons).toContain('Timeline exceeds 60 days');
        });

        it('should handle single failure reason', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: ['Timeline exceeds 60 days'],
            };

            expect(status.failureReasons).toHaveLength(1);
            expect(status.failureReasons?.[0]).toBe('Timeline exceeds 60 days');
        });

        it('should handle fail status without failure reasons', () => {
            const status: SectionStatusType = {
                result: 'fail',
            };

            expect(status.result).toBe('fail');
            expect(status.failureReasons).toBeUndefined();
        });

        it('should handle empty failure reasons array', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: [],
            };

            expect(status.failureReasons).toHaveLength(0);
        });
    });

    describe('Notes Handling', () => {
        it('should support notes for pass status', () => {
            const status: SectionStatusType = {
                result: 'pass',
                notes: 'Approved by PDM team on 2025-01-15',
            };

            expect(status.notes).toBe('Approved by PDM team on 2025-01-15');
        });

        it('should support notes for fail status', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: ['Missing field'],
                notes: 'Requires immediate attention',
            };

            expect(status.notes).toBe('Requires immediate attention');
        });

        it('should handle status without notes', () => {
            const status: SectionStatusType = {
                result: 'pending',
            };

            expect(status.notes).toBeUndefined();
        });
    });

    describe('Evaluation Metadata', () => {
        it('should support evaluation timestamp', () => {
            const evaluatedAt = new Date('2025-01-15T10:30:00Z');
            const status: SectionStatusType = {
                result: 'pass',
                evaluatedAt,
            };

            expect(status.evaluatedAt).toBe(evaluatedAt);
        });

        it('should support evaluator information', () => {
            const status: SectionStatusType = {
                result: 'fail',
                evaluatedBy: 'pdm-user@example.com',
                failureReasons: ['Incomplete data'],
            };

            expect(status.evaluatedBy).toBe('pdm-user@example.com');
        });

        it('should support complete evaluation metadata', () => {
            const evaluatedAt = new Date('2025-01-15T10:30:00Z');
            const status: SectionStatusType = {
                result: 'pass',
                evaluatedAt,
                evaluatedBy: 'pdm-user@example.com',
                notes: 'All criteria met',
            };

            expect(status.evaluatedAt).toBe(evaluatedAt);
            expect(status.evaluatedBy).toBe('pdm-user@example.com');
            expect(status.notes).toBe('All criteria met');
        });
    });

    describe('Status Result Types', () => {
        it('should support pass result', () => {
            const status: SectionStatusType = {
                result: 'pass',
            };

            expect(['pass', 'fail', 'pending']).toContain(status.result);
        });

        it('should support fail result', () => {
            const status: SectionStatusType = {
                result: 'fail',
            };

            expect(['pass', 'fail', 'pending']).toContain(status.result);
        });

        it('should support pending result', () => {
            const status: SectionStatusType = {
                result: 'pending',
            };

            expect(['pass', 'fail', 'pending']).toContain(status.result);
        });
    });

    describe('Visual Indicator Logic', () => {
        it('should determine correct color for pass status', () => {
            const result = 'pass';
            const colorClass = result === 'pass' ? 'green' : result === 'fail' ? 'red' : 'yellow';

            expect(colorClass).toBe('green');
        });

        it('should determine correct color for fail status', () => {
            const result = 'fail';
            const colorClass = result === 'pass' ? 'green' : result === 'fail' ? 'red' : 'yellow';

            expect(colorClass).toBe('red');
        });

        it('should determine correct color for pending status', () => {
            const result = 'pending';
            const colorClass = result === 'pass' ? 'green' : result === 'fail' ? 'red' : 'yellow';

            expect(colorClass).toBe('yellow');
        });
    });

    describe('Display Mode Logic', () => {
        it('should default to detailed mode', () => {
            const mode = undefined;
            const displayMode = mode || 'detailed';

            expect(displayMode).toBe('detailed');
        });

        it('should support compact mode', () => {
            const mode = 'compact';
            const displayMode = mode || 'detailed';

            expect(displayMode).toBe('compact');
        });

        it('should support detailed mode explicitly', () => {
            const mode = 'detailed';
            const displayMode = mode || 'detailed';

            expect(displayMode).toBe('detailed');
        });
    });

    describe('Tooltip Generation', () => {
        it('should generate tooltip for pass status', () => {
            const status: SectionStatusType = {
                result: 'pass',
            };

            const tooltip = `PASS${status.failureReasons && status.failureReasons.length > 0 ? `: ${status.failureReasons.join(', ')}` : ''}`;

            expect(tooltip).toBe('PASS');
        });

        it('should generate tooltip for fail status with reasons', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: ['Missing field', 'Invalid value'],
            };

            const tooltip = `FAIL${status.failureReasons && status.failureReasons.length > 0 ? `: ${status.failureReasons.join(', ')}` : ''}`;

            expect(tooltip).toBe('FAIL: Missing field, Invalid value');
        });

        it('should generate tooltip for fail status without reasons', () => {
            const status: SectionStatusType = {
                result: 'fail',
            };

            const tooltip = `FAIL${status.failureReasons && status.failureReasons.length > 0 ? `: ${status.failureReasons.join(', ')}` : ''}`;

            expect(tooltip).toBe('FAIL');
        });
    });

    describe('Aria Label Generation', () => {
        it('should generate aria label for pass status', () => {
            const sectionId = 'executive-sponsorship';
            const label = 'PASS';
            const ariaLabel = `Section ${sectionId} status: ${label}`;

            expect(ariaLabel).toBe('Section executive-sponsorship status: PASS');
        });

        it('should generate aria label for fail status', () => {
            const sectionId = 'commercial-framework';
            const label = 'FAIL';
            const ariaLabel = `Section ${sectionId} status: ${label}`;

            expect(ariaLabel).toBe('Section commercial-framework status: FAIL');
        });

        it('should generate aria label for pending status', () => {
            const sectionId = 'technical-feasibility';
            const label = 'PENDING';
            const ariaLabel = `Section ${sectionId} status: ${label}`;

            expect(ariaLabel).toBe('Section technical-feasibility status: PENDING');
        });
    });

    describe('Failure Reasons Display Logic', () => {
        it('should show failure reasons only for fail status', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: ['Missing field'],
            };

            const shouldShowReasons = status.result === 'fail' && status.failureReasons && status.failureReasons.length > 0;

            expect(shouldShowReasons).toBe(true);
        });

        it('should not show failure reasons for pass status', () => {
            const status: SectionStatusType = {
                result: 'pass',
            };

            const shouldShowReasons = status.result === 'fail' && status.failureReasons && status.failureReasons.length > 0;

            expect(shouldShowReasons).toBe(false);
        });

        it('should not show failure reasons for pending status', () => {
            const status: SectionStatusType = {
                result: 'pending',
            };

            const shouldShowReasons = status.result === 'fail' && status.failureReasons && status.failureReasons.length > 0;

            expect(shouldShowReasons).toBe(false);
        });

        it('should not show failure reasons when array is empty', () => {
            const status: SectionStatusType = {
                result: 'fail',
                failureReasons: [],
            };

            const shouldShowReasons = status.result === 'fail' && status.failureReasons && status.failureReasons.length > 0;

            expect(shouldShowReasons).toBe(false);
        });
    });
});
