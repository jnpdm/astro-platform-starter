/**
 * Auth0 authentication utility module
 * Provides Auth0 integration for the Partner Onboarding Hub
 */

import type { AuthUser, UserRole } from '../middleware/auth';
import {
    handleAuth0Error,
    logAuthError,
    clearCorruptedSession,
    isSessionCorrupted,
    handleStorageError,
    retryWithBackoff,
} from './auth0-errors';

// Auth0 client type (from @auth0/auth0-spa-js)
declare global {
    interface Window {
        createAuth0Client?: (config: Auth0Config) => Promise<Auth0Client>;
    }
}

export interface Auth0Config {
    domain: string;
    clientId: string;
    authorizationParams: {
        redirect_uri: string;
        audience?: string;
    };
    cacheLocation?: 'memory' | 'localstorage';
    useRefreshTokens?: boolean;
}

export interface Auth0Client {
    loginWithRedirect(options?: { appState?: any }): Promise<void>;
    handleRedirectCallback(): Promise<{ appState?: any }>;
    logout(options?: { logoutParams?: { returnTo?: string } }): Promise<void>;
    isAuthenticated(): Promise<boolean>;
    getUser(): Promise<Auth0User | undefined>;
    getTokenSilently(): Promise<string>;
}

export interface Auth0User {
    sub: string;
    email: string;
    name?: string;
    nickname?: string;
    picture?: string;
    updated_at?: string;
    email_verified?: boolean;
    [key: string]: any;
}

// Singleton Auth0 client instance
let auth0Client: Auth0Client | null = null;

/**
 * Validate Auth0 configuration
 * Throws error if required configuration is missing
 */
function validateConfig(config: Partial<Auth0Config>): void {
    const errors: string[] = [];

    if (!config.domain) {
        errors.push('PUBLIC_AUTH0_DOMAIN is required');
    }

    if (!config.clientId) {
        errors.push('PUBLIC_AUTH0_CLIENT_ID is required');
    }

    if (!config.authorizationParams?.redirect_uri) {
        errors.push('PUBLIC_AUTH0_CALLBACK_URL is required');
    }

    if (errors.length > 0) {
        throw new Error(
            `Auth0 configuration error:\n${errors.join('\n')}\n\n` +
            'Please set the following environment variables:\n' +
            '- PUBLIC_AUTH0_DOMAIN\n' +
            '- PUBLIC_AUTH0_CLIENT_ID\n' +
            '- PUBLIC_AUTH0_CALLBACK_URL\n\n' +
            'See docs/AUTH0-SETUP.md for setup instructions.'
        );
    }
}

/**
 * Get Auth0 configuration from environment variables
 */
function getAuth0Config(): Auth0Config {
    const config: Partial<Auth0Config> = {
        domain: import.meta.env.PUBLIC_AUTH0_DOMAIN,
        clientId: import.meta.env.PUBLIC_AUTH0_CLIENT_ID,
        authorizationParams: {
            redirect_uri: import.meta.env.PUBLIC_AUTH0_CALLBACK_URL,
            audience: import.meta.env.PUBLIC_AUTH0_AUDIENCE,
        },
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
    };

    validateConfig(config);

    return config as Auth0Config;
}

/**
 * Create Auth0 client with configuration
 * Initializes the Auth0 SPA SDK
 */
export async function createAuth0Client(config?: Auth0Config): Promise<Auth0Client> {
    try {
        const clientConfig = config || getAuth0Config();

        // Check if Auth0 SDK is loaded
        if (typeof window === 'undefined' || !window.createAuth0Client) {
            const error = new Error(
                'Auth0 SDK not loaded. Please ensure the Auth0 SPA SDK script is included in your HTML.'
            );
            logAuthError(error, {
                errorType: 'ConfigurationError',
                errorMessage: 'Auth0 SDK not loaded',
            });
            throw error;
        }

        const client = await window.createAuth0Client(clientConfig);
        return client;
    } catch (error) {
        logAuthError(error, {
            errorType: 'ClientInitializationError',
            errorMessage: 'Failed to create Auth0 client',
        });
        throw error;
    }
}

/**
 * Get Auth0 client singleton
 * Creates client on first call, returns cached instance on subsequent calls
 */
export async function getAuth0Client(): Promise<Auth0Client> {
    if (!auth0Client) {
        auth0Client = await createAuth0Client();
    }
    return auth0Client;
}

/**
 * Reset Auth0 client singleton (useful for testing)
 */
export function resetAuth0Client(): void {
    auth0Client = null;
}

/**
 * Login with redirect to Auth0
 * Optionally accepts a return URL to redirect after authentication
 */
