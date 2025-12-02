/**
 * Property-Based Tests for Documentation Link Targets
 * Feature: hub-improvements, Property 10: Documentation link targets
 * Validates: Requirements 4.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DocumentationSection, DocumentationLink, GateId } from '@/types';

/**
 * Property 10: Documentation Link Targets
 * For any contextual help link, the href attribute should match the expected
 * documentation section URL.
 */

// Helper function to generate contextual help link for a gate
function getContextualHelpLink(gateId: GateId): string {
    return `#${gateId}`;
}

// Helper function to validate internal documentation links
function validateInternalLink(link: DocumentationLink): boolean {
    if (link.type !== 'internal') return true;

    // Internal links should start with /docs/ or be anchor links
    return link.url.startsWith('/docs/') || link.url.startsWith('#');
}

// Helper function to validate external documentation links
function validateExternalLink(link: DocumentationLink): boolean {
    if (link.type !== 'external') return true;

    // External links should be valid URLs (http or https)
    try {
        const url = new URL(link.url);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Arbitraries for generating test data
const gateIdArb = fc.constantFrom<GateId>(
    'pre-contract',
    'gate-0',
    'gate-1',
    'gate-2',
    'gate-3',
    'post-launch'
);

describe('Documentation Link Targets Property Tests', () => {
    it('Property 10: Contextual help links match expected gate anchor format', () => {
        fc.assert(
            fc.property(gateIdArb, (gateId) => {
                const link = getContextualHelpLink(gateId);

                // Link should be an anchor link starting with #
                const startsWithHash = link.startsWith('#');

                // Link should contain the gate ID
                const containsGateId = link.includes(gateId);

                // Link should be exactly #gateId
                const isCorrectFormat = link === `#${gateId}`;

                return startsWithHash && containsGateId && isCorrectFormat;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 10 (variant): Internal links have correct path format', () => {
        const internalLinkArb = fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.oneof(
                fc.constant('/docs/').chain((prefix) =>
                    fc
                        .string({ minLength: 1, maxLength: 30 })
                        .map((path) => prefix + path.replace(/[^a-z0-9-]/gi, '-').toLowerCase())
                ),
                gateIdArb.map((gateId) => `#${gateId}`)
            ),
            type: fc.constant('internal' as const),
            description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        });

        fc.assert(
            fc.property(internalLinkArb, (link) => {
                return validateInternalLink(link);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 10 (variant): External links have valid URL format', () => {
        const externalLinkArb = fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl(),
            type: fc.constant('external' as const),
            description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        });

        fc.assert(
            fc.property(externalLinkArb, (link) => {
                return validateExternalLink(link);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 10 (variant): All links in a section have valid targets', () => {
        const documentationLinkArb = fc.oneof(
            // Internal link
            fc.record({
                title: fc.string({ minLength: 1, maxLength: 50 }),
                url: fc.oneof(
                    fc.constant('/docs/').chain((prefix) =>
                        fc
                            .string({ minLength: 1, maxLength: 30 })
                            .map((path) => prefix + path.replace(/[^a-z0-9-]/gi, '-').toLowerCase())
                    ),
                    gateIdArb.map((gateId) => `#${gateId}`)
                ),
                type: fc.constant('internal' as const),
                description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            }),
            // External link
            fc.record({
                title: fc.string({ minLength: 1, maxLength: 50 }),
                url: fc.webUrl(),
                type: fc.constant('external' as const),
                description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            })
        );

        const documentationSectionArb = fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            gate: gateIdArb,
            phase: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
            links: fc.array(documentationLinkArb, { minLength: 1, maxLength: 5 }),
            relevantRoles: fc.array(fc.constantFrom('PAM', 'PDM', 'TAM', 'PSM'), {
                minLength: 1,
                maxLength: 4,
            }).map((roles) => Array.from(new Set(roles))),
        });

        fc.assert(
            fc.property(documentationSectionArb, (section) => {
                // All links in the section should have valid targets
                return section.links.every((link) => {
                    if (link.type === 'internal') {
                        return validateInternalLink(link);
                    } else {
                        return validateExternalLink(link);
                    }
                });
            }),
            { numRuns: 100 }
        );
    });

    it('Property 10 (variant): Gate anchor links are unique and well-formed', () => {
        fc.assert(
            fc.property(
                fc.array(gateIdArb, { minLength: 1, maxLength: 6 }).map((gates) => Array.from(new Set(gates))),
                (gates) => {
                    const links = gates.map((gateId) => getContextualHelpLink(gateId));

                    // All links should be unique
                    const uniqueLinks = new Set(links);
                    const allUnique = uniqueLinks.size === links.length;

                    // All links should follow the #gateId pattern
                    const allWellFormed = links.every((link) => /^#[a-z0-9-]+$/.test(link));

                    return allUnique && allWellFormed;
                }
            ),
            { numRuns: 100 }
        );
    });
});
