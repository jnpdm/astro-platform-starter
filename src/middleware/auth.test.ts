import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getUserRole,
    transformUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isAdmin,
    isProtectedRoute,
    isPublicRoute,
    getLoginRedirectUrl,
    storeUserSession,
    getUserSession,
    clearUserSession,
    canAccessRoute,
    type AuthUser,
    type UserRole,
} from './auth';

describe('Auth Middleware', () => {
    describe('getUserRole', () => {
        it('should extract role from app_metadata.role', () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                app_metadata: { role: 'PDM' },
            };
            expect(getUserRole(user)).toBe('PDM');
        });

        it('should extract role from app_metadata.roles array', () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                app_metadata: { roles: ['TPM', 'Admin'] },
            };
            expect(getUserRole(user)).toBe('TPM');
        });

        it('should default to PAM if no role specified', () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                app_metadata: {},
            };
            expect(getUserRole(user)).toBe('PAM');
        });

        it('should prefer app_metadata.role over roles array', () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                app_metadata: {
                    role: 'PDM',
                    roles: ['TPM'],
                },
            };
            expect(getUserRole(user)).toBe('PDM');
        });
    });

    describe('transformUser', () => {
        it('should transform Netlify user to AuthUser', () => {
            const netlifyUser = {
                id: '123',
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User' },
                app_metadata: { role: 'PDM' },
            };

            const authUser = transformUser(netlifyUser);
            expect(authUser).toEqual({
                id: '123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'PDM',
                app_metadata: { role: 'PDM' },
                user_metadata: { full_name: 'Test User' },
            });
        });

        it('should use email as name if full_name not provided', () => {
            const netlifyUser = {
                id: '123',
                email: 'test@example.com',
                app_metadata: { role: 'PAM' },
            };

            const authUser = transformUser(netlifyUser);
            expect(authUser?.name).toBe('test@example.com');
        });

        it('should return null for null user', () => {
            expect(transformUser(null)).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('should return true for valid user', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PAM',
            };
            expect(isAuthenticated(user)).toBe(true);
        });

        it('should return false for null user', () => {
            expect(isAuthenticated(null)).toBe(false);
        });

        it('should return false for user without id', () => {
            const user = {
                id: '',
                email: 'test@example.com',
                role: 'PAM' as UserRole,
            };
            expect(isAuthenticated(user)).toBe(false);
        });
    });

    describe('hasRole', () => {
        it('should return true if user has required role', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PDM',
            };
            expect(hasRole(user, 'PDM')).toBe(true);
        });

        it('should return false if user has different role', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PAM',
            };
            expect(hasRole(user, 'PDM')).toBe(false);
        });

        it('should return false for null user', () => {
            expect(hasRole(null, 'PAM')).toBe(false);
        });
    });

    describe('hasAnyRole', () => {
        it('should return true if user has one of required roles', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PDM',
            };
            expect(hasAnyRole(user, ['PAM', 'PDM', 'TPM'])).toBe(true);
        });

        it('should return false if user has none of required roles', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'TAM',
            };
            expect(hasAnyRole(user, ['PAM', 'PDM', 'TPM'])).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('should return true for PDM role', () => {
            const user: AuthUser = {
                id: '123',
                email: 'admin@example.com',
                role: 'PDM',
            };
            expect(isAdmin(user)).toBe(true);
        });

        it('should return false for non-Admin role', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PAM',
            };
            expect(isAdmin(user)).toBe(false);
        });
    });

    describe('isProtectedRoute', () => {
        it('should return true for protected routes', () => {
            expect(isProtectedRoute('/partner/123')).toBe(true);
            expect(isProtectedRoute('/questionnaires/gate-0')).toBe(true);
            expect(isProtectedRoute('/reports')).toBe(true);
            expect(isProtectedRoute('/api/partners')).toBe(true);
        });

        it('should return false for non-protected routes', () => {
            expect(isProtectedRoute('/')).toBe(false);
            expect(isProtectedRoute('/documentation')).toBe(false);
        });
    });

    describe('isPublicRoute', () => {
        it('should return true for public routes', () => {
            expect(isPublicRoute('/')).toBe(true);
            expect(isPublicRoute('/documentation')).toBe(true);
        });

        it('should return false for non-public routes', () => {
            expect(isPublicRoute('/partner/123')).toBe(false);
            expect(isPublicRoute('/questionnaires/gate-0')).toBe(false);
        });
    });

    describe('getLoginRedirectUrl', () => {
        it('should create redirect URL with encoded path', () => {
            const url = getLoginRedirectUrl('/partner/123');
            expect(url).toBe('/?redirect=%2Fpartner%2F123');
        });

        it('should handle paths with special characters', () => {
            const url = getLoginRedirectUrl('/partner/test?id=123&name=test');
            expect(url).toContain('redirect=');
        });
    });

    describe('Session Management', () => {
        beforeEach(() => {
            // Mock localStorage
            const localStorageMock = (() => {
                let store: Record<string, string> = {};
                return {
                    getItem: (key: string) => store[key] || null,
                    setItem: (key: string, value: string) => {
                        store[key] = value;
                    },
                    removeItem: (key: string) => {
                        delete store[key];
                    },
                    clear: () => {
                        store = {};
                    },
                };
            })();

            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
                writable: true,
            });
        });

        afterEach(() => {
            localStorage.clear();
        });

        describe('storeUserSession', () => {
            it('should store user in localStorage', () => {
                const user: AuthUser = {
                    id: '123',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'PDM',
                };

                storeUserSession(user);

                const stored = localStorage.getItem('kuiper_user');
                expect(stored).toBeTruthy();
                expect(JSON.parse(stored!)).toEqual(user);
                expect(localStorage.getItem('kuiper_user_role')).toBe('PDM');
            });
        });

        describe('getUserSession', () => {
            it('should retrieve user from localStorage', () => {
                const user: AuthUser = {
                    id: '123',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'PDM',
                };

                localStorage.setItem('kuiper_user', JSON.stringify(user));

                const retrieved = getUserSession();
                expect(retrieved).toEqual(user);
            });

            it('should return null if no user stored', () => {
                const retrieved = getUserSession();
                expect(retrieved).toBeNull();
            });
        });

        describe('clearUserSession', () => {
            it('should remove user from localStorage', () => {
                const user: AuthUser = {
                    id: '123',
                    email: 'test@example.com',
                    role: 'PDM',
                };

                localStorage.setItem('kuiper_user', JSON.stringify(user));
                localStorage.setItem('kuiper_user_role', 'PDM');

                clearUserSession();

                expect(localStorage.getItem('kuiper_user')).toBeNull();
                expect(localStorage.getItem('kuiper_user_role')).toBeNull();
            });
        });
    });

    describe('canAccessRoute', () => {
        it('should allow PDM (admin) to access all routes', () => {
            const admin: AuthUser = {
                id: '123',
                email: 'admin@example.com',
                role: 'PDM',
            };

            expect(canAccessRoute(admin, '/partner/123')).toBe(true);
            expect(canAccessRoute(admin, '/questionnaires/gate-2-ready-to-order')).toBe(true);
            expect(canAccessRoute(admin, '/reports')).toBe(true);
        });

        it('should allow PAM to access pre-contract questionnaire', () => {
            const pam: AuthUser = {
                id: '123',
                email: 'pam@example.com',
                role: 'PAM',
            };

            expect(canAccessRoute(pam, '/questionnaires/pre-contract-pdm')).toBe(true);
        });

        it('should return false for null user', () => {
            expect(canAccessRoute(null, '/partner/123')).toBe(false);
        });

        it('should allow authenticated users to access general routes', () => {
            const user: AuthUser = {
                id: '123',
                email: 'test@example.com',
                role: 'PAM',
            };

            expect(canAccessRoute(user, '/partner/123')).toBe(true);
        });
    });
});
