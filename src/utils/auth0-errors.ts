/**
 * Auth0 Error Handling Utilities
 * Provides comprehensive error handling for Auth0 authentication
 */

export interface Auth0ErrorContext {
    userId?: string;
    email?: string;
    timestamp: string;
    errorType: string;
    errorCode?: string;
    errorMessage: string;
    stackTrace?: string;
    url?: string;
    userAgent?: string;
}

export interface Auth0ErrorRecovery {
    canRetry: boolean;
    retryDelay?: number;
    recoveryAction?: () => void;
    userMessage: string;
    technicalMessage: string;
}

/**
 * Auth0 error codes and their user-friendly messages
 */
const AUTH0_ERROR_MESSAGES: Record<string, string> = {
    // Authentication errors
    'login_required': 'Please log in to continue.',
    'consent_required': 'Additional consent is required. Please try logging in again.',
    'interaction_required': 'Additional authentication is required. Please try logging in again.',
    'account_selection_required': 'Please select an account to continue.',
    'access_denied': 'Access was denied. Please contact support if you believe this is an error.',
    'unauthorized': 'You are not authorized to access this resource.',

    // Network errors
    'network_error': 'Unable to connect to the authentication service. Please check your internet connection and try again.',
    'timeout': 'The authentication request timed out. Please try again.',
    'failed_to_fetch': 'Unable to reach the authentication service. Please check your internet connection.',

    // Configuration errors
    'missing_refresh_token': 'Session refresh failed. Please log in again.',
    'invalid_token': 'Your session is invalid. Please log in again.',
    'expired_token': 'Your session has expired. Please log in again.',

    // User errors
    'invalid_user_password': 'Invalid email or password. Please try again.',
    'too_many_attempts': 'Too many login attempts. Please try again later.',
    'password_leaked': 'This password has been compromised. Please reset your password.',
    'user_blocked': 'Your account has been blocked. Please contact support.',

    // Generic errors
    'unknown_error': 'An unexpected error occurred. Please try again.',
    'server_error': 'The authentication service is temporarily unavailable. Please try again later.',
};

/**
 * Get user-friendly error message from Auth0 error
 */
export function getErrorMessage(error: any): string {
    // Check for Auth0 error code
    if (error?.error) {
        const errorCode = error.error;
        if (AUTH0_ERROR_MESSAGES[errorCode]) {
            return AUTH0_ERROR_MESSAGES[errorCode];
        }
    }

    // Check for error description
    if (error?.error_description) {
        return error.error_description;
    }

    // Check for standard error message
    if (error?.message) {
        const message = error.message.toLowerCase();

        // Network errors
        if (message.includes('network') || message.includes('fetch')) {
            return AUTH0_ERROR_MESSAGES['network_error'];
        }

        // Timeout errors
        if (message.includes('timeout')) {
            return AUTH0_ERROR_MESSAGES['timeout'];
        }

        // Token errors
        if (message.includes('token')) {
            return AUTH0_ERROR_MESSAGES['invalid_token'];
        }

        // Return the original message if it's user-friendly
        if (message.length < 100 && !message.includes('undefined')) {
            return error.message;
        }
    }

    // Default error message
    return AUTH0_ERROR_MESSAGES['unknown_error'];
}

/**
 * Log error with context for debugging
 */
export function logAuthError(
    error: any,
    context: Partial<Auth0ErrorContext> = {}
): void {
    const errorContext: Auth0ErrorContext = {
        timestamp: new Date().toISOString(),
        errorType: error?.name || 'UnknownError',
        errorCode: error?.error || error?.code,
        errorMessage: error?.message || String(error),
        stackTrace: error?.stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        ...context,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
        console.error('Auth0 Error:', errorContext);
    }

    // In production, you might want to send this to a logging service
    // Example: sendToLoggingService(errorContext);

    // Store recent errors in sessionStorage for debugging
    if (typeof window !== 'undefined') {
        try {
            const recentErrors = JSON.parse(
                sessionStorage.getItem('auth_errors') || '[]'
            );
            recentErrors.push(errorContext);

            // Keep only last 10 errors
            if (recentErrors.length > 10) {
                recentErrors.shift();
            }

            sessionStorage.setItem('auth_errors', JSON.stringify(recentErrors));
        } catch (e) {
            // Ignore storage errors
        }
    }
}

/**
 * Determine error recovery strategy
 */
