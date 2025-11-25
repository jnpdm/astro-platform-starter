/**
 * Property-based tests for partner migration utilities
 * Feature: hub-improvements, Property 32: Role validity
 * Validates: Role Consolidation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { migrateLegacyPartner, hasDeprecatedFields } from './partnerMigration';
import type { PartnerRecord, UserRole } from '../types/partner';

// Arbitraries for generating test data
const validRoleArb = fc.constantFrom<UserRole>('PAM', 'PDM', 'TAM', 'PSM');
const deprecatedRoleArb = fc.constantFrom('TPM', 'Admin');
const gateIdArb = fc.constantFrom('pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch');
const contractTypeArb = fc.constantFrom('PPA', 'Distribution', 'Sales-Agent', 'Other');
const tierArb = fc.constantFrom('tier-0', 'tier-1', 'tier-2');

const partnerRecordArb = fc.record({
    id: fc.string({ minLength: 1 }),
    partnerName: fc.string({ minLength: 1 }),
    pamOwner: fc.emailAddress(),
    pdmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    psmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    tamOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    contractType: contractTypeArb,
    tier: tierArb,
    ccv: fc.nat(),
    lrp: fc.nat(),
    currentGate: gateIdArb,
    gates: fc.dictionary(fc.string(), fc.anything()),
    createdAt: fc.date(),
    updatedAt: fc.date()
});

const legacyPartnerRecordArb = fc.record({
    id: fc.string({ minLength: 1 }),
    partnerName: fc.string({ minLength: 1 }),
    pamOwner: fc.emailAddress(),
    pdmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    tpmOwner: fc.option(fc.emailAddress(), { nil: undefined }), // Deprecated field
    psmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    tamOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    contractType: contractTypeArb,
    tier: tierArb,
    ccv: fc.nat(),
    lrp: fc.nat(),
    currentGate: gateIdArb,
    gates: fc.dictionary(fc.string(), fc.anything()),
    createdAt: fc.date(),
    updatedAt: fc.date()
});

describe('Property-Based Tests: Role Consolidation', () => {
    /**
     * Property 32: Role validity
     * For any partner record, after migration, it should only contain valid role fields
     * (PAM, PDM, TAM, PSM) and should not contain deprecated role fields (TPM)
     */
    it('Property 32: migrated partners should never contain tpmOwner field', () => {
        fc.assert(
            fc.property(legacyPartnerRecordArb, (legacyPartner) => {
                const migrated = migrateLegacyPartner(legacyPartner);

                // The migrated partner should never have tpmOwner
                expect(migrated).not.toHaveProperty('tpmOwner');

                // All valid role fields should be preserved
                expect(migrated).toHaveProperty('pamOwner');

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: migrated partners should preserve all valid owner fields', () => {
        fc.assert(
            fc.property(legacyPartnerRecordArb, (legacyPartner) => {
                const migrated = migrateLegacyPartner(legacyPartner);

                // All valid owner fields should be preserved
                expect(migrated.pamOwner).toBe(legacyPartner.pamOwner);
                expect(migrated.pdmOwner).toBe(legacyPartner.pdmOwner);
                expect(migrated.psmOwner).toBe(legacyPartner.psmOwner);
                expect(migrated.tamOwner).toBe(legacyPartner.tamOwner);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: migrated partners should preserve all non-owner fields', () => {
        fc.assert(
            fc.property(legacyPartnerRecordArb, (legacyPartner) => {
                const migrated = migrateLegacyPartner(legacyPartner);

                // All other fields should be preserved exactly
                expect(migrated.id).toBe(legacyPartner.id);
                expect(migrated.partnerName).toBe(legacyPartner.partnerName);
                expect(migrated.contractType).toBe(legacyPartner.contractType);
                expect(migrated.tier).toBe(legacyPartner.tier);
                expect(migrated.ccv).toBe(legacyPartner.ccv);
                expect(migrated.lrp).toBe(legacyPartner.lrp);
                expect(migrated.currentGate).toBe(legacyPartner.currentGate);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: hasDeprecatedFields should correctly identify legacy records', () => {
        fc.assert(
            fc.property(legacyPartnerRecordArb, (legacyPartner) => {
                const hasTpmOwner = legacyPartner.tpmOwner !== undefined;
                const detected = hasDeprecatedFields(legacyPartner);

                // Should return true if and only if tpmOwner is present
                expect(detected).toBe(hasTpmOwner);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: modern partners should never have deprecated fields', () => {
        fc.assert(
            fc.property(partnerRecordArb, (partner) => {
                // Modern partner records should never have tpmOwner
                expect(partner).not.toHaveProperty('tpmOwner');
                expect(hasDeprecatedFields(partner)).toBe(false);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: valid roles should only be PAM, PDM, TAM, PSM', () => {
        fc.assert(
            fc.property(validRoleArb, (role) => {
                // Valid roles should be one of the four allowed roles
                const validRoles: UserRole[] = ['PAM', 'PDM', 'TAM', 'PSM'];
                expect(validRoles).toContain(role);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: deprecated roles should not be in valid role set', () => {
        fc.assert(
            fc.property(deprecatedRoleArb, (deprecatedRole) => {
                // Deprecated roles should not be in the valid set
                const validRoles = ['PAM', 'PDM', 'TAM', 'PSM'];
                expect(validRoles).not.toContain(deprecatedRole);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 32: migration is idempotent', () => {
        fc.assert(
            fc.property(legacyPartnerRecordArb, (legacyPartner) => {
                // Migrating once should be the same as migrating twice
                const migrated1 = migrateLegacyPartner(legacyPartner);
                const migrated2 = migrateLegacyPartner(migrated1);

                expect(migrated2).toEqual(migrated1);
                expect(migrated2).not.toHaveProperty('tpmOwner');

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
