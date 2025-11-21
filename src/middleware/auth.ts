/**
 * Authentication middleware for Netlify Identity
 * Protects routes and manages user sessions with role-based access
 */

export type UserRole = 'PAM' | 'PDM' | 'TPM' | 'PSM' | 'TAM' | 'Admin';

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
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
    return hasRole(user, 'Admin');
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
 * Store user session in cookie or localStorage
 * Note: In production, this should use secure HTTP-only cookies
 */
export function storeUserSession(user: AuthUser): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('kuiper_user', JSON.stringify(user));
            localStorage.setItem('kuiper_user_role', user.role);
        } catch (error) {
            console.error('Failed to store user session:', error);
        }
    }
}

/**
 * Retrieve user session from storage
 */
export function getUserSession(): AuthUser | null {
    if (typeof window !== 'undefined') {
        try {
            const userJson = localStorage.getItem('kuiper_user');
            if (userJson) {
                return JSON.parse(userJson) as AuthUser;
            }
        } catch (error) {
            console.error('Failed to retrieve user session:', error);
        }
    }
    return null;
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('kuiper_user');
            localStorage.removeItem('kuiper_user_role');
        } catch (error) {
            console.error('Failed to clear user session:', error);
        }
    }
}

/**
 * Role-based route access control
 * Defines which roles can access which routes
 */
export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
    '/partner': ['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'],
    '/questionnaires/pre-contract-pdm': ['PAM', 'PDM', 'Admin'],
    '/questionnaires/gate-0-kickoff': ['PAM', 'PDM', 'Admin'],
    '/questionnaires/gate-1-ready-to-sell': ['PAM', 'PDM', 'TPM', 'Admin'],
    '/questionnaires/gate-2-ready-to-order': ['TPM', 'Admin'],
    '/questionnaires/gate-3-ready-to-deliver': ['PSM', 'TAM', 'Admin'],
    '/reports': ['Admin', 'PAM'],
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
