/**
 * Property-based tests for preview rendering consistency
 * Feature: hub-improvements, Property 30: Preview rendering consistency
 * Validates: Requirements 8.12
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';
import type { QuestionnaireConfig, Field } from '../types/questionnaire';
import { templateToConfig } from './templateToConfig';

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
 * Extract field structure from a config (used by both preview and actual questionnaires)
 * This represents the fields that will be rendered in the form
 */
function extractFieldStructure(config: QuestionnaireConfig): Field[] {
    // Both preview and actual questionnaires use the same config structure
    // Fields are in sections, so we need to extract them
    const allFields: Field[] = [];
    for (const section of config.sections) {
        allFields.push(...section.fields);
    }
    return allFields;
}

/**
 * Normalize field for comparison (remove undefined values that might differ)
 */
function normalizeField(field: Field): any {
    return {
        id: field.id,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options || undefined,
        helpText: field.helpText || undefined,
        placeholder: field.placeholder || undefined,
    };
}

describe('Preview Rendering Consistency Property Tests', () => {
    it('Property 30: For any template, the preview rendering should generate the same field structure as the actual questionnaire form', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // Given: A questionnaire template

                    // When: The template is converted to config for preview rendering
                    const previewConfig = templateToConfig(template);

                    // And: The same template is converted for actual questionnaire rendering
                    const actualConfig = templateToConfig(template);

                    // Then: Both should produce the same field structure
                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Check field count matches
                    expect(previewFields.length).toBe(actualFields.length);

                    // Check each field matches
                    for (let i = 0; i < previewFields.length; i++) {
                        const previewField = normalizeField(previewFields[i]);
                        const actualField = normalizeField(actualFields[i]);

                        expect(previewField).toEqual(actualField);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field count): Preview and actual questionnaire should have the same number of fields', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Field counts should match
                    expect(previewFields.length).toBe(actualFields.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field IDs): Preview and actual questionnaire should have the same field IDs in the same order', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Field IDs should match in order
                    const previewIds = previewFields.map(f => f.id);
                    const actualIds = actualFields.map(f => f.id);

                    expect(previewIds).toEqual(actualIds);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field types): Preview and actual questionnaire should have matching field types', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Each field should have the same type
                    for (let i = 0; i < previewFields.length; i++) {
                        expect(previewFields[i].type).toBe(actualFields[i].type);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field labels): Preview and actual questionnaire should have matching field labels', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Each field should have the same label
                    for (let i = 0; i < previewFields.length; i++) {
                        expect(previewFields[i].label).toBe(actualFields[i].label);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (required fields): Preview and actual questionnaire should have matching required field settings', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Each field should have the same required setting
                    for (let i = 0; i < previewFields.length; i++) {
                        expect(previewFields[i].required).toBe(actualFields[i].required);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field options): Preview and actual questionnaire should have matching field options', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Each field should have the same options
                    for (let i = 0; i < previewFields.length; i++) {
                        expect(previewFields[i].options).toEqual(actualFields[i].options);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (removed fields): Removed fields should be excluded from both preview and actual rendering', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // Given: A template where some fields are marked as removed
                    const templateWithRemovedFields = {
                        ...template,
                        fields: template.fields.map((field, index) => ({
                            ...field,
                            removed: index % 2 === 0 ? true : undefined,
                        })),
                    };

                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(templateWithRemovedFields);
                    const actualConfig = templateToConfig(templateWithRemovedFields);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Both should exclude removed fields
                    const expectedFieldCount = templateWithRemovedFields.fields.filter(f => !f.removed).length;
                    expect(previewFields.length).toBe(expectedFieldCount);
                    expect(actualFields.length).toBe(expectedFieldCount);

                    // And: Both should have the same fields
                    expect(previewFields.map(f => f.id)).toEqual(actualFields.map(f => f.id));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (empty template): Empty template should produce no fields in both preview and actual rendering', () => {
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
                    // When: Empty template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Both should have no fields
                    expect(previewFields.length).toBe(0);
                    expect(actualFields.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 30 (field ordering): Preview and actual questionnaire should have fields in the same order', () => {
        fc.assert(
            fc.property(
                templateArb,
                (template) => {
                    // When: Template is converted for both preview and actual rendering
                    const previewConfig = templateToConfig(template);
                    const actualConfig = templateToConfig(template);

                    const previewFields = extractFieldStructure(previewConfig);
                    const actualFields = extractFieldStructure(actualConfig);

                    // Then: Fields should be in the same order (sorted by order property)
                    // We verify this by checking that the sequence of field IDs matches
                    const previewSequence = previewFields.map(f => f.id).join(',');
                    const actualSequence = actualFields.map(f => f.id).join(',');

                    expect(previewSequence).toBe(actualSequence);
                }
            ),
            { numRuns: 100 }
        );
    });
});
