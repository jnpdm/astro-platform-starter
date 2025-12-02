/**
 * TemplateEditorWrapper Component
 * 
 * Wrapper component for the template editor that manages the list of fields
 * and integrates with the FieldEditor component.
 * 
 * This component handles:
 * - Field list management
 * - Adding new fields
 * - Reordering fields
 * - Deleting fields
 * - Saving template changes
 */

import { useState } from 'react';
import type { QuestionnaireTemplate, QuestionField } from '../../types/template';
import { validateTemplate } from '../../utils/templateStorage';
import FieldEditor from './FieldEditor';

interface TemplateEditorWrapperProps {
    template: QuestionnaireTemplate;
    onSave: (updatedTemplate: QuestionnaireTemplate) => Promise<void>;
    onCancel: () => void;
}

export default function TemplateEditorWrapper({
    template,
    onSave,
    onCancel
}: TemplateEditorWrapperProps) {
    const [fields, setFields] = useState<QuestionField[]>(
        [...template.fields].sort((a, b) => a.order - b.order)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Map<string, string[]>>(new Map());

    const handleFieldChange = (index: number, updatedField: QuestionField) => {
        const newFields = [...fields];
        newFields[index] = updatedField;
        setFields(newFields);
    };

    const handleFieldDelete = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        // Reorder remaining fields
        const reorderedFields = newFields.map((field, i) => ({
            ...field,
            order: i
        }));
        setFields(reorderedFields);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;

        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[index - 1];
        newFields[index - 1] = temp;

        // Update order values
        newFields[index].order = index;
        newFields[index - 1].order = index - 1;

        setFields(newFields);
    };

    const handleMoveDown = (index: number) => {
        if (index === fields.length - 1) return;

        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[index + 1];
        newFields[index + 1] = temp;

        // Update order values
        newFields[index].order = index;
        newFields[index + 1].order = index + 1;

        setFields(newFields);
    };

    const handleAddField = () => {
        const newField: QuestionField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'text',
            label: 'New Field',
            required: false,
            order: fields.length
        };
        setFields([...fields, newField]);
    };

    const validateTemplateWithFieldErrors = (): { valid: boolean; errors: string[] } => {
        // Create a temporary template for validation
        const tempTemplate: QuestionnaireTemplate = {
            ...template,
            fields
        };

        // Use centralized validation
        const validation = validateTemplate(tempTemplate);

        // Build field-level error map for inline display
        const newFieldErrors = new Map<string, string[]>();

        // Check for duplicate field IDs
        const fieldIds = fields.map(f => f.id);
        const duplicateIds = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
        duplicateIds.forEach(id => {
            const existing = newFieldErrors.get(id) || [];
            existing.push('Duplicate field ID');
            newFieldErrors.set(id, existing);
        });

        // Check each field for errors
        fields.forEach(field => {
            const errors: string[] = [];

            // Check for empty label
            if (!field.label.trim()) {
                errors.push('Label is required');
            }

            // Check options for select/radio/checkbox
            if (['select', 'radio', 'checkbox'].includes(field.type)) {
                if (!field.options || field.options.length === 0) {
                    errors.push('Options are required for this field type');
                }
            }

            if (errors.length > 0) {
                newFieldErrors.set(field.id, errors);
            }
        });

        setFieldErrors(newFieldErrors);

        return validation;
    };

    const handleSave = async () => {
        setError(null);
        setFieldErrors(new Map());

        // Validate template
        const validation = validateTemplateWithFieldErrors();
        if (!validation.valid) {
            setError(validation.errors.join(', '));
            return;
        }

        setIsSaving(true);

        try {
            const updatedTemplate: QuestionnaireTemplate = {
                ...template,
                fields,
                updatedAt: new Date(),
                version: template.version + 1
            };

            await onSave(updatedTemplate);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Error Display */}
            {error && (
                <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold mb-1">Validation Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Fields List */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Template Fields</h2>
                        <button
                            type="button"
                            onClick={handleAddField}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            ➕ Add Field
                        </button>
                    </div>
                </div>

                {fields.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-400 mb-4">No fields in this template yet</p>
                        <button
                            type="button"
                            onClick={handleAddField}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            ➕ Add Your First Field
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {fields.map((field, index) => (
                            <FieldEditor
                                key={field.id}
                                field={field}
                                onChange={(updatedField) => handleFieldChange(index, updatedField)}
                                onDelete={() => handleFieldDelete(index)}
                                onMoveUp={() => handleMoveUp(index)}
                                onMoveDown={() => handleMoveDown(index)}
                                canMoveUp={index > 0}
                                canMoveDown={index < fields.length - 1}
                                errors={fieldErrors.get(field.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Save/Cancel Actions */}
            <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-400">
                    <p className="mb-1">💡 <strong>Note:</strong> Saving will create version {template.version + 1}</p>
                    <p>New submissions will use the updated template. Existing submissions will continue to use their original version.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? '💾 Saving...' : '💾 Save Template'}
                    </button>
                </div>
            </div>
        </div>
    );
}
