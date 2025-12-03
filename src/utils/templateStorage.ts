/**
 * Template storage utilities
 * Provides CRUD operations for questionnaire templates with versioning support
 */

import { getStore } from '@netlify/blobs';
import type {
    QuestionnaireTemplate,
    TemplateVersion,
    TemplateMetadata,
    ValidationResult,
    QuestionField,
} from '../types/template';

// Store names
const TEMPLATES_STORE = 'templates';

// Storage keys
const CURRENT_PREFIX = 'current/';
const VERSIONS_PREFIX = 'versions/';
const METADATA_KEY = 'metadata';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Template storage error class
 */
export class TemplateStorageError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'TemplateStorageError';
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
 * Get the current version of a template
 * @param templateId - The template identifier (e.g., 'gate-0', 'pre-contract')
 * @returns The current template or null if not found
 * @throws TemplateStorageError if retrieval fails
 */
export async function getCurrentTemplate(templateId: string): Promise<QuestionnaireTemplate | null> {
    // In development mode without Netlify Blobs, return null immediately
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
        console.warn(`[TemplateStorage] Development mode: skipping Netlify Blobs, template ${templateId} not available`);
        return null;
    }

    try {
        return await retryOperation(async () => {
            const store = getStore(TEMPLATES_STORE);
            const key = `${CURRENT_PREFIX}${templateId}`;
            const data = await store.get(key, { type: 'json' });

            if (!data) {
                return null;
            }

            return deserializeTemplate(data as any);
        });
    } catch (error) {
        console.error('[TemplateStorage] Error getting current template:', error);

        throw new TemplateStorageError(
            `Failed to retrieve template ${templateId}`,
            'GET_TEMPLATE_ERROR',
            error
        );
    }
}

/**
 * Get a specific version of a template
 * @param templateId - The template identifier
 * @param version - The version number
 * @returns The template version or null if not found
 * @throws TemplateStorageError if retrieval fails
 */
export async function getTemplateVersion(
    templateId: string,
    version: number
): Promise<TemplateVersion | null> {
    // In development mode without Netlify Blobs, return null immediately
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
        console.warn(`[TemplateStorage] Development mode: skipping Netlify Blobs, template ${templateId} version ${version} not available`);
        return null;
    }

    try {
        return await retryOperation(async () => {
            const store = getStore(TEMPLATES_STORE);
            const key = `${VERSIONS_PREFIX}${templateId}/${version}`;
            const data = await store.get(key, { type: 'json' });

            if (!data) {
                return null;
            }

            return deserializeTemplateVersion(data as any);
        });
    } catch (error) {
        console.error('[TemplateStorage] Error getting template version:', error);

        throw new TemplateStorageError(
            `Failed to retrieve template ${templateId} version ${version}`,
            'GET_TEMPLATE_VERSION_ERROR',
            error
        );
    }
}

/**
 * Save a template with versioning
 * Creates a new version and updates the current template
 * @param template - The template to save
 * @param updatedBy - Email of the user making the update
 * @returns The updated template with incremented version
 * @throws TemplateStorageError if save fails
 */
export async function saveTemplate(
    template: QuestionnaireTemplate,
    updatedBy: string
): Promise<QuestionnaireTemplate> {
    try {
        console.log('[TemplateStorage] Saving template:', template.id);

        return await retryOperation(async () => {
            const store = getStore(TEMPLATES_STORE);

            // Get current template to create version history
            const currentKey = `${CURRENT_PREFIX}${template.id}`;
            const currentData = await store.get(currentKey, { type: 'json' });

            let newVersion = 1;

            // If template exists, save current version to history and increment version
            if (currentData) {
                const current = deserializeTemplate(currentData as any);
                newVersion = current.version + 1;

                // Save previous version to history
                const versionKey = `${VERSIONS_PREFIX}${template.id}/${current.version}`;
                const templateVersion: TemplateVersion = {
                    templateId: current.id,
                    version: current.version,
                    fields: current.fields,
                    createdAt: current.updatedAt,
                    createdBy: current.updatedBy,
                };

                await store.setJSON(versionKey, templateVersion);
                console.log('[TemplateStorage] Saved version to history:', versionKey);
            }

            // Create updated template with new version
            const updatedTemplate: QuestionnaireTemplate = {
                ...template,
                version: newVersion,
                updatedAt: new Date(),
                updatedBy,
            };

            // Save as current template
            await store.setJSON(currentKey, updatedTemplate);
            console.log('[TemplateStorage] Saved current template:', currentKey);

            // Update metadata
            await updateMetadata(template.id);

            return updatedTemplate;
        });
    } catch (error) {
        console.error('[TemplateStorage] Error saving template:', error);

        if (import.meta.env.DEV && !import.meta.env.VITEST) {
            console.warn('[TemplateStorage] Netlify Blobs not available in development');
            console.log('[TemplateStorage] Would save template:', template);
            // Return template with incremented version for dev mode
            return {
                ...template,
                version: template.version + 1,
                updatedAt: new Date(),
                updatedBy,
            };
        }

        throw new TemplateStorageError(
            `Failed to save template ${template.id}`,
            'SAVE_TEMPLATE_ERROR',
            error
        );
    }
}

