/**
 * API route for questionnaire submission operations
 * POST: Create a new questionnaire submission
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { saveSubmission, StorageError } from '../../utils/storage';
import type { QuestionnaireSubmission } from '../../types/submission';

/**
 * POST /api/submissions
 * Create a new questionnaire submission
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();

        // Validate required fields
        const validationError = validateSubmissionData(body);
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

        // Generate ID if not provided
        const submissionId = body.id || generateSubmissionId();

        // Get client IP address
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Get user agent
        const userAgent = request.headers.get('user-agent') || undefined;

        // Create submission record
        const submission: QuestionnaireSubmission = {
            id: submissionId,
            questionnaireId: body.questionnaireId,
            version: body.version || '1.0.0',
            partnerId: body.partnerId,
            sections: body.sections || [],
            sectionStatuses: body.sectionStatuses || {},
            overallStatus: body.overallStatus || 'pending',
            signature: {
                ...body.signature,
                timestamp: body.signature?.timestamp ? new Date(body.signature.timestamp) : new Date(),
                ipAddress: body.signature?.ipAddress || ipAddress,
                userAgent: body.signature?.userAgent || userAgent
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
            submittedBy: body.submittedBy,
            submittedByRole: body.submittedByRole,
            ipAddress: ipAddress,
            userAgent: userAgent
        };

        await saveSubmission(submission);

        return new Response(
            JSON.stringify({
                success: true,
                data: submission
            }),
            {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error creating submission:', error);

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
                error: 'Failed to create submission'
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
 * Validate submission data
 */
function validateSubmissionData(data: any): string | null {
    if (!data.questionnaireId || typeof data.questionnaireId !== 'string') {
        return 'questionnaireId is required and must be a string';
    }

    if (!data.partnerId || typeof data.partnerId !== 'string') {
        return 'partnerId is required and must be a string';
    }

    if (!data.submittedBy || typeof data.submittedBy !== 'string') {
        return 'submittedBy is required and must be a string';
    }

    if (!data.submittedByRole || !['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'].includes(data.submittedByRole)) {
        return 'submittedByRole is required and must be one of: PAM, PDM, TPM, PSM, TAM, Admin';
    }

    if (!data.signature || typeof data.signature !== 'object') {
        return 'signature is required and must be an object';
    }

    if (!data.signature.type || !['typed', 'drawn'].includes(data.signature.type)) {
        return 'signature.type is required and must be either "typed" or "drawn"';
    }

    if (!data.signature.data || typeof data.signature.data !== 'string') {
        return 'signature.data is required and must be a string';
    }

    if (!data.signature.signerName || typeof data.signature.signerName !== 'string') {
        return 'signature.signerName is required and must be a string';
    }

    if (!data.signature.signerEmail || typeof data.signature.signerEmail !== 'string') {
        return 'signature.signerEmail is required and must be a string';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.signature.signerEmail)) {
        return 'signature.signerEmail must be a valid email address';
    }

    if (data.sections && !Array.isArray(data.sections)) {
        return 'sections must be an array';
    }

    if (data.overallStatus && !['pass', 'fail', 'partial', 'pending'].includes(data.overallStatus)) {
        return 'overallStatus must be one of: pass, fail, partial, pending';
    }

    return null;
}

/**
 * Generate a unique submission ID
 */
function generateSubmissionId(): string {
    return `submission-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
