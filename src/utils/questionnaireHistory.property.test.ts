/**
 * Property-based tests for questionnaire history display
 * Feature: hub-improvements, Property 20: Questionnaire history display
 * Validates: Requirements 7.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireSubmission } from '../types/submission';
import type { UserRole } from '../types/partner';

/**
 * Interface for questionnaire history item display
 */
export interface QuestionnaireHistoryItem {
    submissionId: string;
    questionnaireId: string;
    submittedAt: Date;
    updatedAt: Date;
    wasEdited: boolean;
    lastUpdatedDate: string;
}

/**
 * Check if a submission was edited (updatedAt > createdAt)
 */
export function wasSubmissionEdited(submission: QuestionnaireSubmission): boolean {
    if (!submission.updatedAt || !submission.createdAt) {
        return false;
    }
    return new Date(submission.updatedAt).getTime() > new Date(submission.createdAt).getTime();
}

/**
 * Format a submission for history display
 */
export function formatSubmissionForHistory(submission: QuestionnaireSubmission): QuestionnaireHistoryItem {
    const wasEdited = wasSubmissionEdited(submission);

    return {
        submissionId: submission.id,
        questionnaireId: submission.questionnaireId,
        submittedAt: submission.submittedAt || submission.createdAt,
        updatedAt: submission.updatedAt,
        wasEdited,
        lastUpdatedDate: wasEdited ? formatDate(submission.updatedAt) : ''
    };
}

/**
 * Format date for display
 */
function formatDate(date: Date | string | undefined): string {
    if (!date) return 'Not set';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Check if all submissions are displayed in history
 */
export function areAllSubmissionsDisplayed(
    submissions: QuestionnaireSubmission[],
    historyItems: QuestionnaireHistoryItem[]
): boolean {
    if (submissions.length !== historyItems.length) {
        return false;
    }

    // Check that each submission has a corresponding history item
    for (const submission of submissions) {
        const historyItem = historyItems.find(item => item.submissionId === submission.id);
        if (!historyItem) {
            return false;
        }
    }

    return true;
}

/**
 * Generator for safe field names (excluding prototype pollution risks)
 */
const safeFieldNameArbitrary = fc.string({ minLength: 1, maxLength: 30 }).filter(
    name => !['__proto__', 'constructor', 'prototype'].includes(name)
);

/**
 * Generator for section data
 */
const sectionDataArbitrary = fc.record({
    sectionId: fc.string({ minLength: 1, maxLength: 50 }),
    fields: fc.dictionary(
        safeFieldNameArbitrary,
        fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined)
        )
    ),
    status: fc.record({
        result: fc.constantFrom('pass', 'fail', 'pending'),
        evaluatedAt: fc.option(fc.date(), { nil: undefined }),
        evaluatedBy: fc.option(fc.string(), { nil: undefined }),
        notes: fc.option(fc.string(), { nil: undefined }),
        failureReasons: fc.option(fc.array(fc.string()), { nil: undefined })
    })
});

/**
 * Generator for questionnaire submissions
 */
