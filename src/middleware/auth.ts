/**
 * Authentication middleware for Netlify Identity
 * Protects routes and manages user sessions with role-based access
 */

import {
    handleStorageError,
    isSessionCorrupted,
    clearCorruptedSession,
    logAuthError,
} from '../utils/auth0-errors';

// Simplified role system: PAM (Partner Account Manager) and PDM (Partner Development Manager - Admin)
export type UserRole = 'PAM' | 'PDM';

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    app_metadata?: {
        role?: UserRole;
        roles?: UserRole[];
    };
    user_metadata?: {
        full_name?: string;
    };
}

/**
 * Extract user role from Netlify Identity user object
 * Checks app_metadata for role or roles array
 */
export function getUserRole(user: any): UserRole {
    // Check app_metadata.role first
    if (user?.app_metadata?.role) {
        return user.app_metadata.role as UserRole;
    }

    // Check app_metadata.roles array
    if (user?.app_metadata?.roles && Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.length > 0) {
        return user.app_metadata.roles[0] as UserRole;
    }

    // Default to PAM if no role specified
    return 'PAM';
}

/**
 * Transform Netlify Identity user to AuthUser
 */
export function transformUser(user: any): AuthUser | null {
    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        role: getUserRole(user),
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
    };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: AuthUser | null): boolean {
    return user !== null && !!user.id && !!user.email;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    return user.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.role);
}

/**
 * Check if user is admin (PDM role has admin privileges)
 */
export function isAdmin(user: AuthUser | null): boolean {
    return hasRole(user, 'PDM');
}

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
    '/partner',
    '/questionnaires',
    '/reports',
    '/api/partners',
    '/api/partner',
    '/api/submissions',
    '/api/submission',
];

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
    '/',
    '/documentation',
];

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
    // Exact match for root
    if (pathname === '/') return true;

    // Check if pathname starts with any public route (excluding root)
    return PUBLIC_ROUTES.slice(1).some(route => pathname.startsWith(route));
}

/**
 * Get redirect URL for unauthenticated users
 */
export function getLoginRedirectUrl(currentPath: string): string {
    const encodedPath = encodeURIComponent(currentPath);
    return `/?redirect=${encodedPath}`;
}

/**
 * Session metadata for tracking expiration
 */
interface SessionMetadata {
    user: AuthUser;
    timestamp: number;
    expiresAt?: number;
}

/**
 * Session expiration time in milliseconds (24 hours)
 */
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Validate user session data
 * Checks if the session data has all required fields
 */
function isValidUserSession(data: any): data is AuthUser {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.email === 'string' &&
        typeof data.role === 'string' &&
        data.id.length > 0 &&
        data.email.length > 0
    );
}

/**
 * Check if session has expired
 * Returns true if session is expired or invalid
 */
function isSessionExpired(timestamp?: number, expiresAt?: number): boolean {
    if (!timestamp) {
        return true;
    }

    const now = Date.now();

    // Check explicit expiration time if provided
    if (expiresAt && now > expiresAt) {
        return true;
    }

    // Check if session is older than SESSION_EXPIRATION_MS
    if (now - timestamp > SESSION_EXPIRATION_MS) {
        return true;
    }

    return false;
}

/**
 * Detect and handle corrupted session data
 * Returns true if corruption was detected and handled
 */
function handleCorruptedSession(error: unknown, context: string): boolean {
    console.error(`Session corruption detected in ${context}:`, error);

    // Clear the corrupted session
    try {
        clearUserSession();
        console.log('Corrupted session data cleared');
        return true;
    } catch (clearError) {
        console.error('Failed to clear corrupted session:', clearError);
        return false;
    }
}

/**
 * Check if localStorage is available and accessible
 * Returns false in private browsing mode or when localStorage is disabled
 */
function isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        const testKey = '__kuiper_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn('localStorage is not available:', error);
        return false;
    }
}

/**
 * Store user session in both localStorage and cookies
 * Works with Auth0 user data and maintains backward compatibility
 * Handles localStorage errors (quota exceeded, access denied)
 * Stores in cookies so server-side middleware can access
 */
export function storeUserSession(user: AuthUser): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
        console.error('localStorage is not available. Session will not persist.');
        return;
    }

    try {
        // Validate user data before storing
        if (!isValidUserSession(user)) {
            logAuthError(new Error('Invalid user session data'), {
                errorType: 'SessionValidationError',
                userId: (user as any)?.id,
                email: (user as any)?.email,
            });
            return;
        }

        // Store with metadata for expiration tracking
        const sessionData: SessionMetadata = {
            user,
            timestamp: Date.now(),
            expiresAt: Date.now() + SESSION_EXPIRATION_MS,
        };

        // Store in localStorage (for client-side access)
        localStorage.setItem('kuiper_user', JSON.stringify(user));
        localStorage.setItem('kuiper_user_role', user.role);
        localStorage.setItem('kuiper_session_metadata', JSON.stringify({
            timestamp: sessionData.timestamp,
            expiresAt: sessionData.expiresAt,
        }));

        // Store in cookies (for server-side middleware access)
        // Use secure, httpOnly-like settings (SameSite=Strict for CSRF protection)
        const cookieOptions = `path=/; max-age=${SESSION_EXPIRATION_MS / 1000}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;

        console.log('🍪 Setting session cookies with options:', cookieOptions);
        document.cookie = `kuiper_user=${encodeURIComponent(JSON.stringify(user))}; ${cookieOptions}`;
        document.cookie = `kuiper_user_role=${encodeURIComponent(user.role)}; ${cookieOptions}`;

        // Verify cookies were set
        setTimeout(() => {
            const cookiesSet = document.cookie.includes('kuiper_user=');
            console.log('🍪 Cookies verification:', cookiesSet ? 'SUCCESS' : 'FAILED');
            if (!cookiesSet) {
                console.error('🍪 Failed to set cookies. Current cookies:', document.cookie);
            }
        }, 50);
    } catch (error) {
        // Use centralized storage error handling
        handleStorageError(error);

        // Attempt retry for quota errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            try {
                clearUserSession();
                localStorage.setItem('kuiper_user', JSON.stringify(user));
                localStorage.setItem('kuiper_user_role', user.role);
                localStorage.setItem('kuiper_session_metadata', JSON.stringify({
                    timestamp: Date.now(),
                    expiresAt: Date.now() + SESSION_EXPIRATION_MS,
                }));

                // Also retry cookie storage
                const cookieOptions = `path=/; max-age=${SESSION_EXPIRATION_MS / 1000}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
                document.cookie = `kuiper_user=${encodeURIComponent(JSON.stringify(user))}; ${cookieOptions}`;
                document.cookie = `kuiper_user_role=${encodeURIComponent(user.role)}; ${cookieOptions}`;

                console.log('Session stored successfully after clearing old data');
            } catch (retryError) {
                logAuthError(retryError, {
                    errorType: 'SessionStorageRetryError',
                    userId: user.id,
                    email: user.email,
                });
            }
        }
    }
}

