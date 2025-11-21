/**
 * Gate 2: Ready to Order Questionnaire Tests
 * 
 * Tests for the Gate2Questionnaire component including:
 * - Section status calculation
 * - Gate criteria validation
 * - Signature capture flow
 * - Submission handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Gate2Questionnaire from './Gate2Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

// Mock fetch
global.fetch = vi.fn();

const mockConfig: QuestionnaireConfig = {
    id: 'gate-2-ready-to-order',
    version: '1.0.0',
    metadata: {
        name: 'Gate 2: Ready to Order',
        description: 'Validates systems integration and operational process setup',
        gate: 'gate-2',
        estimatedTime: 45,
        requiredRoles: ['TPM', 'PDM', 'PSM'],
        primaryRole: 'TPM',
    },
    gateCriteria: [
        'API integration complete',
        'Monitoring active',
        'Test transactions successful',
    ],
    sections: [
        {
            id: 'phase-2a-systems-integration',
            title: 'Phase 2A: Systems Integration',
            description: 'API integration and monitoring',
            fields: [
                {
                    id: 'api-integration-complete',
                    type: 'radio',
                    label: 'Has API integration been completed?',
                    required: true,
                    options: ['Yes', 'No'],
                },
                {
                    id: 'monitoring-active',
                    type: 'radio',
                    label: 'Is system monitoring active?',
                    required: true,
                    options: ['Yes', 'No'],
                },
            ],
            passFailCriteria: {
                type: 'automatic',
                rules: [
                    {
                        field: 'api-integration-complete',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'API integration must be completed',
                    },
                    {
                        field: 'monitoring-active',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'System monitoring must be active',
                    },
                ],
            },
        },
        {
            id: 'phase-2b-operational-process',
            title: 'Phase 2B: Operational Process Setup',
            description: 'Order management and support processes',
            fields: [
                {
                    id: 'order-management-configured',
                    type: 'radio',
                    label: 'Has order management been configured?',
                    required: true,
                    options: ['Yes', 'No'],
                },
                {
                    id: 'support-processes-established',
                    type: 'radio',
                    label: 'Have support processes been established?',
                    required: true,
                    options: ['Yes', 'No'],
                },
            ],
            passFailCriteria: {
                type: 'automatic',
                rules: [
                    {
                        field: 'order-management-configured',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Order management must be configured',
                    },
                    {
                        field: 'support-processes-established',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Support processes must be established',
                    },
                ],
            },
        },
    ],
    validation: {
        requiredSections: ['phase-2a-systems-integration', 'phase-2b-operational-process'],
        minimumPassingSections: 2,
        allowPartialSubmission: false,
    },
    documentation: [],
};

describe('Gate2Questionnaire', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the questionnaire form', () => {
        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // QuestionnaireForm should be rendered
        expect(screen.getByRole('heading', { name: /Phase 2A: Systems Integration/i })).toBeInTheDocument();
    });

    it('calculates section status correctly when all criteria pass', async () => {
        const user = userEvent.setup();

        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 2A with passing answers
        const apiYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(apiYesRadio);

        const monitoringYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(monitoringYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 2B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2B: Operational Process Setup/i })).toBeInTheDocument();
        });

        const orderYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(orderYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Should show signature capture
        await waitFor(() => {
            expect(screen.getByText(/Review and Sign/i)).toBeInTheDocument();
        });

        // Should show passing status
        expect(screen.getByText(/Both phases completed successfully/i)).toBeInTheDocument();
    });

    it('calculates section status correctly when criteria fail', async () => {
        const user = userEvent.setup();

        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 2A with failing answers
        const apiNoRadio = screen.getAllByRole('radio', { name: /No/i })[0];
        await user.click(apiNoRadio);

        const monitoringNoRadio = screen.getAllByRole('radio', { name: /No/i })[1];
        await user.click(monitoringNoRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 2B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2B: Operational Process Setup/i })).toBeInTheDocument();
        });

        const orderYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(orderYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Should show signature capture
        await waitFor(() => {
            expect(screen.getByText(/Review and Sign/i)).toBeInTheDocument();
        });

        // Should show failing status
        expect(screen.getByText(/Only 1 of 2 phases passed/i)).toBeInTheDocument();
    });

    it('validates Gate 2 criteria correctly', async () => {
        const user = userEvent.setup();

        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 2A with passing answers
        const apiYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(apiYesRadio);

        const monitoringYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(monitoringYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 2B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2B: Operational Process Setup/i })).toBeInTheDocument();
        });

        const orderYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(orderYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Should show Gate 2 assessment
        await waitFor(() => {
            expect(screen.getByText(/Gate 2: Ready to Order Assessment/i)).toBeInTheDocument();
        });

        // Should show gate criteria
        expect(screen.getByText(/API integration complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Monitoring active/i)).toBeInTheDocument();
        expect(screen.getByText(/Test transactions successful/i)).toBeInTheDocument();
    });

    it('shows signature capture after form submission', async () => {
        const user = userEvent.setup();

        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 2A
        const apiYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(apiYesRadio);

        const monitoringYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(monitoringYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 2B
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2B: Operational Process Setup/i })).toBeInTheDocument();
        });

        const orderYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(orderYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Wait for signature capture
        await waitFor(() => {
            expect(screen.getByText(/Digital Signature Required/i)).toBeInTheDocument();
        });

        // Should show signature inputs
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Type Your Full Name/i)).toBeInTheDocument();
    });

    it('allows canceling signature and returning to form', async () => {
        const user = userEvent.setup();

        render(
            <Gate2Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 2A
        const apiYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(apiYesRadio);

        const monitoringYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(monitoringYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 2B
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2B: Operational Process Setup/i })).toBeInTheDocument();
        });

        const orderYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(orderYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Wait for signature capture
        await waitFor(() => {
            expect(screen.getByText(/Digital Signature Required/i)).toBeInTheDocument();
        });

        // Click back button
        const backButton = screen.getByRole('button', { name: /Back to Form/i });
        await user.click(backButton);

        // Should return to form (goes back to first section)
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 2A: Systems Integration/i })).toBeInTheDocument();
        });
    });

    it('renders in view mode correctly', () => {
        const existingData = {
            sections: [
                {
                    sectionId: 'phase-2a-systems-integration',
                    fields: {
                        'api-integration-complete': 'Yes',
                        'monitoring-active': 'Yes',
                    },
                },
                {
                    sectionId: 'phase-2b-operational-process',
                    fields: {
                        'order-management-configured': 'Yes',
                        'support-processes-established': 'Yes',
                    },
                },
            ],
        };

        render(
            <Gate2Questionnaire
                config={mockConfig}
                existingData={existingData}
                partnerId="test-partner"
                mode="view"
            />
        );

        // Should render in view mode - check for heading specifically
        const heading = screen.getByRole('heading', { name: /Phase 2A: Systems Integration/i });
        expect(heading).toBeInTheDocument();
    });
});
