/**
 * API route for template version history
 * GET: List all versions of a template
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../../../middleware/auth';
import { listTemplateVersions } from '../../../../utils/templateStorage';
import type { TemplateVersion } from '../../../../types/template';

interface TemplateVersionsResponse {
    success: boolean;
    versions: TemplateVersion[];
    error?: string;
}

/**
 * GET /api/templates/[id]/versions
 * Get version history for a template
 * 
 * Requires: PDM role (admin only)
 */
export const GET: APIRoute = async ({ request, params }) => {
    try {
        const templateId = params.id;
        console.log('[API] GET /api/templates/[id]/versions - Getting versions for:', templateId);

        if (!templateId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Template ID is required',
                    versions: []
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
                    error: 'Authentication required',
                    versions: []
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
                    versions: []
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get all versions for the template
        const versions = await listTemplateVersions(templateId);

        console.log('[API] Returning versions:', versions.length);

        const response: TemplateVersionsResponse = {
            success: true,
            versions
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
        console.error('[API] Error getting template versions:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to get template versions',
                versions: []
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
