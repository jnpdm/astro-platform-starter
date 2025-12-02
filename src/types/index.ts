/**
 * Central export file for all type definitions
 * Import types from this file for convenience: import { PartnerRecord, QuestionnaireConfig } from '@/types'
 */

// Partner types
export type {
    GateId,
    GateStatus,
    ContractType,
    TierClassification,
    UserRole,
    PartnerRecord,
    GateProgress,
    Approval,
    GateMetadata,
    QuestionnaireMetadata,
    PhaseMetadata,
    ActivityItem,
    DocumentationSection,
    DocumentationLink,
} from './partner';

// Questionnaire types
export type {
    FieldType,
    QuestionnaireConfig,
    QuestionnaireMetadataConfig,
    Section,
    Field,
    ValidationRule,
    PassFailCriteria,
    AutomaticRule,
    ValidationConfig,
    DocumentationLinkConfig,
} from './questionnaire';

// Submission types
export type {
    SubmissionStatus,
    SectionResult,
    QuestionnaireSubmission,
    SectionData,
    SectionStatus,
    SubmissionData,
} from './submission';

// Signature types
export type {
    SignatureType,
    Signature,
    SignatureMetadata,
} from './signature';

// Template types
export type {
    FieldType as TemplateFieldType,
    QuestionField,
    QuestionnaireTemplate,
    TemplateVersion,
    TemplateMetadata,
    ValidationResult,
} from './template';
