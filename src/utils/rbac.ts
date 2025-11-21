/**
 * Role-Based Access Control (RBAC) utilities
 * Implements partner ownership checks and role-based filtering
 */

import type { PartnerRecord, GateId, UserRole } from '@/types';
import type { AuthUser } from '../middleware/auth';

/**
 * Check if a user can access a specific partner
 * 
 * Rules:
 * - Admin can access all partners
 * - PAM can access partners they own
 * - PDM can access partners they own or are assigned to
 * - TPM can access partners they own or are assigned to
 * - PSM can access partners they own or are assigned to
 * - TAM can access partners they own or are assigned to
 */
export function canAccessPartner(user: AuthUser | null, partner: PartnerRecord): boolean {
    if (!user) return false;

    // Admin has full access
    if (user.role === 'Admin') return true;

    const userEmail = user.email.toLowerCase();

    // Check if user is assigned to this partner in any role
    const isOwner =
        partner.pamOwner?.toLowerCase() === userEmail ||
        partner.pdmOwner?.toLowerCase() === userEmail ||
        partner.tpmOwner?.toLowerCase() === userEmail ||
        partner.psmOwner?.toLowerCase() === userEmail ||
        partner.tamOwner?.toLowerCase() === userEmail;

    return isOwner;
}

/**
 * Filter partners based on user role and gate access
 * 
 * Role-based gate visibility:
 * - PAM: All gates (full visibility)
 * - PDM: Pre-Contract through Gate 1 (Ready to Sell)
 * - TPM: Gate 2 (Ready to Order)
 * - PSM: Gate 3 (Ready to Deliver) and Post-Launch
 * - TAM: Gate 3 (Ready to Deliver) and Post-Launch
 * - Admin: All gates (full visibility)
 */
export function filterPartnersByRole(
    partners: PartnerRecord[],
    user: AuthUser | null
): PartnerRecord[] {
    if (!user) return [];

    // Admin sees everything
    if (user.role === 'Admin') {
        return partners;
    }

    // Filter by ownership first
    const ownedPartners = partners.filter(partner => canAccessPartner(user, partner));

    // Then filter by gate visibility based on role
    return ownedPartners.filter(partner => {
        const currentGate = partner.currentGate;

        switch (user.role) {
            case 'PAM':
                // PAM sees all gates
                return true;

            case 'PDM':
                // PDM sees Pre-Contract through Gate 1
                return ['pre-contract', 'gate-0', 'gate-1'].includes(currentGate);

            case 'TPM':
                // TPM sees Gate 2
                return currentGate === 'gate-2';

            case 'PSM':
            case 'TAM':
                // PSM and TAM see Gate 3 and Post-Launch
                return ['gate-3', 'post-launch'].includes(currentGate);

            default:
                return false;
        }
    });
}

/**
 * Get gates that are relevant for a specific role
 */
export function getRelevantGatesForRole(role: UserRole): GateId[] {
    switch (role) {
        case 'Admin':
        case 'PAM':
            return ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

        case 'PDM':
            return ['pre-contract', 'gate-0', 'gate-1'];

        case 'TPM':
            return ['gate-2'];

        case 'PSM':
        case 'TAM':
            return ['gate-3', 'post-launch'];

        default:
            return [];
    }
}

/**
 * Check if a role can view a specific gate
 */
export function canViewGate(role: UserRole, gateId: GateId): boolean {
    const relevantGates = getRelevantGatesForRole(role);
    return relevantGates.includes(gateId);
}

/**
 * Filter partners by gate for dashboard display
 * Groups partners by their current gate, filtered by role
 */
export function groupPartnersByGate(
    partners: PartnerRecord[],
    user: AuthUser | null
): Record<GateId, PartnerRecord[]> {
    const filteredPartners = filterPartnersByRole(partners, user);

    const grouped: Record<GateId, PartnerRecord[]> = {
        'pre-contract': [],
        'gate-0': [],
        'gate-1': [],
        'gate-2': [],
        'gate-3': [],
        'post-launch': [],
    };

    filteredPartners.forEach(partner => {
        grouped[partner.currentGate].push(partner);
    });

    return grouped;
}

/**
 * Check if user can edit a partner record
 * Only assigned team members and admins can edit
 */
export function canEditPartner(user: AuthUser | null, partner: PartnerRecord): boolean {
    if (!user) return false;

    // Admin can edit everything
    if (user.role === 'Admin') return true;

    // Must be assigned to the partner
    return canAccessPartner(user, partner);
}

/**
 * Check if user can submit a questionnaire for a partner
 * Based on role and gate
 */
export function canSubmitQuestionnaire(
    user: AuthUser | null,
    partner: PartnerRecord,
    gateId: GateId
): boolean {
    if (!user) return false;

    // Admin can submit anything
    if (user.role === 'Admin') return true;

    // Must have access to the partner
    if (!canAccessPartner(user, partner)) return false;

    // Must be able to view the gate
    return canViewGate(user.role, gateId);
}

/**
 * Get partners assigned to a specific user
 */
export function getAssignedPartners(
    partners: PartnerRecord[],
    userEmail: string
): PartnerRecord[] {
    const email = userEmail.toLowerCase();

    return partners.filter(partner =>
        partner.pamOwner?.toLowerCase() === email ||
        partner.pdmOwner?.toLowerCase() === email ||
        partner.tpmOwner?.toLowerCase() === email ||
        partner.psmOwner?.toLowerCase() === email ||
        partner.tamOwner?.toLowerCase() === email
    );
}

/**
 * Check if user is the primary owner (PAM) of a partner
 */
export function isPrimaryOwner(user: AuthUser | null, partner: PartnerRecord): boolean {
    if (!user) return false;
    return partner.pamOwner?.toLowerCase() === user.email.toLowerCase();
}

/**
 * Get role-specific dashboard message
 */
export function getRoleDashboardMessage(role: UserRole): string {
    switch (role) {
        case 'Admin':
            return 'Viewing all partners across all gates';
        case 'PAM':
            return 'Viewing all your partners across all gates';
        case 'PDM':
            return 'Viewing partners in Pre-Contract through Gate 1 (Ready to Sell)';
        case 'TPM':
            return 'Viewing partners in Gate 2 (Ready to Order)';
        case 'PSM':
            return 'Viewing partners in Gate 3 (Ready to Deliver) and Post-Launch';
        case 'TAM':
            return 'Viewing partners in Gate 3 (Ready to Deliver) and Post-Launch';
        default:
            return 'Viewing your assigned partners';
    }
}
