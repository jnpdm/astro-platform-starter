/**
 * Lazy-loaded Questionnaire Form Wrapper
 * 
 * This component provides lazy loading for questionnaire components
 * to improve initial page load performance through code splitting.
 * 
 * Requirements: 8.1, 8.2
 */

import React, { Suspense, lazy } from 'react';
import type { QuestionnaireConfig } from '../../types/questionnaire';
import type { SubmissionData } from '../../types/submission';

// Lazy load the QuestionnaireForm component
const QuestionnaireForm = lazy(() => import('./QuestionnaireForm'));

interface QuestionnaireFormWrapperProps {
    config: QuestionnaireConfig;
    existingData?: SubmissionData;
    mode?: 'edit' | 'view';
    onSubmit: (data: SubmissionData) => Promise<void>;
    partnerId?: string;
}

// Loading skeleton component
function QuestionnaireFormSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
            {/* Progress bar skeleton */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-300 h-3 rounded-full w-1/3"></div>
                </div>
                <div className="mt-4 flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-gray-300 rounded w-20"></div>
                    ))}
                </div>
            </div>

            {/* Form skeleton */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mb-6"></div>

                {/* Field skeletons */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="mb-6">
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                ))}
            </div>

            {/* Button skeleton */}
            <div className="flex justify-between">
                <div className="h-10 bg-gray-300 rounded w-24"></div>
                <div className="h-10 bg-blue-300 rounded w-24"></div>
            </div>
        </div>
    );
}

export default function QuestionnaireFormWrapper(props: QuestionnaireFormWrapperProps) {
    return (
        <Suspense fallback={<QuestionnaireFormSkeleton />}>
            <QuestionnaireForm {...props} />
        </Suspense>
    );
}
