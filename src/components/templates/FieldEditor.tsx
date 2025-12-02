/**
 * FieldEditor Component
 * 
 * Allows editing of individual questionnaire template fields.
 * Supports all field types and their specific properties.
 * 
 * Requirements: 8.4, 8.7, 8.8
 */

import { useState, useEffect } from 'react';
import type { QuestionField, FieldType } from '../../types/template';

interface FieldEditorProps {
    field: QuestionField;
    onChange: (updatedField: QuestionField) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    errors?: string[]; // Inline validation errors for this field
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown Select' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date Picker' }
];

export default function FieldEditor({
    field,
    onChange,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    errors = []
}: FieldEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedField, setEditedField] = useState<QuestionField>(field);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newOption, setNewOption] = useState('');

    // Update local state when field prop changes
    useEffect(() => {
        setEditedField(field);
    }, [field]);

    const needsOptions = ['select', 'radio', 'checkbox'].includes(editedField.type);

    const handleSave = () => {
        // Validate before saving
        if (!editedField.label.trim()) {
            alert('Field label is required');
            return;
        }

        if (needsOptions && (!editedField.options || editedField.options.length === 0)) {
            alert(`${editedField.type} fields require at least one option`);
            return;
        }

        onChange(editedField);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedField(field);
        setIsEditing(false);
    };

    const handleFieldChange = (updates: Partial<QuestionField>) => {
        setEditedField(prev => ({ ...prev, ...updates }));
    };

    const handleTypeChange = (newType: FieldType) => {
        const updates: Partial<QuestionField> = { type: newType };

        // If switching to a type that needs options, initialize empty array
        if (['select', 'radio', 'checkbox'].includes(newType) && !editedField.options) {
            updates.options = [];
        }

        // If switching away from option-based type, clear options
        if (!['select', 'radio', 'checkbox'].includes(newType)) {
            updates.options = undefined;
        }

        handleFieldChange(updates);
    };

    const handleAddOption = () => {
        if (!newOption.trim()) return;

        const currentOptions = editedField.options || [];
        handleFieldChange({
            options: [...currentOptions, newOption.trim()]
        });
        setNewOption('');
    };

    const handleRemoveOption = (index: number) => {
        const currentOptions = editedField.options || [];
        handleFieldChange({
            options: currentOptions.filter((_, i) => i !== index)
        });
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete();
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    if (!isEditing) {
        // Display mode
        return (
            <div className="px-6 py-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start gap-4">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-1 pt-1">
                        <button
                            type="button"
                            onClick={onMoveUp}
                            disabled={!canMoveUp}
                            className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            onClick={onMoveDown}
                            disabled={!canMoveDown}
                            className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                        >
                            ▼
                        </button>
                    </div>

                    {/* Field Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white">{field.label}</span>
                                    {field.required && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                                            Required
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                        {field.type}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 font-mono">ID: {field.id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>

                        {field.helpText && (
                            <div className="text-sm text-gray-400 mb-2">
                                <span className="font-medium">Help:</span> {field.helpText}
                            </div>
                        )}

                        {field.placeholder && (
                            <div className="text-sm text-gray-400 mb-2">
                                <span className="font-medium">Placeholder:</span> {field.placeholder}
                            </div>
                        )}

                        {field.options && field.options.length > 0 && (
                            <div className="text-sm text-gray-400">
                                <span className="font-medium">Options:</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {field.options.map((option, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                                            {option}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inline Validation Errors */}
                        {errors.length > 0 && (
                            <div className="mt-3 bg-red-900/30 border border-red-600/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-red-400 text-sm">⚠️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-300 mb-1">Validation Errors:</p>
                                        <ul className="text-sm text-red-200 space-y-1">
                                            {errors.map((error, idx) => (
                                                <li key={idx}>• {error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete the field "{field.label}"? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
                                >
                                    Delete Field
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Edit mode
    return (
        <div className="px-6 py-4 bg-gray-700/50 border-l-4 border-blue-500">
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Editing Field</h3>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-semibold"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Field Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Field Type <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={editedField.type}
                        onChange={(e) => handleTypeChange(e.target.value as FieldType)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {FIELD_TYPES.map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Label */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Label <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={editedField.label}
                        onChange={(e) => handleFieldChange({ label: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter field label"
                    />
                </div>

                {/* Help Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Help Text
                    </label>
                    <input
                        type="text"
                        value={editedField.helpText || ''}
                        onChange={(e) => handleFieldChange({ helpText: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional help text to guide users"
                    />
                </div>

                {/* Placeholder */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Placeholder
                    </label>
                    <input
                        type="text"
                        value={editedField.placeholder || ''}
                        onChange={(e) => handleFieldChange({ placeholder: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional placeholder text"
                    />
                </div>

                {/* Required Checkbox */}
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={editedField.required}
                            onChange={(e) => handleFieldChange({ required: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-300">Required field</span>
                    </label>
                </div>

                {/* Options Editor (for select, radio, checkbox) */}
                {needsOptions && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Options <span className="text-red-400">*</span>
                        </label>
                        <div className="space-y-2">
                            {/* Existing Options */}
                            {editedField.options && editedField.options.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {editedField.options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                                                {option}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                                title="Remove option"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Option */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddOption();
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new option"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Add
                                </button>
                            </div>

                            {(!editedField.options || editedField.options.length === 0) && (
                                <p className="text-sm text-yellow-400">
                                    ⚠️ At least one option is required for {editedField.type} fields
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Field ID (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Field ID (read-only)
                    </label>
                    <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 font-mono text-sm">
                        {editedField.id}
                    </div>
                </div>
            </div>
        </div>
    );
}
