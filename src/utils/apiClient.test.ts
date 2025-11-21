import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, apiPost, ApiClientError, getErrorMessage } from './apiClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('apiClient', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('apiGet', () => {
        it('makes successful GET request', async () => {
            const mockData = { id: 1, name: 'Test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockData }),
            });

            const result = await apiGet('/api/test');

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockData);
        });

        it('throws ApiClientError on failed request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ error: 'Not found' }),
            });

            await expect(apiGet('/api/test')).rejects.toThrow(ApiClientError);
        });

        it('retries on retryable status codes', async () => {
            // First call fails with 503, second succeeds
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    json: async () => ({ error: 'Service unavailable' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { id: 1 } }),
                });

            const result = await apiGet('/api/test', { maxRetries: 1, retryDelay: 10 });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ id: 1 });
        });
    });

    describe('apiPost', () => {
        it('makes successful POST request', async () => {
            const mockData = { id: 1, name: 'Created' };
            const postBody = { name: 'Test' };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockData }),
            });

            const result = await apiPost('/api/test', postBody);

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postBody),
            });
            expect(result).toEqual(mockData);
        });

        it('throws ApiClientError on validation error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ error: 'Invalid data', code: 'VALIDATION_ERROR' }),
            });

            await expect(apiPost('/api/test', {})).rejects.toThrow(ApiClientError);
        });
    });

    describe('getErrorMessage', () => {
        it('extracts message from ApiClientError', () => {
            const error = new ApiClientError('Test error', 400);
            expect(getErrorMessage(error)).toBe('Test error');
        });

        it('extracts message from Error', () => {
            const error = new Error('Generic error');
            expect(getErrorMessage(error)).toBe('Generic error');
        });

        it('returns string error as-is', () => {
            expect(getErrorMessage('String error')).toBe('String error');
        });

        it('returns default message for unknown error types', () => {
            expect(getErrorMessage({ unknown: 'object' })).toBe('An unexpected error occurred. Please try again.');
        });
    });
});
