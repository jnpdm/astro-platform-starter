/**
 * Template to Config Converter
 * Converts QuestionnaireTemplate to QuestionnaireConfig format for rendering
 */

import type { QuestionnaireTemplate, TemplateVersion, QuestionField } from '../types/template';
import type { QuestionnaireConfig, Section, Field } from '../types/questionnaire';

/**
 * Map template field type to questionnaire field type
 */
function mapFieldType(templateType: QuestionField['type']): Field['type'] {
    const typeMap: Record<QuestionField['type'], Field['type']> = {
        'text': 'text',
        'textarea': 'textarea',
        'select': 'select',
        'radio': 'radio',
        'checkbox': 'checkbox',
        'date': 'date',
    };
    return typeMap[templateType] || 'text';
}

/**
 * Convert a template field to a questionnaire field
 */
function convertField(templateField: QuestionField): Field {
    return {
        id: templateField.id,
        type: mapFieldType(templateField.type),
        label: templateField.label,
        required: templateField.required,
        options: templateField.options,
        helpText: templateField.helpText,
        placeholder: templateField.placeholder,
    };
}

/**
 * Convert QuestionnaireTemplate to QuestionnaireConfig
 * Groups fields into a single section for template-based questionnaires
 * @param template - The template to convert
 * @param includeRemovedFields - Whether to include removed fields (for historical view)
 */
export function templateToConfig(
    template: QuestionnaireTemplate | TemplateVersion,
    includeRemovedFields: boolean = false
): QuestionnaireConfig {
    // Filter fields based on whether we're including removed fields
    const fieldsToInclude = includeRemovedFields
        ? template.fields.sort((a, b) => a.order - b.order)
        : template.fields.filter(field => !field.removed).sort((a, b) => a.order - b.order);

    // Convert fields
    const fields: Field[] = fieldsToInclude.map(field => {
        const convertedField = convertField(field);
        // Add removed flag to field if it's removed (for historical view)
        if (field.removed) {
            return {
                ...convertedField,
                removed: true,
            } as Field & { removed?: boolean };
        }
        return convertedField;
    });

    // Create a single section with all fields
    const section: Section = {
        id: 'main',
        title: 'Questionnaire',
        fields,
    };

    // Determine metadata based on template ID
    const metadata = getMetadataForTemplate(template.templateId || (template as QuestionnaireTemplate).id);

    // Create config
    const config: QuestionnaireConfig = {
        id: template.templateId || (template as QuestionnaireTemplate).id,
        version: String(template.version),
        metadata,
        sections: [section],
        validation: {
            // Only include active (non-removed) fields in validation
            requiredFields: fields.filter(f => f.required && !(f as any).removed).map(f => f.id),
        },
        documentation: [],
        gateCriteria: [],
    };

    return config;
}

/**
 * Get metadata for a template based on its ID
 */
function getMetadataForTemplate(templateId: string) {
    const metadataMap: Record<string, QuestionnaireConfig['metadata']> = {
        'pre-contract': {
            name: 'Pre-Contract: PDM Engagement',
            description: 'Initial partner assessment and engagement',
            gate: 'pre-contract',
            estimatedTime: 30,
            requiredRoles: ['PDM'],
            primaryRole: 'PDM',
        },
        'gate-0': {
            name: 'Gate 0: Onboarding Kickoff',
            description: 'Validate readiness for white-glove onboarding support',
            gate: 'gate-0',
            estimatedTime: 45,
            requiredRoles: ['PDM'],
            primaryRole: 'PDM',
        },
        'gate-1': {
            name: 'Gate 1: Ready to Sell',
            description: 'Confirm partner is ready to sell the solution',
            gate: 'gate-1',
            estimatedTime: 60,
            requiredRoles: ['PAM', 'PDM'],
            primaryRole: 'PAM',
        },
        'gate-2': {
            name: 'Gate 2: Ready to Order',
            description: 'Verify partner is ready to process orders',
            gate: 'gate-2',
            estimatedTime: 45,
            requiredRoles: ['PAM', 'PDM'],
            primaryRole: 'PAM',
        },
        'gate-3': {
            name: 'Gate 3: Ready to Deliver',
            description: 'Ensure partner is ready to deliver the solution',
            gate: 'gate-3',
            estimatedTime: 60,
            requiredRoles: ['PAM', 'TAM'],
            primaryRole: 'TAM',
        },
    };

    return metadataMap[templateId] || {
        name: templateId,
        description: 'Questionnaire',
        gate: templateId,
        estimatedTime: 30,
        requiredRoles: ['PDM'],
        primaryRole: 'PDM',
    };
}
