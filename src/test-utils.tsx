/**
 * Test utilities for wrapping components with necessary providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

interface AllProvidersProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
function AllProviders({ children }: AllProvidersProps) {
    return (
        <ErrorBoundary>
            <ToastProvider>
                {children}
            </ToastProvider>
        </ErrorBoundary>
    );
}

/**
 * Custom render function that wraps components with providers
 * Use this instead of @testing-library/react's render for components that use toast or error boundary
 */
function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom version
export { renderWithProviders as render };
