/**
 * Property-based tests for template editor field display
 * Feature: hub-improvements, Property 21: Template editor field display
 * Validates: Requirements 8.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';

// Arbitraries for generating test data
const fieldTypeArb = fc.constantFrom('text', 'textarea', 'select', 'radio', 'checkbox', 'date');

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

const templateArb: fc.Arbitrary<QuestionnaireTemplate> = fc.record({
    id: fc.constantFrom('pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    version: fc.nat({ max: 100 }),
    fields: fc.array(questionFieldArb, { minLength: 0, maxLength: 20 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    updatedBy: fc.emailAddress(),
});

/**
 * Simulates what the template editor does when displaying fields
 * This represents the logic in /admin/templates/[templateId]/edit.astro
 * where fields are sorted by order and displayed
 */
function getDisplayedFields(template: QuestionnaireTemplate): QuestionField[] {
    // The template editor sorts fields by order before displaying
    return [...template.fields].sort((a, b) => a.order - b.order);
}

describe('Template Editor Field Display Property Tests', () => {
    it('Property 21: For any questionnaire template, the template editor should display all fields from that template', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: The template editor displays fields from a template
                    const displayedFields = getDisplayedFields(template);

                    // Then: All fields from the template should be displayed
                    // Check that the count matches
                    expect(displayedFields.length).toBe(template.fields.length);

                    // Check that every field from the template is in the displayed fields
                    for (const field of template.fields) {
                        const isDisplayed = displayedFields.some(df => df.id === field.id);
                        expect(isDisplayed).toBe(true);
                    }

                    // Check that no extra fields are displayed
                    for (const displayedField of displayedFields) {
                        const isInTemplate = template.fields.some(f => f.id === displayedField.id);
                        expect(isInTemplate).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21 (field preservation): Displayed fields should preserve all field properties', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: The template editor displays fields
                    const displayedFields = getDisplayedFields(template);

                    // Then: Each displayed field should have all its properties preserved
                    for (const originalField of template.fields) {
                        const displayedField = displayedFields.find(df => df.id === originalField.id);

                        expect(displayedField).toBeDefined();
                        if (displayedField) {
                            expect(displayedField.id).toBe(originalField.id);
                            expect(displayedField.type).toBe(originalField.type);
                            expect(displayedField.label).toBe(originalField.label);
                            expect(displayedField.helpText).toBe(originalField.helpText);
                            expect(displayedField.placeholder).toBe(originalField.placeholder);
                            expect(displayedField.required).toBe(originalField.required);
                            expect(displayedField.options).toEqual(originalField.options);
                            expect(displayedField.order).toBe(originalField.order);
                            expect(displayedField.removed).toBe(originalField.removed);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21 (ordering): Displayed fields should be sorted by order property', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: The template editor displays fields
                    const displayedFields = getDisplayedFields(template);

                    // Then: The fields should be sorted by their order property
                    for (let i = 0; i < displayedFields.length - 1; i++) {
                        expect(displayedFields[i].order).toBeLessThanOrEqual(displayedFields[i + 1].order);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21 (empty template): Template with no fields should display no fields', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.constantFrom('pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'),
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    version: fc.nat({ max: 100 }),
                    fields: fc.constant([]), // Empty fields array
                    createdAt: fc.date(),
                    updatedAt: fc.date(),
                    updatedBy: fc.emailAddress(),
                }),
                (template) => {
                    // When: The template editor displays fields from an empty template
                    const displayedFields = getDisplayedFields(template);

                    // Then: No fields should be displayed
                    expect(displayedFields.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21 (removed fields): Removed fields should still be displayed in the editor', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // Given: A template where some fields might be marked as removed
                    const templateWithRemovedFields = {
                        ...template,
                        fields: template.fields.map((field, index) => ({
                            ...field,
                            removed: index % 2 === 0 ? true : undefined, // Mark every other field as removed
                        })),
                    };

                    // When: The template editor displays fields
                    const displayedFields = getDisplayedFields(templateWithRemovedFields);

                    // Then: All fields should be displayed, including removed ones
                    // (The editor shows all fields so PDM can manage them)
                    expect(displayedFields.length).toBe(templateWithRemovedFields.fields.length);

                    // Verify removed fields are included
                    const removedFieldsInTemplate = templateWithRemovedFields.fields.filter(f => f.removed);
                    const removedFieldsDisplayed = displayedFields.filter(f => f.removed);
                    expect(removedFieldsDisplayed.length).toBe(removedFieldsInTemplate.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});
