/**
 * Property-Based Tests for Removed Field Handling
 * **Feature: hub-improvements, Property 31: Removed field exclusion**
 * **Validates: Requirements 8.13**
 * 
 * Tests that:
 * - New submissions exclude removed fields from the form
 * - Existing submissions retain removed field data
 * - Removed fields are displayed in historical view with indicator
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';
import { templateToConfig } from './templateToConfig';

// Arbitrary for generating field types
const fieldTypeArb = fc.constantFrom(
    'text',
    'textarea',
    'select',
    'radio',
    'checkbox',
    'date'
);

// Arbitrary for generating a question field with unique ID
const questionFieldArb = (index: number) => fc.record({
    id: fc.constant(`field_${index}`),
    type: fieldTypeArb,
    label: fc.string({ minLength: 1, maxLength: 50 }),
    helpText: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    placeholder: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    required: fc.boolean(),
    options: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
    order: fc.nat({ max: 100 }),
    removed: fc.boolean(),
});

// Arbitrary for generating a questionnaire template with unique field IDs
const templateArb = fc.nat({ max: 10 }).chain(fieldCount =>
    fc.record({
        id: fc.constantFrom('gate-0', 'gate-1', 'gate-2', 'gate-3', 'pre-contract'),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        version: fc.nat({ max: 100 }),
        fields: fc.tuple(...Array.from({ length: Math.max(1, fieldCount) }, (_, i) => questionFieldArb(i))),
        createdAt: fc.date(),
        updatedAt: fc.date(),
        updatedBy: fc.emailAddress(),
    })
);

describe('Property 31: Removed Field Exclusion', () => {
    it('new submissions should exclude removed fields from the form', () => {
        fc.assert(
            fc.property(templateArb, (template) => {
                // Convert template for new submission (includeRemovedFields = false)
                const config = templateToConfig(template, false);

                // Get all fields from the config
                const configFields = config.sections.flatMap(section => section.fields);

                // Check that no removed fields are included
                const hasRemovedFields = configFields.some(field => (field as any).removed === true);

                // Property: New submissions should not include removed fields
                expect(hasRemovedFields).toBe(false);

                // Additional check: All removed fields from template should be excluded
                const removedFieldIds = template.fields
                    .filter(f => f.removed)
                    .map(f => f.id);

                const configFieldIds = configFields.map(f => f.id);

                removedFieldIds.forEach(removedId => {
                    expect(configFieldIds).not.toContain(removedId);
                });
            }),
            { numRuns: 100 }
        );
    });

    it('existing submissions should retain removed field data in historical view', () => {
        fc.assert(
            fc.property(templateArb, (template) => {
                // Ensure template has at least one removed field
                if (!template.fields.some(f => f.removed)) {
                    // Mark at least one field as removed
                    if (template.fields.length > 0) {
                        template.fields[0].removed = true;
                    }
                }

                // Convert template for historical submission (includeRemovedFields = true)
                const config = templateToConfig(template, true);

                // Get all fields from the config
                const configFields = config.sections.flatMap(section => section.fields);

                // Get removed fields from template
                const removedFields = template.fields.filter(f => f.removed);

                // Property: All removed fields should be included in historical view
                removedFields.forEach(removedField => {
                    const foundField = configFields.find(f => f.id === removedField.id);
                    expect(foundField).toBeDefined();
                    expect((foundField as any).removed).toBe(true);
                });
            }),
            { numRuns: 100 }
        );
    });

    it('removed fields should be marked with removed flag in historical view', () => {
        fc.assert(
            fc.property(templateArb, (template) => {
                // Mark some fields as removed
                const fieldsToRemove = template.fields.slice(0, Math.ceil(template.fields.length / 2));
                fieldsToRemove.forEach(field => {
                    field.removed = true;
                });

                // Convert template for historical submission (includeRemovedFields = true)
                const config = templateToConfig(template, true);

                // Get all fields from the config
                const configFields = config.sections.flatMap(section => section.fields);

                // Property: All removed fields should have the removed flag set
                fieldsToRemove.forEach(removedField => {
                    const foundField = configFields.find(f => f.id === removedField.id);
                    expect(foundField).toBeDefined();
                    // Check if removed is explicitly true (not just truthy)
                    expect((foundField as any).removed).toBe(true);
                });

                // Property: Non-removed fields should not have the removed flag set to true
                const nonRemovedFields = template.fields.filter(f => !f.removed);
                nonRemovedFields.forEach(activeField => {
                    const foundField = configFields.find(f => f.id === activeField.id);
                    expect(foundField).toBeDefined();
                    // Should be undefined or false, but not true
                    expect((foundField as any).removed === true).toBe(false);
                });
            }),
            { numRuns: 100 }
        );
    });

    it('validation should not require removed fields', () => {
        fc.assert(
            fc.property(templateArb, (template) => {
                // Mark some required fields as removed
                template.fields.forEach((field, index) => {
                    if (index % 2 === 0) {
                        field.required = true;
                        field.removed = true;
                    }
                });

                // Convert template for historical submission (includeRemovedFields = true)
                const config = templateToConfig(template, true);

                // Get removed required fields
                const removedRequiredFieldIds = template.fields
                    .filter(f => f.removed && f.required)
                    .map(f => f.id);

                // Property: Removed fields should not be in the required fields list
                removedRequiredFieldIds.forEach(fieldId => {
                    expect(config.validation.requiredFields).not.toContain(fieldId);
                });
            }),
            { numRuns: 100 }
        );
    });

    it('field order should be preserved when including removed fields', () => {
        fc.assert(
            fc.property(templateArb, (template) => {
                // Assign unique order values to avoid ties
                template.fields.forEach((field, index) => {
                    field.order = index;
                });

                // Sort template fields by order
                const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

                // Mark some fields as removed
                sortedFields.forEach((field, index) => {
                    if (index % 3 === 0) {
                        field.removed = true;
                    }
                });

                // Convert template for historical submission (includeRemovedFields = true)
                const config = templateToConfig(template, true);

                // Get all fields from the config
                const configFields = config.sections.flatMap(section => section.fields);

                // Property: Fields should maintain their relative order
                const configFieldIds = configFields.map(f => f.id);
                const sortedFieldIds = sortedFields.map(f => f.id);

                // Check that the order is preserved (each field should appear after the previous one)
                let lastIndex = -1;
                sortedFieldIds.forEach(fieldId => {
                    const currentIndex = configFieldIds.indexOf(fieldId);
                    if (currentIndex !== -1) {
                        // Only check if this is not the first field
                        if (lastIndex !== -1) {
                            expect(currentIndex).toBeGreaterThan(lastIndex);
                        }
                        lastIndex = currentIndex;
                    }
                });
            }),
            { numRuns: 100 }
        );
    });
});
