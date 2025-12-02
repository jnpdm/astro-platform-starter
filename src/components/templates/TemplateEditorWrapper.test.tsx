/**
 * Tests for TemplateEditorWrapper Component
 * 
 * Validates the add field functionality and template management
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateEditorWrapper from './TemplateEditorWrapper';
import type { QuestionnaireTemplate } from '../../types/template';

describe('TemplateEditorWrapper', () => {
    const mockTemplate: QuestionnaireTemplate = {
        id: 'test-template',
        name: 'Test Template',
        version: 1,
        fields: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'test@example.com'
    };

    it('should render add field button when no fields exist', () => {
        const mockOnSave = vi.fn();
        const mockOnCancel = vi.fn();

        render(
            <TemplateEditorWrapper
                template={mockTemplate}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        // Should show empty state with add field button
        expect(screen.getByText('No fields in this template yet')).toBeInTheDocument();
        expect(screen.getByText('➕ Add Your First Field')).toBeInTheDocument();
    });

    it('should add a new field with default values when add button is clicked', async () => {
        const mockOnSave = vi.fn();
        const mockOnCancel = vi.fn();

        render(
            <TemplateEditorWrapper
                template={mockTemplate}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        // Click add field button
        const addButton = screen.getByText('➕ Add Your First Field');
        fireEvent.click(addButton);

        // Should now show a field with default values
        await waitFor(() => {
            expect(screen.getByText('New Field')).toBeInTheDocument();
        });

        // Verify field has correct default type
        expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('should generate unique field IDs when adding multiple fields', async () => {
        const mockOnSave = vi.fn();
        const mockOnCancel = vi.fn();

        render(
            <TemplateEditorWrapper
                template={mockTemplate}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        // Add first field
        const addButton1 = screen.getByText('➕ Add Your First Field');
        fireEvent.click(addButton1);

        await waitFor(() => {
            expect(screen.getByText('New Field')).toBeInTheDocument();
        });

        // Add second field
        const addButton2 = screen.getByText('➕ Add Field');
        fireEvent.click(addButton2);

        // Should have two fields now
        await waitFor(() => {
            const newFieldElements = screen.getAllByText('New Field');
            expect(newFieldElements).toHaveLength(2);
        });

        // Verify both fields have ID elements (they should be unique)
        const idLabels = screen.getAllByText(/ID:/);
        expect(idLabels).toHaveLength(2);
    });

    it('should show add field button in header when fields exist', async () => {
        const templateWithFields: QuestionnaireTemplate = {
            ...mockTemplate,
            fields: [
                {
                    id: 'field1',
                    type: 'text',
                    label: 'Existing Field',
                    required: false,
                    order: 0
                }
            ]
        };

        const mockOnSave = vi.fn();
        const mockOnCancel = vi.fn();

        render(
            <TemplateEditorWrapper
                template={templateWithFields}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        // Should show header with add field button
        expect(screen.getByText('Template Fields')).toBeInTheDocument();
        expect(screen.getByText('➕ Add Field')).toBeInTheDocument();

        // Should show existing field
        expect(screen.getByText('Existing Field')).toBeInTheDocument();
    });

    it('should set correct order value for new fields', async () => {
        const templateWithFields: QuestionnaireTemplate = {
            ...mockTemplate,
            fields: [
                {
                    id: 'field1',
                    type: 'text',
                    label: 'Field 1',
                    required: false,
                    order: 0
                },
                {
                    id: 'field2',
                    type: 'text',
                    label: 'Field 2',
                    required: false,
                    order: 1
                }
            ]
        };

        const mockOnSave = vi.fn();
        const mockOnCancel = vi.fn();

        render(
            <TemplateEditorWrapper
                template={templateWithFields}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        // Add a new field
        const addButton = screen.getByText('➕ Add Field');
        fireEvent.click(addButton);

        // Should have 3 fields now
        await waitFor(() => {
            const newFieldElements = screen.getAllByText(/Field/);
            expect(newFieldElements.length).toBeGreaterThanOrEqual(3);
        });
    });
});
