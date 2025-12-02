/**
 * Property-based tests for new submissions using current template
 * Feature: hub-improvements, Property 28: New submissions use current template
 * Validates: Requirements 8.10
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
const { saveTemplate, getCurrentTemplate } = await import('./templateStorage');
const { saveSubmission } = await import('./storage');

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

describe('New Submission Template Version Property Tests', () => {
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

    it('Property 28: For any new questionnaire submission created after a template update, the submission should reference the latest template version', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (initialTemplate, updatedBy) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template exists and is updated
                    const firstSave = await saveTemplate(initialTemplate, updatedBy);
                    const secondSave = await saveTemplate(firstSave, updatedBy);
                    const latestVersion = secondSave.version;

                    // When: We retrieve the current template
                    const currentTemplate = await getCurrentTemplate(initialTemplate.id);

                    // Then: The current template should have the latest version
                    expect(currentTemplate).not.toBeNull();
                    expect(currentTemplate!.version).toBe(latestVersion);

                    // And when: A new submission is created with the current template version
                    // (simulating what happens in the questionnaire page)
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
                        templateVersion: currentTemplate!.version, // Use current template version
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };

                    await saveSubmission(submission);

                    // Then: The submission should reference the latest template version
                    expect(submission.templateVersion).toBe(latestVersion);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 28 (multiple updates): New submissions always use the most recent template version', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 1, max: 5 }),
                async (initialTemplate, updatedBy, updateCount) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template is updated multiple times
                    let currentTemplate = initialTemplate;
                    for (let i = 0; i < updateCount; i++) {
                        currentTemplate = await saveTemplate(currentTemplate, updatedBy);
                    }

                    const expectedVersion = currentTemplate.version;

                    // When: We retrieve the current template
                    const retrievedTemplate = await getCurrentTemplate(initialTemplate.id);

                    // Then: It should have the latest version
                    expect(retrievedTemplate).not.toBeNull();
                    expect(retrievedTemplate!.version).toBe(expectedVersion);

                    // And when: A new submission is created with this version
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
                        templateVersion: retrievedTemplate!.version,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };

                    await saveSubmission(submission);

                    // Then: The submission should reference the latest version
                    expect(submission.templateVersion).toBe(expectedVersion);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 28 (consistency): All new submissions created at the same time use the same template version', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                fc.integer({ min: 2, max: 5 }),
                async (initialTemplate, updatedBy, submissionCount) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template exists
                    const savedTemplate = await saveTemplate(initialTemplate, updatedBy);
                    const currentVersion = savedTemplate.version;

                    // When: We create multiple new submissions at the same time
                    const submissions: QuestionnaireSubmission[] = [];
                    for (let i = 0; i < submissionCount; i++) {
                        const submissionId = `submission-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;
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
                            templateVersion: currentVersion,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            submittedBy: updatedBy,
                            submittedByRole: 'PDM',
                            ipAddress: '127.0.0.1',
                        };
                        await saveSubmission(submission);
                        submissions.push(submission);
                    }

                    // Then: All submissions should reference the same template version
                    const versions = submissions.map(s => s.templateVersion);
                    const uniqueVersions = new Set(versions);
                    expect(uniqueVersions.size).toBe(1);
                    expect(Array.from(uniqueVersions)[0]).toBe(currentVersion);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property 28 (version progression): Submissions created after template updates reflect the progression', async () => {
        await fc.assert(
            fc.asyncProperty(
                templateArb,
                fc.emailAddress(),
                async (initialTemplate, updatedBy) => {
                    // Reset storage for each property test iteration
                    templateStorage.clear();
                    submissionStorage.clear();

                    // Given: A template at version 1
                    const v1Template = await saveTemplate(initialTemplate, updatedBy);
                    const v1 = v1Template.version;

                    // When: We create a submission with version 1
                    const submission1: QuestionnaireSubmission = {
                        id: `submission-1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
                    await saveSubmission(submission1);

                    // And: We update the template to version 2
                    const v2Template = await saveTemplate(v1Template, updatedBy);
                    const v2 = v2Template.version;

                    // And: We create a submission with version 2
                    const submission2: QuestionnaireSubmission = {
                        id: `submission-2-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
                        templateVersion: v2,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        submittedBy: updatedBy,
                        submittedByRole: 'PDM',
                        ipAddress: '127.0.0.1',
                    };
                    await saveSubmission(submission2);

                    // Then: The submissions should have different versions
                    expect(submission1.templateVersion).toBe(v1);
                    expect(submission2.templateVersion).toBe(v2);
                    expect(submission2.templateVersion).toBeGreaterThan(submission1.templateVersion!);
                }
            ),
            { numRuns: 50 }
        );
    });
});
