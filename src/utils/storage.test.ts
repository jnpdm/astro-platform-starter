/**
 * Unit tests for Netlify Blobs storage utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getPartner,
    savePartner,
    listPartners,
    deletePartner,
    saveSubmission,
    getSubmission,
    listSubmissionsByPartner,
    deleteSubmission,
    StorageError,
} from './storage';
import type { PartnerRecord } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';

// Mock @netlify/blobs
vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn(),
}));

const mockStore = {
    get: vi.fn(),
    setJSON: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
};

describe('Storage Utilities', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { getStore } = await import('@netlify/blobs');
        vi.mocked(getStore).mockReturnValue(mockStore as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getPartner', () => {
        it('should retrieve a partner by ID', async () => {
            const mockPartner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'john.doe@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            mockStore.get.mockResolvedValue(mockPartner);

            const result = await getPartner('partner-1');

            expect(result).toBeDefined();
            expect(result?.id).toBe('partner-1');
            expect(result?.partnerName).toBe('Test Partner');
            expect(mockStore.get).toHaveBeenCalledWith('partner-1', { type: 'json' });
        });

        it('should return null if partner not found', async () => {
            mockStore.get.mockResolvedValue(null);

            const result = await getPartner('non-existent');

            expect(result).toBeNull();
        });

        it('should deserialize date fields correctly', async () => {
            const mockData = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'john.doe@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-0',
                gates: {},
                contractSignedDate: '2024-01-15T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
            };

            mockStore.get.mockResolvedValue(mockData);

            const result = await getPartner('partner-1');

            expect(result?.createdAt).toBeInstanceOf(Date);
            expect(result?.updatedAt).toBeInstanceOf(Date);
            expect(result?.contractSignedDate).toBeInstanceOf(Date);
        });

        it('should throw StorageError on failure', async () => {
            mockStore.get.mockRejectedValue(new Error('Network error'));

            try {
                await getPartner('partner-1');
                expect.fail('Should have thrown StorageError');
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError);
                expect((error as Error).message).toContain('Failed to retrieve partner partner-1');
            }
        }, 10000);
    });

    describe('savePartner', () => {
        it('should save a partner record', async () => {
            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'john.doe@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            mockStore.setJSON.mockResolvedValue(undefined);

            await savePartner(partner);

            expect(mockStore.setJSON).toHaveBeenCalledWith(
                'partner-1',
                expect.objectContaining({
                    id: 'partner-1',
                    partnerName: 'Test Partner',
                })
            );
        });

        it('should update the updatedAt timestamp', async () => {
            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'john.doe@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            mockStore.setJSON.mockResolvedValue(undefined);

            await savePartner(partner);

            const savedData = mockStore.setJSON.mock.calls[0][1];
            expect(savedData.updatedAt).toBeInstanceOf(Date);
        });

        it('should throw StorageError on failure', async () => {
            const partner: PartnerRecord = {
                id: 'partner-1',
                partnerName: 'Test Partner',
                pamOwner: 'john.doe@example.com',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-0',
                gates: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockStore.setJSON.mockRejectedValue(new Error('Storage full'));

            await expect(savePartner(partner)).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('listPartners', () => {
        it('should list all partners', async () => {
            const mockPartners = [
                {
                    id: 'partner-1',
                    partnerName: 'Partner 1',
                    pamOwner: 'john@example.com',
                    contractType: 'PPA',
                    tier: 'tier-1',
                    ccv: 1000000,
                    lrp: 2000000,
                    currentGate: 'gate-0',
                    gates: {},
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-02T00:00:00.000Z',
                },
                {
                    id: 'partner-2',
                    partnerName: 'Partner 2',
                    pamOwner: 'jane@example.com',
                    contractType: 'Distribution',
                    tier: 'tier-2',
                    ccv: 500000,
                    lrp: 1000000,
                    currentGate: 'gate-1',
                    gates: {},
                    createdAt: '2024-01-03T00:00:00.000Z',
                    updatedAt: '2024-01-04T00:00:00.000Z',
                },
            ];

            mockStore.list.mockResolvedValue({
                blobs: [{ key: 'partner-1' }, { key: 'partner-2' }],
            });

            mockStore.get
                .mockResolvedValueOnce(mockPartners[0])
                .mockResolvedValueOnce(mockPartners[1]);

            const result = await listPartners();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('partner-1');
            expect(result[1].id).toBe('partner-2');
        });

        it('should return empty array if no partners exist', async () => {
            mockStore.list.mockResolvedValue({ blobs: [] });

            const result = await listPartners();

            expect(result).toEqual([]);
        });

        it('should throw StorageError on failure', async () => {
            mockStore.list.mockRejectedValue(new Error('Connection timeout'));

            await expect(listPartners()).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('deletePartner', () => {
        it('should delete a partner', async () => {
            mockStore.delete.mockResolvedValue(undefined);

            await deletePartner('partner-1');

            expect(mockStore.delete).toHaveBeenCalledWith('partner-1');
        });

        it('should throw StorageError on failure', async () => {
            mockStore.delete.mockRejectedValue(new Error('Delete failed'));

            await expect(deletePartner('partner-1')).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('saveSubmission', () => {
        it('should save a questionnaire submission', async () => {
            const submission: QuestionnaireSubmission = {
                id: 'submission-1',
                questionnaireId: 'pre-contract-pdm',
                version: '1.0.0',
                partnerId: 'partner-1',
                sections: [],
                sectionStatuses: {},
                overallStatus: 'pending',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com',
                    timestamp: new Date('2024-01-01'),
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                },
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                ipAddress: '192.168.1.1',
            };

            mockStore.setJSON.mockResolvedValue(undefined);

            await saveSubmission(submission);

            expect(mockStore.setJSON).toHaveBeenCalledWith(
                'submission-1',
                expect.objectContaining({
                    id: 'submission-1',
                    questionnaireId: 'pre-contract-pdm',
                })
            );
        });

        it('should throw StorageError on failure', async () => {
            const submission: QuestionnaireSubmission = {
                id: 'submission-1',
                questionnaireId: 'pre-contract-pdm',
                version: '1.0.0',
                partnerId: 'partner-1',
                sections: [],
                sectionStatuses: {},
                overallStatus: 'pending',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com',
                    timestamp: new Date(),
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                ipAddress: '192.168.1.1',
            };

            mockStore.setJSON.mockRejectedValue(new Error('Storage error'));

            await expect(saveSubmission(submission)).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('getSubmission', () => {
        it('should retrieve a submission by ID', async () => {
            const mockSubmission = {
                id: 'submission-1',
                questionnaireId: 'pre-contract-pdm',
                version: '1.0.0',
                partnerId: 'partner-1',
                sections: [],
                sectionStatuses: {},
                overallStatus: 'pending',
                signature: {
                    type: 'typed',
                    data: 'John Doe',
                    signerName: 'John Doe',
                    signerEmail: 'john@example.com',
                    timestamp: '2024-01-01T00:00:00.000Z',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                },
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
                submittedBy: 'john@example.com',
                submittedByRole: 'PAM',
                ipAddress: '192.168.1.1',
            };

            mockStore.get.mockResolvedValue(mockSubmission);

            const result = await getSubmission('submission-1');

            expect(result).toBeDefined();
            expect(result?.id).toBe('submission-1');
            expect(result?.createdAt).toBeInstanceOf(Date);
            expect(result?.signature.timestamp).toBeInstanceOf(Date);
        });

        it('should return null if submission not found', async () => {
            mockStore.get.mockResolvedValue(null);

            const result = await getSubmission('non-existent');

            expect(result).toBeNull();
        });

        it('should throw StorageError on failure', async () => {
            mockStore.get.mockRejectedValue(new Error('Network error'));

            await expect(getSubmission('submission-1')).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('listSubmissionsByPartner', () => {
        it('should list submissions for a specific partner', async () => {
            const mockSubmissions = [
                {
                    id: 'submission-1',
                    questionnaireId: 'pre-contract-pdm',
                    version: '1.0.0',
                    partnerId: 'partner-1',
                    sections: [],
                    sectionStatuses: {},
                    overallStatus: 'pending',
                    signature: {
                        type: 'typed',
                        data: 'John Doe',
                        signerName: 'John Doe',
                        signerEmail: 'john@example.com',
                        timestamp: '2024-01-01T00:00:00.000Z',
                        ipAddress: '192.168.1.1',
                        userAgent: 'Mozilla/5.0',
                    },
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-02T00:00:00.000Z',
                    submittedBy: 'john@example.com',
                    submittedByRole: 'PAM',
                    ipAddress: '192.168.1.1',
                },
                {
                    id: 'submission-2',
                    questionnaireId: 'gate-0-kickoff',
                    version: '1.0.0',
                    partnerId: 'partner-2',
                    sections: [],
                    sectionStatuses: {},
                    overallStatus: 'pending',
                    signature: {
                        type: 'typed',
                        data: 'Jane Smith',
                        signerName: 'Jane Smith',
                        signerEmail: 'jane@example.com',
                        timestamp: '2024-01-03T00:00:00.000Z',
                        ipAddress: '192.168.1.2',
                        userAgent: 'Mozilla/5.0',
                    },
                    createdAt: '2024-01-03T00:00:00.000Z',
                    updatedAt: '2024-01-04T00:00:00.000Z',
                    submittedBy: 'jane@example.com',
                    submittedByRole: 'PDM',
                    ipAddress: '192.168.1.2',
                },
            ];

            mockStore.list.mockResolvedValue({
                blobs: [{ key: 'submission-1' }, { key: 'submission-2' }],
            });

            mockStore.get
                .mockResolvedValueOnce(mockSubmissions[0])
                .mockResolvedValueOnce(mockSubmissions[1]);

            const result = await listSubmissionsByPartner('partner-1');

            expect(result).toHaveLength(1);
            expect(result[0].partnerId).toBe('partner-1');
        });

        it('should return empty array if no submissions found', async () => {
            mockStore.list.mockResolvedValue({ blobs: [] });

            const result = await listSubmissionsByPartner('partner-1');

            expect(result).toEqual([]);
        });

        it('should throw StorageError on failure', async () => {
            mockStore.list.mockRejectedValue(new Error('Connection error'));

            await expect(listSubmissionsByPartner('partner-1')).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('deleteSubmission', () => {
        it('should delete a submission', async () => {
            mockStore.delete.mockResolvedValue(undefined);

            await deleteSubmission('submission-1');

            expect(mockStore.delete).toHaveBeenCalledWith('submission-1');
        });

        it('should throw StorageError on failure', async () => {
            mockStore.delete.mockRejectedValue(new Error('Delete failed'));

            await expect(deleteSubmission('submission-1')).rejects.toThrow(StorageError);
        }, 10000);
    });

    describe('Retry Logic', () => {
        it('should retry on transient failures', async () => {
            mockStore.get
                .mockRejectedValueOnce(new Error('Temporary error'))
                .mockRejectedValueOnce(new Error('Temporary error'))
                .mockResolvedValueOnce({
                    id: 'partner-1',
                    partnerName: 'Test Partner',
                    pamOwner: 'john@example.com',
                    contractType: 'PPA',
                    tier: 'tier-1',
                    ccv: 1000000,
                    lrp: 2000000,
                    currentGate: 'gate-0',
                    gates: {},
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-02T00:00:00.000Z',
                });

            const result = await getPartner('partner-1');

            expect(result).toBeDefined();
            expect(mockStore.get).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retries', async () => {
            mockStore.get.mockRejectedValue(new Error('Persistent error'));

            await expect(getPartner('partner-1')).rejects.toThrow(StorageError);
            expect(mockStore.get).toHaveBeenCalledTimes(4); // Initial + 3 retries
        }, 10000);
    });
});
