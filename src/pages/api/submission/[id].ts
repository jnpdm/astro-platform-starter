/**
 * API route for individual submission operations
 * GET: Retrieve a specific questionnaire submission
 */

import type { APIRoute } from 'astro';
import { getSubmission, StorageError } from '../../../utils/storage';

export const prerender = false;

/**
 * GET /api/submission/[id]
 * Retrieve a specific questionnaire submission
 */
export const GET: APIRoute = async ({ params }) => {
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
