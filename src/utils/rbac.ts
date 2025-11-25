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
 * - PDM (admin) can access all partners
 * - PAM can access partners they own
 */
export function canAccessPartner(user: AuthUser | null, partner: PartnerRecord): boolean {
    if (!user) {
        console.log('[RBAC] No user, denying access');
        return false;
    }

    // PDM has full access (admin role)
    if (user.role === 'PDM') {
        console.log('[RBAC] User is PDM (admin), granting access to partner:', partner.id);
        return true;
    }

    const userEmail = user.email.toLowerCase();

    // PAM can access partners they own
    const isOwner = partner.pamOwner?.toLowerCase() === userEmail;
    console.log('[RBAC] PAM access check:', {
        partnerName: partner.partnerName,
        pamOwner: partner.pamOwner,
        userEmail,
        isOwner
    });

    return isOwner;
}

/**
 * Filter partners based on user role and gate access
 * 
 * Role-based gate visibility:
 * - PDM (admin): All gates (full visibility)
 * - PAM: All gates for partners they own
 */
export function filterPartnersByRole(
    partners: PartnerRecord[],
    user: AuthUser | null
): PartnerRecord[] {
    console.log('[RBAC] Filtering partners:', {
        totalPartners: partners.length,
        userRole: user?.role,
        userEmail: user?.email
    });

    if (!user) {
        console.log('[RBAC] No user, returning empty array');
        return [];
    }

    // PDM (admin) sees everything
    if (user.role === 'PDM') {
        console.log('[RBAC] User is PDM, returning all partners:', partners.length);
        return partners;
    }

    // PAM sees all gates for partners they own
    const filtered = partners.filter(partner => canAccessPartner(user, partner));
    console.log('[RBAC] Filtered partners for PAM:', filtered.length);
    return filtered;
}

/**
 * Get gates that are relevant for a specific role
 * Both PAM and PDM can access all gates
 */
export function getRelevantGatesForRole(role: UserRole): GateId[] {
    // Both roles have access to all gates
    return ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];
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
 * PDM (admin) can edit everything, PAM can edit partners they own
 */
export function canEditPartner(user: AuthUser | null, partner: PartnerRecord): boolean {
    if (!user) return false;

    // PDM (admin) can edit everything
    if (user.role === 'PDM') return true;

    // PAM can edit partners they own
    return canAccessPartner(user, partner);
}

/**
 * Check if user can submit a questionnaire for a partner
 * PDM (admin) can submit anything, PAM can submit for partners they own
 */
export function canSubmitQuestionnaire(
    user: AuthUser | null,
    partner: PartnerRecord,
    gateId: GateId
): boolean {
    if (!user) return false;

    // PDM (admin) can submit anything
    if (user.role === 'PDM') return true;

    // PAM must have access to the partner
    return canAccessPartner(user, partner);
}

/**
 * Get partners assigned to a specific user (PAM owner)
 */
export function getAssignedPartners(
    partners: PartnerRecord[],
    userEmail: string
): PartnerRecord[] {
    const email = userEmail.toLowerCase();

    return partners.filter(partner =>
        partner.pamOwner?.toLowerCase() === email
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
        case 'PDM':
            return 'Viewing all partners across all gates (Admin)';
        case 'PAM':
            return 'Viewing your assigned partners across all gates';
        default:
            return 'Viewing your assigned partners';
    }
}

/**
 * Check if user can edit a questionnaire submission
 * PDM (admin) can edit any questionnaire, PAM can edit questionnaires for partners they own
 */
export function canEditQuestionnaire(
    user: AuthUser | null,
    partner: PartnerRecord
): boolean {
    if (!user) return false;

    // PDM (admin) can edit any questionnaire
    if (user.role === 'PDM') return true;

    // PAM can edit questionnaires for partners they own
    return partner.pamOwner?.toLowerCase() === user.email.toLowerCase();
}
