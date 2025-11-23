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

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
        // Get user session from storage
        const user: AuthUser | null = getUserSession();

        // If not authenticated, redirect to login with return URL
        if (!user) {
            const returnUrl = encodeURIComponent(pathname + url.search);
            return redirect(`/?redirect=${returnUrl}`);
        }

        // Check if user has permission to access this specific route
        if (!canAccessRoute(user, pathname)) {
            // User is authenticated but doesn't have permission
            // Redirect to home with error message
            return redirect('/?error=access_denied');
        }

        // User is authenticated and has permission, continue
        // Store user in context for use in pages
        context.locals.user = user;
    }

    // Continue to the page
    return next();
});
