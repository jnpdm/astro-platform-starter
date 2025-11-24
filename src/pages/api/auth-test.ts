/**
 * Auth test endpoint to verify cookies and session
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getUserSession } from '../../middleware/auth';

export const GET: APIRoute = async ({ request }) => {
    console.log('[Auth Test] Testing authentication...');

    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    console.log('[Auth Test] Request headers:', headers);

    // Get cookie header
    const cookieHeader = request.headers.get('cookie');
    console.log('[Auth Test] Cookie header:', cookieHeader);

    // Try to get user session
    const user = getUserSession(cookieHeader || undefined);
    console.log('[Auth Test] User session:', user);

    return new Response(
        JSON.stringify({
            success: true,
            headers: headers,
            cookieHeader: cookieHeader,
            user: user ? {
                email: user.email,
                role: user.role,
                id: user.id
            } : null,
            hasCookies: !!cookieHeader,
            hasUser: !!user
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
};

export const POST: APIRoute = async ({ request }) => {
    console.log('[Auth Test POST] Testing authentication with POST...');

    // Get cookie header
    const cookieHeader = request.headers.get('cookie');
    console.log('[Auth Test POST] Cookie header:', cookieHeader);

    // Try to get user session
    const user = getUserSession(cookieHeader || undefined);
    console.log('[Auth Test POST] User session:', user);

    return new Response(
        JSON.stringify({
            success: true,
            method: 'POST',
            cookieHeader: cookieHeader,
            user: user ? {
                email: user.email,
                role: user.role,
                id: user.id
            } : null,
            hasCookies: !!cookieHeader,
            hasUser: !!user
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
};