const submissionArbitrary = fc.record({
    id: fc.uuid(),
    questionnaireId: fc.constantFrom('pre-contract-pdm', 'gate-0-kickoff', 'gate-1-ready-to-sell', 'gate-2-ready-to-order', 'gate-3-ready-to-deliver'),
    version: fc.constant('1.0.0'),
    partnerId: fc.uuid(),
    sections: fc.array(sectionDataArbitrary, { minLength: 1, maxLength: 10 }),
    sectionStatuses: fc.constant({}),
    overallStatus: fc.constantFrom('pass', 'fail', 'partial', 'pending'),
    signature: fc.record({
        type: fc.constantFrom('typed', 'drawn'),
        data: fc.string(),
        signerName: fc.string({ minLength: 1, maxLength: 50 }),
        signerEmail: fc.emailAddress(),
        timestamp: fc.date(),
        ipAddress: fc.ipV4(),
        userAgent: fc.string()
    }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    submittedAt: fc.option(fc.date(), { nil: undefined }),
    submittedBy: fc.emailAddress(),
    submittedByRole: fc.constantFrom<UserRole>('PAM', 'PDM', 'TAM', 'PSM'),
    ipAddress: fc.ipV4(),
    userAgent: fc.option(fc.string(), { nil: undefined })
});

describe('Questionnaire History Display Properties', () => {
    /**
     * Property 20: Questionnaire history display
     * For any partner with questionnaire submissions, the partner detail page 
     * should display all submissions with their last updated dates.
     * 
     * **Feature: hub-improvements, Property 20: Questionnaire history display**
     * **Validates: Requirements 7.7**
     */
    it('should display all submissions with their last updated dates', () => {
        fc.assert(
            fc.property(
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 10 }),
                (submissions) => {
                    const historyItems = submissions.map(formatSubmissionForHistory);

                    // All submissions should be displayed
                    expect(areAllSubmissionsDisplayed(submissions, historyItems)).toBe(true);

                    // Each history item should have required fields
                    historyItems.forEach(item => {
                        expect(item.submissionId).toBeTruthy();
                        expect(item.questionnaireId).toBeTruthy();
                        expect(item.submittedAt).toBeInstanceOf(Date);
                        expect(item.updatedAt).toBeInstanceOf(Date);
                        expect(typeof item.wasEdited).toBe('boolean');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Edited submissions should show last updated date
     */
    it('should show last updated date for edited submissions', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (baseSubmission) => {
                    // Create an edited submission (updatedAt > createdAt)
                    const editedSubmission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        createdAt: new Date(Date.now() - 10000), // 10 seconds ago
                        updatedAt: new Date(Date.now() - 1000)   // 1 second ago
                    };

                    const historyItem = formatSubmissionForHistory(editedSubmission);

                    // Should be marked as edited
                    expect(historyItem.wasEdited).toBe(true);

                    // Should have last updated date
                    expect(historyItem.lastUpdatedDate).toBeTruthy();
                    expect(historyItem.lastUpdatedDate).not.toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Non-edited submissions should not show last updated date
     */
    it('should not show last updated date for non-edited submissions', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (baseSubmission) => {
                    // Create a non-edited submission (updatedAt === createdAt)
                    const createdDate = new Date(Date.now() - 10000);
                    const nonEditedSubmission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        createdAt: createdDate,
                        updatedAt: createdDate
                    };

                    const historyItem = formatSubmissionForHistory(nonEditedSubmission);

                    // Should not be marked as edited
                    expect(historyItem.wasEdited).toBe(false);

                    // Should not have last updated date
                    expect(historyItem.lastUpdatedDate).toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: wasEdited flag should be consistent with timestamps
     */
    it('should correctly determine if submission was edited based on timestamps', () => {
        fc.assert(
            fc.property(
                fc.date(),
                fc.date(),
                (createdAt, updatedAt) => {
                    const submission: QuestionnaireSubmission = {
                        id: 'test-id',
                        questionnaireId: 'gate-0-kickoff',
                        version: '1.0.0',
                        partnerId: 'partner-id',
                        sections: [],
                        sectionStatuses: {},
                        overallStatus: 'pending',
                        signature: {
                            type: 'typed',
                            data: 'test',
                            signerName: 'Test',
                            signerEmail: 'test@test.com',
                            timestamp: new Date(),
                            ipAddress: '0.0.0.0',
                            userAgent: 'test'
                        },
                        createdAt,
                        updatedAt,
                        submittedBy: 'test@test.com',
                        submittedByRole: 'PAM',
                        ipAddress: '0.0.0.0'
                    };

                    const wasEdited = wasSubmissionEdited(submission);
                    const expectedEdited = new Date(updatedAt).getTime() > new Date(createdAt).getTime();

                    expect(wasEdited).toBe(expectedEdited);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: History items should preserve submission IDs
     */
    it('should preserve submission IDs in history items', () => {
        fc.assert(
            fc.property(
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 20 }),
                (submissions) => {
                    const historyItems = submissions.map(formatSubmissionForHistory);

                    // Each submission ID should appear exactly once in history
                    submissions.forEach(submission => {
                        const matchingItems = historyItems.filter(
                            item => item.submissionId === submission.id
                        );
                        expect(matchingItems.length).toBe(1);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: History items count should match submissions count
     */
    it('should have same number of history items as submissions', () => {
        fc.assert(
            fc.property(
                fc.array(submissionArbitrary, { minLength: 0, maxLength: 50 }),
                (submissions) => {
                    const historyItems = submissions.map(formatSubmissionForHistory);

                    expect(historyItems.length).toBe(submissions.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty submissions list should produce empty history
     */
    it('should produce empty history for empty submissions list', () => {
        const submissions: QuestionnaireSubmission[] = [];
        const historyItems = submissions.map(formatSubmissionForHistory);

        expect(historyItems.length).toBe(0);
        expect(areAllSubmissionsDisplayed(submissions, historyItems)).toBe(true);
    });

    /**
     * Property: All history items should have valid questionnaire IDs
     */
    it('should have valid questionnaire IDs in all history items', () => {
        fc.assert(
            fc.property(
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 10 }),
                (submissions) => {
                    const historyItems = submissions.map(formatSubmissionForHistory);

                    const validQuestionnaireIds = [
                        'pre-contract-pdm',
                        'gate-0-kickoff',
                        'gate-1-ready-to-sell',
                        'gate-2-ready-to-order',
                        'gate-3-ready-to-deliver'
                    ];

                    historyItems.forEach(item => {
                        expect(validQuestionnaireIds).toContain(item.questionnaireId);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
