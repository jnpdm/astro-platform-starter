/**
 * Unit tests for FieldEditor component
 * 
 * Tests core functionality of field editing including:
 * - Field property updates
 * - Field type changes
 * - Options management for select/radio/checkbox fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldEditor from './FieldEditor';
import type { QuestionField } from '../../types/template';

describe('FieldEditor', () => {
    const mockField: QuestionField = {
        id: 'test-field-1',
        type: 'text',
        label: 'Test Field',
        helpText: 'Test help text',
        placeholder: 'Test placeholder',
        required: true,
        order: 0
    };

    let mockHandlers: {
        onChange: ReturnType<typeof vi.fn>;
        onDelete: ReturnType<typeof vi.fn>;
        onMoveUp: ReturnType<typeof vi.fn>;
        onMoveDown: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockHandlers = {
            onChange: vi.fn(),
            onDelete: vi.fn(),
            onMoveUp: vi.fn(),
            onMoveDown: vi.fn()
        };
    });

    it('should render field in display mode by default', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(screen.getByText('Test Field')).toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('should show help text and placeholder when present', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(screen.getByText(/Test help text/)).toBeInTheDocument();
        expect(screen.getByText(/Test placeholder/)).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const editButton = screen.getByText(/Edit/);
        fireEvent.click(editButton);

        expect(screen.getByText('Editing Field')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Field')).toBeInTheDocument();
    });

    it('should display options for select/radio/checkbox fields', () => {
        const fieldWithOptions: QuestionField = {
            ...mockField,
            type: 'select',
            options: ['Option 1', 'Option 2', 'Option 3']
        };

        render(
            <FieldEditor
                field={fieldWithOptions}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should call onMoveUp when up button is clicked', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const upButton = screen.getByTitle('Move up');
        fireEvent.click(upButton);

        expect(mockHandlers.onMoveUp).toHaveBeenCalled();
    });

    it('should call onMoveDown when down button is clicked', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const downButton = screen.getByTitle('Move down');
        fireEvent.click(downButton);

        expect(mockHandlers.onMoveDown).toHaveBeenCalled();
    });

    it('should disable move up button when canMoveUp is false', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={false}
                canMoveDown={true}
            />
        );

        const upButton = screen.getByTitle('Move up') as HTMLButtonElement;
        expect(upButton.disabled).toBe(true);
    });

    it('should disable move down button when canMoveDown is false', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={false}
            />
        );

        const downButton = screen.getByTitle('Move down') as HTMLButtonElement;
        expect(downButton.disabled).toBe(true);
    });

    it('should show delete button in display mode', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const deleteButton = screen.getByText(/Delete/);
        expect(deleteButton).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button is clicked', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const deleteButton = screen.getByText(/Delete/);
        fireEvent.click(deleteButton);

        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete the field "Test Field"/)).toBeInTheDocument();
    });

    it('should call onDelete when delete is confirmed', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        // Click delete button
        const deleteButton = screen.getByText(/Delete/);
        fireEvent.click(deleteButton);

        // Confirm deletion
        const confirmButton = screen.getByText('Delete Field');
        fireEvent.click(confirmButton);

        expect(mockHandlers.onDelete).toHaveBeenCalled();
    });

    it('should close confirmation dialog when cancel is clicked', () => {
        render(
            <FieldEditor
                field={mockField}
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        // Click delete button
        const deleteButton = screen.getByText(/Delete/);
        fireEvent.click(deleteButton);

        // Click cancel
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        // Dialog should be closed
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
        expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });
});
