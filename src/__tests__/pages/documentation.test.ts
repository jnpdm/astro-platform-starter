import { describe, it, expect } from 'vitest';
import documentationConfig from '../../config/documentation.json';
import gatesConfig from '../../config/gates.json';

describe('Documentation Page Configuration', () => {
    it('should have documentation sections defined', () => {
        expect(documentationConfig.sections).toBeDefined();
        expect(documentationConfig.sections.length).toBeGreaterThan(0);
    });

    it('should have sections for all gates', () => {
        const gates = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

        gates.forEach((gateId) => {
            const gateSections = documentationConfig.sections.filter(
                (section) => section.gate === gateId
            );
            expect(gateSections.length).toBeGreaterThan(0);
        });
    });

    it('should have phase-specific sections for Gate 1', () => {
        const gate1Sections = documentationConfig.sections.filter(
            (section) => section.gate === 'gate-1'
        );

        const phases = gate1Sections.map((s) => s.phase).filter(Boolean);
        expect(phases).toContain('1A');
        expect(phases).toContain('1B');
        expect(phases).toContain('1C');
    });

    it('should have phase-specific sections for Gate 2', () => {
        const gate2Sections = documentationConfig.sections.filter(
            (section) => section.gate === 'gate-2'
        );

        const phases = gate2Sections.map((s) => s.phase).filter(Boolean);
        expect(phases).toContain('2A');
        expect(phases).toContain('2B');
    });

    it('should have phase-specific sections for Gate 3', () => {
        const gate3Sections = documentationConfig.sections.filter(
            (section) => section.gate === 'gate-3'
        );

        const phases = gate3Sections.map((s) => s.phase).filter(Boolean);
        expect(phases).toContain('3A');
        expect(phases).toContain('3B');
    });

    it('should have role-specific sections', () => {
        const roleSpecificSections = documentationConfig.sections.filter(
            (section) => section.gate === 'all'
        );

        expect(roleSpecificSections.length).toBeGreaterThan(0);

        // Check for role-specific sections
        const roles = ['PAM', 'PDM', 'TPM', 'PSM', 'TAM'];
        roles.forEach((role) => {
            const hasRoleSection = roleSpecificSections.some((section) =>
                section.relevantRoles.includes(role)
            );
            expect(hasRoleSection).toBe(true);
        });
    });

    it('should have all required fields in documentation sections', () => {
        documentationConfig.sections.forEach((section) => {
            expect(section.id).toBeDefined();
            expect(section.title).toBeDefined();
            expect(section.description).toBeDefined();
            expect(section.gate).toBeDefined();
            expect(section.relevantRoles).toBeDefined();
            expect(Array.isArray(section.relevantRoles)).toBe(true);
            expect(section.links).toBeDefined();
            expect(Array.isArray(section.links)).toBe(true);
        });
    });

    it('should have valid links in documentation sections', () => {
        documentationConfig.sections.forEach((section) => {
            section.links.forEach((link) => {
                expect(link.title).toBeDefined();
                expect(link.url).toBeDefined();
                expect(link.type).toBeDefined();
                expect(['internal', 'external']).toContain(link.type);
            });
        });
    });

    it('should have gate criteria defined for all gates', () => {
        const gates = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3'];

        gates.forEach((gateId) => {
            const gateInfo = gatesConfig.gates.find((g) => g.id === gateId);
            expect(gateInfo).toBeDefined();
            expect(gateInfo?.criteria).toBeDefined();
            expect(Array.isArray(gateInfo?.criteria)).toBe(true);
            expect(gateInfo?.criteria.length).toBeGreaterThan(0);
        });
    });

    it('should have estimated weeks for all gates', () => {
        gatesConfig.gates.forEach((gate) => {
            expect(gate.estimatedWeeks).toBeDefined();
            expect(typeof gate.estimatedWeeks).toBe('string');
        });
    });

    it('should have phases defined for Gate 1, 2, and 3', () => {
        const gate1 = gatesConfig.gates.find((g) => g.id === 'gate-1');
        expect(gate1?.phases).toEqual(['1A', '1B', '1C']);

        const gate2 = gatesConfig.gates.find((g) => g.id === 'gate-2');
        expect(gate2?.phases).toEqual(['2A', '2B']);

        const gate3 = gatesConfig.gates.find((g) => g.id === 'gate-3');
        expect(gate3?.phases).toEqual(['3A', '3B']);
    });

    it('should organize sections by gate correctly', () => {
        const sectionsByGate = documentationConfig.sections.reduce(
            (acc, section) => {
                const gate = section.gate;
                if (!acc[gate]) {
                    acc[gate] = [];
                }
                acc[gate].push(section);
                return acc;
            },
            {} as Record<string, typeof documentationConfig.sections>
        );

        // Verify each gate has sections
        expect(sectionsByGate['pre-contract']).toBeDefined();
        expect(sectionsByGate['gate-0']).toBeDefined();
        expect(sectionsByGate['gate-1']).toBeDefined();
        expect(sectionsByGate['gate-2']).toBeDefined();
        expect(sectionsByGate['gate-3']).toBeDefined();
        expect(sectionsByGate['post-launch']).toBeDefined();
        expect(sectionsByGate['all']).toBeDefined();
    });

    it('should have contextual help for each gate criteria', () => {
        const gates = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3'];

        gates.forEach((gateId) => {
            const gateInfo = gatesConfig.gates.find((g) => g.id === gateId);
            expect(gateInfo).toBeDefined();

            // Each gate should have criteria
            expect(gateInfo?.criteria).toBeDefined();
            expect(gateInfo?.criteria.length).toBeGreaterThan(0);

            // Each gate should have documentation sections
            const gateSections = documentationConfig.sections.filter(
                (section) => section.gate === gateId
            );
            expect(gateSections.length).toBeGreaterThan(0);
        });
    });
});
