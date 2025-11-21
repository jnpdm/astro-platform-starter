/**
 * API Response Optimization Utilities
 * 
 * Provides utilities for optimizing API response payloads by:
 * - Removing unnecessary fields
 * - Compressing data structures
 * - Implementing field selection
 * 
 * Requirements: 8.1, 8.2
 */

import type { PartnerRecord } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';

/**
 * Partner fields that can be selected
 */
export type PartnerField =
    | 'id'
    | 'partnerName'
    | 'pamOwner'
    | 'pdmOwner'
    | 'tpmOwner'
    | 'psmOwner'
    | 'tamOwner'
    | 'contractSignedDate'
    | 'contractType'
    | 'tier'
    | 'ccv'
    | 'lrp'
    | 'targetLaunchDate'
    | 'actualLaunchDate'
    | 'onboardingStartDate'
    | 'currentGate'
    | 'gates'
    | 'createdAt'
    | 'updatedAt';

/**
 * Submission fields that can be selected
 */
export type SubmissionField =
    | 'id'
    | 'questionnaireId'
    | 'version'
    | 'sections'
    | 'sectionStatuses'
    | 'overallStatus'
    | 'signature'
    | 'createdAt'
    | 'updatedAt'
    | 'submittedAt'
    | 'submittedBy'
    | 'submittedByRole'
    | 'ipAddress';

/**
 * Select specific fields from a partner record
 */
export function selectPartnerFields(
    partner: PartnerRecord,
    fields?: PartnerField[]
): Partial<PartnerRecord> {
    if (!fields || fields.length === 0) {
        return partner;
    }

    const result: Partial<PartnerRecord> = {};

    for (const field of fields) {
        if (field in partner) {
            (result as any)[field] = partner[field];
        }
    }

    return result;
}

/**
 * Select specific fields from multiple partner records
 */
export function selectPartnerFieldsBulk(
    partners: PartnerRecord[],
    fields?: PartnerField[]
): Partial<PartnerRecord>[] {
    return partners.map(partner => selectPartnerFields(partner, fields));
}

/**
 * Select specific fields from a submission
 */
export function selectSubmissionFields(
    submission: QuestionnaireSubmission,
    fields?: SubmissionField[]
): Partial<QuestionnaireSubmission> {
    if (!fields || fields.length === 0) {
        return submission;
    }

    const result: Partial<QuestionnaireSubmission> = {};

    for (const field of fields) {
        if (field in submission) {
            (result as any)[field] = submission[field];
        }
    }

    return result;
}

/**
 * Create a summary version of a partner record (minimal fields for lists)
 */
export function createPartnerSummary(partner: PartnerRecord) {
    return selectPartnerFields(partner, [
        'id',
        'partnerName',
        'pamOwner',
        'tier',
        'currentGate',
        'targetLaunchDate'
    ]);
}

/**
 * Create summary versions of multiple partner records
 */
export function createPartnerSummaries(partners: PartnerRecord[]) {
    return partners.map(createPartnerSummary);
}

/**
 * Create a summary version of a submission (minimal fields for lists)
 */
export function createSubmissionSummary(submission: QuestionnaireSubmission) {
    return selectSubmissionFields(submission, [
        'id',
        'questionnaireId',
        'overallStatus',
        'submittedAt',
        'submittedBy'
    ]);
}

/**
 * Parse field selection from query parameters
 */
export function parseFieldSelection(queryString: string): string[] | undefined {
    const params = new URLSearchParams(queryString);
    const fields = params.get('fields');

    if (!fields) {
        return undefined;
    }

    return fields.split(',').map(f => f.trim()).filter(f => f.length > 0);
}

/**
 * Compress gate data by removing empty or default values
 */
export function compressGateData(gates: Record<string, any>) {
    const compressed: Record<string, any> = {};

    for (const [gateId, gateData] of Object.entries(gates)) {
        // Skip gates with no meaningful data
        if (!gateData || gateData.status === 'not-started') {
            continue;
        }

        compressed[gateId] = {
            status: gateData.status,
            ...(gateData.startedDate && { startedDate: gateData.startedDate }),
            ...(gateData.completedDate && { completedDate: gateData.completedDate }),
            ...(gateData.blockers && gateData.blockers.length > 0 && { blockers: gateData.blockers })
        };
    }

    return compressed;
}

/**
 * Calculate response size in bytes (approximate)
 */
export function estimateResponseSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
}

/**
 * Paginate results
 */
export interface PaginationOptions {
    page?: number;
    pageSize?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export function paginate<T>(
    items: T[],
    options: PaginationOptions = {}
): PaginatedResponse<T> {
    const page = Math.max(1, options.page || 1);
    const requestedPageSize = options.pageSize !== undefined ? options.pageSize : 20;
    const pageSize = Math.min(100, Math.max(1, requestedPageSize));

    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
        data: items.slice(startIndex, endIndex),
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
}
