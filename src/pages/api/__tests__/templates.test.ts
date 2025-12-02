/**
 * Unit tests for template API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuestionnaireTemplate, TemplateVersion } from '../../../types/template';

// Mock the auth middleware
vi.mock('../../../middleware/auth', () => ({
    getUserSession: vi.fn()
}));

// Mock the template storage
vi.mock('../../../utils/templateStorage', () => ({
    listTemplates: vi.fn(),
    getCurrentTemplate: vi.fn(),
    saveTemplate: vi.fn(),
    validateTemplate: vi.fn(),
    listTemplateVersions: vi.fn(),
    getTemplateVersion: vi.fn()
}));

import { getUserSession } from '../../../middleware/auth';
import {
    listTemplates,
    getCurrentTemplate,
    saveTemplate,
    validateTemplate,
    listTemplateVersions,
    getTemplateVersion
} from '../../../utils/templateStorage';

// Import the API routes
import { GET as getTemplates } from '../templates';
import { GET as getTemplate, PUT as updateTemplate } from '../templates/[id]';
import { GET as getVersions } from '../templates/[id]/versions';
import { GET as getVersion } from '../templates/[id]/versions/[version]';

describe('Template API Endpoints', () => {
    const mockPDMUser = {
        id: 'pdm-user-id',
        email: 'pdm@example.com',
        name: 'PDM User',
        role: 'PDM' as const
    };

    const mockPAMUser = {
        id: 'pam-user-id',
        email: 'pam@example.com',
        name: 'PAM User',
        role: 'PAM' as const
    };

    const mockTemplate: QuestionnaireTemplate = {
        id: 'gate-0',
        name: 'Gate 0: Onboarding Kickoff',
        version: 1,
        fields: [
            {
                id: 'field1',
                type: 'text',
                label: 'Test Field',
                required: true,
                order: 1
            }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'pdm@example.com'
    };

    const mockVersion: TemplateVersion = {
        templateId: 'gate-0',
        version: 1,
        fields: mockTemplate.fields,
        createdAt: new Date('2024-01-01'),
        createdBy: 'pdm@example.com'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/templates', () => {
        it('should return templates for authenticated PDM user', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(listTemplates).mockResolvedValue([mockTemplate]);

            const request = new Request('http://localhost/api/templates', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getTemplates({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.templates).toHaveLength(1);
            expect(data.templates[0].id).toBe('gate-0');
        });

        it('should return 401 for unauthenticated user', async () => {
            vi.mocked(getUserSession).mockReturnValue(null);

            const request = new Request('http://localhost/api/templates');

            const response = await getTemplates({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error).toContain('Authentication required');
        });

        it('should return 403 for non-PDM user', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPAMUser);

            const request = new Request('http://localhost/api/templates', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getTemplates({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error).toContain('Insufficient permissions');
        });
    });

    describe('GET /api/templates/[id]', () => {
        it('should return template for authenticated PDM user', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getCurrentTemplate).mockResolvedValue(mockTemplate);

            const request = new Request('http://localhost/api/templates/gate-0', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getTemplate({
                request,
                params: { id: 'gate-0' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.template?.id).toBe('gate-0');
        });

        it('should return 404 for non-existent template', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getCurrentTemplate).mockResolvedValue(null);

            const request = new Request('http://localhost/api/templates/invalid', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getTemplate({
                request,
                params: { id: 'invalid' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toContain('not found');
        });
    });

    describe('PUT /api/templates/[id]', () => {
        it('should update template for authenticated PDM user', async () => {
            const updatedTemplate = { ...mockTemplate, version: 2 };

            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getCurrentTemplate).mockResolvedValue(mockTemplate);
            vi.mocked(validateTemplate).mockReturnValue({ valid: true, errors: [] });
            vi.mocked(saveTemplate).mockResolvedValue(updatedTemplate);

            const request = new Request('http://localhost/api/templates/gate-0', {
                method: 'PUT',
                headers: {
                    cookie: 'session=valid',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    fields: mockTemplate.fields,
                    updatedBy: 'pdm@example.com'
                })
            });

            const response = await updateTemplate({
                request,
                params: { id: 'gate-0' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.template?.version).toBe(2);
            expect(data.previousVersion).toBe(1);
        });

        it('should return 400 for invalid template data', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getCurrentTemplate).mockResolvedValue(mockTemplate);
            vi.mocked(validateTemplate).mockReturnValue({
                valid: false,
                errors: ['Duplicate field IDs found']
            });

            const request = new Request('http://localhost/api/templates/gate-0', {
                method: 'PUT',
                headers: {
                    cookie: 'session=valid',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    fields: mockTemplate.fields,
                    updatedBy: 'pdm@example.com'
                })
            });

            const response = await updateTemplate({
                request,
                params: { id: 'gate-0' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('validation failed');
        });
    });

    describe('GET /api/templates/[id]/versions', () => {
        it('should return version history for authenticated PDM user', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(listTemplateVersions).mockResolvedValue([mockVersion]);

            const request = new Request('http://localhost/api/templates/gate-0/versions', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getVersions({
                request,
                params: { id: 'gate-0' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.versions).toHaveLength(1);
            expect(data.versions[0].version).toBe(1);
        });
    });

    describe('GET /api/templates/[id]/versions/[version]', () => {
        it('should return specific version for authenticated PDM user', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getTemplateVersion).mockResolvedValue(mockVersion);

            const request = new Request('http://localhost/api/templates/gate-0/versions/1', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getVersion({
                request,
                params: { id: 'gate-0', version: '1' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.version?.version).toBe(1);
        });

        it('should return 400 for invalid version number', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);

            const request = new Request('http://localhost/api/templates/gate-0/versions/invalid', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getVersion({
                request,
                params: { id: 'gate-0', version: 'invalid' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('Invalid version number');
        });

        it('should return 404 for non-existent version', async () => {
            vi.mocked(getUserSession).mockReturnValue(mockPDMUser);
            vi.mocked(getTemplateVersion).mockResolvedValue(null);

            const request = new Request('http://localhost/api/templates/gate-0/versions/999', {
                headers: { cookie: 'session=valid' }
            });

            const response = await getVersion({
                request,
                params: { id: 'gate-0', version: '999' }
            } as any);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toContain('not found');
        });
    });
});
