/**
 * Property-based tests for report calculations
 * Feature: hub-improvements, Property 4 & 5
 * Validates: Requirements 2.2, 2.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateReportData, calculateGateMetrics } from './reportCalculations';
import type { PartnerRecord, GateId, GateStatus } from '../types/partner';

/**
 * Generator for GateId
 */
const gateIdArb = fc.constantFrom<GateId>(
    'pre-contract',
    'gate-0',
    'gate-1',
    'gate-2',
    'gate-3',
    'post-launch'
);

/**
 * Generator for GateStatus
 */
const gateStatusArb = fc.constantFrom<GateStatus>(
    'not-started',
    'in-progress',
    'passed',
    'failed',
    'blocked'
);

/**
 * Generator for a partner record with minimal required fields
 */
const partnerRecordArb = fc.record({
    id: fc.uuid(),
    partnerName: fc.string({ minLength: 1, maxLength: 50 }),
    pamOwner: fc.emailAddress(),
    contractType: fc.constantFrom('PPA', 'Distribution', 'Sales-Agent', 'Other'),
    tier: fc.constantFrom('tier-0', 'tier-1', 'tier-2'),
    ccv: fc.integer({ min: 0, max: 10000000 }),
    lrp: fc.integer({ min: 0, max: 10000000 }),
    currentGate: gateIdArb,
    gates: fc.dictionary(
        fc.string(),
        fc.record({
            gateId: fc.string(),
            status: gateStatusArb,
            startedDate: fc.option(fc.date(), { nil: undefined }),
            completedDate: fc.option(fc.date(), { nil: undefined }),
            questionnaires: fc.dictionary(fc.string(), fc.string()),
            approvals: fc.array(fc.record({
                approvedBy: fc.emailAddress(),
                approvedByRole: fc.constantFrom('PAM', 'PDM', 'TAM', 'PSM'),
                approvedAt: fc.date(),
                signature: fc.record({
                    type: fc.constantFrom('typed', 'drawn'),
                    data: fc.string()
                })
            }))
        })
    ),
    createdAt: fc.date(),
    updatedAt: fc.date()
}) as fc.Arbitrary<PartnerRecord>;

