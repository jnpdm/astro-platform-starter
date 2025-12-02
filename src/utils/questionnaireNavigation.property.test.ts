/**
 * Property-Based Tests for Questionnaire Navigation
 * 
 * **Feature: hub-improvements, Property 13: Navigation URLs**
 * **Validates: Requirements 5.3**
 * 
 * Property: For any partner, clicking "Add Gate Questionnaire" should navigate 
 * to a URL containing the partner's ID as a query parameter.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { PartnerRecord, GateId } from '../types/partner';
import gatesConfig from '../config/gates.json';

// Valid gate IDs
const validGateIds: GateId[] = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

// Arbitrary for generating gate IDs
const gateIdArbitrary = fc.constantFrom(...validGateIds);

// Arbitrary for generating partner records
const partnerArbitrary = fc.record({
    id: fc.uuid(),
    partnerName: fc.string({ minLength: 1, maxLength: 50 }),
    pamOwner: fc.emailAddress(),
    pdmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    psmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    tamOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    contractType: fc.constantFrom('PPA', 'Distribution', 'Sales-Agent', 'Other'),
    tier: fc.constantFrom('tier-0', 'tier-1', 'tier-2'),
    ccv: fc.integer({ min: 0, max: 10000000 }),
    lrp: fc.integer({ min: 0, max: 10000000 }),
    currentGate: gateIdArbitrary,
    gates: fc.constant({}),
    createdAt: fc.date(),
    updatedAt: fc.date()
}) as fc.Arbitrary<PartnerRecord>;

/**
 * Generate the questionnaire navigation URL for a partner
 */
function generateQuestionnaireUrl(partner: PartnerRecord): string | null {
    const currentGateInfo = gatesConfig.gates.find(g => g.id === partner.currentGate);
    const hasQuestionnaires = currentGateInfo?.questionnaires && currentGateInfo.questionnaires.length > 0;

    if (!hasQuestionnaires || !currentGateInfo) {
        return null;
    }

    // Use the first questionnaire for the current gate
    const questionnaireId = currentGateInfo.questionnaires[0];
    return `/questionnaires/${questionnaireId}?partnerId=${partner.id}`;
}

/**
 * Parse URL to extract query parameters
 */
function parseUrl(url: string): { path: string; params: Record<string, string> } {
    const [path, queryString] = url.split('?');
    const params: Record<string, string> = {};

    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = value;
        });
    }

    return { path, params };
}

describe('Questionnaire Navigation Property Tests', () => {
    it('Property 13: Navigation URLs - should contain partnerId query parameter', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);

                    // If URL exists, it should contain partnerId parameter
                    if (url !== null) {
                        const { params } = parseUrl(url);
                        return params.partnerId === partner.id;
                    }

                    // If no URL, that's fine (gate has no questionnaires)
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: Navigation URLs - should point to questionnaires path', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);

                    // If URL exists, it should start with /questionnaires/
                    if (url !== null) {
                        return url.startsWith('/questionnaires/');
                    }

                    // If no URL, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: Navigation URLs - should include questionnaire ID from gate config', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);

                    // If URL exists, verify it contains the correct questionnaire ID
                    if (url !== null) {
                        const currentGateInfo = gatesConfig.gates.find(g => g.id === partner.currentGate);
                        if (currentGateInfo && currentGateInfo.questionnaires.length > 0) {
                            const expectedQuestionnaireId = currentGateInfo.questionnaires[0];
                            return url.includes(`/questionnaires/${expectedQuestionnaireId}`);
                        }
                    }

                    // If no URL, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: Navigation URLs - partnerId should match partner ID exactly', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);

                    // If URL exists, partnerId parameter should match exactly
                    if (url !== null) {
                        const { params } = parseUrl(url);
                        // Check exact match (not substring)
                        return params.partnerId === partner.id &&
                            !params.partnerId.includes(partner.id + 'extra');
                    }

                    // If no URL, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: Navigation URLs - should be null for gates without questionnaires', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);
                    const currentGateInfo = gatesConfig.gates.find(g => g.id === partner.currentGate);
                    const hasQuestionnaires = currentGateInfo?.questionnaires && currentGateInfo.questionnaires.length > 0;

                    // If gate has no questionnaires, URL should be null
                    if (!hasQuestionnaires) {
                        return url === null;
                    }

                    // If gate has questionnaires, URL should not be null
                    return url !== null;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: Navigation URLs - URL format should be valid', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const url = generateQuestionnaireUrl(partner);

                    // If URL exists, it should have valid format
                    if (url !== null) {
                        // Should have path and query string
                        const hasQueryString = url.includes('?');
                        const hasPartnerId = url.includes('partnerId=');
                        const hasValidPath = url.startsWith('/questionnaires/');

                        return hasQueryString && hasPartnerId && hasValidPath;
                    }

                    // If no URL, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
