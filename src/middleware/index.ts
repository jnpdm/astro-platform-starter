/**
 * Astro middleware for Auth0-based route protection
 * Executes before page rendering to check authentication
 */

import { defineMiddleware } from 'astro:middleware';
import {
    isProtectedRoute,
    getUserSession,
    canAccessRoute,
    type AuthUser
} from './auth';

/**
 * Middleware to protect routes and enforce authentication
 * Redirects unauthenticated users to login with return URL
 * Returns JSON errors for API routes
 */
export const onRequest = defineMiddleware(async (context, next) => {
    const { url, redirect } = context;
    const pathname = url.pathname;

    // Skip middleware for public routes and static assets
    if (
        pathname.startsWith('/_') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') && !pathname.endsWith('.html')
    ) {
        return next();
    }

    // Check if this is an API route
    const isApiRoute = pathname.startsWith('/api/');

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
        // Get user session from cookies (server-side)
        const cookieHeader = context.request.headers.get('cookie');
        const user: AuthUser | null = getUserSession(cookieHeader || undefined);

        // If not authenticated, handle based on route type
        if (!user) {
            if (isApiRoute) {
                // Return JSON error for API routes
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Authentication required',
                        code: 'UNAUTHORIZED'
                    }),
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // Redirect to login for page routes
                const returnUrl = encodeURIComponent(pathname + url.search);
                return redirect(`/?redirect=${returnUrl}`);
            }
        }

        // Check if user has permission to access this specific route
        if (!canAccessRoute(user, pathname)) {
            if (isApiRoute) {
                // Return JSON error for API routes
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Access denied',
                        code: 'FORBIDDEN'
                    }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // Redirect to home with error message for page routes
                return redirect('/?error=access_denied');
            }
        }

        // User is authenticated and has permission, continue
        // Store user in context for use in pages
        context.locals.user = user;
    }

    // Continue to the page
    return next();
});
