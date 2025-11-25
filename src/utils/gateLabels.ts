/**
 * Gate label mappings for navigation and display
 * Maps gate IDs to their descriptive names
 */

import type { GateId } from '../types';

/**
 * Descriptive labels for each gate phase
 * Format: "Gate X: Description" or "Phase: Description"
 */
export const GATE_LABELS: Record<GateId, string> = {
    'pre-contract': 'Pre-Contract: PDM Engagement',
    'gate-0': 'Gate 0: Onboarding Kickoff',
    'gate-1': 'Gate 1: Ready to Sell',
    'gate-2': 'Gate 2: Ready to Order',
    'gate-3': 'Gate 3: Ready to Deliver',
    'post-launch': 'Post-Launch'
};

/**
 * Get the descriptive label for a gate
 * @param gateId - The gate identifier
 * @returns The descriptive label for the gate
 */
export function getGateLabel(gateId: GateId): string {
    return GATE_LABELS[gateId];
}
