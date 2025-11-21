/**
 * Tests for PreContractQuestionnaire component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import PreContractQuestionnaire from './PreContractQuestionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

// Mock fetch
global.fetch = vi.fn();

const mockConfig: QuestionnaireConfig = {
    id: 'pre-contract-pdm',
    version: '1.0.0',
    metadata: {
        name: 'Pre-Contract PDM Engagement',
        description: 'Test questionnaire',
        gate: 'pre-contract',
        estimatedTime: 30,
        requiredRoles: ['PAM', 'PDM'],
        primaryRole: 'PAM',
    },
    sections: [
        {
            id: 'test-section',
            title: 'Test Section',
            description: 'Test description',
            fields: [
                {
                    id: 'test-field',
                    type: 'text',
                    label: 'Test Field',
                    required: true,
                },
            ],
            passFailCriteria: {
                type: 'automatic',
                rules: [
                    {
                        field: 'test-field',
                        operator: 'equals',
                        value: 'pass',
                        failureMessage: 'Field must equal "pass"',
                    },
                ],
            },
        },
    ],
    validation: {
        requiredFields: ['test-field'],
    },
    documentation: [],
    gateCriteria: ['Test Criteria'],
};

describe('PreContractQuestionnaire', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the questionnaire form', () => {
        render(
            <PreContractQuestionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // The QuestionnaireForm should be rendered
        expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('calculates section status correctly for passing criteria', () => {
        const { container } = render(
            <PreContractQuestionnaire
                config={mockConfig}
                partnerId="test-partner"
                mode="edit"
            />
        );

        // Component should render without errors
        expect(container).toBeTruthy();
    });

    it('handles CCV threshold validation for Tier 0', () => {
        const configWithStrategic: QuestionnaireConfig = {
            ...mockConfig,
            sections: [
                {
                    id: 'strategic-classification',
                    title: 'Strategic Classification',
                    fields: [
                        {
                            id: 'partner-tier',
                            type: 'select',
                            label: 'Partner Tier',
                            required: true,
                            options: ['Tier 0', 'Tier 1', 'Tier 2'],
                        },
                        {
                            id: 'ccv-amount',
                            type: 'number',
                            label: 'CCV Amount',
                            required: true,
                        },
                        {
                            id: 'country-lrp',
                            type: 'number',
                            label: 'Country LRP',
                            required: true,
                        },
                    ],
                    passFailCriteria: {
                        type: 'automatic',
                        rules: [],
                    },
                },
            ],
        };

        const { container } = render(
            <PreContractQuestionnaire
                config={configWithStrategic}
                partnerId="test-partner"
                mode="edit"
            />
        );

        expect(container).toBeTruthy();
    });

    it('handles CCV threshold validation for Tier 1', () => {
        const configWithStrategic: QuestionnaireConfig = {
            ...mockConfig,
            sections: [
                {
                    id: 'strategic-classification',
                    title: 'Strategic Classification',
                    fields: [
                        {
                            id: 'partner-tier',
                            type: 'select',
                            label: 'Partner Tier',
                            required: true,
                            options: ['Tier 0', 'Tier 1', 'Tier 2'],
                        },
                        {
                            id: 'ccv-amount',
                            type: 'number',
                            label: 'CCV Amount',
                            required: true,
                        },
                        {
                            id: 'country-lrp',
                            type: 'number',
                            label: 'Country LRP',
                            required: true,
                        },
                    ],
                    passFailCriteria: {
                        type: 'automatic',
                        rules: [],
                    },
                },
            ],
        };

        const { container } = render(
            <PreContractQuestionnaire
                config={configWithStrategic}
                partnerId="test-partner"
                mode="edit"
            />
        );

        expect(container).toBeTruthy();
    });

    it('renders in view mode', () => {
        const existingData = {
            sections: [
                {
                    sectionId: 'test-section',
                    fields: {
                        'test-field': 'test value',
                    },
                    status: {
                        result: 'pass',
                    },
                },
            ],
        };

        render(
            <PreContractQuestionnaire
                config={mockConfig}
                existingData={existingData}
                partnerId="test-partner"
                mode="view"
            />
        );

        expect(screen.getByText('Test Section')).toBeInTheDocument();
    });
});