describe('Report Calculation Properties', () => {
    /**
     * Property 4: Gate metrics calculation
     * For any set of partners, the sum of partner counts across all gate metrics 
     * should equal the total number of partners.
     * 
     * **Feature: hub-improvements, Property 4: Gate metrics calculation**
     * **Validates: Requirements 2.2**
     */
    it('should have gate partner counts sum to total partners', () => {
        fc.assert(
            fc.property(
                fc.array(partnerRecordArb, { minLength: 0, maxLength: 50 }),
                (partners) => {
                    const reportData = calculateReportData(partners);

                    // Sum of all partner counts across gates should equal total partners
                    const sumOfGateCounts = reportData.gateMetrics.reduce(
                        (sum, metric) => sum + metric.partnerCount,
                        0
                    );

                    expect(sumOfGateCounts).toBe(reportData.totalPartners);
                    expect(sumOfGateCounts).toBe(partners.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 5: Report data completeness
     * For any generated report, all required fields (partner count, completion rate, 
     * timeline metrics) should be present for each gate.
     * 
     * **Feature: hub-improvements, Property 5: Report data completeness**
     * **Validates: Requirements 2.4**
     */
    it('should have all required fields present for each gate', () => {
        fc.assert(
            fc.property(
                fc.array(partnerRecordArb, { minLength: 0, maxLength: 50 }),
                (partners) => {
                    const reportData = calculateReportData(partners);

                    // Report should have required top-level fields
                    expect(reportData.totalPartners).toBeDefined();
                    expect(typeof reportData.totalPartners).toBe('number');
                    expect(reportData.totalPartners).toBeGreaterThanOrEqual(0);

                    expect(reportData.gateMetrics).toBeDefined();
                    expect(Array.isArray(reportData.gateMetrics)).toBe(true);

                    expect(reportData.generatedAt).toBeDefined();
                    expect(reportData.generatedAt).toBeInstanceOf(Date);

                    // Should have metrics for all 6 gates
                    expect(reportData.gateMetrics.length).toBe(6);

                    // Each gate metric should have all required fields
                    reportData.gateMetrics.forEach(metric => {
                        // Gate identification
                        expect(metric.gateId).toBeDefined();
                        expect(typeof metric.gateId).toBe('string');

                        expect(metric.gateName).toBeDefined();
                        expect(typeof metric.gateName).toBe('string');
                        expect(metric.gateName.length).toBeGreaterThan(0);

                        // Partner count
                        expect(metric.partnerCount).toBeDefined();
                        expect(typeof metric.partnerCount).toBe('number');
                        expect(metric.partnerCount).toBeGreaterThanOrEqual(0);

                        // Completion rate (percentage)
                        expect(metric.completionRate).toBeDefined();
                        expect(typeof metric.completionRate).toBe('number');
                        expect(metric.completionRate).toBeGreaterThanOrEqual(0);
                        expect(metric.completionRate).toBeLessThanOrEqual(100);

                        // Timeline metric (average days)
                        expect(metric.averageDaysInGate).toBeDefined();
                        expect(typeof metric.averageDaysInGate).toBe('number');
                        expect(metric.averageDaysInGate).toBeGreaterThanOrEqual(0);

                        // Partners array
                        expect(metric.partners).toBeDefined();
                        expect(Array.isArray(metric.partners)).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Gate metrics should only include partners in that gate
     */
    it('should only include partners currently in the specified gate', () => {
        fc.assert(
            fc.property(
                fc.array(partnerRecordArb, { minLength: 1, maxLength: 50 }),
                gateIdArb,
                (partners, gateId) => {
                    const metrics = calculateGateMetrics(partners, gateId);

                    // All partners in the metrics should have currentGate matching gateId
                    metrics.partners.forEach(partner => {
                        expect(partner.currentGate).toBe(gateId);
                    });

                    // Partner count should match the length of partners array
                    expect(metrics.partnerCount).toBe(metrics.partners.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Completion rate should be 0 when no partners have reached the gate
     */
    it('should have 0% completion rate when no partners have reached the gate', () => {
        fc.assert(
            fc.property(
                gateIdArb,
                (gateId) => {
                    // Create partners that are all before this gate
                    const gateOrder: GateId[] = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];
                    const gateIndex = gateOrder.indexOf(gateId);

                    if (gateIndex === 0) {
                        // Can't have partners before pre-contract, skip this case
                        return true;
                    }

                    // Create partners in gates before this one
                    const partners: PartnerRecord[] = [{
                        id: '1',
                        partnerName: 'Test Partner',
                        pamOwner: 'test@example.com',
                        contractType: 'PPA',
                        tier: 'tier-1',
                        ccv: 100000,
                        lrp: 50000,
                        currentGate: gateOrder[gateIndex - 1], // One gate before
                        gates: {},
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }];

                    const metrics = calculateGateMetrics(partners, gateId);

                    // Completion rate should be 0 since no partners have reached this gate
                    expect(metrics.completionRate).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Average days should be 0 when no gates are completed
     */
    it('should have 0 average days when no gates are completed', () => {
        fc.assert(
            fc.property(
                gateIdArb,
                (gateId) => {
                    // Create partners with no completed gates
                    const partners: PartnerRecord[] = [{
                        id: '1',
                        partnerName: 'Test Partner',
                        pamOwner: 'test@example.com',
                        contractType: 'PPA',
                        tier: 'tier-1',
                        ccv: 100000,
                        lrp: 50000,
                        currentGate: gateId,
                        gates: {
                            [gateId]: {
                                gateId,
                                status: 'in-progress', // Not completed
                                questionnaires: {},
                                approvals: []
                            }
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }];

                    const metrics = calculateGateMetrics(partners, gateId);

                    // Average days should be 0 since no gates are completed
                    expect(metrics.averageDaysInGate).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Total partners should never be negative
     */
    it('should never have negative total partners', () => {
        fc.assert(
            fc.property(
                fc.array(partnerRecordArb, { minLength: 0, maxLength: 50 }),
                (partners) => {
                    const reportData = calculateReportData(partners);

                    expect(reportData.totalPartners).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Partner counts should never be negative
     */
    it('should never have negative partner counts in gate metrics', () => {
        fc.assert(
            fc.property(
                fc.array(partnerRecordArb, { minLength: 0, maxLength: 50 }),
                (partners) => {
                    const reportData = calculateReportData(partners);

                    reportData.gateMetrics.forEach(metric => {
                        expect(metric.partnerCount).toBeGreaterThanOrEqual(0);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