export function getErrorRecovery(error: any): Auth0ErrorRecovery {
    const errorCode = error?.error || error?.code;
    const errorMessage = error?.message?.toLowerCase() || '';

    // Network errors - can retry
    if (
        errorCode === 'network_error' ||
        errorCode === 'timeout' ||
        errorCode === 'failed_to_fetch' ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('timeout')
    ) {
        return {
            canRetry: true,
            retryDelay: 2000,
            userMessage: getErrorMessage(error),
            technicalMessage: error?.message || String(error),
        };
    }

    // Token/session errors - need to re-authenticate
    if (
        errorCode === 'login_required' ||
        errorCode === 'invalid_token' ||
        errorCode === 'expired_token' ||
        errorCode === 'missing_refresh_token' ||
        errorMessage.includes('token')
    ) {
        return {
            canRetry: false,
            recoveryAction: () => {
                // Clear session and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('kuiper_user');
                    localStorage.removeItem('kuiper_user_role');
                    window.location.href = '/';
                }
            },
            userMessage: getErrorMessage(error),
            technicalMessage: error?.message || String(error),
        };
    }

    // Access denied - cannot retry
    if (
        errorCode === 'access_denied' ||
        errorCode === 'unauthorized' ||
        errorCode === 'user_blocked'
    ) {
        return {
            canRetry: false,
            userMessage: getErrorMessage(error),
            technicalMessage: error?.message || String(error),
        };
    }

    // Too many attempts - need to wait
    if (errorCode === 'too_many_attempts') {
        return {
            canRetry: true,
            retryDelay: 60000, // 1 minute
            userMessage: getErrorMessage(error),
            technicalMessage: error?.message || String(error),
        };
    }

    // Generic errors - can retry
    return {
        canRetry: true,
        retryDelay: 3000,
        userMessage: getErrorMessage(error),
        technicalMessage: error?.message || String(error),
    };
}

/**
 * Handle Auth0 error with automatic recovery
 */
export async function handleAuth0Error(
    error: any,
    context: Partial<Auth0ErrorContext> = {}
): Promise<Auth0ErrorRecovery> {
    // Log the error
    logAuthError(error, context);

    // Get recovery strategy
    const recovery = getErrorRecovery(error);

    // Execute recovery action if available
    if (recovery.recoveryAction) {
        try {
            recovery.recoveryAction();
        } catch (recoveryError) {
            console.error('Error recovery failed:', recoveryError);
        }
    }

    return recovery;
}

/**
 * Clear corrupted session data
 */
export function clearCorruptedSession(): void {
    if (typeof window === 'undefined') return;

    try {
        // Clear all auth-related data
        localStorage.removeItem('kuiper_user');
        localStorage.removeItem('kuiper_user_role');

        // Clear Auth0 SDK cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('@@auth0spajs@@')) {
                localStorage.removeItem(key);
            }
        });

        console.warn('Corrupted session data cleared');
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
}

/**
 * Check if session data is corrupted
 * Returns true if session data exists but is invalid
 * Returns false if no session data exists or if session is valid
 */
export function isSessionCorrupted(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const userData = localStorage.getItem('kuiper_user');

        // No session data is not considered corrupted
        if (!userData) return false;

        // Try to parse the user data
        const user = JSON.parse(userData);

        // Validate required fields
        if (!user || typeof user !== 'object') {
            return true;
        }

        if (!user.id || !user.email || !user.role) {
            return true;
        }

        // Validate role is valid
        const validRoles = ['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'];
        if (!validRoles.includes(user.role)) {
            return true;
        }

        return false;
    } catch (error) {
        // JSON parse error means corrupted data (only if data exists)
        const userData = localStorage.getItem('kuiper_user');
        return userData !== null;
    }
}

/**
 * Handle storage errors (quota exceeded, access denied)
 */
export function handleStorageError(error: any): void {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('quota')) {
        console.error(
            'localStorage quota exceeded. Please clear browser data or use private browsing mode.'
        );
        // Try to clear old data
        try {
            const keys = Object.keys(localStorage);
            // Remove non-essential items
            keys.forEach(key => {
                if (!key.startsWith('kuiper_') && !key.startsWith('@@auth0spajs@@')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            // Ignore
        }
    } else if (errorMessage.includes('access')) {
        console.error(
            'localStorage access denied. This may happen in private browsing mode. ' +
            'Session will not persist across page refreshes.'
        );
    } else {
        console.error('localStorage error:', error);
    }
}

/**
 * Display error to user (can be used with toast notifications)
 */
export function displayError(error: any, context?: Partial<Auth0ErrorContext>): void {
    const userMessage = getErrorMessage(error);

    // Log for debugging
    logAuthError(error, context);

    // Display to user (you can integrate with your toast system)
    if (typeof window !== 'undefined') {
        // Check if toast system is available
        if ((window as any).showToast) {
            (window as any).showToast(userMessage, 'error');
        } else {
            // Fallback to alert
            console.error(userMessage);
        }
    }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const recovery = getErrorRecovery(error);
            if (!recovery.canRetry) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
