/**
 * Unit tests for Role-Based Access Control utilities
 */

import { describe, test, expect } from 'vitest';
import {
    canAccessPartner,
    filterPartnersByRole,
    getRelevantGatesForRole,
    canViewGate,
    groupPartnersByGate,
    canEditPartner,
    canSubmitQuestionnaire,
    getAssignedPartners,
    isPrimaryOwner,
    getRoleDashboardMessage,
} from './rbac';
import type { PartnerRecord } from '@/types';
import type { AuthUser } from '../middleware/auth';

// Mock partner data
const createMockPartner = (overrides: Partial<PartnerRecord> = {}): PartnerRecord => ({
    id: 'partner-1',
    partnerName: 'Test Partner',
    pamOwner: 'pam@example.com',
    pdmOwner: 'pdm@example.com',
    tpmOwner: 'tpm@example.com',
    psmOwner: 'psm@example.com',
    tamOwner: 'tam@example.com',
    contractType: 'PPA',
    tier: 'tier-1',
    ccv: 1000000,
    lrp: 2000000,
    currentGate: 'gate-1',
    gates: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

// Mock user data
const createMockUser = (role: AuthUser['role'], email: string = 'user@example.com'): AuthUser => ({
    id: 'user-1',
    email,
    name: 'Test User',
    role,
});

describe('canAccessPartner', () => {
    test('admin can access any partner', () => {
        const admin = createMockUser('Admin', 'admin@example.com');
        const partner = createMockPartner();

        expect(canAccessPartner(admin, partner)).toBe(true);
    });

    test('PAM owner can access their partner', () => {
        const pam = createMockUser('PAM', 'pam@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(canAccessPartner(pam, partner)).toBe(true);
    });

    test('PDM owner can access their partner', () => {
        const pdm = createMockUser('PDM', 'pdm@example.com');
        const partner = createMockPartner({ pdmOwner: 'pdm@example.com' });

        expect(canAccessPartner(pdm, partner)).toBe(true);
    });

    test('TPM owner can access their partner', () => {
        const tpm = createMockUser('TPM', 'tpm@example.com');
        const partner = createMockPartner({ tpmOwner: 'tpm@example.com' });

        expect(canAccessPartner(tpm, partner)).toBe(true);
    });

    test('user cannot access partner they are not assigned to', () => {
        const user = createMockUser('PAM', 'other@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(canAccessPartner(user, partner)).toBe(false);
    });

    test('null user cannot access any partner', () => {
        const partner = createMockPartner();

        expect(canAccessPartner(null, partner)).toBe(false);
    });

    test('email comparison is case-insensitive', () => {
        const pam = createMockUser('PAM', 'PAM@EXAMPLE.COM');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(canAccessPartner(pam, partner)).toBe(true);
    });
});

describe('filterPartnersByRole', () => {
    const partners: PartnerRecord[] = [
        createMockPartner({ id: 'p1', currentGate: 'pre-contract', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p2', currentGate: 'gate-0', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p3', currentGate: 'gate-1', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p4', currentGate: 'gate-2', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p5', currentGate: 'gate-3', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p6', currentGate: 'post-launch', pamOwner: 'pam@example.com' }),
    ];

    test('admin sees all partners', () => {
        const admin = createMockUser('Admin', 'admin@example.com');
        const filtered = filterPartnersByRole(partners, admin);

        expect(filtered).toHaveLength(6);
    });

    test('PAM sees all their partners across all gates', () => {
        const pam = createMockUser('PAM', 'pam@example.com');
        const filtered = filterPartnersByRole(partners, pam);

        expect(filtered).toHaveLength(6);
        expect(filtered.map(p => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    });

    test('PDM sees only Pre-Contract through Gate 1', () => {
        const pdm = createMockUser('PDM', 'pam@example.com');
        const filtered = filterPartnersByRole(partners, pdm);

        expect(filtered).toHaveLength(3);
        expect(filtered.map(p => p.id)).toEqual(['p1', 'p2', 'p3']);
    });

    test('TPM sees only Gate 2', () => {
        const tpm = createMockUser('TPM', 'pam@example.com');
        const filtered = filterPartnersByRole(partners, tpm);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('p4');
    });

    test('PSM sees Gate 3 and Post-Launch', () => {
        const psm = createMockUser('PSM', 'pam@example.com');
        const filtered = filterPartnersByRole(partners, psm);

        expect(filtered).toHaveLength(2);
        expect(filtered.map(p => p.id)).toEqual(['p5', 'p6']);
    });

    test('TAM sees Gate 3 and Post-Launch', () => {
        const tam = createMockUser('TAM', 'pam@example.com');
        const filtered = filterPartnersByRole(partners, tam);

        expect(filtered).toHaveLength(2);
        expect(filtered.map(p => p.id)).toEqual(['p5', 'p6']);
    });

    test('null user sees no partners', () => {
        const filtered = filterPartnersByRole(partners, null);

        expect(filtered).toHaveLength(0);
    });

    test('user only sees partners they are assigned to', () => {
        const partnersWithDifferentOwners = [
            createMockPartner({ id: 'p1', pamOwner: 'pam1@example.com', currentGate: 'gate-1' }),
            createMockPartner({ id: 'p2', pamOwner: 'pam2@example.com', currentGate: 'gate-1' }),
        ];

        const pam = createMockUser('PAM', 'pam1@example.com');
        const filtered = filterPartnersByRole(partnersWithDifferentOwners, pam);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('p1');
    });
});

describe('getRelevantGatesForRole', () => {
    test('Admin sees all gates', () => {
        const gates = getRelevantGatesForRole('Admin');
        expect(gates).toEqual(['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch']);
    });

    test('PAM sees all gates', () => {
        const gates = getRelevantGatesForRole('PAM');
        expect(gates).toEqual(['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch']);
    });

    test('PDM sees Pre-Contract through Gate 1', () => {
        const gates = getRelevantGatesForRole('PDM');
        expect(gates).toEqual(['pre-contract', 'gate-0', 'gate-1']);
    });

    test('TPM sees only Gate 2', () => {
        const gates = getRelevantGatesForRole('TPM');
        expect(gates).toEqual(['gate-2']);
    });

    test('PSM sees Gate 3 and Post-Launch', () => {
        const gates = getRelevantGatesForRole('PSM');
        expect(gates).toEqual(['gate-3', 'post-launch']);
    });

    test('TAM sees Gate 3 and Post-Launch', () => {
        const gates = getRelevantGatesForRole('TAM');
        expect(gates).toEqual(['gate-3', 'post-launch']);
    });
});

describe('canViewGate', () => {
    test('PAM can view all gates', () => {
        expect(canViewGate('PAM', 'pre-contract')).toBe(true);
        expect(canViewGate('PAM', 'gate-0')).toBe(true);
        expect(canViewGate('PAM', 'gate-1')).toBe(true);
        expect(canViewGate('PAM', 'gate-2')).toBe(true);
        expect(canViewGate('PAM', 'gate-3')).toBe(true);
        expect(canViewGate('PAM', 'post-launch')).toBe(true);
    });

    test('PDM can view Pre-Contract through Gate 1', () => {
        expect(canViewGate('PDM', 'pre-contract')).toBe(true);
        expect(canViewGate('PDM', 'gate-0')).toBe(true);
        expect(canViewGate('PDM', 'gate-1')).toBe(true);
        expect(canViewGate('PDM', 'gate-2')).toBe(false);
        expect(canViewGate('PDM', 'gate-3')).toBe(false);
    });

    test('TPM can only view Gate 2', () => {
        expect(canViewGate('TPM', 'gate-2')).toBe(true);
        expect(canViewGate('TPM', 'gate-1')).toBe(false);
        expect(canViewGate('TPM', 'gate-3')).toBe(false);
    });
});

describe('groupPartnersByGate', () => {
    const partners: PartnerRecord[] = [
        createMockPartner({ id: 'p1', currentGate: 'pre-contract', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p2', currentGate: 'pre-contract', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p3', currentGate: 'gate-1', pamOwner: 'pam@example.com' }),
        createMockPartner({ id: 'p4', currentGate: 'gate-2', pamOwner: 'pam@example.com' }),
    ];

    test('groups partners by gate for PAM', () => {
        const pam = createMockUser('PAM', 'pam@example.com');
        const grouped = groupPartnersByGate(partners, pam);

        expect(grouped['pre-contract']).toHaveLength(2);
        expect(grouped['gate-0']).toHaveLength(0);
        expect(grouped['gate-1']).toHaveLength(1);
        expect(grouped['gate-2']).toHaveLength(1);
    });

    test('groups partners by gate for PDM (filtered)', () => {
        const pdm = createMockUser('PDM', 'pam@example.com');
        const grouped = groupPartnersByGate(partners, pdm);

        expect(grouped['pre-contract']).toHaveLength(2);
        expect(grouped['gate-1']).toHaveLength(1);
        expect(grouped['gate-2']).toHaveLength(0); // Filtered out
    });
});

describe('canEditPartner', () => {
    test('admin can edit any partner', () => {
        const admin = createMockUser('Admin', 'admin@example.com');
        const partner = createMockPartner();

        expect(canEditPartner(admin, partner)).toBe(true);
    });

    test('assigned user can edit partner', () => {
        const pam = createMockUser('PAM', 'pam@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(canEditPartner(pam, partner)).toBe(true);
    });

    test('non-assigned user cannot edit partner', () => {
        const user = createMockUser('PAM', 'other@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(canEditPartner(user, partner)).toBe(false);
    });
});

describe('canSubmitQuestionnaire', () => {
    test('admin can submit any questionnaire', () => {
        const admin = createMockUser('Admin', 'admin@example.com');
        const partner = createMockPartner();

        expect(canSubmitQuestionnaire(admin, partner, 'gate-1')).toBe(true);
    });

    test('PDM can submit questionnaire for Gate 1', () => {
        const pdm = createMockUser('PDM', 'pdm@example.com');
        const partner = createMockPartner({ pdmOwner: 'pdm@example.com' });

        expect(canSubmitQuestionnaire(pdm, partner, 'gate-1')).toBe(true);
    });

    test('PDM cannot submit questionnaire for Gate 2', () => {
        const pdm = createMockUser('PDM', 'pdm@example.com');
        const partner = createMockPartner({ pdmOwner: 'pdm@example.com' });

        expect(canSubmitQuestionnaire(pdm, partner, 'gate-2')).toBe(false);
    });

    test('user cannot submit questionnaire for partner they do not own', () => {
        const pdm = createMockUser('PDM', 'other@example.com');
        const partner = createMockPartner({ pdmOwner: 'pdm@example.com' });

        expect(canSubmitQuestionnaire(pdm, partner, 'gate-1')).toBe(false);
    });
});

describe('getAssignedPartners', () => {
    const partners: PartnerRecord[] = [
        createMockPartner({ id: 'p1', pamOwner: 'user@example.com' }),
        createMockPartner({ id: 'p2', pdmOwner: 'user@example.com' }),
        createMockPartner({ id: 'p3', pamOwner: 'other@example.com' }),
    ];

    test('returns partners assigned to user', () => {
        const assigned = getAssignedPartners(partners, 'user@example.com');

        expect(assigned).toHaveLength(2);
        expect(assigned.map(p => p.id)).toEqual(['p1', 'p2']);
    });

    test('email comparison is case-insensitive', () => {
        const assigned = getAssignedPartners(partners, 'USER@EXAMPLE.COM');

        expect(assigned).toHaveLength(2);
    });
});

describe('isPrimaryOwner', () => {
    test('returns true if user is PAM owner', () => {
        const pam = createMockUser('PAM', 'pam@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com' });

        expect(isPrimaryOwner(pam, partner)).toBe(true);
    });

    test('returns false if user is not PAM owner', () => {
        const pdm = createMockUser('PDM', 'pdm@example.com');
        const partner = createMockPartner({ pamOwner: 'pam@example.com', pdmOwner: 'pdm@example.com' });

        expect(isPrimaryOwner(pdm, partner)).toBe(false);
    });

    test('returns false for null user', () => {
        const partner = createMockPartner();

        expect(isPrimaryOwner(null, partner)).toBe(false);
    });
});

describe('getRoleDashboardMessage', () => {
    test('returns correct message for each role', () => {
        expect(getRoleDashboardMessage('Admin')).toContain('all partners');
        expect(getRoleDashboardMessage('PAM')).toContain('all your partners');
        expect(getRoleDashboardMessage('PDM')).toContain('Pre-Contract through Gate 1');
        expect(getRoleDashboardMessage('TPM')).toContain('Gate 2');
        expect(getRoleDashboardMessage('PSM')).toContain('Gate 3');
        expect(getRoleDashboardMessage('TAM')).toContain('Gate 3');
    });
});
