/**
 * Property-based tests for gate label formatting
 * Feature: hub-improvements, Property 15: Gate label format
 * Validates: Requirements 6.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GATE_LABELS, getGateLabel } from './gateLabels';
import type { GateId } from '../types';

describe('Gate Label Format Properties', () => {
    /**
     * Property 15: Gate label format
     * For any gate navigation button, the displayed text should contain both 
     * the gate identifier and descriptive name.
     * 
     * **Feature: hub-improvements, Property 15: Gate label format**
     * **Validates: Requirements 6.1**
     */
    it('should contain both gate identifier and descriptive name for all gates', () => {
        fc.assert(
            fc.property(
                fc.constantFrom<GateId>(
                    'pre-contract',
                    'gate-0',
                    'gate-1',
                    'gate-2',
                    'gate-3',
                    'post-launch'
                ),
                (gateId) => {
                    const label = getGateLabel(gateId);

                    // Label should not be empty
                    expect(label).toBeTruthy();
                    expect(label.length).toBeGreaterThan(0);

                    // Post-launch is a special case - it doesn't have a colon separator
                    if (gateId === 'post-launch') {
                        expect(label).toContain('Post-Launch');
                        return; // Skip colon checks for post-launch
                    }

                    // All other gates should contain a colon separator (format: "X: Y")
                    expect(label).toContain(':');

                    // Label should have content before and after the colon
                    const parts = label.split(':');
                    expect(parts.length).toBeGreaterThanOrEqual(2);
                    expect(parts[0].trim().length).toBeGreaterThan(0);
                    expect(parts[1].trim().length).toBeGreaterThan(0);

                    // For numbered gates (gate-0 through gate-3), verify "Gate X" format
                    if (gateId.startsWith('gate-')) {
                        const gateNumber = gateId.split('-')[1];
                        expect(label).toMatch(new RegExp(`Gate ${gateNumber}:`));
                    }

                    // For pre-contract, verify it starts with "Pre-Contract"
                    if (gateId === 'pre-contract') {
                        expect(label).toMatch(/^Pre-Contract:/);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: All gate IDs should have corresponding labels
     */
    it('should have labels defined for all gate IDs', () => {
        const gateIds: GateId[] = [
            'pre-contract',
            'gate-0',
            'gate-1',
            'gate-2',
            'gate-3',
            'post-launch'
        ];

        fc.assert(
            fc.property(
                fc.constantFrom(...gateIds),
                (gateId) => {
                    // Every gate ID should have a label in GATE_LABELS
                    expect(GATE_LABELS[gateId]).toBeDefined();
                    expect(GATE_LABELS[gateId]).not.toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Labels should match specific requirements
     */
    it('should match specific label requirements from spec', () => {
        // Requirement 6.2: Gate 0 should show "Gate 0: Onboarding Kickoff"
        expect(GATE_LABELS['gate-0']).toBe('Gate 0: Onboarding Kickoff');

        // Requirement 6.3: Gate 1 should show "Gate 1: Ready to Sell"
        expect(GATE_LABELS['gate-1']).toBe('Gate 1: Ready to Sell');

        // Requirement 6.4: Gate 2 should show "Gate 2: Ready to Order"
        expect(GATE_LABELS['gate-2']).toBe('Gate 2: Ready to Order');

        // Requirement 6.5: Gate 3 should show "Gate 3: Ready to Deliver"
        expect(GATE_LABELS['gate-3']).toBe('Gate 3: Ready to Deliver');

        // Requirement 6.6: Pre-Contract should show "Pre-Contract: PDM Engagement"
        expect(GATE_LABELS['pre-contract']).toBe('Pre-Contract: PDM Engagement');

        // Requirement 6.7: Post-Launch should show "Post-Launch"
        expect(GATE_LABELS['post-launch']).toBe('Post-Launch');
    });
});