export async function login(returnTo?: string): Promise<void> {
    try {
        const client = await getAuth0Client();
        const appState = returnTo ? { returnTo } : undefined;

        await client.loginWithRedirect({
            appState,
        });
    } catch (error) {
        const recovery = await handleAuth0Error(error, {
            errorType: 'LoginError',
            url: returnTo,
        });
        throw new Error(recovery.userMessage);
    }
}

/**
 * Logout and clear session
 * Redirects to Auth0 logout endpoint and clears local session
 */
export async function logout(): Promise<void> {
    try {
        const client = await getAuth0Client();

        // Clear local session storage
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('kuiper_user');
                localStorage.removeItem('kuiper_user_role');
            } catch (storageError) {
                handleStorageError(storageError);
            }
        }

        // Logout from Auth0
        await client.logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    } catch (error) {
        logAuthError(error, {
            errorType: 'LogoutError',
        });

        // Even if Auth0 logout fails, clear local session
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('kuiper_user');
                localStorage.removeItem('kuiper_user_role');
            } catch (storageError) {
                handleStorageError(storageError);
            }
        }

        const recovery = await handleAuth0Error(error, {
            errorType: 'LogoutError',
        });
        throw new Error(recovery.userMessage);
    }
}

/**
 * Handle OAuth callback after login
 * Processes the callback and returns the app state (including returnTo URL)
 */
export async function handleCallback(): Promise<{ returnTo?: string }> {
    try {
        const client = await getAuth0Client();

        // Check if we're in a callback (has code and state parameters)
        const query = window.location.search;
        if (!query.includes('code=') || !query.includes('state=')) {
            return {};
        }

        // Handle the callback with retry logic for network errors
        const result = await retryWithBackoff(
            () => client.handleRedirectCallback(),
            3,
            1000
        );

        // Clean up the URL (remove code and state parameters)
        window.history.replaceState({}, document.title, window.location.pathname);

        return {
            returnTo: result.appState?.returnTo,
        };
    } catch (error) {
        const recovery = await handleAuth0Error(error, {
            errorType: 'CallbackError',
            url: window.location.href,
        });
        throw new Error(recovery.userMessage);
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        // Check for corrupted session first
        if (isSessionCorrupted()) {
            clearCorruptedSession();
            return false;
        }

        const client = await getAuth0Client();
        return await client.isAuthenticated();
    } catch (error) {
        logAuthError(error, {
            errorType: 'AuthenticationCheckError',
        });
        return false;
    }
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getUser(): Promise<AuthUser | null> {
    try {
        // Check for corrupted session first
        if (isSessionCorrupted()) {
            clearCorruptedSession();
            return null;
        }

        const client = await getAuth0Client();
        const authenticated = await client.isAuthenticated();

        if (!authenticated) {
            return null;
        }

        const auth0User = await client.getUser();

        if (!auth0User) {
            return null;
        }

        // Transform Auth0 user to AuthUser
        const user = transformAuth0User(auth0User);

        // Store user in session with error handling
        try {
            localStorage.setItem('kuiper_user', JSON.stringify(user));
            localStorage.setItem('kuiper_user_role', user.role);
        } catch (storageError) {
            handleStorageError(storageError);
        }

        return user;
    } catch (error) {
        logAuthError(error, {
            errorType: 'GetUserError',
        });
        return null;
    }
}

/**
 * Extract user role from Auth0 user metadata
 * Checks app_metadata for role or roles array
 * Returns default 'PAM' role if no role is assigned
 */
export function getUserRole(auth0User: Auth0User): UserRole {
    // Check app_metadata.role first
    if (auth0User?.app_metadata?.role) {
        const role = auth0User.app_metadata.role;
        // Validate it's a valid UserRole
        const validRoles: UserRole[] = ['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'];
        if (validRoles.includes(role)) {
            return role as UserRole;
        }
    }

    // Check app_metadata.roles array
    if (
        auth0User?.app_metadata?.roles &&
        Array.isArray(auth0User.app_metadata.roles) &&
        auth0User.app_metadata.roles.length > 0
    ) {
        const role = auth0User.app_metadata.roles[0];
        const validRoles: UserRole[] = ['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'];
        if (validRoles.includes(role)) {
            return role as UserRole;
        }
    }

    // Default to PAM if no role specified
    console.warn(`User ${auth0User.email} has no role assigned, defaulting to PAM`);
    return 'PAM';
}

/**
 * Transform Auth0 user to AuthUser interface
 * Converts Auth0 user object to the application's AuthUser format
 */
export function transformAuth0User(auth0User: Auth0User): AuthUser {
    const role = getUserRole(auth0User);

    return {
        id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name || auth0User.nickname || auth0User.email,
        role,
        app_metadata: auth0User.app_metadata || {},
        user_metadata: auth0User.user_metadata || {},
    };
}
