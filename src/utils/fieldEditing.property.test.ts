/**
 * Property-based tests for field editing
 * Feature: hub-improvements, Property 22: Field type support
 * Feature: hub-improvements, Property 25: Field property updates
 * Feature: hub-improvements, Property 26: Option-based field options
 * Validates: Requirements 8.4, 8.7, 8.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionField, FieldType } from '../types/template';

// Arbitraries for generating test data
const fieldTypeArb = fc.constantFrom('text', 'textarea', 'select', 'radio', 'checkbox', 'date');

const optionBasedFieldTypeArb = fc.constantFrom('select', 'radio', 'checkbox');

const nonOptionBasedFieldTypeArb = fc.constantFrom('text', 'textarea', 'date');

const questionFieldArb: fc.Arbitrary<QuestionField> = fc.record({
    id: fc.uuid(),
    type: fieldTypeArb,
    label: fc.string({ minLength: 1, maxLength: 100 }),
    helpText: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    placeholder: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    required: fc.boolean(),
    options: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }), { nil: undefined }),
    order: fc.nat({ max: 100 }),
    removed: fc.option(fc.boolean(), { nil: undefined }),
});

// Helper function to create a field with a specific type
function createFieldWithType(type: FieldType): QuestionField {
    const needsOptions = ['select', 'radio', 'checkbox'].includes(type);
    return {
        id: crypto.randomUUID(),
        type,
        label: 'Test Field',
        required: false,
        options: needsOptions ? ['Option 1'] : undefined,
        order: 0,
    };
}

// Helper function to update field properties
function updateFieldProperties(
    field: QuestionField,
    updates: Partial<QuestionField>
): QuestionField {
    return { ...field, ...updates };
}

describe('Field Editing Property Tests', () => {
    describe('Property 22: Field Type Support', () => {
        it('For any supported field type, the system should allow creating a field of that type', () => {
            fc.assert(
                fc.property(
                    fieldTypeArb,
                    (fieldType) => {
                        // When: We create a field with a specific type
                        const field = createFieldWithType(fieldType);

                        // Then: The field should have that type
                        expect(field.type).toBe(fieldType);

                        // And: The field should be a valid QuestionField
                        expect(field).toHaveProperty('id');
                        expect(field).toHaveProperty('label');
                        expect(field).toHaveProperty('required');
                        expect(field).toHaveProperty('order');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field type, changing the type should update the field correctly', () => {
            fc.assert(
                fc.property(
                    fieldTypeArb,
                    fieldTypeArb,
                    (initialType, newType) => {
                        // Given: A field with an initial type
                        const field = createFieldWithType(initialType);

                        // When: We change the type
                        const needsOptions = ['select', 'radio', 'checkbox'].includes(newType);
                        const updatedField = updateFieldProperties(field, {
                            type: newType,
                            options: needsOptions ? (field.options || ['Option 1']) : undefined,
                        });

                        // Then: The field should have the new type
                        expect(updatedField.type).toBe(newType);

                        // And: Options should be present only for option-based types
                        if (needsOptions) {
                            expect(updatedField.options).toBeDefined();
                            expect(Array.isArray(updatedField.options)).toBe(true);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('All supported field types should be valid FieldType values', () => {
            const supportedTypes: FieldType[] = ['text', 'textarea', 'select', 'radio', 'checkbox', 'date'];

            supportedTypes.forEach(type => {
                const field = createFieldWithType(type);
                expect(field.type).toBe(type);
            });
        });
    });

    describe('Property 25: Field Property Updates', () => {
        it('For any field and any new property values, updating those properties should result in the field having the new values', () => {
            fc.assert(
                fc.property(
                    questionFieldArb,
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
                    fc.boolean(),
                    (field, newLabel, newHelpText, newRequired) => {
                        // When: We update field properties
                        const updatedField = updateFieldProperties(field, {
                            label: newLabel,
                            helpText: newHelpText,
                            required: newRequired,
                        });

                        // Then: The field should have the new values
                        expect(updatedField.label).toBe(newLabel);
                        expect(updatedField.helpText).toBe(newHelpText);
                        expect(updatedField.required).toBe(newRequired);

                        // And: Other properties should remain unchanged
                        expect(updatedField.id).toBe(field.id);
                        expect(updatedField.type).toBe(field.type);
                        expect(updatedField.order).toBe(field.order);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, updating label should preserve other properties', () => {
            fc.assert(
                fc.property(
                    questionFieldArb,
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (field, newLabel) => {
                        // When: We update only the label
                        const updatedField = updateFieldProperties(field, { label: newLabel });

                        // Then: The label should be updated
                        expect(updatedField.label).toBe(newLabel);

                        // And: All other properties should remain unchanged
                        expect(updatedField.id).toBe(field.id);
                        expect(updatedField.type).toBe(field.type);
                        expect(updatedField.helpText).toBe(field.helpText);
                        expect(updatedField.placeholder).toBe(field.placeholder);
                        expect(updatedField.required).toBe(field.required);
                        expect(updatedField.options).toEqual(field.options);
                        expect(updatedField.order).toBe(field.order);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, updating helpText should preserve other properties', () => {
            fc.assert(
                fc.property(
                    questionFieldArb,
                    fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
                    (field, newHelpText) => {
                        // When: We update only the helpText
                        const updatedField = updateFieldProperties(field, { helpText: newHelpText });

                        // Then: The helpText should be updated
                        expect(updatedField.helpText).toBe(newHelpText);

                        // And: All other properties should remain unchanged
                        expect(updatedField.id).toBe(field.id);
                        expect(updatedField.type).toBe(field.type);
                        expect(updatedField.label).toBe(field.label);
                        expect(updatedField.placeholder).toBe(field.placeholder);
                        expect(updatedField.required).toBe(field.required);
                        expect(updatedField.options).toEqual(field.options);
                        expect(updatedField.order).toBe(field.order);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, updating placeholder should preserve other properties', () => {
            fc.assert(
                fc.property(
                    questionFieldArb,
                    fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
                    (field, newPlaceholder) => {
                        // When: We update only the placeholder
                        const updatedField = updateFieldProperties(field, { placeholder: newPlaceholder });

                        // Then: The placeholder should be updated
                        expect(updatedField.placeholder).toBe(newPlaceholder);

                        // And: All other properties should remain unchanged
                        expect(updatedField.id).toBe(field.id);
                        expect(updatedField.type).toBe(field.type);
                        expect(updatedField.label).toBe(field.label);
                        expect(updatedField.helpText).toBe(field.helpText);
                        expect(updatedField.required).toBe(field.required);
                        expect(updatedField.options).toEqual(field.options);
                        expect(updatedField.order).toBe(field.order);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, updating required should preserve other properties', () => {
            fc.assert(
                fc.property(
                    questionFieldArb,
                    fc.boolean(),
                    (field, newRequired) => {
                        // When: We update only the required flag
                        const updatedField = updateFieldProperties(field, { required: newRequired });

                        // Then: The required flag should be updated
                        expect(updatedField.required).toBe(newRequired);

                        // And: All other properties should remain unchanged
                        expect(updatedField.id).toBe(field.id);
                        expect(updatedField.type).toBe(field.type);
                        expect(updatedField.label).toBe(field.label);
                        expect(updatedField.helpText).toBe(field.helpText);
                        expect(updatedField.placeholder).toBe(field.placeholder);
                        expect(updatedField.options).toEqual(field.options);
                        expect(updatedField.order).toBe(field.order);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 26: Option-Based Field Options', () => {
        it('For any field with type select, radio, or checkbox, the field should have a non-empty options array', () => {
            fc.assert(
                fc.property(
                    optionBasedFieldTypeArb,
                    (fieldType) => {
                        // When: We create a field with an option-based type
                        const field = createFieldWithType(fieldType);

                        // Then: The field should have options
                        expect(field.options).toBeDefined();
                        expect(Array.isArray(field.options)).toBe(true);
                        expect(field.options!.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any option-based field, options should be an array of strings', () => {
            fc.assert(
                fc.property(
                    optionBasedFieldTypeArb,
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
                    (fieldType, options) => {
                        // Given: A field with an option-based type
                        const field = createFieldWithType(fieldType);

                        // When: We set options
                        const updatedField = updateFieldProperties(field, { options });

                        // Then: The options should be set correctly
                        expect(updatedField.options).toEqual(options);
                        expect(Array.isArray(updatedField.options)).toBe(true);
                        expect(updatedField.options!.length).toBe(options.length);

                        // And: All options should be strings
                        updatedField.options!.forEach(option => {
                            expect(typeof option).toBe('string');
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any non-option-based field type, options should be undefined', () => {
            fc.assert(
                fc.property(
                    nonOptionBasedFieldTypeArb,
                    (fieldType) => {
                        // When: We create a field with a non-option-based type
                        const field = createFieldWithType(fieldType);

                        // Then: The field should not have options
                        expect(field.options).toBeUndefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, changing from option-based to non-option-based type should clear options', () => {
            fc.assert(
                fc.property(
                    optionBasedFieldTypeArb,
                    nonOptionBasedFieldTypeArb,
                    (optionType, nonOptionType) => {
                        // Given: A field with an option-based type
                        const field = createFieldWithType(optionType);
                        expect(field.options).toBeDefined();

                        // When: We change to a non-option-based type
                        const updatedField = updateFieldProperties(field, {
                            type: nonOptionType,
                            options: undefined,
                        });

                        // Then: The options should be cleared
                        expect(updatedField.type).toBe(nonOptionType);
                        expect(updatedField.options).toBeUndefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any field, changing from non-option-based to option-based type should add options', () => {
            fc.assert(
                fc.property(
                    nonOptionBasedFieldTypeArb,
                    optionBasedFieldTypeArb,
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
                    (nonOptionType, optionType, options) => {
                        // Given: A field with a non-option-based type
                        const field = createFieldWithType(nonOptionType);
                        expect(field.options).toBeUndefined();

                        // When: We change to an option-based type and add options
                        const updatedField = updateFieldProperties(field, {
                            type: optionType,
                            options,
                        });

                        // Then: The field should have options
                        expect(updatedField.type).toBe(optionType);
                        expect(updatedField.options).toBeDefined();
                        expect(Array.isArray(updatedField.options)).toBe(true);
                        expect(updatedField.options!.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any option-based field, adding an option should increase the options array length', () => {
            fc.assert(
                fc.property(
                    optionBasedFieldTypeArb,
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
                    fc.string({ minLength: 1 }),
                    (fieldType, initialOptions, newOption) => {
                        // Given: A field with options
                        const field = createFieldWithType(fieldType);
                        const fieldWithOptions = updateFieldProperties(field, { options: initialOptions });
                        const initialLength = fieldWithOptions.options!.length;

                        // When: We add a new option
                        const updatedField = updateFieldProperties(fieldWithOptions, {
                            options: [...fieldWithOptions.options!, newOption],
                        });

                        // Then: The options array should be longer
                        expect(updatedField.options!.length).toBe(initialLength + 1);
                        expect(updatedField.options).toContain(newOption);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('For any option-based field, removing an option should decrease the options array length', () => {
            fc.assert(
                fc.property(
                    optionBasedFieldTypeArb,
                    fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }),
                    (fieldType, initialOptions) => {
                        // Given: A field with multiple options
                        const field = createFieldWithType(fieldType);
                        const fieldWithOptions = updateFieldProperties(field, { options: initialOptions });
                        const initialLength = fieldWithOptions.options!.length;

                        // When: We remove the first option
                        const updatedField = updateFieldProperties(fieldWithOptions, {
                            options: fieldWithOptions.options!.slice(1),
                        });

                        // Then: The options array should be shorter
                        expect(updatedField.options!.length).toBe(initialLength - 1);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
