/**
 * Gate 3: Ready to Deliver Questionnaire Tests
 * 
 * Tests for the Gate3Questionnaire component including:
 * - Section status calculation
 * - Gate criteria validation
 * - Signature capture flow
 * - Submission handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import Gate3Questionnaire from './Gate3Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

// Mock fetch
global.fetch = vi.fn();

const mockConfig: QuestionnaireConfig = {
    id: 'gate-3-ready-to-deliver',
    version: '1.0.0',
    metadata: {
        name: 'Gate 3: Ready to Deliver',
        description: 'Validates operational readiness and launch validation',
        gate: 'gate-3',
        estimatedTime: 40,
        requiredRoles: ['PSM', 'TAM', 'TPM'],
        primaryRole: 'PSM',
    },
    gateCriteria: [
        'Beta testing successful',
        'Support transition complete',
        'Operational metrics validated',
    ],
    sections: [
        {
            id: 'phase-3a-operational-readiness',
            title: 'Phase 3A: Operational Readiness',
            description: 'Beta testing and support transition',
            fields: [
                {
                    id: 'beta-testing-complete',
                    type: 'radio',
                    label: 'Has beta testing been completed successfully?',
                    required: true,
                    options: ['Yes', 'No'],
                },
                {
                    id: 'support-transition-complete',
                    type: 'radio',
                    label: 'Has support transition been completed?',
                    required: true,
                    options: ['Yes', 'No'],
                },
            ],
            passFailCriteria: {
                type: 'automatic',
                rules: [
                    {
                        field: 'beta-testing-complete',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Beta testing must be completed successfully',
                    },
                    {
                        field: 'support-transition-complete',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Support transition must be completed',
                    },
                ],
            },
        },
        {
            id: 'phase-3b-launch-validation',
            title: 'Phase 3B: Launch Validation',
            description: 'Final launch readiness validation',
            fields: [
                {
                    id: 'launch-readiness-review-complete',
                    type: 'radio',
                    label: 'Has the launch readiness review been completed?',
                    required: true,
                    options: ['Yes', 'No'],
                },
                {
                    id: 'go-live-approval-obtained',
                    type: 'radio',
                    label: 'Has final go-live approval been obtained?',
                    required: true,
                    options: ['Yes', 'No'],
                },
            ],
            passFailCriteria: {
                type: 'automatic',
                rules: [
                    {
                        field: 'launch-readiness-review-complete',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Launch readiness review must be completed',
                    },
                    {
                        field: 'go-live-approval-obtained',
                        operator: 'equals',
                        value: 'Yes',
                        failureMessage: 'Final go-live approval must be obtained',
                    },
                ],
            },
        },
    ],
    validation: {
        requiredSections: ['phase-3a-operational-readiness', 'phase-3b-launch-validation'],
        minimumPassingSections: 2,
        allowPartialSubmission: false,
    },
    documentation: [],
};

describe('Gate3Questionnaire', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the questionnaire form', () => {
        render(
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // QuestionnaireForm should be rendered
        expect(screen.getByRole('heading', { name: /Phase 3A: Operational Readiness/i })).toBeInTheDocument();
    });

    it('calculates section status correctly when all criteria pass', async () => {
        const user = userEvent.setup();

        render(
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 3A with passing answers
        const betaYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(betaYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 3B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 3B: Launch Validation/i })).toBeInTheDocument();
        });

        const launchYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(launchYesRadio);

        const approvalYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(approvalYesRadio);

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
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 3A with failing answers
        const betaNoRadio = screen.getAllByRole('radio', { name: /No/i })[0];
        await user.click(betaNoRadio);

        const supportNoRadio = screen.getAllByRole('radio', { name: /No/i })[1];
        await user.click(supportNoRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 3B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 3B: Launch Validation/i })).toBeInTheDocument();
        });

        const launchYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(launchYesRadio);

        const approvalYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(approvalYesRadio);

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

    it('validates Gate 3 criteria correctly', async () => {
        const user = userEvent.setup();

        render(
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 3A with passing answers
        const betaYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(betaYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 3B with passing answers
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 3B: Launch Validation/i })).toBeInTheDocument();
        });

        const launchYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(launchYesRadio);

        const approvalYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(approvalYesRadio);

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Submit Questionnaire/i });
        await user.click(submitButton);

        // Should show Gate 3 assessment
        await waitFor(() => {
            expect(screen.getByText(/Gate 3: Ready to Deliver Assessment/i)).toBeInTheDocument();
        });

        // Should show gate criteria
        expect(screen.getByText(/Beta testing successful/i)).toBeInTheDocument();
        expect(screen.getByText(/Support transition complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Operational metrics validated/i)).toBeInTheDocument();
    });

    it('shows signature capture after form submission', async () => {
        const user = userEvent.setup();

        render(
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 3A
        const betaYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(betaYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 3B
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 3B: Launch Validation/i })).toBeInTheDocument();
        });

        const launchYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(launchYesRadio);

        const approvalYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(approvalYesRadio);

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
            <Gate3Questionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Fill out Phase 3A
        const betaYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(betaYesRadio);

        const supportYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(supportYesRadio);

        // Navigate to next section
        const nextButton = screen.getByRole('button', { name: /Next/i });
        await user.click(nextButton);

        // Fill out Phase 3B
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Phase 3B: Launch Validation/i })).toBeInTheDocument();
        });

        const launchYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[0];
        await user.click(launchYesRadio);

        const approvalYesRadio = screen.getAllByRole('radio', { name: /Yes/i })[1];
        await user.click(approvalYesRadio);

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
            expect(screen.getByRole('heading', { name: /Phase 3A: Operational Readiness/i })).toBeInTheDocument();
        });
    });

    it('renders in view mode correctly', () => {
        const existingData = {
            sections: [
                {
                    sectionId: 'phase-3a-operational-readiness',
                    fields: {
                        'beta-testing-complete': 'Yes',
                        'support-transition-complete': 'Yes',
                    },
                },
                {
                    sectionId: 'phase-3b-launch-validation',
                    fields: {
                        'launch-readiness-review-complete': 'Yes',
                        'go-live-approval-obtained': 'Yes',
                    },
                },
            ],
        };

        render(
            <Gate3Questionnaire
                config={mockConfig}
                existingData={existingData}
                partnerId="test-partner"
                mode="view"
            />
        );

        // Should render in view mode - check for heading specifically
        const heading = screen.getByRole('heading', { name: /Phase 3A: Operational Readiness/i });
        expect(heading).toBeInTheDocument();
    });
});
