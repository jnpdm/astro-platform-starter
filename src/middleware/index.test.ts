/**
 * Tests for Astro middleware route protection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthUser } from './auth';

// Mock the auth module
vi.mock('./auth', () => ({
    isProtectedRoute: vi.fn(),
    getUserSession: vi.fn(),
    canAccessRoute: vi.fn(),
}));

import { isProtectedRoute, getUserSession, canAccessRoute } from './auth';
import { onRequest } from './index';

describe('Astro Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockContext = (pathname: string, search: string = '') => {
        const url = new URL(`http://localhost${pathname}${search}`);
        return {
            url,
            redirect: vi.fn((path: string) => ({ type: 'redirect', path })),
            locals: {} as any,
        };
    };

    const mockNext = vi.fn(() => Promise.resolve({ type: 'next' }));

    describe('Public routes', () => {
        it('should allow access to public routes without authentication', async () => {
            const context = createMockContext('/');
            vi.mocked(isProtectedRoute).mockReturnValue(false);

            await onRequest(context as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(context.redirect).not.toHaveBeenCalled();
        });

        it('should skip middleware for static assets', async () => {
            const context = createMockContext('/favicon.svg');

            await onRequest(context as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(isProtectedRoute).not.toHaveBeenCalled();
        });

        it('should skip middleware for Astro internal routes', async () => {
            const context = createMockContext('/_astro/something');

            await onRequest(context as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(isProtectedRoute).not.toHaveBeenCalled();
        });
    });

    describe('Protected routes - unauthenticated', () => {
        it('should redirect to login with return URL for unauthenticated users', async () => {
            const context = createMockContext('/partner/123');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(null);

            await onRequest(context as any, mockNext);

            expect(context.redirect).toHaveBeenCalledWith('/?redirect=%2Fpartner%2F123');
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should include query parameters in return URL', async () => {
            const context = createMockContext('/partner/123', '?tab=details');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(null);

            await onRequest(context as any, mockNext);

            expect(context.redirect).toHaveBeenCalledWith('/?redirect=%2Fpartner%2F123%3Ftab%3Ddetails');
        });
    });

    describe('Protected routes - authenticated', () => {
        const mockUser: AuthUser = {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'PAM',
        };

        it('should allow access for authenticated users with permission', async () => {
            const context = createMockContext('/partner/123');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(mockUser);
            vi.mocked(canAccessRoute).mockReturnValue(true);

            await onRequest(context as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(context.redirect).not.toHaveBeenCalled();
            expect(context.locals.user).toEqual(mockUser);
        });

        it('should redirect to home with error for users without permission', async () => {
            const context = createMockContext('/reports');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(mockUser);
            vi.mocked(canAccessRoute).mockReturnValue(false);

            await onRequest(context as any, mockNext);

            expect(context.redirect).toHaveBeenCalledWith('/?error=access_denied');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('API routes - unauthenticated', () => {
        it('should return 401 JSON for unauthenticated API requests', async () => {
            const context = createMockContext('/api/partners');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(null);

            const result = await onRequest(context as any, mockNext);

            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(401);
            expect((result as Response).headers.get('Content-Type')).toBe('application/json');

            const body = await (result as Response).json();
            expect(body).toEqual({
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 JSON for unauthorized API requests', async () => {
            const mockUser: AuthUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'PAM',
            };

            const context = createMockContext('/api/partners');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(mockUser);
            vi.mocked(canAccessRoute).mockReturnValue(false);

            const result = await onRequest(context as any, mockNext);

            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(403);
            expect((result as Response).headers.get('Content-Type')).toBe('application/json');

            const body = await (result as Response).json();
            expect(body).toEqual({
                success: false,
                error: 'Access denied',
                code: 'FORBIDDEN'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Middleware execution order', () => {
        it('should execute before page rendering', async () => {
            const context = createMockContext('/partner/123');
            vi.mocked(isProtectedRoute).mockReturnValue(true);
            vi.mocked(getUserSession).mockReturnValue(null);

            const result = await onRequest(context as any, mockNext);

            // Middleware should return redirect before calling next()
            expect(result).toHaveProperty('path');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
