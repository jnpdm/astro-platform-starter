/**
 * API route for user operations
 * GET: List users filtered by role
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../middleware/auth';
import type { UserRole } from '../../types';

interface UserInfo {
    email: string;
    name: string;
    role: UserRole;
}

interface UserListResponse {
    success: boolean;
    users: UserInfo[];
    error?: string;
}

/**
 * GET /api/users?role=PAM
 * List users filtered by role
 * 
 * Query parameters:
 * - role: Filter users by role (PAM, PDM, TAM, PSM)
 * 
 * Note: This is a simplified implementation that returns mock data.
 * In production, this would query Auth0 Management API to get real users.
 */
export const GET: APIRoute = async ({ request, url }) => {
    try {
        console.log('[API] GET /api/users - Listing users');

        // Check authentication - only PDM (admin) can list users
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

        // Only PDM (admin) can list users
        if (currentUser.role !== 'PDM') {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Insufficient permissions. Only PDM users can list users.'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get role filter from query params
        const roleFilter = url.searchParams.get('role') as UserRole | null;
        console.log('[API] Role filter:', roleFilter);

        // Validate role filter if provided
        const validRoles: UserRole[] = ['PAM', 'PDM', 'TAM', 'PSM'];
        if (roleFilter && !validRoles.includes(roleFilter)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Invalid role filter. Must be one of: ${validRoles.join(', ')}`
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // TODO: In production, this would query Auth0 Management API
        // For now, return mock data for development/testing
        const allUsers: UserInfo[] = getMockUsers();

        // Filter by role if specified
        const filteredUsers = roleFilter
            ? allUsers.filter(user => user.role === roleFilter)
            : allUsers;

        console.log('[API] Returning users:', filteredUsers.length);

        const response: UserListResponse = {
            success: true,
            users: filteredUsers
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
        console.error('[API] Error listing users:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to list users',
                users: []
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
 * Get mock users for development/testing
 * In production, this would be replaced with Auth0 Management API calls
 */
function getMockUsers(): UserInfo[] {
    return [
        {
            email: 'pam1@example.com',
            name: 'Alice PAM',
            role: 'PAM'
        },
        {
            email: 'pam2@example.com',
            name: 'Bob PAM',
            role: 'PAM'
        },
        {
            email: 'pam3@example.com',
            name: 'Carol PAM',
            role: 'PAM'
        },
        {
            email: 'pdm1@example.com',
            name: 'David PDM',
            role: 'PDM'
        },
        {
            email: 'pdm2@example.com',
            name: 'Eve PDM',
            role: 'PDM'
        },
        {
            email: 'tam1@example.com',
            name: 'Frank TAM',
            role: 'TAM'
        },
        {
            email: 'tam2@example.com',
            name: 'Grace TAM',
            role: 'TAM'
        },
        {
            email: 'psm1@example.com',
            name: 'Henry PSM',
            role: 'PSM'
        },
        {
            email: 'psm2@example.com',
            name: 'Iris PSM',
            role: 'PSM'
        }
    ];
}
