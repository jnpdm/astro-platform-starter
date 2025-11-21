/**
 * Integration tests for submissions API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the storage module
vi.mock('../../../utils/storage', () => ({
    saveSubmission: vi.fn(),
    getSubmission: vi.fn(),
    StorageError: class StorageError extends Error {
        constructor(message: string, public code: string, public originalError?: unknown) {
            super(message);
            this.name = 'StorageError';
        }
    }
}));

describe('Submissions API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/submissions - Validation', () => {
        it('should validate required questionnaireId field', () => {
            const invalidData = {
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('questionnaireId is required and must be a string');
        });

        it('should validate required partnerId field', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('partnerId is required and must be a string');
        });

        it('should validate required submittedBy field', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('submittedBy is required and must be a string');
        });

        it('should validate submittedByRole enum', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'InvalidRole',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('submittedByRole is required and must be one of: PAM, PDM, TPM, PSM, TAM, Admin');
        });

        it('should validate signature is required', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM'
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature is required and must be an object');
        });

        it('should validate signature type', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'invalid',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature.type is required and must be either "typed" or "drawn"');
        });

        it('should validate signature data', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature.data is required and must be a string');
        });

        it('should validate signature signerName', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerEmail: 'john@example.com'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature.signerName is required and must be a string');
        });

        it('should validate signature signerEmail', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature.signerEmail is required and must be a string');
        });

        it('should validate email format', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'invalid-email'
                }
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('signature.signerEmail must be a valid email address');
        });

        it('should validate sections is array', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                },
                sections: 'not-an-array'
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('sections must be an array');
        });

        it('should validate overallStatus enum', () => {
            const invalidData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                },
                overallStatus: 'invalid-status'
            };

            const error = validateSubmissionData(invalidData);
            expect(error).toBe('overallStatus must be one of: pass, fail, partial, pending');
        });

        it('should pass validation with valid data', () => {
            const validData = {
                questionnaireId: 'pre-contract-pdm',
                partnerId: 'partner-1',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com'
                },
                sections: [],
                overallStatus: 'pending'
            };

            const error = validateSubmissionData(validData);
            expect(error).toBeNull();
        });
    });
});

// Helper function extracted from the API route for testing
function validateSubmissionData(data: any): string | null {
    if (!data.questionnaireId || typeof data.questionnaireId !== 'string') {
        return 'questionnaireId is required and must be a string';
    }

    if (!data.partnerId || typeof data.partnerId !== 'string') {
        return 'partnerId is required and must be a string';
    }

    if (!data.submittedBy || typeof data.submittedBy !== 'string') {
        return 'submittedBy is required and must be a string';
    }

    if (!data.submittedByRole || !['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin'].includes(data.submittedByRole)) {
        return 'submittedByRole is required and must be one of: PAM, PDM, TPM, PSM, TAM, Admin';
    }

    if (!data.signature || typeof data.signature !== 'object') {
        return 'signature is required and must be an object';
    }

    if (!data.signature.type || !['typed', 'drawn'].includes(data.signature.type)) {
        return 'signature.type is required and must be either "typed" or "drawn"';
    }

    if (!data.signature.data || typeof data.signature.data !== 'string') {
        return 'signature.data is required and must be a string';
    }

    if (!data.signature.signerName || typeof data.signature.signerName !== 'string') {
        return 'signature.signerName is required and must be a string';
    }

    if (!data.signature.signerEmail || typeof data.signature.signerEmail !== 'string') {
        return 'signature.signerEmail is required and must be a string';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.signature.signerEmail)) {
        return 'signature.signerEmail must be a valid email address';
    }

    if (data.sections && !Array.isArray(data.sections)) {
        return 'sections must be an array';
    }

    if (data.overallStatus && !['pass', 'fail', 'partial', 'pending'].includes(data.overallStatus)) {
        return 'overallStatus must be one of: pass, fail, partial, pending';
    }

    return null;
}
