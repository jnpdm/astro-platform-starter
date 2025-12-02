/**
 * Report calculation utilities
 * Provides functions to calculate metrics and statistics for partner reports
 */

import type { PartnerRecord, GateId } from '../types/partner';

/**
 * Gate metrics for a specific gate
 */
export interface GateMetrics {
    gateId: GateId;
    gateName: string;
    partnerCount: number;
    completionRate: number; // Percentage of partners who completed this gate
    averageDaysInGate: number;
    partners: PartnerRecord[];
}

/**
 * Complete report data structure
 */
export interface ReportData {
    totalPartners: number;
    gateMetrics: GateMetrics[];
    generatedAt: Date;
}

/**
 * Gate order for consistent processing
 */
const GATE_ORDER: GateId[] = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

/**
 * Gate display names mapping
 */
const GATE_NAMES: Record<GateId, string> = {
    'pre-contract': 'Pre-Contract: PDM Engagement',
    'gate-0': 'Gate 0: Onboarding Kickoff',
    'gate-1': 'Gate 1: Ready to Sell',
    'gate-2': 'Gate 2: Ready to Order',
    'gate-3': 'Gate 3: Ready to Deliver',
    'post-launch': 'Post-Launch'
};

/**
 * Calculate metrics for a specific gate
 * 
 * @param partners - Array of all partner records
 * @param gateId - The gate to calculate metrics for
 * @returns Gate metrics including partner count, completion rate, and average time
 */
export function calculateGateMetrics(partners: PartnerRecord[], gateId: GateId): GateMetrics {
    // Partners currently in this gate
    const partnersInGate = partners.filter(p => p.currentGate === gateId);

    // Partners who have completed this gate (status = 'passed')
    const completedGates = partners
        .map(p => p.gates?.[gateId])
        .filter(gate => gate?.status === 'passed' && gate?.startedDate && gate?.completedDate);

    // Calculate completion rate: percentage of partners who passed this gate
    // out of all partners who have reached or passed this gate
    const gateIndex = GATE_ORDER.indexOf(gateId);
    const partnersReachedGate = partners.filter(p => {
        const currentIndex = GATE_ORDER.indexOf(p.currentGate);
        return currentIndex >= gateIndex;
    });

    const completionRate = partnersReachedGate.length > 0
        ? Math.round((completedGates.length / partnersReachedGate.length) * 100)
        : 0;

    // Calculate average days in gate for completed gates
    let averageDaysInGate = 0;
    if (completedGates.length > 0) {
        const totalDays = completedGates.reduce((sum, gate) => {
            const start = new Date(gate!.startedDate!).getTime();
            const end = new Date(gate!.completedDate!).getTime();
            const days = (end - start) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);

        averageDaysInGate = Math.round(totalDays / completedGates.length);
    }

    return {
        gateId,
        gateName: GATE_NAMES[gateId],
        partnerCount: partnersInGate.length,
        completionRate,
        averageDaysInGate,
        partners: partnersInGate
    };
}

/**
 * Calculate complete report data for all gates
 * 
 * @param partners - Array of all partner records
 * @returns Complete report data with metrics for all gates
 */
export function calculateReportData(partners: PartnerRecord[]): ReportData {
    const gateMetrics = GATE_ORDER.map(gateId => calculateGateMetrics(partners, gateId));

    return {
        totalPartners: partners.length,
        gateMetrics,
        generatedAt: new Date()
    };
}
