/**
 * PDM Utilization Tracking Utilities
 * Calculates PDM workload metrics by revenue or partner count
 */

import type { PartnerRecord } from '../types/partner';

export type UtilizationMode = 'revenue' | 'partner-count';

export interface PDMUtilization {
    pdmEmail: string;
    mode: UtilizationMode;
    currentValue: number; // CCV sum or partner count
    capacityTarget: number;
    utilizationPercentage: number;
    partners: PartnerRecord[];
}

/**
 * Calculate PDM utilization metrics
 * 
 * @param partners - All partner records
 * @param pdmEmail - Email of the PDM to calculate utilization for
 * @param mode - 'revenue' to sum CCV, 'partner-count' to count partners
 * @param capacityTarget - Target capacity (revenue amount or partner count)
 * @returns PDM utilization data
 */
export function calculatePDMUtilization(
    partners: PartnerRecord[],
    pdmEmail: string,
    mode: UtilizationMode,
    capacityTarget: number
): PDMUtilization {
    // Filter partners assigned to this PDM
    const pdmPartners = partners.filter(
        (partner) => partner.pdmOwner?.toLowerCase() === pdmEmail.toLowerCase()
    );

    // Calculate current value based on mode
    let currentValue: number;
    if (mode === 'revenue') {
        // Sum CCV of all partners
        currentValue = pdmPartners.reduce((sum, partner) => sum + partner.ccv, 0);
    } else {
        // Count number of partners
        currentValue = pdmPartners.length;
    }

    // Calculate utilization percentage
    const utilizationPercentage = capacityTarget > 0
        ? (currentValue / capacityTarget) * 100
        : 0;

    return {
        pdmEmail,
        mode,
        currentValue,
        capacityTarget,
        utilizationPercentage,
        partners: pdmPartners,
    };
}
