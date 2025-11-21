import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DocumentationHub } from './DocumentationHub';
import type { DocumentationSection } from '@/types';

const mockSections: DocumentationSection[] = [
    {
        id: 'pre-contract',
        title: 'Pre-Contract Engagement',
        description: 'Resources for pre-contract PDM engagement',
        gate: 'pre-contract',
        relevantRoles: ['PAM', 'PDM'],
        links: [
            {
                title: 'Executive Sponsorship Guide',
                url: '/docs/exec-sponsorship',
                type: 'internal',
                description: 'How to validate executive commitment',
            },
            {
                title: 'Commercial Framework',
                url: '/docs/commercial-framework',
                type: 'internal',
                description: 'Evaluating partnership structure',
            },
        ],
    },
    {
        id: 'gate-1-phase-1a',
        title: 'Gate 1: Phase 1A - Onboarding Kickoff',
        description: 'Resources for Phase 1A (Weeks 1-3)',
        gate: 'gate-1',
        phase: '1A',
        relevantRoles: ['PDM', 'PAM', 'TPM'],
        links: [
            {
                title: 'Kickoff Template',
                url: '/docs/kickoff-template',
                type: 'internal',
                description: 'Template for conducting kickoff meetings',
            },
        ],
    },
    {
        id: 'gate-2-phase-2a',
        title: 'Gate 2: Phase 2A - Systems Integration',
        description: 'Resources for Phase 2A (Weeks 13-17)',
        gate: 'gate-2',
        phase: '2A',
        relevantRoles: ['TPM', 'PDM'],
        links: [
            {
                title: 'API Integration Guide',
                url: 'https://external.com/api-guide',
                type: 'external',
                description: 'Step-by-step API integration',
            },
        ],
    },
    {
        id: 'role-pam',
        title: 'PAM Role-Specific Resources',
        description: 'Resources specifically for Partner Account Managers',
        gate: 'all',
        relevantRoles: ['PAM'],
        links: [
            {
                title: 'PAM Playbook',
                url: '/docs/pam-playbook',
                type: 'internal',
                description: 'Complete guide for PAM responsibilities',
            },
        ],
    },
];

