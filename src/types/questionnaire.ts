/**
 * Questionnaire configuration interfaces
 * Defines the structure for questionnaire configurations loaded from JSON files
 */

import type { UserRole } from './partner';

export type FieldType = 'text' | 'email' | 'date' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';

export interface QuestionnaireConfig {
    id: string;
    version: string;
    metadata: QuestionnaireMetadataConfig;
    sections: Section[];
    validation: ValidationConfig;
    documentation: DocumentationLinkConfig[];
    gateCriteria: string[];
}

export interface QuestionnaireMetadataConfig {
    name: string;
    description: string;
    gate: string;
    phase?: string;
    estimatedTime: number;
    icon?: string;
    requiredRoles: UserRole[];
    primaryRole: UserRole;
}

export interface Section {
    id: string;
    title: string;
    description?: string;
    fields: Field[];
    passFailCriteria?: PassFailCriteria;
    documentationLinks?: DocumentationLinkConfig[];
}

export interface Field {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    options?: string[];
    validation?: ValidationRule;
    helpText?: string;
    placeholder?: string;
    defaultValue?: any;
}

export interface ValidationRule {
    type: 'regex' | 'min' | 'max' | 'minLength' | 'maxLength' | 'email' | 'url' | 'custom';
    value?: any;
    message: string;
    customValidator?: string; // Reference to custom validation function
}

export interface PassFailCriteria {
    type: 'manual' | 'automatic';
    rules?: AutomaticRule[];
}

export interface AutomaticRule {
    fieldId?: string;
    field?: string; // Support legacy field name
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'notContains' | 'in';
    value: any;
    failureMessage?: string;
}

export interface ValidationConfig {
    requiredFields: string[];
    customValidators?: Record<string, string>;
}

export interface DocumentationLinkConfig {
    title: string;
    url: string;
    type: 'internal' | 'external';
    icon?: string;
    description?: string;
}
