/**
 * Partner data migration utilities
 * Handles migration of legacy partner records with deprecated fields
 */

import type { PartnerRecord } from '../types/partner';

/**
 * Legacy partner record that may contain deprecated fields
 */
interface LegacyPartnerRecord extends Omit<PartnerRecord, 'tpmOwner'> {
    tpmOwner?: string;
}

/**
 * Migrates a legacy partner record by removing deprecated fields
 * Logs when deprecated fields are removed for audit purposes
 * 
 * @param partner - Legacy partner record that may contain tpmOwner
 * @returns Migrated partner record without deprecated fields
 */
export function migrateLegacyPartner(partner: any): PartnerRecord {
    const { tpmOwner, ...rest } = partner;

    // Log if tpmOwner was present for audit purposes
    if (tpmOwner) {
        console.warn(
            `[Migration] Partner ${partner.id} (${partner.partnerName}) had tpmOwner: ${tpmOwner} - field removed during migration`
        );
    }

    return rest as PartnerRecord;
}

/**
 * Migrates an array of legacy partner records
 * 
 * @param partners - Array of legacy partner records
 * @returns Array of migrated partner records
 */
export function migrateLegacyPartners(partners: any[]): PartnerRecord[] {
    return partners.map(migrateLegacyPartner);
}

/**
 * Checks if a partner record contains any deprecated fields
 * 
 * @param partner - Partner record to check
 * @returns True if the record contains deprecated fields
 */
export function hasDeprecatedFields(partner: any): boolean {
    return 'tpmOwner' in partner && partner.tpmOwner !== undefined;
}
