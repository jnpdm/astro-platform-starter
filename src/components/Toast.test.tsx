import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastContainer, ToastMessage } from './Toast';

describe('ToastContainer', () => {
    it('renders toast messages', () => {
        const messages: ToastMessage[] = [
            {
                id: '1',
                type: 'success',
                message: 'Success message',
            },
            {
                id: '2',
                type: 'error',
                message: 'Error message',
            },
        ];

        const onClose = vi.fn();

        render(<ToastContainer messages={messages} onClose={onClose} />);

        expect(screen.getByText('Success message')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('calls onClose when toast duration expires', async () => {
        const messages: ToastMessage[] = [
            {
                id: '1',
                type: 'info',
                message: 'Test message',
                duration: 100, // Short duration for testing
            },
        ];

        const onClose = vi.fn();

        render(<ToastContainer messages={messages} onClose={onClose} />);

        expect(screen.getByText('Test message')).toBeInTheDocument();

        // Wait for toast to auto-close
        await waitFor(() => {
            expect(onClose).toHaveBeenCalledWith('1');
        }, { timeout: 500 });
    });

    it('renders different toast types with appropriate styling', () => {
        const messages: ToastMessage[] = [
            { id: '1', type: 'success', message: 'Success' },
            { id: '2', type: 'error', message: 'Error' },
            { id: '3', type: 'warning', message: 'Warning' },
            { id: '4', type: 'info', message: 'Info' },
        ];

        const onClose = vi.fn();

        render(<ToastContainer messages={messages} onClose={onClose} />);

        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Warning')).toBeInTheDocument();
        expect(screen.getByText('Info')).toBeInTheDocument();
    });
});
