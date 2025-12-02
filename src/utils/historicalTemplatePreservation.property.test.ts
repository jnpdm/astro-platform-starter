/**
 * Property-based tests for historical submission template preservation
 * Feature: hub-improvements, Property 29: Historical submission template preservation
 * Validates: Requirements 8.10, 8.11
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { QuestionnaireTemplate, QuestionField } from '../types/template';
import type { QuestionnaireSubmission } from '../types/submission';

// Create a storage instance that can be reset between tests
let templateStorage = new Map<string, any>();
let submissionStorage = new Map<string, any>();

// Mock Netlify Blobs
vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn((storeName: string) => {
        const storage = storeName === 'templates' ? templateStorage : submissionStorage;
        return {
            get: vi.fn(async (key: string) => {
                return storage.get(key) || null;
            }),
            setJSON: vi.fn(async (key: string, value: any) => {
                storage.set(key, value);
            }),
            list: vi.fn(async () => ({
                blobs: Array.from(storage.keys()).map(key => ({ key })),
            })),
        };
    }),
}));

// Import after mocking
const { saveTemplate, getCurrentTemplate, getTemplateVersion } = await import('./templateStorage');
const { saveSubmission, getSubmission } = await import('./storage');

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

describe('Historical Template Preservation Property Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset storage between tests
        templateStorage = new Map<string, any>();
        submissionStorage = new Map<string, any>();
    });

    afterEach(() => {
        // Clear storage after each test
        templateStorage.clear();
        submissionStorage.clear();
    });

    it('Property 29: For any existing submission, the template version stored with that submission should remain unchanged when the template is updated', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 1, max: 5 }),
                async (initialTemplate, updatedBy, updateCount) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template exists at version 1
                    const v1Template = await saveTemplate(initialTemplate, updatedBy);
                    const originalVersion = v1Template.version;

                    // And: A submission is created with version 1
                    const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const originalSubmission: QuestionnaireSubmission = {
                        id: submissionId,
                        questionnaireId: initialTemplate.id,
                        version: '1.0.0',
                        partnerId: `partner-${Math.random().toString(36).substring(2, 9)}`,
                        sections: [],
                        sectionStatuses: {},
                        overallStatus: 'pending',
                        signature: {
                            type: 'typed',
                            data: 'Test Signature',
                            signerName: 'Test User',
                            signerEmail: updatedBy,
                            timestamp: new Date(),
                            ipAddress: '127.0.0.1',
                        },
                        templateVersion: originalVersion,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };
                    await saveSubmission(originalSubmission);

                    // When: The template is updated multiple times
                    let currentTemplate = v1Template;
                    for (let i = 0; i < updateCount; i++) {
                        currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                    }

                    // Then: The submission's template version should remain unchanged
                    const retrievedSubmission = await getSubmission(submissionId);
                    expect(retrievedSubmission).not.toBeNull();
                    expect(retrievedSubmission!.templateVersion).toBe(originalVersion);

                    // And: The current template should have a higher version
                    const currentTemplateVersion = currentTemplate.version;
                    expect(currentTemplateVersion).toBeGreaterThan(originalVersion);

                    // And: The submission's version should not equal the current template version
                    expect(retrievedSubmission!.templateVersion).not.toBe(currentTemplateVersion);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 29 (multiple submissions): All existing submissions preserve their original template versions independently', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 2, max: 5 }),
                async (initialTemplate, updatedBy, submissionCount) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template that gets updated multiple times with submissions at each version
                    const submissionVersionMap = new Map<string, number>();
                    let currentTemplate = initialTemplate;

                    for (let i = 0; i < submissionCount; i++) {
                        // Save template (creates new version)
                        currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                        const versionAtCreation = currentTemplate.version;

                        // Create submission with this version
                        const submissionId = `submission-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                        const submission: QuestionnaireSubmission = {
                            id: submissionId,
                            questionnaireId: initialTemplate.id,
                            version: '1.0.0',
                            partnerId: `partner-${Math.random().toString(36).substring(2, 9)}`,
                            sections: [],
                            sectionStatuses: {},
                            overallStatus: 'pending',
                            signature: {
                                type: 'typed',
                                data: 'Test Signature',
                                signerName: 'Test User',
                                signerEmail: updatedBy,
                                timestamp: new Date(),
                                ipAddress: '127.0.0.1',
                            },
                            templateVersion: versionAtCreation,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            submittedBy: updatedBy,
                            submittedByRole: 'PDM',
                            ipAddress: '127.0.0.1',
                        };
                        await saveSubmission(submission);
                        submissionVersionMap.set(submissionId, versionAtCreation);
                    }

                    // When: We update the template one more time
                    currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                    const finalVersion = currentTemplate.version;

                    // Then: All submissions should still have their original template versions
                    for (const [submissionId, originalVersion] of submissionVersionMap.entries()) {
                        const retrievedSubmission = await getSubmission(submissionId);
                        expect(retrievedSubmission).not.toBeNull();
                        expect(retrievedSubmission!.templateVersion).toBe(originalVersion);
                        expect(retrievedSubmission!.templateVersion).toBeLessThan(finalVersion);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 29 (version history): Historical template versions remain accessible after template updates', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 1, max: 5 }),
                async (initialTemplate, updatedBy, updateCount) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template that gets updated multiple times
                    const versions: number[] = [];
                    let currentTemplate = initialTemplate;

                    for (let i = 0; i < updateCount; i++) {
                        currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                        versions.push(currentTemplate.version);
                    }

                    // When: We try to retrieve each historical version
                    for (const version of versions.slice(0, -1)) { // All except the last (current)
                        const historicalVersion = await getTemplateVersion(initialTemplate.id, version);

                        // Then: The historical version should be accessible
                        expect(historicalVersion).not.toBeNull();
                        expect(historicalVersion!.version).toBe(version);
                        expect(historicalVersion!.templateId).toBe(initialTemplate.id);
                    }

                    // And: The current template should have the latest version
                    const currentRetrieved = await getCurrentTemplate(initialTemplate.id);
                    expect(currentRetrieved).not.toBeNull();
                    expect(currentRetrieved!.version).toBe(versions[versions.length - 1]);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 29 (immutability): Submission template versions are immutable after creation', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (initialTemplate, updatedBy) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template and a submission
                    const v1Template = await saveTemplate(initialTemplate, updatedBy);
                    const v1 = v1Template.version;

                    const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const submission: QuestionnaireSubmission = {
                        id: submissionId,
                        questionnaireId: initialTemplate.id,
                        version: '1.0.0',
                        partnerId: `partner-${Math.random().toString(36).substring(2, 9)}`,
                        sections: [],
                        sectionStatuses: {},
                        overallStatus: 'pending',
                        signature: {
                            type: 'typed',
                            data: 'Test Signature',
                            signerName: 'Test User',
                            signerEmail: updatedBy,
                            timestamp: new Date(),
                            ipAddress: '127.0.0.1',
                        },
                        templateVersion: v1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };
                    await saveSubmission(submission);

                    // When: We retrieve the submission multiple times with template updates in between
                    const firstRetrieval = await getSubmission(submissionId);
                    const firstVersion = firstRetrieval!.templateVersion;

                    // Update template
                    await saveTemplate(v1Template, updatedBy);

                    const secondRetrieval = await getSubmission(submissionId);
                    const secondVersion = secondRetrieval!.templateVersion;

                    // Update template again
                    await saveTemplate(v1Template, updatedBy);

                    const thirdRetrieval = await getSubmission(submissionId);
                    const thirdVersion = thirdRetrieval!.templateVersion;

                    // Then: All retrievals should return the same template version
                    expect(firstVersion).toBe(v1);
                    expect(secondVersion).toBe(v1);
                    expect(thirdVersion).toBe(v1);
                    expect(firstVersion).toBe(secondVersion);
                    expect(secondVersion).toBe(thirdVersion);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 29 (field preservation): Submissions retain field data even when template fields are modified', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (initialTemplate, updatedBy) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template with specific fields
                    const v1Template = await saveTemplate(initialTemplate, updatedBy);
                    const originalFieldIds = v1Template.fields.map(f => f.id);

                    // And: A submission with data for those fields
                    const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const fieldData: Record<string, any> = {};
                    originalFieldIds.forEach(fieldId => {
                        fieldData[fieldId] = `value-for-${fieldId}`;
                    });

                    const submission: QuestionnaireSubmission = {
                        id: submissionId,
                        questionnaireId: initialTemplate.id,
                        version: '1.0.0',
                        partnerId: `partner-${Math.random().toString(36).substring(2, 9)}`,
                        sections: [{
                            sectionId: 'section-1',
                            fields: fieldData,
                            status: {
                                result: 'pass',
                            },
                        }],
                        sectionStatuses: {},
                        overallStatus: 'pending',
                        signature: {
                            type: 'typed',
                            data: 'Test Signature',
                            signerName: 'Test User',
                            signerEmail: updatedBy,
                            timestamp: new Date(),
                            ipAddress: '127.0.0.1',
                        },
                        templateVersion: v1Template.version,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };
                    await saveSubmission(submission);

                    // When: The template is updated with modified fields
                    const modifiedTemplate = {
                        ...v1Template,
                        fields: v1Template.fields.map(f => ({
                            ...f,
                            label: `Modified ${f.label}`,
                        })),
                    };
                    await saveTemplate(modifiedTemplate, updatedBy);

                    // Then: The submission should still have all its original field data
                    const retrievedSubmission = await getSubmission(submissionId);
                    expect(retrievedSubmission).not.toBeNull();
                    expect(retrievedSubmission!.sections[0].fields).toEqual(fieldData);

                    // And: All original field IDs should still be present
                    const retrievedFieldIds = Object.keys(retrievedSubmission!.sections[0].fields);
                    expect(retrievedFieldIds.sort()).toEqual(originalFieldIds.sort());
                }
            ),
            { numRuns: 50 }
        );
    });
});
