/**
 * Questionnaire submission interfaces
 * Defines the structure for questionnaire submissions and section status tracking
 */

import type { UserRole } from './partner';
import type { Signature } from './signature';

export type SubmissionStatus = 'pass' | 'fail' | 'partial' | 'pending';
export type SectionResult = 'pass' | 'fail' | 'pending';

export interface QuestionnaireSubmission {
    id: string;
    questionnaireId: string;
    version: string;
    partnerId: string;

    // Form Data
    sections: SectionData[];

    // Status Tracking
    sectionStatuses: Record<string, SectionStatus>;
    overallStatus: SubmissionStatus;

    // Signature
    signature: Signature;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
    submittedBy: string;
    submittedByRole: UserRole;
    ipAddress: string;
    userAgent?: string;
}

export interface SectionData {
    sectionId: string;
    fields: Record<string, any>;
    status: SectionStatus;
}

export interface SectionStatus {
    result: SectionResult;
    evaluatedAt?: Date;
    evaluatedBy?: string;
    notes?: string;
    failureReasons?: string[];
}

export interface SubmissionData {
    sections: SectionData[];
    metadata?: {
        partnerId?: string;
        submittedBy?: string;
        submittedByRole?: UserRole;
    };
}
