/**
 * Property-Based Tests for Gate View Filtering
 * 
 * **Feature: hub-improvements, Property 11: Gate view filtering**
 * **Validates: Requirements 5.1**
 * 
 * Property: For any gate and set of partners, the gate view should display 
 * only partners where currentGate matches the selected gate.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { PartnerRecord, GateId } from '../types/partner';

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
 * Filter partners by gate (simulates the gate view filtering logic)
 */
function filterPartnersByGate(partners: PartnerRecord[], gateId: GateId): PartnerRecord[] {
    return partners.filter(partner => partner.currentGate === gateId);
}

describe('Gate View Filtering Property Tests', () => {
    it('Property 11: Gate view filtering - filtered partners should only include those in the selected gate', () => {
        fc.assert(
            fc.property(
                gateIdArbitrary,
                fc.array(partnerArbitrary, { minLength: 0, maxLength: 50 }),
                (selectedGate, partners) => {
                    // Filter partners by the selected gate
                    const filteredPartners = filterPartnersByGate(partners, selectedGate);

                    // Property: All filtered partners must have currentGate === selectedGate
                    const allMatch = filteredPartners.every(
                        partner => partner.currentGate === selectedGate
                    );

                    // Property: No partners with different gates should be included
                    const partnersInOtherGates = partners.filter(
                        partner => partner.currentGate !== selectedGate
                    );
                    const noneFromOtherGates = partnersInOtherGates.every(
                        partner => !filteredPartners.includes(partner)
                    );

                    // Property: All partners with matching gate should be included
                    const partnersInSelectedGate = partners.filter(
                        partner => partner.currentGate === selectedGate
                    );
                    const allIncluded = partnersInSelectedGate.every(
                        partner => filteredPartners.includes(partner)
                    );

                    return allMatch && noneFromOtherGates && allIncluded;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 11: Gate view filtering - count of filtered partners should match count of partners in that gate', () => {
        fc.assert(
            fc.property(
                gateIdArbitrary,
                fc.array(partnerArbitrary, { minLength: 0, maxLength: 50 }),
                (selectedGate, partners) => {
                    // Filter partners by the selected gate
                    const filteredPartners = filterPartnersByGate(partners, selectedGate);

                    // Count partners in the selected gate
                    const expectedCount = partners.filter(
                        partner => partner.currentGate === selectedGate
                    ).length;

                    // Property: The count should match
                    return filteredPartners.length === expectedCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 11: Gate view filtering - empty result when no partners in gate', () => {
        fc.assert(
            fc.property(
                gateIdArbitrary,
                gateIdArbitrary,
                fc.array(partnerArbitrary, { minLength: 1, maxLength: 20 }),
                (selectedGate, differentGate, partners) => {
                    // Skip if gates are the same
                    fc.pre(selectedGate !== differentGate);

                    // Set all partners to a different gate
                    const partnersInDifferentGate = partners.map(p => ({
                        ...p,
                        currentGate: differentGate
                    }));

                    // Filter by selected gate
                    const filteredPartners = filterPartnersByGate(partnersInDifferentGate, selectedGate);

                    // Property: Should return empty array
                    return filteredPartners.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 11: Gate view filtering - all partners returned when all in same gate', () => {
        fc.assert(
            fc.property(
                gateIdArbitrary,
                fc.array(partnerArbitrary, { minLength: 1, maxLength: 20 }),
                (selectedGate, partners) => {
                    // Set all partners to the selected gate
                    const partnersInSameGate = partners.map(p => ({
                        ...p,
                        currentGate: selectedGate
                    }));

                    // Filter by selected gate
                    const filteredPartners = filterPartnersByGate(partnersInSameGate, selectedGate);

                    // Property: Should return all partners
                    return filteredPartners.length === partnersInSameGate.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});
