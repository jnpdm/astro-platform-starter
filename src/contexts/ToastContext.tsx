import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastMessage, ToastType } from '../components/Toast';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

/**
 * Toast provider component that manages toast notifications
 */
export function ToastProvider({ children }: ToastProviderProps) {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newMessage: ToastMessage = {
            id,
            type,
            message,
            duration,
        };

        setMessages((prev) => [...prev, newMessage]);
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration);
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration);
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    const handleClose = useCallback((id: string) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <ToastContainer messages={messages} onClose={handleClose} />
        </ToastContext.Provider>
    );
}

/**
 * Hook to access toast notifications
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
