/**
 * Property-based tests for PDM utilization calculations
 * Feature: hub-improvements
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculatePDMUtilization } from './pdmUtilization';
import type { PartnerRecord, GateId, ContractType, TierClassification } from '../types/partner';

// Arbitrary for generating partner records
const partnerArbitrary = (pdmEmail?: string) =>
    fc.record({
        id: fc.uuid(),
        partnerName: fc.string({ minLength: 1, maxLength: 50 }),
        pamOwner: fc.emailAddress(),
        pdmOwner: pdmEmail ? fc.constant(pdmEmail) : fc.option(fc.emailAddress(), { nil: undefined }),
        psmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
        tamOwner: fc.option(fc.emailAddress(), { nil: undefined }),
        contractType: fc.constantFrom('PPA', 'Distribution', 'Sales-Agent', 'Other') as fc.Arbitrary<ContractType>,
        tier: fc.constantFrom('tier-0', 'tier-1', 'tier-2') as fc.Arbitrary<TierClassification>,
        ccv: fc.integer({ min: 0, max: 10000000 }),
        lrp: fc.integer({ min: 0, max: 10000000 }),
        currentGate: fc.constantFrom('pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch') as fc.Arbitrary<GateId>,
        gates: fc.constant({}),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    }) as fc.Arbitrary<PartnerRecord>;

describe('PDM Utilization Property Tests', () => {
    /**
     * Property 6: PDM utilization by revenue
     * For any set of partners assigned to a PDM, the revenue-based utilization should equal the sum of all partner CCV values.
     * Validates: Requirements 3.2
     */
    it('Property 6: PDM utilization by revenue - currentValue equals sum of CCV', () => {
        fc.assert(
            fc.property(
                fc.emailAddress(),
                fc.array(partnerArbitrary(), { minLength: 0, maxLength: 20 }),
                fc.integer({ min: 1, max: 100000000 }),
                (pdmEmail, partners, capacityTarget) => {
                    // Assign some partners to this PDM
                    const partnersWithPDM = partners.map((p, idx) => ({
                        ...p,
                        pdmOwner: idx % 2 === 0 ? pdmEmail : p.pdmOwner,
                    }));

                    const result = calculatePDMUtilization(
                        partnersWithPDM,
                        pdmEmail,
                        'revenue',
                        capacityTarget
                    );

                    // Calculate expected CCV sum
                    const expectedCCV = partnersWithPDM
                        .filter((p) => p.pdmOwner?.toLowerCase() === pdmEmail.toLowerCase())
                        .reduce((sum, p) => sum + p.ccv, 0);

                    expect(result.currentValue).toBe(expectedCCV);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7: PDM utilization by count
     * For any set of partners assigned to a PDM, the count-based utilization should equal the number of partners.
     * Validates: Requirements 3.3
     */
    it('Property 7: PDM utilization by count - currentValue equals partner count', () => {
        fc.assert(
            fc.property(
                fc.emailAddress(),
                fc.array(partnerArbitrary(), { minLength: 0, maxLength: 20 }),
                fc.integer({ min: 1, max: 100 }),
                (pdmEmail, partners, capacityTarget) => {
                    // Assign some partners to this PDM
                    const partnersWithPDM = partners.map((p, idx) => ({
                        ...p,
                        pdmOwner: idx % 3 === 0 ? pdmEmail : p.pdmOwner,
                    }));

                    const result = calculatePDMUtilization(
                        partnersWithPDM,
                        pdmEmail,
                        'partner-count',
                        capacityTarget
                    );

                    // Calculate expected partner count
                    const expectedCount = partnersWithPDM.filter(
                        (p) => p.pdmOwner?.toLowerCase() === pdmEmail.toLowerCase()
                    ).length;

                    expect(result.currentValue).toBe(expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8: Utilization display completeness
     * For any utilization calculation, the displayed output should contain both current value and capacity target.
     * Validates: Requirements 3.4
     */
    it('Property 8: Utilization display completeness - contains current value and capacity target', () => {
        fc.assert(
            fc.property(
                fc.emailAddress(),
                fc.array(partnerArbitrary(), { minLength: 0, maxLength: 20 }),
                fc.constantFrom('revenue', 'partner-count') as fc.Arbitrary<'revenue' | 'partner-count'>,
                fc.integer({ min: 1, max: 100000000 }),
                (pdmEmail, partners, mode, capacityTarget) => {
                    const result = calculatePDMUtilization(
                        partners,
                        pdmEmail,
                        mode,
                        capacityTarget
                    );

                    // Verify all required fields are present
                    expect(result).toHaveProperty('currentValue');
                    expect(result).toHaveProperty('capacityTarget');
                    expect(result.capacityTarget).toBe(capacityTarget);
                    expect(typeof result.currentValue).toBe('number');
                    expect(result.currentValue).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});
