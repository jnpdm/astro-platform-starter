import React, { useState, useEffect, useCallback } from 'react';
import type { QuestionnaireConfig, Field, Section } from '../../types/questionnaire';
import type { SubmissionData } from '../../types/submission';
import { useToast } from '../../contexts/ToastContext';

interface QuestionnaireFormProps {
    config: QuestionnaireConfig;
    existingData?: SubmissionData;
    mode?: 'edit' | 'view';
    onSubmit: (data: SubmissionData) => Promise<void>;
    partnerId?: string;
}

interface ValidationErrors {
    [sectionId: string]: {
        [fieldId: string]: string;
    };
}

export default function QuestionnaireForm({
    config,
    existingData,
    mode,
    onSubmit,
    partnerId,
}: QuestionnaireFormProps) {
    const toast = useToast();
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const currentSection = config.sections[currentSectionIndex];
    const isFirstSection = currentSectionIndex === 0;
    const isLastSection = currentSectionIndex === config.sections.length - 1;
    const isViewMode = mode === 'view';

    // Initialize form data from existing data or empty
    useEffect(() => {
        if (existingData) {
            const dataMap: Record<string, Record<string, any>> = {};
            existingData.sections.forEach((section) => {
                dataMap[section.sectionId] = section.fields;
            });
            setFormData(dataMap);
        } else {
            // Initialize with default values
            const initialData: Record<string, Record<string, any>> = {};
            config.sections.forEach((section) => {
                initialData[section.id] = {};
                section.fields.forEach((field) => {
                    if (field.defaultValue !== undefined) {
                        initialData[section.id][field.id] = field.defaultValue;
                    }
                });
            });
            setFormData(initialData);
        }
    }, [existingData, config]);

    // Auto-save to localStorage
    useEffect(() => {
        if (!isViewMode && Object.keys(formData).length > 0) {
            const autoSaveKey = `questionnaire-draft-${config.id}-${partnerId || 'new'}`;
            const autoSaveData = {
                formData,
                timestamp: new Date().toISOString(),
                currentSectionIndex,
            };
            localStorage.setItem(autoSaveKey, JSON.stringify(autoSaveData));
        }
    }, [formData, config.id, partnerId, isViewMode, currentSectionIndex]);

    // Load auto-saved data on mount
    useEffect(() => {
        if (!existingData && !isViewMode) {
            const autoSaveKey = `questionnaire-draft-${config.id}-${partnerId || 'new'}`;
            const savedData = localStorage.getItem(autoSaveKey);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setFormData(parsed.formData);
                    setCurrentSectionIndex(parsed.currentSectionIndex || 0);
                } catch (error) {
                    console.error('Failed to load auto-saved data:', error);
                }
            }
        }
    }, [config.id, partnerId, existingData, isViewMode]);

    const handleFieldChange = useCallback((sectionId: string, fieldId: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [fieldId]: value,
            },
        }));

        // Clear validation error for this field
        setValidationErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors[sectionId]?.[fieldId]) {
                delete newErrors[sectionId][fieldId];
                if (Object.keys(newErrors[sectionId]).length === 0) {
                    delete newErrors[sectionId];
                }
            }
            return newErrors;
        });
    }, []);

    const validateField = (field: Field, value: any): string | null => {
        // Required field validation
        if (field.required && (value === undefined || value === null || value === '')) {
            return `${field.label} is required`;
        }

        // Skip other validations if field is empty and not required
        if (!value && !field.required) {
            return null;
        }

        // Type-specific validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
        }

        if (field.type === 'number' && value !== undefined && value !== '') {
            if (isNaN(Number(value))) {
                return 'Please enter a valid number';
            }
        }

        // Custom validation rules
        if (field.validation) {
            const rule = field.validation;
            switch (rule.type) {
                case 'regex':
                    if (rule.value && !new RegExp(rule.value).test(String(value))) {
                        return rule.message;
                    }
                    break;
                case 'min':
                    if (Number(value) < rule.value) {
                        return rule.message;
                    }
                    break;
                case 'max':
                    if (Number(value) > rule.value) {
                        return rule.message;
                    }
                    break;
                case 'minLength':
                    if (String(value).length < rule.value) {
                        return rule.message;
                    }
                    break;
                case 'maxLength':
                    if (String(value).length > rule.value) {
                        return rule.message;
                    }
                    break;
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(String(value))) {
                        return rule.message;
                    }
                    break;
                case 'url':
                    try {
                        new URL(String(value));
                    } catch {
                        return rule.message;
                    }
                    break;
            }
        }

        return null;
    };

    const validateSection = (section: Section): boolean => {
        const errors: Record<string, string> = {};
        const sectionData = formData[section.id] || {};

        section.fields.forEach((field) => {
            const value = sectionData[field.id];
            const error = validateField(field, value);
            if (error) {
                errors[field.id] = error;
            }
        });

        if (Object.keys(errors).length > 0) {
            setValidationErrors((prev) => ({
                ...prev,
                [section.id]: errors,
            }));
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (validateSection(currentSection)) {
            setCurrentSectionIndex((prev) => Math.min(prev + 1, config.sections.length - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        setCurrentSectionIndex((prev) => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isViewMode) return;

        // Validate all sections
        let allValid = true;
        const allErrors: ValidationErrors = {};

        config.sections.forEach((section) => {
            const sectionData = formData[section.id] || {};
            const sectionErrors: Record<string, string> = {};

            section.fields.forEach((field) => {
                const value = sectionData[field.id];
                const error = validateField(field, value);
                if (error) {
                    sectionErrors[field.id] = error;
                    allValid = false;
                }
            });

            if (Object.keys(sectionErrors).length > 0) {
                allErrors[section.id] = sectionErrors;
            }
        });

        if (!allValid) {
            setValidationErrors(allErrors);
            // Navigate to first section with errors
            const firstErrorSectionIndex = config.sections.findIndex(
                (section) => allErrors[section.id]
            );
            if (firstErrorSectionIndex !== -1) {
                setCurrentSectionIndex(firstErrorSectionIndex);
            }
            setSubmitError('Please fix all validation errors before submitting');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const submissionData: SubmissionData = {
                sections: config.sections.map((section) => ({
                    sectionId: section.id,
                    fields: formData[section.id] || {},
                    status: {
                        result: 'pending',
                    },
                })),
                metadata: {
                    partnerId,
                },
            };

            await onSubmit(submissionData);

            // Clear auto-saved data on successful submission
            const autoSaveKey = `questionnaire-draft-${config.id}-${partnerId || 'new'}`;
            localStorage.removeItem(autoSaveKey);

            // Show success notification
            toast.showSuccess('Questionnaire submitted successfully!');
        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit questionnaire';
            setSubmitError(errorMessage);
            toast.showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field: Field, sectionId: string) => {
        const value = formData[sectionId]?.[field.id] ?? '';
        const error = validationErrors[sectionId]?.[field.id];
        const fieldId = `${sectionId}-${field.id}`;

        const commonProps = {
            id: fieldId,
            name: field.id,
            disabled: isViewMode,
            'aria-describedby': field.helpText ? `${fieldId}-help` : undefined,
            'aria-invalid': error ? true : undefined,
            className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
                } ${isViewMode ? 'bg-gray-50' : ''}`,
        };

        const handleChange = (newValue: any) => {
            handleFieldChange(sectionId, field.id, newValue);
        };

        return (
            <div key={field.id} className="mb-6">
                <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'text' && (
                    <input
                        {...commonProps}
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                    />
                )}

                {field.type === 'email' && (
                    <input
                        {...commonProps}
                        type="email"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                    />
                )}

                {field.type === 'date' && (
                    <input
                        {...commonProps}
                        type="date"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                    />
                )}

                {field.type === 'number' && (
                    <input
                        {...commonProps}
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                    />
                )}

                {field.type === 'select' && (
                    <select
                        {...commonProps}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                    >
                        <option value="">Select an option...</option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )}

                {field.type === 'checkbox' && (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <label key={option} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={Array.isArray(value) && value.includes(option)}
                                    onChange={(e) => {
                                        const currentValues = Array.isArray(value) ? value : [];
                                        const newValues = e.target.checked
                                            ? [...currentValues, option]
                                            : currentValues.filter((v) => v !== option);
                                        handleChange(newValues);
                                    }}
                                    disabled={isViewMode}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                )}

                {field.type === 'radio' && (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <label key={option} className="flex items-center">
                                <input
                                    type="radio"
                                    name={fieldId}
                                    value={option}
                                    checked={value === option}
                                    onChange={(e) => handleChange(e.target.value)}
                                    disabled={isViewMode}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                )}

                {field.type === 'textarea' && (
                    <textarea
                        {...commonProps}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                    />
                )}

                {field.helpText && (
                    <p id={`${fieldId}-help`} className="mt-1 text-sm text-gray-500">
                        {field.helpText}
                    </p>
                )}

                {error && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    };

    const progressPercentage = ((currentSectionIndex + 1) / config.sections.length) * 100;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Progress Indicator */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm sm:text-base font-medium text-gray-700">
                        Section {currentSectionIndex + 1} of {config.sections.length}
                    </span>
                    <span className="text-sm text-gray-500">
                        {Math.round(progressPercentage)}% Complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                    <div
                        className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Section Navigation */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {config.sections.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => setCurrentSectionIndex(index)}
                            className={`px-3 py-2 text-xs sm:text-sm rounded-md transition-colors min-h-[44px] touch-target ${index === currentSectionIndex
                                ? 'bg-blue-600 text-white'
                                : validationErrors[section.id]
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            type="button"
                        >
                            <span className="hidden sm:inline">{index + 1}. {section.title}</span>
                            <span className="sm:hidden">{index + 1}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Section */}
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {currentSection.title}
                    </h2>
                    {currentSection.description && (
                        <p className="text-sm sm:text-base text-gray-600 mb-6">{currentSection.description}</p>
                    )}

                    {/* Documentation Links */}
                    {currentSection.documentationLinks && currentSection.documentationLinks.length > 0 && (
                        <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-md">
                            <h3 className="text-sm font-medium text-blue-900 mb-2">
                                Related Documentation
                            </h3>
                            <ul className="space-y-1">
                                {currentSection.documentationLinks.map((link) => (
                                    <li key={link.url}>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 underline break-words"
                                        >
                                            {link.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-6">
                        {currentSection.fields.map((field) => renderField(field, currentSection.id))}
                    </div>
                </div>

                {/* Error Message */}
                {submitError && (
                    <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isFirstSection}
                        className={`px-6 py-3 sm:py-2 rounded-md font-medium transition-colors min-h-[44px] ${isFirstSection
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Previous
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isLastSection && (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
                            >
                                Next
                            </button>
                        )}

                        {isLastSection && !isViewMode && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-3 sm:py-2 rounded-md font-medium transition-colors min-h-[44px] ${isSubmitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                    } text-white`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Questionnaire'}
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Auto-save Indicator */}
            {!isViewMode && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Your progress is automatically saved
                    </p>
                </div>
            )}
        </div>
    );
}
