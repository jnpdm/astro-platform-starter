/**
 * API route for individual questionnaire submission operations
 * GET: Retrieve a specific submission
 * PUT: Update an existing submission
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getSubmission, saveSubmission, StorageError } from '../../../utils/storage';
import { getUserSession } from '../../../middleware/auth';
import { canEditQuestionnaire } from '../../../utils/rbac';
import { getPartner } from '../../../utils/storage';
import type { QuestionnaireSubmission } from '../../../types/submission';

/**
 * GET /api/submission/[id]
 * Retrieve a specific questionnaire submission
 */
export const GET: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Submission ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        const submission = await getSubmission(id);

        if (!submission) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Submission not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: submission
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error retrieving submission:', error);

        if (error instanceof StorageError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to retrieve submission'
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
 * PUT /api/submission/[id]
 * Update an existing questionnaire submission
 */
export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Submission ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get current user from cookies
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

        // Get existing submission
        const existingSubmission = await getSubmission(id);

        if (!existingSubmission) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Submission not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get partner to check permissions
        const partner = await getPartner(existingSubmission.partnerId);

        if (!partner) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check if user has permission to edit this questionnaire
        if (!canEditQuestionnaire(currentUser, partner)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'You do not have permission to edit this questionnaire'
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
        const body = await request.json();

        // Validate required fields
        const validationError = validateUpdateData(body);
        if (validationError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: validationError
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get client IP address
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Get user agent
        const userAgent = request.headers.get('user-agent') || undefined;

        // Update submission record (keeping the same ID and createdAt)
        const updatedSubmission: QuestionnaireSubmission = {
            ...existingSubmission,
            sections: body.sections || existingSubmission.sections,
            sectionStatuses: body.sectionStatuses || existingSubmission.sectionStatuses,
            overallStatus: body.overallStatus || existingSubmission.overallStatus,
            signature: body.signature ? {
                ...body.signature,
                timestamp: body.signature.timestamp ? new Date(body.signature.timestamp) : new Date(),
                ipAddress: body.signature.ipAddress || ipAddress,
                userAgent: body.signature.userAgent || userAgent
            } : existingSubmission.signature,
            updatedAt: new Date(), // Update timestamp
            submittedAt: body.submittedAt ? new Date(body.submittedAt) : existingSubmission.submittedAt,
            submittedBy: currentUser.email,
            submittedByRole: currentUser.role,
            ipAddress: ipAddress,
            userAgent: userAgent
        };

        await saveSubmission(updatedSubmission);

        return new Response(
            JSON.stringify({
                success: true,
                data: updatedSubmission
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error updating submission:', error);

        if (error instanceof StorageError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        if (error instanceof SyntaxError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to update submission'
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
 * Validate update data
 */
function validateUpdateData(data: any): string | null {
    // At least one field should be provided for update
    if (!data.sections && !data.sectionStatuses && !data.overallStatus && !data.signature) {
        return 'At least one field must be provided for update';
    }

    if (data.sections && !Array.isArray(data.sections)) {
        return 'sections must be an array';
    }

    if (data.overallStatus && !['pass', 'fail', 'partial', 'pending'].includes(data.overallStatus)) {
        return 'overallStatus must be one of: pass, fail, partial, pending';
    }

    if (data.signature) {
        if (typeof data.signature !== 'object') {
            return 'signature must be an object';
        }

        if (data.signature.type && !['typed', 'drawn'].includes(data.signature.type)) {
            return 'signature.type must be either "typed" or "drawn"';
        }

        if (data.signature.signerEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.signature.signerEmail)) {
                return 'signature.signerEmail must be a valid email address';
            }
        }
    }

    return null;
}
