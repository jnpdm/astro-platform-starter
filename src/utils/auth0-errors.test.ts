/**
 * Tests for Auth0 error handling utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getErrorMessage,
    logAuthError,
    getErrorRecovery,
    handleAuth0Error,
    clearCorruptedSession,
    isSessionCorrupted,
    handleStorageError,
    retryWithBackoff,
} from './auth0-errors';

describe('Auth0 Error Handling', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('getErrorMessage', () => {
        it('should return user-friendly message for known Auth0 error codes', () => {
            const error = { error: 'login_required' };
            expect(getErrorMessage(error)).toBe('Please log in to continue.');
        });

        it('should return error description if available', () => {
            const error = { error_description: 'Custom error description' };
            expect(getErrorMessage(error)).toBe('Custom error description');
        });

        it('should detect network errors from message', () => {
            const error = { message: 'Network request failed' };
            const message = getErrorMessage(error);
            expect(message).toContain('connect');
        });

        it('should return default message for unknown errors', () => {
            const error = { message: 'Some random error' };
            const message = getErrorMessage(error);
            expect(message).toBeTruthy();
        });
    });

    describe('logAuthError', () => {
        it('should log error with context', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const error = new Error('Test error');
            logAuthError(error, {
                userId: 'user123',
                email: 'test@example.com',
            });

            // In dev mode, should log to console
            if (import.meta.env.DEV) {
                expect(consoleSpy).toHaveBeenCalled();
            }

            consoleSpy.mockRestore();
        });

        it('should store errors in sessionStorage', () => {
            const error = new Error('Test error');
            logAuthError(error);

            const storedErrors = JSON.parse(sessionStorage.getItem('auth_errors') || '[]');
            expect(storedErrors.length).toBeGreaterThan(0);
            expect(storedErrors[0].errorMessage).toBe('Test error');
        });
    });

    describe('getErrorRecovery', () => {
        it('should allow retry for network errors', () => {
            const error = { error: 'network_error' };
            const recovery = getErrorRecovery(error);

            expect(recovery.canRetry).toBe(true);
            expect(recovery.retryDelay).toBeDefined();
        });

        it('should not allow retry for access denied errors', () => {
            const error = { error: 'access_denied' };
            const recovery = getErrorRecovery(error);

            expect(recovery.canRetry).toBe(false);
        });

        it('should provide recovery action for token errors', () => {
            const error = { error: 'invalid_token' };
            const recovery = getErrorRecovery(error);

            expect(recovery.canRetry).toBe(false);
            expect(recovery.recoveryAction).toBeDefined();
        });
    });

    describe('handleAuth0Error', () => {
        it('should handle error and return recovery strategy', async () => {
            const error = new Error('Test error');
            const recovery = await handleAuth0Error(error);

            expect(recovery).toBeDefined();
            expect(recovery.userMessage).toBeTruthy();
            expect(recovery.technicalMessage).toBeTruthy();
        });
    });

    describe('clearCorruptedSession', () => {
        it('should clear all auth-related localStorage items', () => {
            localStorage.setItem('kuiper_user', 'test');
            localStorage.setItem('kuiper_user_role', 'PAM');
            localStorage.setItem('@@auth0spajs@@test', 'test');

            clearCorruptedSession();

            expect(localStorage.getItem('kuiper_user')).toBeFalsy();
            expect(localStorage.getItem('kuiper_user_role')).toBeFalsy();
            expect(localStorage.getItem('@@auth0spajs@@test')).toBeFalsy();
        });
    });

    describe('isSessionCorrupted', () => {
        it('should return false for valid session', () => {
            const validUser = {
                id: 'user123',
                email: 'test@example.com',
                role: 'PAM',
            };
            localStorage.setItem('kuiper_user', JSON.stringify(validUser));

            expect(isSessionCorrupted()).toBe(false);
        });

        it('should return false when no session exists', () => {
            expect(isSessionCorrupted()).toBe(false);
        });
    });

    describe('handleStorageError', () => {
        it('should handle quota exceeded errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            handleStorageError(error);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle access denied errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const error = new Error('Access denied');
            handleStorageError(error);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('retryWithBackoff', () => {
        it('should succeed on first try', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(fn, 3, 100);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce({ error: 'network_error' })
                .mockResolvedValue('success');

            const result = await retryWithBackoff(fn, 3, 100);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should not retry non-retryable errors', async () => {
            const fn = vi.fn().mockRejectedValue({ error: 'access_denied' });

            await expect(retryWithBackoff(fn, 3, 100)).rejects.toEqual({ error: 'access_denied' });
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should throw after max retries', async () => {
            const fn = vi.fn().mockRejectedValue({ error: 'network_error' });

            await expect(retryWithBackoff(fn, 3, 100)).rejects.toEqual({ error: 'network_error' });
            expect(fn).toHaveBeenCalledTimes(3);
        });
    });
});