/**
 * Get cookie value by name (for server-side access)
 */
function getCookie(name: string, cookieString?: string): string | null {
    const cookies = cookieString || (typeof document !== 'undefined' ? document.cookie : '');
    const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Retrieve user session from storage
 * Validates and returns Auth0 session data
 * Detects and clears corrupted or expired session data
 * Works both client-side (localStorage) and server-side (cookies)
 */
export function getUserSession(cookieString?: string): AuthUser | null {
    // Server-side: read from cookies
    if (typeof window === 'undefined') {
        if (!cookieString) {
            return null;
        }

        try {
            const userJson = getCookie('kuiper_user', cookieString);
            if (!userJson) {
                return null;
            }

            const userData = JSON.parse(userJson);

            // Validate user data
            if (!isValidUserSession(userData)) {
                return null;
            }

            return userData;
        } catch (error) {
            console.error('Error reading session from cookies:', error);
            return null;
        }
    }

    // Client-side: read from localStorage
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
        return null;
    }

    // Use centralized corruption check
    if (isSessionCorrupted()) {
        clearCorruptedSession();
        return null;
    }

    try {
        const userJson = localStorage.getItem('kuiper_user');
        const metadataJson = localStorage.getItem('kuiper_session_metadata');

        if (!userJson) {
            return null;
        }

        // Parse and validate session metadata
        let metadata: { timestamp?: number; expiresAt?: number } = {};
        if (metadataJson) {
            try {
                metadata = JSON.parse(metadataJson);

                // Check if session has expired (only if metadata exists)
                if (isSessionExpired(metadata.timestamp, metadata.expiresAt)) {
                    console.log('Session expired, clearing');
                    clearUserSession();
                    return null;
                }
            } catch (metadataError) {
                console.warn('Invalid session metadata, ignoring');
            }
        }
        // If no metadata exists, allow the session (backward compatibility)

        // Parse user data
        let userData: any;
        try {
            userData = JSON.parse(userJson);
        } catch (parseError) {
            handleCorruptedSession(parseError, 'getUserSession - JSON parse');
            return null;
        }

        // Validate session data structure
        if (!isValidUserSession(userData)) {
            handleCorruptedSession(new Error('Invalid session structure'), 'getUserSession - validation');
            return null;
        }

        return userData;
    } catch (error) {
        handleCorruptedSession(error, 'getUserSession - general');
        return null;
    }
}

/**
 * Clear user session
 * Removes all Auth0 session data from localStorage and cookies
 */
export function clearUserSession(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        // Clear localStorage
        localStorage.removeItem('kuiper_user');
        localStorage.removeItem('kuiper_user_role');
        localStorage.removeItem('kuiper_session_metadata');

        // Clear cookies by setting them to expire immediately
        document.cookie = 'kuiper_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        document.cookie = 'kuiper_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';

        // The Auth0 SDK manages its own cache separately
    } catch (error) {
        console.error('Failed to clear user session:', error);
        // Even if removal fails, try to set to empty values
        try {
            localStorage.setItem('kuiper_user', '');
            localStorage.setItem('kuiper_user_role', '');
            localStorage.setItem('kuiper_session_metadata', '');

            // Try to clear cookies again
            document.cookie = 'kuiper_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'kuiper_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (fallbackError) {
            // If even this fails, localStorage is likely inaccessible
            console.error('localStorage is inaccessible');
        }
    }
}

/**
 * Role-based route access control
 * Defines which roles can access which routes
 * Simplified to PAM and PDM (admin) only
 */
export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
    '/partner': ['PAM', 'PDM'],  // Both roles can access partners
    '/questionnaires': ['PAM', 'PDM'],  // Both roles can access questionnaires
    '/reports': ['PAM', 'PDM'],  // Both roles can access reports
};

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(user: AuthUser | null, pathname: string): boolean {
    if (!user) return false;

    // Admin can access everything
    if (isAdmin(user)) return true;

    // Check specific route access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTE_ACCESS)) {
        if (pathname.startsWith(route)) {
            return allowedRoles.includes(user.role);
        }
    }

    // Default: allow access if authenticated
    return true;
}
