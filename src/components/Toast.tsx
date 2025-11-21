import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    message: ToastMessage;
    onClose: (id: string) => void;
}

/**
 * Individual toast notification component
 */
function Toast({ message, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = message.duration || 5000;
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(message.id);
        }, 300);
    };

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getBackgroundColor = () => {
        switch (message.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md w-full transition-all duration-300 ${getBackgroundColor()} ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
                }`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 break-words">{message.message}</p>
            </div>
            <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

interface ToastContainerProps {
    messages: ToastMessage[];
    onClose: (id: string) => void;
}

/**
 * Toast container component that manages multiple toast notifications
 */
export function ToastContainer({ messages, onClose }: ToastContainerProps) {
    return (
        <div
            className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            <div className="pointer-events-auto">
                {messages.map((message) => (
                    <Toast key={message.id} message={message} onClose={onClose} />
                ))}
            </div>
        </div>
    );
}
