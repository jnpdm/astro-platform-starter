/**
 * Property-based tests for field removal
 * Feature: hub-improvements, Property 24: Field removal
 * Validates: Requirements 8.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionField } from '../types/template';

// Helper function to remove a field from a template
function removeField(fields: QuestionField[], fieldId: string): QuestionField[] {
    return fields.filter(field => field.id !== fieldId);
}

// Arbitrary for generating a single field
const questionFieldArb: fc.Arbitrary<QuestionField> = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('text', 'textarea', 'select', 'radio', 'checkbox', 'date'),
    label: fc.string({ minLength: 1, maxLength: 50 }),
    helpText: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    placeholder: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    required: fc.boolean(),
    options: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
    order: fc.nat({ max: 100 }),
    removed: fc.option(fc.boolean(), { nil: undefined }),
});

// Arbitrary for generating an array of fields
const fieldsArrayArb = (minLength: number = 1, maxLength: number = 10): fc.Arbitrary<QuestionField[]> => {
    return fc.array(questionFieldArb, { minLength, maxLength });
};

describe('Field Removal Property Tests', () => {
    describe('Property 24: Field Removal', () => {
        it('For any template with fields, removing a field should result in that field no longer being present in the template\'s field list', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(1, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with fields
                        const index = indexSeed % fields.length;
                        const fieldToRemove = fields[index];

                        // When: We remove a field
                        const updatedFields = removeField(fields, fieldToRemove.id);

                        // Then: The field should no longer be present
                        expect(updatedFields.find(f => f.id === fieldToRemove.id)).toBeUndefined();

                        // And: The field list should be shorter by exactly 1
                        expect(updatedFields.length).toBe(fields.length - 1);

                        // And: All other fields should still be present
                        fields.forEach(field => {
                            if (field.id !== fieldToRemove.id) {
                                expect(updatedFields.find(f => f.id === field.id)).toBeDefined();
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing a non-existent field should not change the field list', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(1, 10),
                    fc.uuid(),
                    (fields, nonExistentId) => {
                        // Given: A template with fields and a non-existent field ID
                        // Ensure the ID doesn't exist in the current fields
                        fc.pre(!fields.some(f => f.id === nonExistentId));

                        // When: We attempt to remove a non-existent field
                        const updatedFields = removeField(fields, nonExistentId);

                        // Then: The field list should remain unchanged
                        expect(updatedFields.length).toBe(fields.length);
                        expect(updatedFields).toEqual(fields);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template with multiple fields, removing all fields one by one should result in an empty list', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(1, 10),
                    (fields) => {
                        // Given: A template with fields
                        let currentFields = fields;

                        // When: We remove all fields one by one
                        fields.forEach(field => {
                            currentFields = removeField(currentFields, field.id);
                        });

                        // Then: The field list should be empty
                        expect(currentFields.length).toBe(0);
                        expect(currentFields).toEqual([]);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing a field should preserve the properties of all remaining fields', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(2, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with multiple fields
                        const index = indexSeed % fields.length;
                        const fieldToRemove = fields[index];

                        // When: We remove a field
                        const updatedFields = removeField(fields, fieldToRemove.id);

                        // Then: All remaining fields should have unchanged properties
                        updatedFields.forEach(updatedField => {
                            const originalField = fields.find(f => f.id === updatedField.id)!;
                            expect(updatedField).toEqual(originalField);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing the first field should preserve all other fields', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(2, 10),
                    (fields) => {
                        // Given: A template with multiple fields
                        const firstField = fields[0];

                        // When: We remove the first field
                        const updatedFields = removeField(fields, firstField.id);

                        // Then: All other fields should still be present
                        expect(updatedFields.length).toBe(fields.length - 1);
                        fields.slice(1).forEach(field => {
                            expect(updatedFields.find(f => f.id === field.id)).toBeDefined();
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing the last field should preserve all other fields', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(2, 10),
                    (fields) => {
                        // Given: A template with multiple fields
                        const lastField = fields[fields.length - 1];

                        // When: We remove the last field
                        const updatedFields = removeField(fields, lastField.id);

                        // Then: All other fields should still be present
                        expect(updatedFields.length).toBe(fields.length - 1);
                        fields.slice(0, -1).forEach(field => {
                            expect(updatedFields.find(f => f.id === field.id)).toBeDefined();
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing a middle field should preserve all other fields', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(3, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with at least 3 fields
                        // Select a middle field (not first or last)
                        const index = (indexSeed % (fields.length - 2)) + 1;
                        const middleField = fields[index];

                        // When: We remove the middle field
                        const updatedFields = removeField(fields, middleField.id);

                        // Then: All other fields should still be present
                        expect(updatedFields.length).toBe(fields.length - 1);
                        fields.forEach(field => {
                            if (field.id !== middleField.id) {
                                expect(updatedFields.find(f => f.id === field.id)).toBeDefined();
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing a field should maintain the relative order of remaining fields', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(2, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with fields
                        const index = indexSeed % fields.length;
                        const fieldToRemove = fields[index];

                        // When: We remove a field
                        const updatedFields = removeField(fields, fieldToRemove.id);

                        // Then: The relative order of remaining fields should be preserved
                        const remainingOriginalFields = fields.filter(f => f.id !== fieldToRemove.id);
                        expect(updatedFields.map(f => f.id)).toEqual(remainingOriginalFields.map(f => f.id));
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing and then re-adding a field should result in the field being present again', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(1, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with fields
                        const index = indexSeed % fields.length;
                        const fieldToRemove = fields[index];

                        // When: We remove a field
                        const afterRemoval = removeField(fields, fieldToRemove.id);
                        expect(afterRemoval.find(f => f.id === fieldToRemove.id)).toBeUndefined();

                        // And: We re-add the field
                        const afterReAdd = [...afterRemoval, fieldToRemove];

                        // Then: The field should be present again
                        expect(afterReAdd.find(f => f.id === fieldToRemove.id)).toBeDefined();
                        expect(afterReAdd.length).toBe(fields.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, removing multiple fields should result in only the removed fields being absent', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(3, 10),
                    fc.nat(),
                    fc.nat(),
                    (fields, indexSeed1, indexSeed2) => {
                        // Given: A template with at least 3 fields
                        const index1 = indexSeed1 % fields.length;
                        const index2 = indexSeed2 % fields.length;

                        // Ensure we're removing two different fields
                        fc.pre(index1 !== index2);

                        const field1 = fields[index1];
                        const field2 = fields[index2];

                        // When: We remove two fields
                        let updatedFields = removeField(fields, field1.id);
                        updatedFields = removeField(updatedFields, field2.id);

                        // Then: Both fields should be absent
                        expect(updatedFields.find(f => f.id === field1.id)).toBeUndefined();
                        expect(updatedFields.find(f => f.id === field2.id)).toBeUndefined();

                        // And: The field list should be shorter by exactly 2
                        expect(updatedFields.length).toBe(fields.length - 2);

                        // And: All other fields should still be present
                        fields.forEach(field => {
                            if (field.id !== field1.id && field.id !== field2.id) {
                                expect(updatedFields.find(f => f.id === field.id)).toBeDefined();
                            }
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any template, the set of field IDs after removal should equal the original set minus the removed ID', () => {
            fc.assert(
                fc.property(
                    fieldsArrayArb(1, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with fields
                        const index = indexSeed % fields.length;
                        const fieldToRemove = fields[index];

                        // When: We remove a field
                        const updatedFields = removeField(fields, fieldToRemove.id);

                        // Then: The set of IDs should be the original set minus the removed ID
                        const originalIds = new Set(fields.map(f => f.id));
                        const updatedIds = new Set(updatedFields.map(f => f.id));

                        originalIds.delete(fieldToRemove.id);
                        expect(updatedIds).toEqual(originalIds);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
