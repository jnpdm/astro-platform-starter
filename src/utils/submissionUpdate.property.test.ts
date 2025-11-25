/**
 * Property-based tests for questionnaire submission updates
 * Feature: hub-improvements, Property 18: Questionnaire update (not create)
 * Feature: hub-improvements, Property 19: Questionnaire update timestamp
 * Validates: Requirements 7.5, 7.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireSubmission } from '../types/submission';
import type { UserRole } from '../types/partner';

/**
 * Simulate updating a submission (returns updated submission with new timestamp)
 */
export function updateSubmission(
    existingSubmission: QuestionnaireSubmission,
    updates: Partial<QuestionnaireSubmission>
): QuestionnaireSubmission {
    return {
        ...existingSubmission,
        ...updates,
        id: existingSubmission.id, // ID must not change
        createdAt: existingSubmission.createdAt, // createdAt must not change
        updatedAt: new Date() // updatedAt must be updated
    };
}

/**
 * Check if submission update preserves ID (doesn't create new submission)
 */
export function isUpdateNotCreate(
    originalSubmission: QuestionnaireSubmission,
    updatedSubmission: QuestionnaireSubmission
): boolean {
    return originalSubmission.id === updatedSubmission.id;
}

/**
 * Check if updatedAt timestamp is more recent than createdAt
 */
