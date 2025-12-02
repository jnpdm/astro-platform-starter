/**
 * API route for individual template operations
 * GET: Get specific template
 * PUT: Update template
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../../middleware/auth';
import {
    getCurrentTemplate,
    saveTemplate,
    validateTemplate
} from '../../../utils/templateStorage';
import type { QuestionnaireTemplate } from '../../../types/template';

interface TemplateResponse {
    success: boolean;
    template?: QuestionnaireTemplate;
    error?: string;
}

interface TemplateUpdateRequest {
    fields: QuestionnaireTemplate['fields'];
    updatedBy: string;
}

interface TemplateUpdateResponse {
    success: boolean;
    template?: QuestionnaireTemplate;
    previousVersion?: number;
    error?: string;
}

/**
 * GET /api/templates/[id]
 * Get a specific template by ID
 * 
 * Requires: PDM role (admin only)
 */
export const GET: APIRoute = async ({ request, params }) => {
    try {
        const templateId = params.id;
        console.log('[API] GET /api/templates/[id] - Getting template:', templateId);

        if (!templateId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Template ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check authentication - only PDM (admin) can manage templates
        const cookieHeader = request.headers.get('cookie');
        const currentUser = getUserSession(cookieHeader || undefined);

        if (!currentUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Authentication required'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Only PDM (admin) can manage templates
        if (currentUser.role !== 'PDM') {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Insufficient permissions. Only PDM users can manage templates.'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get the template
        const template = await getCurrentTemplate(templateId);

        if (!template) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Template '${templateId}' not found`
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        console.log('[API] Returning template:', template.id, 'version:', template.version);

        const response: TemplateResponse = {
            success: true,
            template
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
                }
            }
        );
    } catch (error) {
        console.error('[API] Error getting template:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to get template'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};

/**
 * PUT /api/templates/[id]
 * Update a template (creates new version)
 * 
 * Requires: PDM role (admin only)
 * Body: { fields: QuestionField[], updatedBy: string }
 */
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const templateId = params.id;
        console.log('[API] PUT /api/templates/[id] - Updating template:', templateId);

        if (!templateId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Template ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check authentication - only PDM (admin) can manage templates
        const cookieHeader = request.headers.get('cookie');
        const currentUser = getUserSession(cookieHeader || undefined);

        if (!currentUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Authentication required'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Only PDM (admin) can manage templates
        if (currentUser.role !== 'PDM') {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Insufficient permissions. Only PDM users can manage templates.'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Parse request body
        const body = await request.json() as TemplateUpdateRequest;

        if (!body.fields || !Array.isArray(body.fields)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid request body. Fields array is required.'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get current template
        const currentTemplate = await getCurrentTemplate(templateId);

        if (!currentTemplate) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Template '${templateId}' not found`
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Create updated template
        const updatedTemplate: QuestionnaireTemplate = {
            ...currentTemplate,
            fields: body.fields
        };

        // Validate template
        const validation = validateTemplate(updatedTemplate);
        if (!validation.valid) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Template validation failed: ${validation.errors.join(', ')}`
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Save template (this will create a new version)
        const previousVersion = currentTemplate.version;
        const savedTemplate = await saveTemplate(
            updatedTemplate,
            body.updatedBy || currentUser.email
        );

        console.log('[API] Template updated:', savedTemplate.id, 'version:', savedTemplate.version);

        const response: TemplateUpdateResponse = {
            success: true,
            template: savedTemplate,
            previousVersion
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('[API] Error updating template:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to update template'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
