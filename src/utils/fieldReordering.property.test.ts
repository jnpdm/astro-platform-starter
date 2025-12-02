/**
 * Property-based tests for field reordering
 * Feature: hub-improvements, Property 23: Field reordering
 * Validates: Requirements 8.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionField } from '../types/template';

// Helper function to reorder fields by swapping two adjacent fields
function reorderFields(fields: QuestionField[], fromIndex: number, toIndex: number): QuestionField[] {
    if (fromIndex < 0 || fromIndex >= fields.length || toIndex < 0 || toIndex >= fields.length) {
        return fields;
    }

    const newFields = [...fields];
    const temp = newFields[fromIndex];
    newFields[fromIndex] = newFields[toIndex];
    newFields[toIndex] = temp;

    // Update order values to match new positions
    newFields[fromIndex] = { ...newFields[fromIndex], order: fromIndex };
    newFields[toIndex] = { ...newFields[toIndex], order: toIndex };

    return newFields;
}

// Helper function to move a field up (swap with previous)
function moveFieldUp(fields: QuestionField[], index: number): QuestionField[] {
    if (index === 0) return fields;
    return reorderFields(fields, index, index - 1);
}

// Helper function to move a field down (swap with next)
function moveFieldDown(fields: QuestionField[], index: number): QuestionField[] {
    if (index === fields.length - 1) return fields;
    return reorderFields(fields, index, index + 1);
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

// Arbitrary for generating an array of fields with sequential order values
const orderedFieldsArb = (minLength: number = 2, maxLength: number = 10): fc.Arbitrary<QuestionField[]> => {
    return fc.array(questionFieldArb, { minLength, maxLength }).map(fields =>
        fields.map((field, index) => ({ ...field, order: index }))
    );
};

describe('Field Reordering Property Tests', () => {
    describe('Property 23: Field Reordering', () => {
        it('For any template with multiple fields, reordering two fields should result in their order values being swapped correctly', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A template with multiple fields
                        const index1 = indexSeed % fields.length;
                        const index2 = (index1 + 1) % fields.length;

                        const field1Before = fields[index1];
                        const field2Before = fields[index2];

                        // When: We reorder two fields
                        const reorderedFields = reorderFields(fields, index1, index2);

                        // Then: The fields should be swapped in position
                        expect(reorderedFields[index1].id).toBe(field2Before.id);
                        expect(reorderedFields[index2].id).toBe(field1Before.id);

                        // And: Their order values should match their new positions
                        expect(reorderedFields[index1].order).toBe(index1);
                        expect(reorderedFields[index2].order).toBe(index2);

                        // And: All other fields should remain in their original positions
                        fields.forEach((field, i) => {
                            if (i !== index1 && i !== index2) {
                                expect(reorderedFields[i].id).toBe(field.id);
                                expect(reorderedFields[i].order).toBe(i);
                            }
                        });

                        // And: The total number of fields should remain the same
                        expect(reorderedFields.length).toBe(fields.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field not at the beginning, moving up should swap it with the previous field', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A field that is not at the beginning
                        const index = (indexSeed % (fields.length - 1)) + 1; // Ensure index > 0
                        const fieldBefore = fields[index];
                        const previousFieldBefore = fields[index - 1];

                        // When: We move the field up
                        const reorderedFields = moveFieldUp(fields, index);

                        // Then: The field should be in the previous position
                        expect(reorderedFields[index - 1].id).toBe(fieldBefore.id);
                        expect(reorderedFields[index - 1].order).toBe(index - 1);

                        // And: The previous field should be in the current position
                        expect(reorderedFields[index].id).toBe(previousFieldBefore.id);
                        expect(reorderedFields[index].order).toBe(index);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field not at the end, moving down should swap it with the next field', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A field that is not at the end
                        const index = indexSeed % (fields.length - 1); // Ensure index < length - 1
                        const fieldBefore = fields[index];
                        const nextFieldBefore = fields[index + 1];

                        // When: We move the field down
                        const reorderedFields = moveFieldDown(fields, index);

                        // Then: The field should be in the next position
                        expect(reorderedFields[index + 1].id).toBe(fieldBefore.id);
                        expect(reorderedFields[index + 1].order).toBe(index + 1);

                        // And: The next field should be in the current position
                        expect(reorderedFields[index].id).toBe(nextFieldBefore.id);
                        expect(reorderedFields[index].order).toBe(index);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For the first field, moving up should not change the field order', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    (fields) => {
                        // Given: The first field in a template
                        const firstFieldBefore = fields[0];

                        // When: We attempt to move it up
                        const reorderedFields = moveFieldUp(fields, 0);

                        // Then: The field should remain in the first position
                        expect(reorderedFields[0].id).toBe(firstFieldBefore.id);
                        expect(reorderedFields[0].order).toBe(0);

                        // And: All fields should remain in their original positions
                        expect(reorderedFields).toEqual(fields);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For the last field, moving down should not change the field order', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    (fields) => {
                        // Given: The last field in a template
                        const lastIndex = fields.length - 1;
                        const lastFieldBefore = fields[lastIndex];

                        // When: We attempt to move it down
                        const reorderedFields = moveFieldDown(fields, lastIndex);

                        // Then: The field should remain in the last position
                        expect(reorderedFields[lastIndex].id).toBe(lastFieldBefore.id);
                        expect(reorderedFields[lastIndex].order).toBe(lastIndex);

                        // And: All fields should remain in their original positions
                        expect(reorderedFields).toEqual(fields);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, moving up then down should return to the original position', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(3, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A field in the middle of the template (not first or last)
                        const index = (indexSeed % (fields.length - 2)) + 1; // Ensure 0 < index < length - 1
                        const fieldBefore = fields[index];

                        // When: We move the field up then down
                        const movedUp = moveFieldUp(fields, index);
                        const movedBack = moveFieldDown(movedUp, index - 1);

                        // Then: The field should be back in its original position
                        expect(movedBack[index].id).toBe(fieldBefore.id);
                        expect(movedBack[index].order).toBe(index);

                        // And: All fields should be in their original positions
                        fields.forEach((field, i) => {
                            expect(movedBack[i].id).toBe(field.id);
                            expect(movedBack[i].order).toBe(i);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, moving down then up should return to the original position', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(3, 10),
                    fc.nat(),
                    (fields, indexSeed) => {
                        // Given: A field in the middle of the template (not first or last)
                        const index = (indexSeed % (fields.length - 2)) + 1; // Ensure 0 < index < length - 1
                        const fieldBefore = fields[index];

                        // When: We move the field down then up
                        const movedDown = moveFieldDown(fields, index);
                        const movedBack = moveFieldUp(movedDown, index + 1);

                        // Then: The field should be back in its original position
                        expect(movedBack[index].id).toBe(fieldBefore.id);
                        expect(movedBack[index].order).toBe(index);

                        // And: All fields should be in their original positions
                        fields.forEach((field, i) => {
                            expect(movedBack[i].id).toBe(field.id);
                            expect(movedBack[i].order).toBe(i);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any sequence of reorderings, order values should always match array indices', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(3, 10),
                    fc.array(fc.record({
                        action: fc.constantFrom('up', 'down'),
                        indexSeed: fc.nat()
                    }), { minLength: 1, maxLength: 20 }),
                    (fields, actions) => {
                        // Given: A template with fields
                        let currentFields = fields;

                        // When: We perform a sequence of random reorderings
                        actions.forEach(({ action, indexSeed }) => {
                            const index = indexSeed % currentFields.length;
                            if (action === 'up') {
                                currentFields = moveFieldUp(currentFields, index);
                            } else {
                                currentFields = moveFieldDown(currentFields, index);
                            }
                        });

                        // Then: All order values should match their array indices
                        currentFields.forEach((field, index) => {
                            expect(field.order).toBe(index);
                        });

                        // And: The total number of fields should remain the same
                        expect(currentFields.length).toBe(fields.length);

                        // And: All original field IDs should still be present
                        const originalIds = new Set(fields.map(f => f.id));
                        const currentIds = new Set(currentFields.map(f => f.id));
                        expect(currentIds).toEqual(originalIds);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any reordering operation, all field properties except order should remain unchanged', () => {
            fc.assert(
                fc.property(
                    orderedFieldsArb(2, 10),
                    fc.nat(),
                    fc.constantFrom('up', 'down'),
                    (fields, indexSeed, action) => {
                        // Given: A template with fields
                        const index = action === 'up'
                            ? (indexSeed % (fields.length - 1)) + 1  // Not first
                            : indexSeed % (fields.length - 1);        // Not last

                        const fieldBefore = fields[index];

                        // When: We reorder a field
                        const reorderedFields = action === 'up'
                            ? moveFieldUp(fields, index)
                            : moveFieldDown(fields, index);

                        // Find the field in the new array
                        const fieldAfter = reorderedFields.find(f => f.id === fieldBefore.id)!;

                        // Then: All properties except order should remain unchanged
                        expect(fieldAfter.id).toBe(fieldBefore.id);
                        expect(fieldAfter.type).toBe(fieldBefore.type);
                        expect(fieldAfter.label).toBe(fieldBefore.label);
                        expect(fieldAfter.helpText).toBe(fieldBefore.helpText);
                        expect(fieldAfter.placeholder).toBe(fieldBefore.placeholder);
                        expect(fieldAfter.required).toBe(fieldBefore.required);
                        expect(fieldAfter.options).toEqual(fieldBefore.options);
                        expect(fieldAfter.removed).toBe(fieldBefore.removed);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
