/**
 * Questionnaire template interfaces
 * Defines the structure for dynamic questionnaire templates that can be edited by PDM users
 */

export type FieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

export interface QuestionField {
    id: string; // Unique identifier for the field
    type: FieldType;
    label: string;
    helpText?: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select, radio, checkbox
    order: number; // For sorting
    removed?: boolean; // Soft delete flag for historical preservation
}

export interface QuestionnaireTemplate {
    id: string; // e.g., 'pre-contract', 'gate-0', etc.
    name: string; // Display name
    version: number; // Incremented on each save
    fields: QuestionField[];
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string; // PDM email
}

export interface TemplateVersion {
    templateId: string;
    version: number;
    fields: QuestionField[];
    createdAt: Date;
    createdBy: string;
}

export interface TemplateMetadata {
    lastUpdated: Date;
    templates: string[]; // List of template IDs
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
