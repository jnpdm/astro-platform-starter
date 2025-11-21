/**
 * Partner data models and interfaces
 * Defines the structure for partner records and gate progress tracking
 */

export type GateId = 'pre-contract' | 'gate-0' | 'gate-1' | 'gate-2' | 'gate-3' | 'post-launch';
export type GateStatus = 'not-started' | 'in-progress' | 'passed' | 'failed' | 'blocked';
export type ContractType = 'PPA' | 'Distribution' | 'Sales-Agent' | 'Other';
export type TierClassification = 'tier-0' | 'tier-1' | 'tier-2';
export type UserRole = 'PAM' | 'PDM' | 'TPM' | 'PSM' | 'TAM' | 'Admin';

export interface PartnerRecord {
    id: string;
    partnerName: string;

    // Team Assignments
    pamOwner: string;
    pdmOwner?: string;
    tpmOwner?: string;
    psmOwner?: string;
    tamOwner?: string;

    // Contract Information
    contractSignedDate?: Date;
    contractType: ContractType;
    tier: TierClassification;
    ccv: number; // Contractually Committed Value
    lrp: number; // Launch Revenue Potential

    // Timeline
    targetLaunchDate?: Date;
    actualLaunchDate?: Date;
    onboardingStartDate?: Date;

    // Gate Progress
    currentGate: GateId;
    gates: Record<string, GateProgress>;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface GateProgress {
    gateId: string;
    status: GateStatus;
    startedDate?: Date;
    completedDate?: Date;
    questionnaires: Record<string, string>; // questionnaireId -> submissionId
    approvals: Approval[];
    blockers?: string[];
}

export interface Approval {
    approvedBy: string;
    approvedByRole: UserRole;
    approvedAt: Date;
    signature: {
        type: 'typed' | 'drawn';
        data: string;
    };
    notes?: string;
}

export interface GateMetadata {
    id: string;
    name: string;
    description: string;
    questionnaires: QuestionnaireMetadata[];
    phases: PhaseMetadata[];
    estimatedWeeks: string;
    criteria: string[];
    pdmHoursPerWeek?: string;
}

export interface QuestionnaireMetadata {
    id: string;
    name: string;
    description: string;
    gate: string;
    sections: number;
    estimatedTime: number;
    requiredFor: UserRole[];
    primaryRole: UserRole;
}

export interface PhaseMetadata {
    id: string;
    name: string;
    description: string;
    weeks: string;
}

export interface ActivityItem {
    id: string;
    type: 'gate-completion' | 'questionnaire-submission' | 'approval' | 'blocker';
    partnerId: string;
    partnerName: string;
    description: string;
    timestamp: Date;
    actor: string;
    actorRole: UserRole;
}

export interface DocumentationSection {
    id: string;
    title: string;
    description: string;
    gate: GateId;
    phase?: string;
    links: DocumentationLink[];
    relevantRoles: UserRole[];
}

export interface DocumentationLink {
    title: string;
    url: string;
    type: 'internal' | 'external';
    icon?: string;
    description?: string;
}
