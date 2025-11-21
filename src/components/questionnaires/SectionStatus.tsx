/**
 * SectionStatus Component
 * 
 * Displays pass/fail/pending status for questionnaire sections with visual indicators.
 * Supports compact mode (icon only) and detailed mode (icon + label + reasons).
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React from 'react';
import type { SectionStatus as SectionStatusType } from '../../types/submission';

export interface SectionStatusProps {
    sectionId: string;
    status: SectionStatusType;
    mode?: 'compact' | 'detailed';
    className?: string;
}

/**
 * Visual indicator component for section pass/fail status
 * - Green checkmark for pass
 * - Red X for fail
 * - Yellow clock for pending
 */
export function SectionStatus({
    sectionId,
    status,
    mode = 'detailed',
    className = '',
}: SectionStatusProps) {
    const { result, failureReasons, notes } = status;

    // Icon and color configuration based on result
    const statusConfig = {
        pass: {
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            ),
            label: 'PASS',
            colorClass: 'text-green-600 bg-green-50 border-green-200',
            iconColorClass: 'text-green-600',
        },
        fail: {
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            ),
            label: 'FAIL',
            colorClass: 'text-red-600 bg-red-50 border-red-200',
            iconColorClass: 'text-red-600',
        },
        pending: {
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            label: 'PENDING',
            colorClass: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            iconColorClass: 'text-yellow-600',
        },
    };

    const config = statusConfig[result];

    // Compact mode: icon only
    if (mode === 'compact') {
        return (
            <div
                className={`inline-flex items-center justify-center ${config.iconColorClass} ${className}`}
                title={`${config.label}${failureReasons && failureReasons.length > 0 ? `: ${failureReasons.join(', ')}` : ''}`}
                aria-label={`Section ${sectionId} status: ${config.label}`}
            >
                {config.icon}
            </div>
        );
    }

    // Detailed mode: icon + label + reasons
    return (
        <div
            className={`inline-flex flex-col gap-2 ${className}`}
            aria-label={`Section ${sectionId} status: ${config.label}`}
        >
            {/* Status badge with icon and label */}
            <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border font-medium text-sm ${config.colorClass}`}
            >
                {config.icon}
                <span>{config.label}</span>
            </div>

            {/* Failure reasons (only shown for fail status) */}
            {result === 'fail' && failureReasons && failureReasons.length > 0 && (
                <div className="ml-1 space-y-1">
                    <p className="text-sm font-medium text-red-800">Reasons:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-sm text-red-700">
                        {failureReasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Optional notes */}
            {notes && (
                <div className="ml-1">
                    <p className="text-sm text-gray-600 italic">{notes}</p>
                </div>
            )}
        </div>
    );
}

export default SectionStatus;
