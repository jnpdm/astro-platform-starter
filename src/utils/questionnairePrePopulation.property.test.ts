/**
 * Property-based tests for questionnaire pre-population in edit mode
 * Feature: hub-improvements, Property 17: Questionnaire pre-population
 * Validates: Requirements 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireSubmission } from '../types/submission';
import type { UserRole } from '../types/partner';

/**
 * Extract form field values from a submission for pre-population
 */
export function extractFormValues(submission: QuestionnaireSubmission): Record<string, any> {
    const formValues: Record<string, any> = {};

    submission.sections.forEach(section => {
        Object.entries(section.fields).forEach(([fieldId, value]) => {
            formValues[fieldId] = value;
        });
    });

    return formValues;
}

/**
 * Check if all unique field IDs from submission are present in form values
 * Note: When there are duplicate field IDs, only the last occurrence value is checked
 */
export function areAllFieldsPrePopulated(
    submission: QuestionnaireSubmission,
    formValues: Record<string, any>
): boolean {
    // Build a map of field ID to last occurrence value
    const lastOccurrence = new Map<string, any>();
    submission.sections.forEach(section => {
        Object.entries(section.fields).forEach(([fieldId, value]) => {
            lastOccurrence.set(fieldId, value);
        });
    });

    // Check that all unique field IDs are present with correct values
    for (const [fieldId, expectedValue] of lastOccurrence.entries()) {
        if (!(fieldId in formValues)) {
            return false;
        }
        if (formValues[fieldId] !== expectedValue) {
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

describe('Questionnaire Pre-Population Properties', () => {
    /**
     * Property 17: Questionnaire pre-population
     * For any questionnaire loaded in edit mode, all form fields should be 
     * pre-populated with values from the existing submission.
     * 
     * **Feature: hub-improvements, Property 17: Questionnaire pre-population**
     * **Validates: Requirements 7.3**
     */
    it('should extract all field values from submission for pre-population', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (submission) => {
                    const formValues = extractFormValues(submission);

                    // Collect all unique field IDs
                    const allFieldIds = new Set<string>();
                    submission.sections.forEach(section => {
                        Object.keys(section.fields).forEach(fieldId => {
                            allFieldIds.add(fieldId);
                        });
                    });

                    // All unique field IDs should be in formValues
                    allFieldIds.forEach(fieldId => {
                        expect(formValues).toHaveProperty(fieldId);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: All fields are pre-populated correctly
     */
    it('should verify all fields from submission are present in form values', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (submission) => {
                    const formValues = extractFormValues(submission);
                    const allFieldsPresent = areAllFieldsPrePopulated(submission, formValues);

                    expect(allFieldsPresent).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty submission should produce empty form values
     */
    it('should return empty form values for submission with no fields', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (baseSubmission) => {
                    // Create submission with empty sections
                    const emptySubmission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        sections: []
                    };

                    const formValues = extractFormValues(emptySubmission);

                    expect(Object.keys(formValues).length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Field count should match unique fields in submission
     */
    it('should extract exactly the number of unique fields in submission', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (submission) => {
                    const formValues = extractFormValues(submission);

                    // Count unique field IDs in submission
                    const uniqueFieldIds = new Set<string>();
                    submission.sections.forEach(section => {
                        Object.keys(section.fields).forEach(fieldId => {
                            uniqueFieldIds.add(fieldId);
                        });
                    });

                    expect(Object.keys(formValues).length).toBe(uniqueFieldIds.size);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Pre-population should preserve field types for last occurrence
     */
    it('should preserve field value types during extraction', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (submission) => {
                    const formValues = extractFormValues(submission);

                    // Build a map of field ID to last occurrence value
                    const lastOccurrence = new Map<string, any>();
                    submission.sections.forEach(section => {
                        Object.entries(section.fields).forEach(([fieldId, value]) => {
                            lastOccurrence.set(fieldId, value);
                        });
                    });

                    // Check that extracted values match last occurrence
                    lastOccurrence.forEach((expectedValue, fieldId) => {
                        const extractedValue = formValues[fieldId];

                        // Type should be preserved
                        expect(typeof extractedValue).toBe(typeof expectedValue);

                        // Value should be identical
                        expect(extractedValue).toBe(expectedValue);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Multiple sections should all contribute fields
     */
    it('should extract fields from all sections in submission', () => {
        fc.assert(
            fc.property(
                fc.array(sectionDataArbitrary, { minLength: 2, maxLength: 5 }),
                submissionArbitrary,
                (sections, baseSubmission) => {
                    const submission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        sections
                    };

                    const formValues = extractFormValues(submission);

                    // Each section should contribute its fields
                    sections.forEach(section => {
                        Object.keys(section.fields).forEach(fieldId => {
                            expect(formValues).toHaveProperty(fieldId);
                        });
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Duplicate field IDs across sections should use last value
     */
    it('should handle duplicate field IDs by using the last occurrence', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string(),
                fc.string(),
                submissionArbitrary,
                (fieldId, value1, value2, baseSubmission) => {
                    // Create submission with duplicate field ID in different sections
                    const submission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        sections: [
                            {
                                sectionId: 'section1',
                                fields: { [fieldId]: value1 },
                                status: { result: 'pending' }
                            },
                            {
                                sectionId: 'section2',
                                fields: { [fieldId]: value2 },
                                status: { result: 'pending' }
                            }
                        ]
                    };

                    const formValues = extractFormValues(submission);

                    // Should have the field
                    expect(formValues).toHaveProperty(fieldId);

                    // Should use the last value (from section2)
                    expect(formValues[fieldId]).toBe(value2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Null and undefined values should be preserved
     */
    it('should preserve null and undefined field values', () => {
        fc.assert(
            fc.property(
                submissionArbitrary,
                (baseSubmission) => {
                    const submission: QuestionnaireSubmission = {
                        ...baseSubmission,
                        sections: [
                            {
                                sectionId: 'test-section',
                                fields: {
                                    nullField: null,
                                    undefinedField: undefined,
                                    stringField: 'test'
                                },
                                status: { result: 'pending' }
                            }
                        ]
                    };

                    const formValues = extractFormValues(submission);

                    expect(formValues.nullField).toBe(null);
                    expect(formValues.undefinedField).toBe(undefined);
                    expect(formValues.stringField).toBe('test');
                }
            ),
            { numRuns: 100 }
        );
    });
});