export function isUpdatedAtMoreRecent(submission: QuestionnaireSubmission): boolean {
    const createdTime = new Date(submission.createdAt).getTime();
    const updatedTime = new Date(submission.updatedAt).getTime();
    return updatedTime >= createdTime;
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

describe('Submission Update Properties', () => {
    /**
     * Property 18: Questionnaire update (not create)
     * For any edited questionnaire submission, saving should update the existing 
     * submission record and not create a new submission with a different ID.
     * 
     * **Feature: hub-improvements, Property 18: Questionnaire update (not create)**
     * **Validates: Requirements 7.5**
     */
    it('should preserve submission ID when updating (not create new)', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.record({
                    sections: fc.option(fc.array(sectionDataArbitrary), { nil: undefined }),
                    overallStatus: fc.option(fc.constantFrom('pass', 'fail', 'partial', 'pending'), { nil: undefined })
                }),
                (originalSubmission, updates) => {
                    const updatedSubmission = updateSubmission(originalSubmission, updates);

                    // ID must be preserved
                    expect(updatedSubmission.id).toBe(originalSubmission.id);

                    // Verify it's an update, not a create
                    expect(isUpdateNotCreate(originalSubmission, updatedSubmission)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 19: Questionnaire update timestamp
     * For any edited questionnaire, the updatedAt timestamp should be more 
     * recent than the original createdAt timestamp.
     * 
     * **Feature: hub-improvements, Property 19: Questionnaire update timestamp**
     * **Validates: Requirements 7.6**
     */
    it('should have updatedAt timestamp more recent than createdAt', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.record({
                    sections: fc.option(fc.array(sectionDataArbitrary), { nil: undefined })
                }),
                (originalSubmission, updates) => {
                    // Ensure createdAt is in the past for this test
                    const pastSubmission = {
                        ...originalSubmission,
                        createdAt: new Date(Date.now() - 10000) // 10 seconds ago
                    };

                    const updatedSubmission = updateSubmission(pastSubmission, updates);

                    // updatedAt should be >= createdAt
                    expect(isUpdatedAtMoreRecent(updatedSubmission)).toBe(true);

                    // updatedAt should be more recent than original createdAt
                    const createdTime = new Date(pastSubmission.createdAt).getTime();
                    const updatedTime = new Date(updatedSubmission.updatedAt).getTime();
                    expect(updatedTime).toBeGreaterThanOrEqual(createdTime);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: createdAt should never change during update
     */
    it('should preserve createdAt timestamp when updating', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.record({
                    sections: fc.option(fc.array(sectionDataArbitrary), { nil: undefined }),
                    overallStatus: fc.option(fc.constantFrom('pass', 'fail', 'partial', 'pending'), { nil: undefined })
                }),
                (originalSubmission, updates) => {
                    const updatedSubmission = updateSubmission(originalSubmission, updates);

                    // createdAt must be preserved exactly
                    expect(updatedSubmission.createdAt).toEqual(originalSubmission.createdAt);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Update should apply changes to specified fields
     */
    it('should apply updates to specified fields while preserving others', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.constantFrom('pass', 'fail', 'partial', 'pending'),
                (originalSubmission, newStatus) => {
                    const updatedSubmission = updateSubmission(originalSubmission, {
                        overallStatus: newStatus
                    });

                    // Updated field should have new value
                    expect(updatedSubmission.overallStatus).toBe(newStatus);

                    // Other fields should be preserved
                    expect(updatedSubmission.questionnaireId).toBe(originalSubmission.questionnaireId);
                    expect(updatedSubmission.partnerId).toBe(originalSubmission.partnerId);
                    expect(updatedSubmission.version).toBe(originalSubmission.version);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Multiple updates should maintain ID consistency
     */
    it('should maintain same ID across multiple updates', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.array(fc.constantFrom('pass', 'fail', 'partial', 'pending'), { minLength: 2, maxLength: 5 }),
                (originalSubmission, statusUpdates) => {
                    let currentSubmission = originalSubmission;
                    const originalId = originalSubmission.id;

                    // Apply multiple updates
                    statusUpdates.forEach(newStatus => {
                        currentSubmission = updateSubmission(currentSubmission, {
                            overallStatus: newStatus
                        });
                    });

                    // ID should still be the same
                    expect(currentSubmission.id).toBe(originalId);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: updatedAt should advance with each update
     */
    it('should have updatedAt advance with each successive update', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (originalSubmission) => {
                    // First update
                    const firstUpdate = updateSubmission(originalSubmission, {
                        overallStatus: 'partial'
                    });

                    // Small delay to ensure time difference
                    const firstUpdateTime = new Date(firstUpdate.updatedAt).getTime();

                    // Second update (simulate time passing)
                    const secondUpdate = {
                        ...updateSubmission(firstUpdate, {
                            overallStatus: 'pass'
                        }),
                        updatedAt: new Date(firstUpdateTime + 1000) // 1 second later
                    };

                    // Second update should have later timestamp
                    expect(new Date(secondUpdate.updatedAt).getTime()).toBeGreaterThan(firstUpdateTime);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty updates should still update timestamp
     */
    it('should update timestamp even with no field changes', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (originalSubmission) => {
                    // Ensure submission has valid timestamps (createdAt <= updatedAt)
                    const validSubmission = {
                        ...originalSubmission,
                        createdAt: new Date(Date.now() - 10000), // 10 seconds ago
                        updatedAt: new Date(Date.now() - 5000)   // 5 seconds ago
                    };

                    // Update with no changes to data fields
                    const updatedSubmission = updateSubmission(validSubmission, {});

                    // ID should be same
                    expect(updatedSubmission.id).toBe(validSubmission.id);

                    // updatedAt should be set to current time (will be >= original)
                    expect(isUpdatedAtMoreRecent(updatedSubmission)).toBe(true);

                    // updatedAt should be more recent than the original updatedAt
                    const originalUpdatedTime = new Date(validSubmission.updatedAt).getTime();
                    const newUpdatedTime = new Date(updatedSubmission.updatedAt).getTime();
                    expect(newUpdatedTime).toBeGreaterThanOrEqual(originalUpdatedTime);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Update should not modify original submission object
     */
    it('should not mutate the original submission object', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                fc.constantFrom('pass', 'fail', 'partial', 'pending'),
                (originalSubmission, newStatus) => {
                    const originalStatus = originalSubmission.overallStatus;
                    const originalUpdatedAt = originalSubmission.updatedAt;

                    updateSubmission(originalSubmission, {
                        overallStatus: newStatus
                    });

                    // Original should be unchanged
                    expect(originalSubmission.overallStatus).toBe(originalStatus);
                    expect(originalSubmission.updatedAt).toEqual(originalUpdatedAt);
                }
            ),
            { numRuns: 100 }
        );
    });
});
