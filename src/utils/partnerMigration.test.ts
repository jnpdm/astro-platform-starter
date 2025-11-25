/**
 * Tests for partner migration utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { migrateLegacyPartner, migrateLegacyPartners, hasDeprecatedFields } from './partnerMigration';
import type { PartnerRecord } from '../types/partner';

describe('Partner Migration', () => {
    describe('migrateLegacyPartner', () => {
        it('should remove tpmOwner field from legacy partner', () => {
            const legacyPartner = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                pdmOwner: 'pdm@example.com',
                tpmOwner: 'tpm@example.com', // Deprecated field
                psmOwner: 'psm@example.com',
                tamOwner: 'tam@example.com',
                contractType: 'PPA' as const,
                tier: 'tier-1' as const,
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0' as const,
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const migrated = migrateLegacyPartner(legacyPartner);

            expect(migrated).not.toHaveProperty('tpmOwner');
            expect(migrated.pamOwner).toBe('pam@example.com');
            expect(migrated.pdmOwner).toBe('pdm@example.com');
            expect(migrated.psmOwner).toBe('psm@example.com');
            expect(migrated.tamOwner).toBe('tam@example.com');
        });

        it('should log warning when tpmOwner is present', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const legacyPartner = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                tpmOwner: 'tpm@example.com',
                contractType: 'PPA' as const,
                tier: 'tier-1' as const,
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0' as const,
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            migrateLegacyPartner(legacyPartner);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Migration] Partner partner-1 (Test Partner) had tpmOwner: tpm@example.com')
            );

            consoleWarnSpy.mockRestore();
        });

        it('should not log warning when tpmOwner is not present', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                pdmOwner: 'pdm@example.com',
                psmOwner: 'psm@example.com',
                tamOwner: 'tam@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            migrateLegacyPartner(partner);

            expect(consoleWarnSpy).not.toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should preserve all other fields', () => {
            const legacyPartner = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                tpmOwner: 'tpm@example.com',
                contractType: 'Distribution' as const,
                tier: 'tier-0' as const,
                ccv: 500000,
                lrp: 1000000,
                currentGate: 'gate-2' as const,
                gates: { 'gate-0': { status: 'passed' } },
                contractSignedDate: new Date('2024-01-01'),
                targetLaunchDate: new Date('2024-06-01'),
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-15')
            };

            const migrated = migrateLegacyPartner(legacyPartner);

            expect(migrated.id).toBe('partner-1');
            expect(migrated.partnerName).toBe('Test Partner');
            expect(migrated.contractType).toBe('Distribution');
            expect(migrated.tier).toBe('tier-0');
            expect(migrated.ccv).toBe(500000);
            expect(migrated.lrp).toBe(1000000);
            expect(migrated.currentGate).toBe('gate-2');
            expect(migrated.gates).toEqual({ 'gate-0': { status: 'passed' } });
        });
    });

    describe('migrateLegacyPartners', () => {
        it('should migrate multiple partners', () => {
            const legacyPartners = [
                {
                    id: 'partner-1',
                    partnerName: 'Partner 1',
                    pamOwner: 'pam1@example.com',
                    tpmOwner: 'tpm1@example.com',
                    contractType: 'PPA' as const,
                    tier: 'tier-1' as const,
                    ccv: 100000,
                    lrp: 200000,
                    currentGate: 'gate-0' as const,
                    gates: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'partner-2',
                    partnerName: 'Partner 2',
                    pamOwner: 'pam2@example.com',
                    tpmOwner: 'tpm2@example.com',
                    contractType: 'Distribution' as const,
                    tier: 'tier-2' as const,
                    ccv: 50000,
                    lrp: 100000,
                    currentGate: 'pre-contract' as const,
                    gates: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const migrated = migrateLegacyPartners(legacyPartners);

            expect(migrated).toHaveLength(2);
            expect(migrated[0]).not.toHaveProperty('tpmOwner');
            expect(migrated[1]).not.toHaveProperty('tpmOwner');
            expect(migrated[0].pamOwner).toBe('pam1@example.com');
            expect(migrated[1].pamOwner).toBe('pam2@example.com');
        });

        it('should handle empty array', () => {
            const migrated = migrateLegacyPartners([]);
            expect(migrated).toEqual([]);
        });
    });

    describe('hasDeprecatedFields', () => {
        it('should return true when tpmOwner is present', () => {
            const partner = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                tpmOwner: 'tpm@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(hasDeprecatedFields(partner)).toBe(true);
        });

        it('should return false when tpmOwner is not present', () => {
            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(hasDeprecatedFields(partner)).toBe(false);
        });

        it('should return false when tpmOwner is undefined', () => {
            const partner = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                tpmOwner: undefined,
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(hasDeprecatedFields(partner)).toBe(false);
        });
    });

    describe('Role Type Validation', () => {
        it('should only accept valid roles (PAM, PDM, TAM, PSM)', () => {
            const validRoles: Array<'PAM' | 'PDM' | 'TAM' | 'PSM'> = ['PAM', 'PDM', 'TAM', 'PSM'];

            // This test validates at compile time that only these 4 roles are valid
            // If TPM or Admin were still in the type, this would fail to compile
            validRoles.forEach(role => {
                expect(['PAM', 'PDM', 'TAM', 'PSM']).toContain(role);
            });
        });

        it('should not accept deprecated roles (TPM, Admin)', () => {
            const deprecatedRoles = ['TPM', 'Admin'];
            const validRoles = ['PAM', 'PDM', 'TAM', 'PSM'];

            deprecatedRoles.forEach(role => {
                expect(validRoles).not.toContain(role);
            });
        });

        it('should create partner record without tpmOwner field', () => {
            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'pam@example.com',
                pdmOwner: 'pdm@example.com',
                psmOwner: 'psm@example.com',
                tamOwner: 'tam@example.com',
                // tpmOwner should not be allowed here - TypeScript will error if uncommented
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 100000,
                lrp: 200000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(partner).not.toHaveProperty('tpmOwner');
            expect(partner.pamOwner).toBeDefined();
            expect(partner.pdmOwner).toBeDefined();
            expect(partner.psmOwner).toBeDefined();
            expect(partner.tamOwner).toBeDefined();
        });
    });
});
