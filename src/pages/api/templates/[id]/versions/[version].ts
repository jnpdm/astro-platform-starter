/**
 * API route for specific template version
 * GET: Get a specific version of a template
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../../../../middleware/auth';
import { getTemplateVersion } from '../../../../../utils/templateStorage';
import type { TemplateVersion } from '../../../../../types/template';

interface TemplateVersionResponse {
    success: boolean;
    version?: TemplateVersion;
    error?: string;
}

/**
 * GET /api/templates/[id]/versions/[version]
 * Get a specific version of a template
 * 
 * Requires: PDM role (admin only)
 */
export const GET: APIRoute = async ({ request, params }) => {
    try {
        const templateId = params.id;
        const versionParam = params.version;

        console.log('[API] GET /api/templates/[id]/versions/[version] - Getting version:', templateId, versionParam);

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

        if (!versionParam) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Version number is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Parse version number
        const versionNumber = parseInt(versionParam, 10);
        if (isNaN(versionNumber) || versionNumber < 1) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid version number. Must be a positive integer.'
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

        // Get the specific version
        const version = await getTemplateVersion(templateId, versionNumber);

        if (!version) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Version ${versionNumber} of template '${templateId}' not found`
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        console.log('[API] Returning version:', version.templateId, 'version:', version.version);

        const response: TemplateVersionResponse = {
            success: true,
            version
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, max-age=3600' // Cache for 1 hour (versions are immutable)
                }
            }
        );
    } catch (error) {
        console.error('[API] Error getting template version:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to get template version'
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
