/**
 * Unit tests for template validation utility
 * Tests Requirements 8.4, 8.7, 8.8
 */

import { describe, it, expect } from 'vitest';
import { validateTemplate } from './templateStorage';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';

// Helper to create a valid template
function createValidTemplate(fields: QuestionField[]): QuestionnaireTemplate {
    return {
        id: 'test-template',
        name: 'Test Template',
        version: 1,
        fields,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'test@example.com'
    };
}

// Helper to create a valid field
function createValidField(overrides: Partial<QuestionField> = {}): QuestionField {
    return {
        id: `field_${Date.now()}_${Math.random()}`,
        type: 'text',
        label: 'Test Field',
        required: false,
        order: 0,
        ...overrides
    };
}

describe('validateTemplate', () => {
    describe('duplicate field IDs', () => {
        it('should pass validation when all field IDs are unique', () => {
            const template = createValidTemplate([
                createValidField({ id: 'field1', label: 'Field 1' }),
                createValidField({ id: 'field2', label: 'Field 2' }),
                createValidField({ id: 'field3', label: 'Field 3' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail validation when duplicate field IDs exist', () => {
            const template = createValidTemplate([
                createValidField({ id: 'field1', label: 'Field 1' }),
                createValidField({ id: 'field1', label: 'Field 2' }), // Duplicate ID
                createValidField({ id: 'field3', label: 'Field 3' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Duplicate field IDs found');
        });

        it('should fail validation with multiple duplicate field IDs', () => {
            const template = createValidTemplate([
                createValidField({ id: 'field1', label: 'Field 1' }),
                createValidField({ id: 'field1', label: 'Field 2' }), // Duplicate
                createValidField({ id: 'field2', label: 'Field 3' }),
                createValidField({ id: 'field2', label: 'Field 4' })  // Duplicate
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Duplicate field IDs found');
        });
    });

    describe('field labels', () => {
        it('should pass validation when all fields have non-empty labels', () => {
            const template = createValidTemplate([
                createValidField({ label: 'Field 1' }),
                createValidField({ label: 'Field 2' }),
                createValidField({ label: 'Field with spaces' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail validation when a field has an empty label', () => {
            const template = createValidTemplate([
                createValidField({ label: 'Field 1' }),
                createValidField({ label: '' }), // Empty label
                createValidField({ label: 'Field 3' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('All fields must have labels');
        });

        it('should fail validation when a field has a whitespace-only label', () => {
            const template = createValidTemplate([
                createValidField({ label: 'Field 1' }),
                createValidField({ label: '   ' }), // Whitespace only
                createValidField({ label: 'Field 3' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('All fields must have labels');
        });

        it('should fail validation when multiple fields have empty labels', () => {
            const template = createValidTemplate([
                createValidField({ label: '' }),
                createValidField({ label: 'Field 2' }),
                createValidField({ label: '  ' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('All fields must have labels');
        });
    });

    describe('option-based field types', () => {
        it('should pass validation when select field has options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'select',
                    label: 'Select Field',
                    options: ['Option 1', 'Option 2', 'Option 3']
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation when radio field has options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'radio',
                    label: 'Radio Field',
                    options: ['Yes', 'No']
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation when checkbox field has options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'checkbox',
                    label: 'Checkbox Field',
                    options: ['Option A', 'Option B']
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail validation when select field has no options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'select',
                    label: 'Select Field',
                    options: []
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "Select Field" requires options');
        });

        it('should fail validation when radio field has undefined options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'radio',
                    label: 'Radio Field',
                    options: undefined
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "Radio Field" requires options');
        });

        it('should fail validation when checkbox field has empty options array', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'checkbox',
                    label: 'Checkbox Field',
                    options: []
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "Checkbox Field" requires options');
        });

        it('should pass validation when non-option field types have no options', () => {
            const template = createValidTemplate([
                createValidField({ type: 'text', label: 'Text Field' }),
                createValidField({ type: 'textarea', label: 'Textarea Field' }),
                createValidField({ type: 'date', label: 'Date Field' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('multiple validation errors', () => {
        it('should report all validation errors when multiple issues exist', () => {
            const template = createValidTemplate([
                createValidField({ id: 'field1', label: '' }), // Empty label
                createValidField({ id: 'field1', label: 'Field 2' }), // Duplicate ID
                createValidField({
                    id: 'field3',
                    type: 'select',
                    label: 'Select Field',
                    options: [] // Missing options
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('Duplicate field IDs found');
            expect(result.errors).toContain('All fields must have labels');
            expect(result.errors).toContain('Field "Select Field" requires options');
        });

        it('should report multiple fields with missing options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'select',
                    label: 'Select 1',
                    options: []
                }),
                createValidField({
                    type: 'radio',
                    label: 'Radio 1',
                    options: undefined
                }),
                createValidField({
                    type: 'checkbox',
                    label: 'Checkbox 1',
                    options: []
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Field "Select 1" requires options');
            expect(result.errors).toContain('Field "Radio 1" requires options');
            expect(result.errors).toContain('Field "Checkbox 1" requires options');
        });
    });

    describe('edge cases', () => {
        it('should pass validation for empty template', () => {
            const template = createValidTemplate([]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation for single valid field', () => {
            const template = createValidTemplate([
                createValidField({ label: 'Single Field' })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle field with single option', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'select',
                    label: 'Select Field',
                    options: ['Only Option']
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle field with many options', () => {
            const template = createValidTemplate([
                createValidField({
                    type: 'select',
                    label: 'Select Field',
                    options: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`)
                })
            ]);

            const result = validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
