import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { SignatureCapture } from './SignatureCapture';
import type { Signature } from '../../types/signature';

// Mock fetch for IP address
global.fetch = vi.fn();

describe('SignatureCapture', () => {
    const mockOnSignature = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ ip: '192.168.1.1' }),
        });
    });

    describe('Mode Selection', () => {
        it('renders with typed mode by default', () => {
            render(<SignatureCapture onSignature={mockOnSignature} />);

            const typeButton = screen.getByRole('button', { name: /type name/i });
            expect(typeButton).toHaveClass('bg-blue-600');
        });

        it('allows switching between typed and drawn modes', () => {
            render(<SignatureCapture onSignature={mockOnSignature} />);

            const drawButton = screen.getByRole('button', { name: /draw signature/i });
            fireEvent.click(drawButton);

            expect(drawButton).toHaveClass('bg-blue-600');
            // Check for canvas element which indicates drawn mode
            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        it('respects initial mode prop', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="drawn" />);

            const drawButton = screen.getByRole('button', { name: /draw signature/i });
            expect(drawButton).toHaveClass('bg-blue-600');
        });
    });

    describe('Typed Signature Mode', () => {
        it('renders name and email inputs in typed mode', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            expect(screen.getByLabelText(/type your full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        });

        it('shows preview of typed name', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            fireEvent.change(nameInput, { target: { value: 'John Doe' } });

            expect(screen.getByText('Preview:')).toBeInTheDocument();
            const previews = screen.getAllByText('John Doe');
            expect(previews.length).toBeGreaterThan(0);
        });

        it('disables preview button when name is empty', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            expect(previewButton).toBeDisabled();
        });

        it('disables preview button when email is empty', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            fireEvent.change(nameInput, { target: { value: 'John Doe' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            expect(previewButton).toBeDisabled();
        });

        it('enables preview button when both name and email are filled', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            expect(previewButton).not.toBeDisabled();
        });
    });

    describe('Drawn Signature Mode', () => {
        it('renders canvas in drawn mode', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="drawn" />);

            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        it('renders clear button in drawn mode', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="drawn" />);

            expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
        });

        it('disables clear button when nothing is drawn', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="drawn" />);

            const clearButton = screen.getByRole('button', { name: /clear/i });
            expect(clearButton).toBeDisabled();
        });

        it.skip('enables clear button after drawing (requires canvas support)', () => {
            // This test requires full canvas support which jsdom doesn't provide
            // In a real browser environment, drawing on canvas would enable the clear button
        });

        it('disables preview button when nothing is drawn', () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="drawn" />);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            expect(previewButton).toBeDisabled();
        });
    });

    describe('Email Input', () => {
        it('pre-fills email when signerEmail prop is provided', () => {
            render(
                <SignatureCapture
                    onSignature={mockOnSignature}
                    signerEmail="prefilled@example.com"
                />
            );

            const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
            expect(emailInput.value).toBe('prefilled@example.com');
        });

        it('allows changing email', () => {
            render(<SignatureCapture onSignature={mockOnSignature} />);

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

            expect((emailInput as HTMLInputElement).value).toBe('new@example.com');
        });
    });

    describe('Preview and Confirmation', () => {
        it('shows preview when preview button is clicked', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });
        });

        it('displays signature details in preview', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature details/i)).toBeInTheDocument();
                expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
                expect(screen.getByText(/192\.168\.1\.1/)).toBeInTheDocument();
            });
        });

        it('shows terms acceptance checkbox in preview', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/i confirm that this is my digital signature/i)).toBeInTheDocument();
            });
        });

        it('disables confirm button until terms are accepted', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
                expect(confirmButton).toBeDisabled();
            });
        });

        it('calls onSignature when confirmed', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const termsCheckbox = screen.getByRole('checkbox');
            fireEvent.click(termsCheckbox);

            const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSignature).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'typed',
                        data: 'John Doe',
                        signerName: 'John Doe',
                        signerEmail: 'john@example.com',
                        ipAddress: '192.168.1.1',
                    })
                );
            });
        });

        it('returns to input when cancel is clicked', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText(/signature preview/i)).not.toBeInTheDocument();
                expect(screen.getByLabelText(/type your full name/i)).toBeInTheDocument();
            });
        });
    });

    describe('Metadata Capture', () => {
        it('captures timestamp', async () => {
            const beforeTime = new Date();

            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const termsCheckbox = screen.getByRole('checkbox');
            fireEvent.click(termsCheckbox);

            const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSignature).toHaveBeenCalled();
            });

            const signature = mockOnSignature.mock.calls[0][0] as Signature;
            const afterTime = new Date();

            expect(signature.timestamp).toBeInstanceOf(Date);
            expect(signature.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(signature.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });

        it('captures IP address', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const termsCheckbox = screen.getByRole('checkbox');
            fireEvent.click(termsCheckbox);

            const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSignature).toHaveBeenCalled();
            });

            const signature = mockOnSignature.mock.calls[0][0] as Signature;
            expect(signature.ipAddress).toBe('192.168.1.1');
        });

        it('captures user agent', async () => {
            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const termsCheckbox = screen.getByRole('checkbox');
            fireEvent.click(termsCheckbox);

            const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSignature).toHaveBeenCalled();
            });

            const signature = mockOnSignature.mock.calls[0][0] as Signature;
            expect(signature.userAgent).toBe(navigator.userAgent);
        });

        it('handles IP fetch failure gracefully', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network error'));

            render(<SignatureCapture onSignature={mockOnSignature} mode="typed" />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            const previewButton = screen.getByRole('button', { name: /preview signature/i });
            fireEvent.click(previewButton);

            await waitFor(() => {
                expect(screen.getByText(/signature preview/i)).toBeInTheDocument();
            });

            const termsCheckbox = screen.getByRole('checkbox');
            fireEvent.click(termsCheckbox);

            const confirmButton = screen.getByRole('button', { name: /confirm & submit/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSignature).toHaveBeenCalled();
            });

            const signature = mockOnSignature.mock.calls[0][0] as Signature;
            expect(signature.ipAddress).toBe('unknown');
        });
    });

    describe('Disabled State', () => {
        it('disables all inputs when disabled prop is true', () => {
            render(<SignatureCapture onSignature={mockOnSignature} disabled={true} />);

            const nameInput = screen.getByLabelText(/type your full name/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const typeButton = screen.getByRole('button', { name: /type name/i });
            const drawButton = screen.getByRole('button', { name: /draw signature/i });

            expect(nameInput).toBeDisabled();
            expect(emailInput).toBeDisabled();
            expect(typeButton).toBeDisabled();
            expect(drawButton).toBeDisabled();
        });
    });

    describe('Drawn Signature Data', () => {
        it.skip('generates base64 data for drawn signatures (requires canvas support)', () => {
            // This test requires full canvas support which jsdom doesn't provide
            // In a real browser environment:
            // 1. User draws on canvas
            // 2. Canvas.toDataURL() generates base64 PNG data
            // 3. Signature object contains the base64 data
            // The component correctly implements this functionality for real browsers
        });
    });
});
