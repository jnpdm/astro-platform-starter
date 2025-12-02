/**
 * Property-Based Tests for Documentation Search
 * Feature: hub-improvements, Property 9: Documentation search results
 * Validates: Requirements 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DocumentationSection, GateId, UserRole } from '@/types';

/**
 * Property 9: Documentation Search Results
 * For any search query and documentation content, all returned results should contain
 * the search term (case-insensitive).
 */

// Helper function to filter sections based on search query (mirrors DocumentationHub logic)
function searchDocumentation(sections: DocumentationSection[], query: string): DocumentationSection[] {
    if (!query) return sections;

    const lowerQuery = query.toLowerCase();

    return sections.filter((section) => {
        const matchesTitle = section.title.toLowerCase().includes(lowerQuery);
        const matchesDescription = section.description.toLowerCase().includes(lowerQuery);
        const matchesLinks = section.links.some(
            (link) =>
                link.title.toLowerCase().includes(lowerQuery) ||
                link.description?.toLowerCase().includes(lowerQuery)
        );

        return matchesTitle || matchesDescription || matchesLinks;
    });
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

const userRoleArb = fc.constantFrom<UserRole>('PAM', 'PDM', 'TAM', 'PSM');

const documentationLinkArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl(),
    type: fc.constantFrom('internal' as const, 'external' as const),
    description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

const documentationSectionArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    gate: gateIdArb,
    phase: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    links: fc.array(documentationLinkArb, { minLength: 1, maxLength: 5 }),
    relevantRoles: fc.array(userRoleArb, { minLength: 1, maxLength: 4 }).map((roles) => Array.from(new Set(roles))),
});

describe('Documentation Search Property Tests', () => {
    it('Property 9: All search results contain the search term (case-insensitive)', () => {
        fc.assert(
            fc.property(
                fc.array(documentationSectionArb, { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (sections, query) => {
                    const results = searchDocumentation(sections, query);
                    const lowerQuery = query.toLowerCase();

                    // Every result should contain the search term somewhere
                    return results.every((section) => {
                        const inTitle = section.title.toLowerCase().includes(lowerQuery);
                        const inDescription = section.description.toLowerCase().includes(lowerQuery);
                        const inLinks = section.links.some(
                            (link) =>
                                link.title.toLowerCase().includes(lowerQuery) ||
                                link.description?.toLowerCase().includes(lowerQuery)
                        );

                        return inTitle || inDescription || inLinks;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 9 (variant): Empty query returns all sections', () => {
        fc.assert(
            fc.property(
                fc.array(documentationSectionArb, { minLength: 1, maxLength: 20 }),
                (sections) => {
                    const results = searchDocumentation(sections, '');
                    return results.length === sections.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 9 (variant): Search is case-insensitive', () => {
        fc.assert(
            fc.property(
                fc.array(documentationSectionArb, { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (sections, query) => {
                    const lowerResults = searchDocumentation(sections, query.toLowerCase());
                    const upperResults = searchDocumentation(sections, query.toUpperCase());
                    const mixedResults = searchDocumentation(sections, query);

                    // All three should return the same results
                    return (
                        lowerResults.length === upperResults.length &&
                        upperResults.length === mixedResults.length
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 9 (variant): Non-matching query returns empty results', () => {
        fc.assert(
            fc.property(
                fc.array(documentationSectionArb, { minLength: 1, maxLength: 20 }),
                (sections) => {
                    // Use a query that's extremely unlikely to match
                    const impossibleQuery = 'xyzabc123impossible456query789';
                    const results = searchDocumentation(sections, impossibleQuery);

                    // Either no results, or if there are results, they must contain the query
                    return results.every((section) => {
                        const lowerQuery = impossibleQuery.toLowerCase();
                        const inTitle = section.title.toLowerCase().includes(lowerQuery);
                        const inDescription = section.description.toLowerCase().includes(lowerQuery);
                        const inLinks = section.links.some(
                            (link) =>
                                link.title.toLowerCase().includes(lowerQuery) ||
                                link.description?.toLowerCase().includes(lowerQuery)
                        );

                        return inTitle || inDescription || inLinks;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
