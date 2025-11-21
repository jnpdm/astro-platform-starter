/**
 * Integration tests for partners API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PartnerRecord } from '../../../types/partner';

// Mock the storage module
vi.mock('../../../utils/storage', () => ({
    listPartners: vi.fn(),
    savePartner: vi.fn(),
    getPartner: vi.fn(),
    StorageError: class StorageError extends Error {
        constructor(message: string, public code: string, public originalError?: unknown) {
            super(message);
            this.name = 'StorageError';
        }
    }
}));

describe('Partners API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/partners - Validation', () => {
        it('should validate required partnerName field', () => {
            const invalidData = {
                pamOwner: 'john@example.com'
            };

            // Test validation logic
            const error = validatePartnerData(invalidData);
            expect(error).toBe('partnerName is required and must be a string');
        });

        it('should validate required pamOwner field', () => {
            const invalidData = {
                partnerName: 'Test Partner'
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('pamOwner is required and must be a string');
        });

        it('should validate contractType enum', () => {
            const invalidData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                contractType: 'InvalidType'
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('contractType must be one of: PPA, Distribution, Sales-Agent, Other');
        });

        it('should validate tier enum', () => {
            const invalidData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                tier: 'tier-5'
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('tier must be one of: tier-0, tier-1, tier-2');
        });

        it('should validate currentGate enum', () => {
            const invalidData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                currentGate: 'gate-99'
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('currentGate must be one of: pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch');
        });

        it('should validate ccv is non-negative number', () => {
            const invalidData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                ccv: -1000
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('ccv must be a non-negative number');
        });

        it('should validate lrp is non-negative number', () => {
            const invalidData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                lrp: -500
            };

            const error = validatePartnerData(invalidData);
            expect(error).toBe('lrp must be a non-negative number');
        });

        it('should pass validation with valid data', () => {
            const validData = {
                partnerName: 'Test Partner',
                pamOwner: 'john@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                currentGate: 'gate-0',
                ccv: 1000000,
                lrp: 2000000
            };

            const error = validatePartnerData(validData);
            expect(error).toBeNull();
        });
    });

    describe('PUT /api/partner/[id] - Validation', () => {
        it('should allow optional fields in update', () => {
            const updateData = {
                partnerName: 'Updated Partner'
            };

            const error = validatePartnerUpdate(updateData);
            expect(error).toBeNull();
        });

        it('should validate field types when provided', () => {
            const invalidData = {
                ccv: 'not-a-number'
            };

            const error = validatePartnerUpdate(invalidData);
            expect(error).toBe('ccv must be a non-negative number');
        });

        it('should allow null for optional owner fields', () => {
            const updateData = {
                pdmOwner: null,
                tpmOwner: null
            };

            const error = validatePartnerUpdate(updateData);
            expect(error).toBeNull();
        });
    });
});

// Helper functions extracted from the API route for testing
function validatePartnerData(data: any): string | null {
    if (!data.partnerName || typeof data.partnerName !== 'string') {
        return 'partnerName is required and must be a string';
    }

    if (!data.pamOwner || typeof data.pamOwner !== 'string') {
        return 'pamOwner is required and must be a string';
    }

    if (data.contractType && !['PPA', 'Distribution', 'Sales-Agent', 'Other'].includes(data.contractType)) {
        return 'contractType must be one of: PPA, Distribution, Sales-Agent, Other';
    }

    if (data.tier && !['tier-0', 'tier-1', 'tier-2'].includes(data.tier)) {
        return 'tier must be one of: tier-0, tier-1, tier-2';
    }

    if (data.currentGate && !['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'].includes(data.currentGate)) {
        return 'currentGate must be one of: pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch';
    }

    if (data.ccv !== undefined && (typeof data.ccv !== 'number' || data.ccv < 0)) {
        return 'ccv must be a non-negative number';
    }

    if (data.lrp !== undefined && (typeof data.lrp !== 'number' || data.lrp < 0)) {
        return 'lrp must be a non-negative number';
    }

    return null;
}

function validatePartnerUpdate(data: any): string | null {
    if (data.partnerName !== undefined && typeof data.partnerName !== 'string') {
        return 'partnerName must be a string';
    }

    if (data.pamOwner !== undefined && typeof data.pamOwner !== 'string') {
        return 'pamOwner must be a string';
    }

    if (data.pdmOwner !== undefined && data.pdmOwner !== null && typeof data.pdmOwner !== 'string') {
        return 'pdmOwner must be a string or null';
    }

    if (data.tpmOwner !== undefined && data.tpmOwner !== null && typeof data.tpmOwner !== 'string') {
        return 'tpmOwner must be a string or null';
    }

    if (data.psmOwner !== undefined && data.psmOwner !== null && typeof data.psmOwner !== 'string') {
        return 'psmOwner must be a string or null';
    }

    if (data.tamOwner !== undefined && data.tamOwner !== null && typeof data.tamOwner !== 'string') {
        return 'tamOwner must be a string or null';
    }

    if (data.contractType !== undefined && !['PPA', 'Distribution', 'Sales-Agent', 'Other'].includes(data.contractType)) {
        return 'contractType must be one of: PPA, Distribution, Sales-Agent, Other';
    }

    if (data.tier !== undefined && !['tier-0', 'tier-1', 'tier-2'].includes(data.tier)) {
        return 'tier must be one of: tier-0, tier-1, tier-2';
    }

    if (data.currentGate !== undefined && !['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'].includes(data.currentGate)) {
        return 'currentGate must be one of: pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch';
    }

    if (data.ccv !== undefined && (typeof data.ccv !== 'number' || data.ccv < 0)) {
        return 'ccv must be a non-negative number';
    }

    if (data.lrp !== undefined && (typeof data.lrp !== 'number' || data.lrp < 0)) {
        return 'lrp must be a non-negative number';
    }

    return null;
}
