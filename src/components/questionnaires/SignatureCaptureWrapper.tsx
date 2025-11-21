import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ToastProvider } from '../../contexts/ToastContext';
import { SignatureCapture, SignatureCaptureProps } from './SignatureCapture';

/**
 * Wrapper component that provides error boundary and toast notifications
 * for the SignatureCapture component
 */
export default function SignatureCaptureWrapper(props: SignatureCaptureProps) {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <SignatureCapture {...props} />
            </ToastProvider>
        </ErrorBoundary>
    );
}
