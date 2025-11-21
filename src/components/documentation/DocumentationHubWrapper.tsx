/**
 * Lazy-loaded Documentation Hub Wrapper
 * 
 * This component provides lazy loading for the DocumentationHub component
 * to improve initial page load performance.
 * 
 * Requirements: 8.1, 8.2
 */

import React, { Suspense, lazy } from 'react';
import type { DocumentationSection } from '../../types';

// Lazy load the DocumentationHub component
const DocumentationHub = lazy(() => import('./DocumentationHub').then(module => ({
    default: module.DocumentationHub
})));

interface DocumentationHubWrapperProps {
    sections: DocumentationSection[];
    contextual?: boolean;
    currentGate?: string;
    userRole?: 'PAM' | 'PDM' | 'TPM' | 'PSM' | 'TAM';
}

// Loading skeleton component
function DocumentationHubSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="mb-6 space-y-4">
                <div className="h-10 bg-gray-700 rounded w-1/3"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-gray-700 rounded w-32"></div>
                    <div className="h-10 bg-gray-700 rounded w-32"></div>
                    <div className="h-10 bg-gray-700 rounded w-32"></div>
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4">
                        <div className="h-6 bg-gray-700 rounded w-1/4 mb-3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DocumentationHubWrapper(props: DocumentationHubWrapperProps) {
    return (
        <Suspense fallback={<DocumentationHubSkeleton />}>
            <DocumentationHub {...props} />
        </Suspense>
    );
}
