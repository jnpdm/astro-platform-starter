/**
 * Template Storage Tests
 * Tests for template storage utilities including historical template loading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuestionnaireTemplate, TemplateVersion } from '../types/template';

// Mock Netlify Blobs
const mockGet = vi.fn();
const mockSetJSON = vi.fn();
const mockList = vi.fn();

vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn(() => ({
        get: mockGet,
        setJSON: mockSetJSON,
        list: mockList,
    })),
}));

describe('getTemplateForSubmission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockResolvedValue(null);
    });

    it('should load current template when no version is specified', async () => {
        const mockTemplate: QuestionnaireTemplate = {
            id: 'gate-0',
            name: 'Gate 0: Onboarding Kickoff',
            version: 3,
            fields: [
                {
                    id: 'field1',
                    type: 'text',
                    label: 'Test Field',
                    required: true,
                    order: 1,
                },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
            updatedBy: 'admin@example.com',
        };

        // Mock the blob store to return the current template
        mockGet.mockResolvedValue(mockTemplate);

        const { getTemplateForSubmission } = await import('./templateStorage');
        const result = await getTemplateForSubmission('gate-0');

        expect(result).toEqual(mockTemplate);
        expect(result?.version).toBe(3);
    });

    it('should load historical template version when version is specified', async () => {
        const mockVersion: TemplateVersion = {
            templateId: 'gate-0',
            version: 1,
            fields: [
                {
                    id: 'old-field',
                    type: 'text',
                    label: 'Old Field',
                    required: true,
                    order: 1,
                },
            ],
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin@example.com',
        };

        // Mock the blob store to return the historical version
        mockGet.mockResolvedValue(mockVersion);

        const { getTemplateForSubmission } = await import('./templateStorage');
        const result = await getTemplateForSubmission('gate-0', 1);

        expect(result).toEqual(mockVersion);
        expect(result?.version).toBe(1);
    });

    it('should fall back to current template when historical version not found', async () => {
        const mockCurrentTemplate: QuestionnaireTemplate = {
            id: 'gate-0',
            name: 'Gate 0: Onboarding Kickoff',
            version: 3,
            fields: [
                {
                    id: 'field1',
                    type: 'text',
                    label: 'Current Field',
                    required: true,
                    order: 1,
                },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
            updatedBy: 'admin@example.com',
        };

        // First call (for version) returns null, second call (for current) returns template
        mockGet
            .mockResolvedValueOnce(null) // Version not found
            .mockResolvedValueOnce(mockCurrentTemplate); // Current template found

        const { getTemplateForSubmission } = await import('./templateStorage');
        const result = await getTemplateForSubmission('gate-0', 99);

        expect(result).toEqual(mockCurrentTemplate);
        expect(result?.version).toBe(3);
    });

    it('should return null when neither version nor current template exists', async () => {
        // Both calls return null
        mockGet.mockResolvedValue(null);

        const { getTemplateForSubmission } = await import('./templateStorage');
        const result = await getTemplateForSubmission('non-existent', 1);

        expect(result).toBeNull();
    });
});

describe('Historical Template Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockResolvedValue(null);
    });

    it('should preserve field structure from historical version', async () => {
        const historicalVersion: TemplateVersion = {
            templateId: 'gate-1',
            version: 2,
            fields: [
                {
                    id: 'legacy-field',
                    type: 'textarea',
                    label: 'Legacy Question',
                    required: false,
                    order: 1,
                    helpText: 'This field was in version 2',
                },
                {
                    id: 'removed-field',
                    type: 'text',
                    label: 'Removed Field',
                    required: true,
                    order: 2,
                    removed: true, // This field was removed in later versions
                },
            ],
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin@example.com',
        };

        mockGet.mockResolvedValue(historicalVersion);

        const { getTemplateForSubmission } = await import('./templateStorage');
        const result = await getTemplateForSubmission('gate-1', 2);

        expect(result).toEqual(historicalVersion);
        expect(result?.fields).toHaveLength(2);
        expect(result?.fields[0].id).toBe('legacy-field');
        expect(result?.fields[1].removed).toBe(true);
    });
});
