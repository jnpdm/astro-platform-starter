/**
 * Netlify Blobs storage utilities
 * Provides CRUD operations for partner records and questionnaire submissions
 */

import { getStore } from '@netlify/blobs';
import type { PartnerRecord } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';

// Store names
const PARTNERS_STORE = 'partners';
const SUBMISSIONS_STORE = 'submissions';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Storage error class for better error handling
 */
export class StorageError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'StorageError';
    }
}

/**
 * Retry helper function with exponential backoff
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)));
            return retryOperation(operation, retries - 1);
        }
        throw error;
    }
}

/**
 * Get a partner record by ID
 * @param partnerId - The unique partner identifier
 * @returns The partner record or null if not found
 * @throws StorageError if retrieval fails
 */
export async function getPartner(partnerId: string): Promise<PartnerRecord | null> {
    try {
        return await retryOperation(async () => {
            const store = getStore(PARTNERS_STORE);
            const data = await store.get(partnerId, { type: 'json' });

            if (!data) {
                return null;
            }

            // Convert date strings back to Date objects
            return deserializePartner(data as any);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to retrieve partner ${partnerId}`,
            'GET_PARTNER_ERROR',
            error
        );
    }
}

/**
 * Save a partner record
 * @param partner - The partner record to save
 * @throws StorageError if save fails
 */
export async function savePartner(partner: PartnerRecord): Promise<void> {
    try {
        await retryOperation(async () => {
            const store = getStore(PARTNERS_STORE);

            // Update the updatedAt timestamp
            const updatedPartner = {
                ...partner,
                updatedAt: new Date()
            };

            await store.setJSON(partner.id, updatedPartner);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to save partner ${partner.id}`,
            'SAVE_PARTNER_ERROR',
            error
        );
    }
}

/**
 * List all partner records
 * @returns Array of all partner records
 * @throws StorageError if listing fails
 */
export async function listPartners(): Promise<PartnerRecord[]> {
    try {
        return await retryOperation(async () => {
            const store = getStore(PARTNERS_STORE);
            const { blobs } = await store.list();

            const partners: PartnerRecord[] = [];

            for (const blob of blobs) {
                const data = await store.get(blob.key, { type: 'json' });
                if (data) {
                    partners.push(deserializePartner(data as any));
                }
            }

            return partners;
        });
    } catch (error) {
        throw new StorageError(
            'Failed to list partners',
            'LIST_PARTNERS_ERROR',
            error
        );
    }
}

/**
 * Delete a partner record
 * @param partnerId - The unique partner identifier
 * @throws StorageError if deletion fails
 */
export async function deletePartner(partnerId: string): Promise<void> {
    try {
        await retryOperation(async () => {
            const store = getStore(PARTNERS_STORE);
            await store.delete(partnerId);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to delete partner ${partnerId}`,
            'DELETE_PARTNER_ERROR',
            error
        );
    }
}

/**
 * Save a questionnaire submission
 * @param submission - The questionnaire submission to save
 * @throws StorageError if save fails
 */
export async function saveSubmission(submission: QuestionnaireSubmission): Promise<void> {
    try {
        await retryOperation(async () => {
            const store = getStore(SUBMISSIONS_STORE);

            // Update the updatedAt timestamp
            const updatedSubmission = {
                ...submission,
                updatedAt: new Date()
            };

            await store.setJSON(submission.id, updatedSubmission);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to save submission ${submission.id}`,
            'SAVE_SUBMISSION_ERROR',
            error
        );
    }
}

/**
 * Get a questionnaire submission by ID
 * @param submissionId - The unique submission identifier
 * @returns The submission or null if not found
 * @throws StorageError if retrieval fails
 */
export async function getSubmission(submissionId: string): Promise<QuestionnaireSubmission | null> {
    try {
        return await retryOperation(async () => {
            const store = getStore(SUBMISSIONS_STORE);
            const data = await store.get(submissionId, { type: 'json' });

            if (!data) {
                return null;
            }

            // Convert date strings back to Date objects
            return deserializeSubmission(data as any);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to retrieve submission ${submissionId}`,
            'GET_SUBMISSION_ERROR',
            error
        );
    }
}

/**
 * List submissions for a specific partner
 * @param partnerId - The partner identifier
 * @returns Array of submissions for the partner
 * @throws StorageError if listing fails
 */
export async function listSubmissionsByPartner(partnerId: string): Promise<QuestionnaireSubmission[]> {
    try {
        return await retryOperation(async () => {
            const store = getStore(SUBMISSIONS_STORE);
            const { blobs } = await store.list();

            const submissions: QuestionnaireSubmission[] = [];

            for (const blob of blobs) {
                const data = await store.get(blob.key, { type: 'json' });
                if (data) {
                    const submission = deserializeSubmission(data as any);
                    if (submission.partnerId === partnerId) {
                        submissions.push(submission);
                    }
                }
            }

            return submissions;
        });
    } catch (error) {
        throw new StorageError(
            `Failed to list submissions for partner ${partnerId}`,
            'LIST_SUBMISSIONS_ERROR',
            error
        );
    }
}

/**
 * Delete a submission
 * @param submissionId - The unique submission identifier
 * @throws StorageError if deletion fails
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
    try {
        await retryOperation(async () => {
            const store = getStore(SUBMISSIONS_STORE);
            await store.delete(submissionId);
        });
    } catch (error) {
        throw new StorageError(
            `Failed to delete submission ${submissionId}`,
            'DELETE_SUBMISSION_ERROR',
            error
        );
    }
}

/**
 * Helper function to deserialize partner data (convert date strings to Date objects)
 */
function deserializePartner(data: any): PartnerRecord {
    return {
        ...data,
        contractSignedDate: data.contractSignedDate ? new Date(data.contractSignedDate) : undefined,
        targetLaunchDate: data.targetLaunchDate ? new Date(data.targetLaunchDate) : undefined,
        actualLaunchDate: data.actualLaunchDate ? new Date(data.actualLaunchDate) : undefined,
        onboardingStartDate: data.onboardingStartDate ? new Date(data.onboardingStartDate) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        gates: Object.entries(data.gates || {}).reduce((acc, [key, gate]: [string, any]) => {
            acc[key] = {
                ...gate,
                startedDate: gate.startedDate ? new Date(gate.startedDate) : undefined,
                completedDate: gate.completedDate ? new Date(gate.completedDate) : undefined,
                approvals: (gate.approvals || []).map((approval: any) => ({
                    ...approval,
                    approvedAt: new Date(approval.approvedAt)
                }))
            };
            return acc;
        }, {} as Record<string, any>)
    };
}

/**
 * Helper function to deserialize submission data (convert date strings to Date objects)
 */
function deserializeSubmission(data: any): QuestionnaireSubmission {
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
        signature: {
            ...data.signature,
            timestamp: new Date(data.signature.timestamp)
        },
        sections: (data.sections || []).map((section: any) => ({
            ...section,
            status: {
                ...section.status,
                evaluatedAt: section.status.evaluatedAt ? new Date(section.status.evaluatedAt) : undefined
            }
        }))
    };
}