/**
 * List all current templates
 * @returns Array of all current templates
 * @throws TemplateStorageError if listing fails
 */
export async function listTemplates(): Promise<QuestionnaireTemplate[]> {
    // In development mode without Netlify Blobs, return empty list immediately
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
        console.warn('[TemplateStorage] Development mode: skipping Netlify Blobs, returning empty template list');
        return [];
    }

    try {
        console.log('[TemplateStorage] Listing templates...');

        return await retryOperation(async () => {
            const store = getStore(TEMPLATES_STORE);
            const { blobs } = await store.list({ prefix: CURRENT_PREFIX });

            const templates: QuestionnaireTemplate[] = [];

            for (const blob of blobs) {
                const data = await store.get(blob.key, { type: 'json' });
                if (data) {
                    templates.push(deserializeTemplate(data as any));
                }
            }

            console.log('[TemplateStorage] Loaded templates:', templates.length);
            return templates;
        });
    } catch (error) {
        console.error('[TemplateStorage] Error listing templates:', error);

        throw new TemplateStorageError(
            'Failed to list templates',
            'LIST_TEMPLATES_ERROR',
            error
        );
    }
}

/**
 * List all versions of a template
 * @param templateId - The template identifier
 * @returns Array of all versions for the template
 * @throws TemplateStorageError if listing fails
 */
export async function listTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
    // In development mode without Netlify Blobs, return empty list immediately
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
        console.warn(`[TemplateStorage] Development mode: skipping Netlify Blobs, returning empty versions for ${templateId}`);
        return [];
    }

    try {
        return await retryOperation(async () => {
            const store = getStore(TEMPLATES_STORE);
            const prefix = `${VERSIONS_PREFIX}${templateId}/`;
            const { blobs } = await store.list({ prefix });

            const versions: TemplateVersion[] = [];

            for (const blob of blobs) {
                const data = await store.get(blob.key, { type: 'json' });
                if (data) {
                    versions.push(deserializeTemplateVersion(data as any));
                }
            }

            // Sort by version number descending
            versions.sort((a, b) => b.version - a.version);

            return versions;
        });
    } catch (error) {
        console.error('[TemplateStorage] Error listing template versions:', error);

        throw new TemplateStorageError(
            `Failed to list versions for template ${templateId}`,
            'LIST_TEMPLATE_VERSIONS_ERROR',
            error
        );
    }
}

/**
 * Validate a template
 * @param template - The template to validate
 * @returns Validation result with any errors
 */
export function validateTemplate(template: QuestionnaireTemplate): ValidationResult {
    const errors: string[] = [];

    // Check for duplicate field IDs
    const fieldIds = template.fields.map(f => f.id);
    const uniqueIds = new Set(fieldIds);
    if (uniqueIds.size !== fieldIds.length) {
        errors.push('Duplicate field IDs found');
    }

    // Check for empty labels
    if (template.fields.some(f => !f.label.trim())) {
        errors.push('All fields must have labels');
    }

    // Check options for select/radio/checkbox
    template.fields.forEach(field => {
        if (['select', 'radio', 'checkbox'].includes(field.type)) {
            if (!field.options || field.options.length === 0) {
                errors.push(`Field "${field.label}" requires options`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Update template metadata
 * @param templateId - The template that was updated
 */
async function updateMetadata(templateId: string): Promise<void> {
    try {
        const store = getStore(TEMPLATES_STORE);
        const data = await store.get(METADATA_KEY, { type: 'json' });

        let metadata: TemplateMetadata;

        if (data) {
            metadata = data as TemplateMetadata;
            metadata.lastUpdated = new Date();
            if (!metadata.templates.includes(templateId)) {
                metadata.templates.push(templateId);
            }
        } else {
            metadata = {
                lastUpdated: new Date(),
                templates: [templateId],
            };
        }

        await store.setJSON(METADATA_KEY, metadata);
    } catch (error) {
        console.error('[TemplateStorage] Error updating metadata:', error);
        // Don't throw - metadata update failure shouldn't fail the main operation
    }
}

/**
 * Helper function to deserialize template data (convert date strings to Date objects)
 */
function deserializeTemplate(data: any): QuestionnaireTemplate {
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
    };
}

/**
 * Helper function to deserialize template version data
 */
function deserializeTemplateVersion(data: any): TemplateVersion {
    return {
        ...data,
        createdAt: new Date(data.createdAt),
    };
}

/**
 * Get template for rendering a submission
 * If submission has a templateVersion, use that version
 * Otherwise, use the current template
 * @param templateId - The template identifier
 * @param templateVersion - Optional version number from submission
 * @returns The appropriate template or template version
 */
export async function getTemplateForSubmission(
    templateId: string,
    templateVersion?: number
): Promise<QuestionnaireTemplate | TemplateVersion | null> {
    if (templateVersion !== undefined) {
        // Try to get the specific version
        const version = await getTemplateVersion(templateId, templateVersion);
        if (version) {
            return version;
        }
        // Fall back to current if version not found
        console.warn(`[TemplateStorage] Version ${templateVersion} not found for ${templateId}, falling back to current`);
    }

    return getCurrentTemplate(templateId);
}
