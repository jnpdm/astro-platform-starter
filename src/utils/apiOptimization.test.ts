/**
 * Tests for API Optimization Utilities
 */

import { describe, it, expect } from 'vitest';
import {
    selectPartnerFields,
    selectPartnerFieldsBulk,
    createPartnerSummary,
    createPartnerSummaries,
    parseFieldSelection,
    compressGateData,
    paginate,
    estimateResponseSize
} from './apiOptimization';
import type { PartnerRecord } from '../types/partner';

describe('API Optimization Utilities', () => {
    const mockPartner: PartnerRecord = {
        id: 'partner-1',
        partnerName: 'Test Partner',
        pamOwner: 'John Doe',
        pdmOwner: 'Jane Smith',
        tpmOwner: 'Bob Johnson',
        psmOwner: 'Alice Brown',
        tamOwner: 'Charlie Wilson',
        contractSignedDate: new Date('2024-01-01'),
        contractType: 'PPA',
        tier: 'tier-1',
        ccv: 1000000,
        lrp: 2000000,
        targetLaunchDate: new Date('2024-06-01'),
        actualLaunchDate: undefined,
        onboardingStartDate: new Date('2024-01-15'),
        currentGate: 'gate-1',
        gates: {
            'pre-contract': {
                gateId: 'pre-contract',
                status: 'passed',
                startedDate: new Date('2024-01-01'),
                completedDate: new Date('2024-01-10'),
                questionnaires: {},
                approvals: []
            },
            'gate-0': {
                gateId: 'gate-0',
                status: 'passed',
                startedDate: new Date('2024-01-15'),
                completedDate: new Date('2024-02-01'),
                questionnaires: {},
                approvals: []
            }
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-01')
    };

    describe('selectPartnerFields', () => {
        it('should return all fields when no fields specified', () => {
            const result = selectPartnerFields(mockPartner);
            expect(result).toEqual(mockPartner);
        });

        it('should return only specified fields', () => {
            const result = selectPartnerFields(mockPartner, ['id', 'partnerName', 'tier']);
            expect(result).toEqual({
                id: 'partner-1',
                partnerName: 'Test Partner',
                tier: 'tier-1'
            });
        });

        it('should handle empty fields array', () => {
            const result = selectPartnerFields(mockPartner, []);
            expect(result).toEqual(mockPartner);
        });
    });

    describe('selectPartnerFieldsBulk', () => {
        it('should select fields from multiple partners', () => {
            const partners = [mockPartner, { ...mockPartner, id: 'partner-2' }];
            const result = selectPartnerFieldsBulk(partners, ['id', 'partnerName']);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'partner-1', partnerName: 'Test Partner' });
            expect(result[1]).toEqual({ id: 'partner-2', partnerName: 'Test Partner' });
        });
    });

    describe('createPartnerSummary', () => {
        it('should return minimal fields for list views', () => {
            const result = createPartnerSummary(mockPartner);

            expect(result).toEqual({
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'John Doe',
                tier: 'tier-1',
                currentGate: 'gate-1',
                targetLaunchDate: mockPartner.targetLaunchDate
            });
        });
    });

    describe('createPartnerSummaries', () => {
        it('should create summaries for multiple partners', () => {
            const partners = [mockPartner, { ...mockPartner, id: 'partner-2' }];
            const result = createPartnerSummaries(partners);

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('partnerName');
            expect(result[0]).not.toHaveProperty('gates');
        });
    });

    describe('parseFieldSelection', () => {
        it('should parse comma-separated fields', () => {
            const result = parseFieldSelection('?fields=id,partnerName,tier');
            expect(result).toEqual(['id', 'partnerName', 'tier']);
        });

        it('should handle whitespace', () => {
            const result = parseFieldSelection('?fields=id, partnerName , tier');
            expect(result).toEqual(['id', 'partnerName', 'tier']);
        });

        it('should return undefined when no fields parameter', () => {
            const result = parseFieldSelection('?page=1');
            expect(result).toBeUndefined();
        });

        it('should filter empty strings', () => {
            const result = parseFieldSelection('?fields=id,,partnerName');
            expect(result).toEqual(['id', 'partnerName']);
        });
    });

    describe('compressGateData', () => {
        it('should remove not-started gates', () => {
            const gates = {
                'gate-0': { status: 'not-started' },
                'gate-1': { status: 'passed', completedDate: new Date() }
            };

            const result = compressGateData(gates);
            expect(result).not.toHaveProperty('gate-0');
            expect(result).toHaveProperty('gate-1');
        });

        it('should remove empty optional fields', () => {
            const gates = {
                'gate-1': {
                    status: 'in-progress',
                    startedDate: new Date(),
                    completedDate: undefined,
                    blockers: []
                }
            };

            const result = compressGateData(gates);
            expect(result['gate-1']).toHaveProperty('status');
            expect(result['gate-1']).toHaveProperty('startedDate');
            expect(result['gate-1']).not.toHaveProperty('completedDate');
            expect(result['gate-1']).not.toHaveProperty('blockers');
        });

        it('should keep blockers when present', () => {
            const gates = {
                'gate-1': {
                    status: 'blocked',
                    blockers: ['Missing documentation']
                }
            };

            const result = compressGateData(gates);
            expect(result['gate-1'].blockers).toEqual(['Missing documentation']);
        });
    });

    describe('paginate', () => {
        const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));

        it('should paginate results with default page size', () => {
            const result = paginate(items);

            expect(result.data).toHaveLength(20);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.pageSize).toBe(20);
            expect(result.pagination.total).toBe(50);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(false);
        });

        it('should return correct page', () => {
            const result = paginate(items, { page: 2, pageSize: 20 });

            expect(result.data).toHaveLength(20);
            expect(result.data[0].id).toBe(20);
            expect(result.pagination.page).toBe(2);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(true);
        });

        it('should handle last page', () => {
            const result = paginate(items, { page: 3, pageSize: 20 });

            expect(result.data).toHaveLength(10);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(true);
        });

        it('should enforce maximum page size', () => {
            const result = paginate(items, { pageSize: 200 });
            expect(result.pagination.pageSize).toBe(100);
        });

        it('should enforce minimum page size', () => {
            const result = paginate(items, { pageSize: 0 });
            expect(result.pagination.pageSize).toBe(1);
        });

        it('should handle page out of range', () => {
            const result = paginate(items, { page: 100 });
            expect(result.data).toHaveLength(0);
        });
    });

    describe('estimateResponseSize', () => {
        it('should estimate size in bytes', () => {
            const data = { id: 1, name: 'Test' };
            const size = estimateResponseSize(data);

            expect(size).toBeGreaterThan(0);
            expect(typeof size).toBe('number');
        });

        it('should return larger size for larger objects', () => {
            const small = { id: 1 };
            const large = { id: 1, data: 'x'.repeat(1000) };

            expect(estimateResponseSize(large)).toBeGreaterThan(estimateResponseSize(small));
        });
    });
});
