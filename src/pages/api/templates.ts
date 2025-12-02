/**
 * API route for template operations
 * GET: List all templates
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../middleware/auth';
import { listTemplates } from '../../utils/templateStorage';
import type { QuestionnaireTemplate } from '../../types/template';

interface TemplateListResponse {
    success: boolean;
    templates: QuestionnaireTemplate[];
    error?: string;
}

/**
 * GET /api/templates
 * List all current templates
 * 
 * Requires: PDM role (admin only)
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        console.log('[API] GET /api/templates - Listing templates');

        // Check authentication - only PDM (admin) can manage templates
        const cookieHeader = request.headers.get('cookie');
        const currentUser = getUserSession(cookieHeader || undefined);

        if (!currentUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Authentication required',
                    templates: []
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
                    error: 'Insufficient permissions. Only PDM users can manage templates.',
                    templates: []
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get all templates
        const templates = await listTemplates();

        console.log('[API] Returning templates:', templates.length);

        const response: TemplateListResponse = {
            success: true,
            templates
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
        console.error('[API] Error listing templates:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to list templates',
                templates: []
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