describe('DocumentationHub', () => {
    test('renders with title and description', () => {
        render(<DocumentationHub sections={mockSections} />);

        expect(screen.getByText('Documentation Hub')).toBeInTheDocument();
        expect(
            screen.getByText(/Access resources organized by gate, phase, and role/)
        ).toBeInTheDocument();
    });

    test('displays all sections initially collapsed', () => {
        render(<DocumentationHub sections={mockSections} />);

        expect(screen.getByText('Pre-Contract Engagement')).toBeInTheDocument();
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.getByText('PAM Role-Specific Resources')).toBeInTheDocument();

        // Links should not be visible initially
        expect(screen.queryByText('Executive Sponsorship Guide')).not.toBeInTheDocument();
    });

    test('expands section when clicked', () => {
        render(<DocumentationHub sections={mockSections} />);

        const sectionHeader = screen.getByText('Pre-Contract Engagement').closest('button');
        fireEvent.click(sectionHeader!);

        // Links should now be visible
        expect(screen.getByText('Executive Sponsorship Guide')).toBeInTheDocument();
        expect(screen.getByText('Commercial Framework')).toBeInTheDocument();
    });

    test('collapses section when clicked again', () => {
        render(<DocumentationHub sections={mockSections} />);

        const sectionHeader = screen.getByText('Pre-Contract Engagement').closest('button');

        // Expand
        fireEvent.click(sectionHeader!);
        expect(screen.getByText('Executive Sponsorship Guide')).toBeInTheDocument();

        // Collapse
        fireEvent.click(sectionHeader!);
        expect(screen.queryByText('Executive Sponsorship Guide')).not.toBeInTheDocument();
    });

    test('filters sections by search query', () => {
        render(<DocumentationHub sections={mockSections} />);

        const searchInput = screen.getByPlaceholderText(/Search by title, description, or link/);
        fireEvent.change(searchInput, { target: { value: 'API' } });

        // Should show only the section with API in the link
        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.queryByText('Pre-Contract Engagement')).not.toBeInTheDocument();
        expect(screen.queryByText('Gate 1: Phase 1A - Onboarding Kickoff')).not.toBeInTheDocument();
    });

    test('filters sections by gate', () => {
        render(<DocumentationHub sections={mockSections} />);

        const gateFilter = screen.getByLabelText('Filter by Gate');
        fireEvent.change(gateFilter, { target: { value: 'gate-1' } });

        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.queryByText('Pre-Contract Engagement')).not.toBeInTheDocument();
        expect(screen.queryByText('Gate 2: Phase 2A - Systems Integration')).not.toBeInTheDocument();
    });

    test('filters sections by phase', () => {
        render(<DocumentationHub sections={mockSections} />);

        const phaseFilter = screen.getByLabelText('Filter by Phase');
        fireEvent.change(phaseFilter, { target: { value: '2A' } });

        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.queryByText('Gate 1: Phase 1A - Onboarding Kickoff')).not.toBeInTheDocument();
    });

    test('filters sections by role', () => {
        render(<DocumentationHub sections={mockSections} />);

        const roleFilter = screen.getByLabelText('Filter by Role');
        fireEvent.change(roleFilter, { target: { value: 'TPM' } });

        // Should show sections relevant to TPM
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.queryByText('PAM Role-Specific Resources')).not.toBeInTheDocument();
    });

    test('clears all filters when clear button clicked', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Apply filters
        const searchInput = screen.getByPlaceholderText(/Search by title, description, or link/);
        fireEvent.change(searchInput, { target: { value: 'API' } });

        const gateFilter = screen.getByLabelText('Filter by Gate');
        fireEvent.change(gateFilter, { target: { value: 'gate-2' } });

        // Clear filters
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);

        // All sections should be visible again
        expect(screen.getByText('Pre-Contract Engagement')).toBeInTheDocument();
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.getByText('PAM Role-Specific Resources')).toBeInTheDocument();
    });

    test('expands all sections when expand all clicked', () => {
        render(<DocumentationHub sections={mockSections} />);

        const expandAllButton = screen.getByText('Expand All');
        fireEvent.click(expandAllButton);

        // All links should be visible
        expect(screen.getByText('Executive Sponsorship Guide')).toBeInTheDocument();
        expect(screen.getByText('Kickoff Template')).toBeInTheDocument();
        expect(screen.getByText('API Integration Guide')).toBeInTheDocument();
        expect(screen.getByText('PAM Playbook')).toBeInTheDocument();
    });

    test('collapses all sections when collapse all clicked', () => {
        render(<DocumentationHub sections={mockSections} />);

        // First expand all
        const expandAllButton = screen.getByText('Expand All');
        fireEvent.click(expandAllButton);

        // Then collapse all
        const collapseAllButton = screen.getByText('Collapse All');
        fireEvent.click(collapseAllButton);

        // No links should be visible
        expect(screen.queryByText('Executive Sponsorship Guide')).not.toBeInTheDocument();
        expect(screen.queryByText('Kickoff Template')).not.toBeInTheDocument();
        expect(screen.queryByText('API Integration Guide')).not.toBeInTheDocument();
        expect(screen.queryByText('PAM Playbook')).not.toBeInTheDocument();
    });

    test('displays results count', () => {
        render(<DocumentationHub sections={mockSections} />);

        expect(screen.getByText('Showing 4 of 4 documentation sections')).toBeInTheDocument();

        // Apply filter
        const gateFilter = screen.getByLabelText('Filter by Gate');
        fireEvent.change(gateFilter, { target: { value: 'gate-1' } });

        expect(screen.getByText('Showing 1 of 4 documentation sections')).toBeInTheDocument();
    });

    test('shows no results message when no sections match filters', () => {
        render(<DocumentationHub sections={mockSections} />);

        const searchInput = screen.getByPlaceholderText(/Search by title, description, or link/);
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

        expect(screen.getByText('No documentation found matching your filters.')).toBeInTheDocument();
    });

    test('displays gate badges correctly', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Check for badges (not dropdown options) by looking for the badge class
        const badges = screen.getAllByText(/Pre-Contract|Gate 1 - Phase 1A|Gate 2 - Phase 2A|All Gates/);
        expect(badges.length).toBeGreaterThan(0);

        // Verify specific badges exist
        expect(screen.getByText('Gate 1 - Phase 1A')).toBeInTheDocument();
        expect(screen.getByText('Gate 2 - Phase 2A')).toBeInTheDocument();
    });

    test('displays relevant roles for each section', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Check that role badges are displayed
        const preContractSection = screen.getByText('Pre-Contract Engagement').closest('button');
        const rolesContainer = within(preContractSection!).getByText('Relevant for:').parentElement;

        expect(within(rolesContainer!).getByText('PAM')).toBeInTheDocument();
        expect(within(rolesContainer!).getByText('PDM')).toBeInTheDocument();
    });

    test('renders internal links correctly', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Expand section
        const sectionHeader = screen.getByText('Pre-Contract Engagement').closest('button');
        fireEvent.click(sectionHeader!);

        const link = screen.getByText('Executive Sponsorship Guide').closest('a');
        expect(link).toHaveAttribute('href', '/docs/exec-sponsorship');
        expect(link).not.toHaveAttribute('target');
    });

    test('renders external links with correct attributes', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Expand section
        const sectionHeader = screen.getByText('Gate 2: Phase 2A - Systems Integration').closest('button');
        fireEvent.click(sectionHeader!);

        const link = screen.getByText('API Integration Guide').closest('a');
        expect(link).toHaveAttribute('href', 'https://external.com/api-guide');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('contextual mode filters by current gate', () => {
        render(
            <DocumentationHub
                sections={mockSections}
                contextual={true}
                currentGate="gate-1"
            />
        );

        // Should show gate-1 and 'all' sections
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('PAM Role-Specific Resources')).toBeInTheDocument();

        // Should not show other gates
        expect(screen.queryByText('Pre-Contract Engagement')).not.toBeInTheDocument();
        expect(screen.queryByText('Gate 2: Phase 2A - Systems Integration')).not.toBeInTheDocument();
    });

    test('contextual mode filters by user role', () => {
        render(
            <DocumentationHub
                sections={mockSections}
                contextual={true}
                userRole="PAM"
            />
        );

        // Should show sections relevant to PAM
        expect(screen.getByText('Pre-Contract Engagement')).toBeInTheDocument();
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('PAM Role-Specific Resources')).toBeInTheDocument();

        // Should not show TPM-only section
        expect(screen.queryByText('Gate 2: Phase 2A - Systems Integration')).not.toBeInTheDocument();
    });

    test('combines search with other filters', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Apply search
        const searchInput = screen.getByPlaceholderText(/Search by title, description, or link/);
        fireEvent.change(searchInput, { target: { value: 'Phase' } });

        // Apply role filter
        const roleFilter = screen.getByLabelText('Filter by Role');
        fireEvent.change(roleFilter, { target: { value: 'TPM' } });

        // Should show only sections matching both filters
        expect(screen.getByText('Gate 1: Phase 1A - Onboarding Kickoff')).toBeInTheDocument();
        expect(screen.getByText('Gate 2: Phase 2A - Systems Integration')).toBeInTheDocument();
        expect(screen.queryByText('Pre-Contract Engagement')).not.toBeInTheDocument();
        expect(screen.queryByText('PAM Role-Specific Resources')).not.toBeInTheDocument();
    });

    test('displays link descriptions when available', () => {
        render(<DocumentationHub sections={mockSections} />);

        // Expand section
        const sectionHeader = screen.getByText('Pre-Contract Engagement').closest('button');
        fireEvent.click(sectionHeader!);

        expect(screen.getByText('How to validate executive commitment')).toBeInTheDocument();
        expect(screen.getByText('Evaluating partnership structure')).toBeInTheDocument();
    });
});
