/**
 * API client utility with error handling and retry logic
 */

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

interface RetryConfig {
    maxRetries?: number;
    retryDelay?: number;
    retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public response?: any
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a status code is retryable
 */
function isRetryableStatus(status: number, retryableStatuses: number[]): boolean {
    return retryableStatuses.includes(status);
}

/**
 * Parse error response
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;

    try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorCode = errorData.code;
        } else {
            const text = await response.text();
            if (text) {
                errorMessage = text;
            }
        }
    } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
    }

    return {
        message: errorMessage,
        code: errorCode,
        status: response.status,
    };
}

/**
 * Make an API request with retry logic
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryConfig: RetryConfig = {}
): Promise<Response> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If successful or non-retryable error, return response
            if (response.ok || !isRetryableStatus(response.status, config.retryableStatuses)) {
                return response;
            }

            // If retryable and not last attempt, continue to retry
            if (attempt < config.maxRetries) {
                const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`Request failed with status ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
                await sleep(delay);
                continue;
            }

            // Last attempt failed, return the response
            return response;
        } catch (error) {
            lastError = error as Error;

            // Network errors are retryable
            if (attempt < config.maxRetries) {
                const delay = config.retryDelay * Math.pow(2, attempt);
                console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries}):`, error);
                await sleep(delay);
                continue;
            }

            // Last attempt failed, throw error
            throw new ApiClientError(
                `Network error: ${lastError.message}`,
                undefined,
                'NETWORK_ERROR'
            );
        }
    }

    // Should not reach here, but just in case
    throw lastError || new Error('Request failed after retries');
}

/**
 * Make a GET request
 */
export async function apiGet<T = any>(
    url: string,
    retryConfig?: RetryConfig
): Promise<T> {
    const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }, retryConfig);

    if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new ApiClientError(error.message, error.status, error.code);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
        throw new ApiClientError(
            data.error || 'Request failed',
            response.status,
            data.code
        );
    }

    return data.data as T;
}

/**
 * Make a POST request
 */
export async function apiPost<T = any>(
    url: string,
    body: any,
    retryConfig?: RetryConfig
): Promise<T> {
    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }, retryConfig);

    if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new ApiClientError(error.message, error.status, error.code);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
        throw new ApiClientError(
            data.error || 'Request failed',
            response.status,
            data.code
        );
    }

    return data.data as T;
}

/**
 * Make a PUT request
 */
export async function apiPut<T = any>(
    url: string,
    body: any,
    retryConfig?: RetryConfig
): Promise<T> {
    const response = await fetchWithRetry(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }, retryConfig);

    if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new ApiClientError(error.message, error.status, error.code);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
        throw new ApiClientError(
            data.error || 'Request failed',
            response.status,
            data.code
        );
    }

    return data.data as T;
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T = any>(
    url: string,
    retryConfig?: RetryConfig
): Promise<T> {
    const response = await fetchWithRetry(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    }, retryConfig);

    if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new ApiClientError(error.message, error.status, error.code);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
        throw new ApiClientError(
            data.error || 'Request failed',
            response.status,
            data.code
        );
    }

    return data.data as T;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred. Please try again.';
}
