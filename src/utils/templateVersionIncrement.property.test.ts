/**
 * Property-based tests for template version increment
 * Feature: hub-improvements, Property 27: Template version increment
 * Validates: Requirements 8.9
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';

// Create a storage instance that can be reset between tests
let storage = new Map<string, any>();

// Mock Netlify Blobs
vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn(() => ({
        get: vi.fn(async (key: string) => {
            return storage.get(key) || null;
        }),
        setJSON: vi.fn(async (key: string, value: any) => {
            storage.set(key, value);
        }),
        list: vi.fn(async () => ({
            blobs: Array.from(storage.keys()).map(key => ({ key })),
        })),
    })),
}));

// Import after mocking
const { saveTemplate } = await import('./templateStorage');

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
    fields: fc.array(questionFieldArb, { minLength: 1, maxLength: 20 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    updatedBy: fc.emailAddress(),
});

describe('Template Version Increment Property Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset storage between tests
        storage = new Map<string, any>();
    });

    afterEach(() => {
        // Clear storage after each test
        storage.clear();
    });

    it('Property 27: For any template, saving an updated version should increment version by exactly 1', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (template, updatedBy) => {
                    // Reset storage for each property test iteration
                    storage.clear();

                    // Given: A template that exists in storage
                    // First, save it to establish a baseline
                    const firstSave = await saveTemplate(template, updatedBy);
                    const versionAfterFirstSave = firstSave.version;

                    // When: We save the template again (update)
                    const secondSave = await saveTemplate(firstSave, updatedBy);

                    // Then: The version should be incremented by exactly 1
                    expect(secondSave.version).toBe(versionAfterFirstSave + 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 27 (sequential): Saving a template multiple times increments version each time', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 1, max: 5 }), // Use integer with min 1 to avoid 0
                async (initialTemplate, updatedBy, saveCount) => {
                    // Reset storage for each property test iteration
                    storage.clear();

                    // Given: A template
                    let currentTemplate = initialTemplate;

                    // When: We save the template multiple times
                    for (let i = 0; i < saveCount; i++) {
                        currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                    }

                    // Then: The final version should equal the number of saves
                    // (first save = version 1, second save = version 2, etc.)
                    expect(currentTemplate.version).toBe(saveCount);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 27 (updatedBy preservation): Saving updates the updatedBy field', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (template, updatedBy) => {
                    // Reset storage for each property test iteration
                    storage.clear();

                    // When: We save a template with a specific updatedBy
                    const savedTemplate = await saveTemplate(template, updatedBy);

                    // Then: The updatedBy field should match
                    expect(savedTemplate.updatedBy).toBe(updatedBy);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 27 (timestamp update): Saving updates the updatedAt timestamp', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (template, updatedBy) => {
                    // Reset storage for each property test iteration
                    storage.clear();

                    // When: We save the template
                    const beforeSave = new Date();
                    const savedTemplate = await saveTemplate(template, updatedBy);
                    const afterSave = new Date();

                    // Then: The updatedAt should be set to a new date during the save operation
                    expect(savedTemplate.updatedAt).toBeInstanceOf(Date);
                    // The saved timestamp should be between before and after the save
                    expect(savedTemplate.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
                    expect(savedTemplate.updatedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
                }
            ),
            { numRuns: 50 }
        );
    });
});
