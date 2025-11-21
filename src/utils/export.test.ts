/**
 * Unit tests for export utilities
 */

import { describe, test, expect } from 'vitest';
import { exportPartnersToCSV, exportGateMetricsToCSV, generateExportFilename } from './export';
import type { PartnerRecord } from '../types/partner';
import type { GateCompletionMetrics } from './export';

describe('exportPartnersToCSV', () => {
    test('exports empty partner list', () => {
        const csv = exportPartnersToCSV([]);
        const lines = csv.split('\n').filter(line => line.trim() !== '');

        expect(lines[0]).toContain('Partner ID');
        expect(lines[0]).toContain('Partner Name');
        expect(lines.length).toBe(1); // Only header
    });

    test('exports single partner with basic data', () => {
        const partner: PartnerRecord = {
            id: 'partner-1',
            partnerName: 'Test Partner',
            pamOwner: 'John Doe',
            contractType: 'PPA',
            tier: 'tier-1',
            ccv: 1000000,
            lrp: 2000000,
            currentGate: 'gate-1',
            gates: {},
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        };

        const csv = exportPartnersToCSV([partner]);
        const lines = csv.split('\n');

        expect(lines.length).toBe(2); // Header + 1 row
        expect(lines[1]).toContain('partner-1');
        expect(lines[1]).toContain('Test Partner');
        expect(lines[1]).toContain('John Doe');
        expect(lines[1]).toContain('tier-1');
        expect(lines[1]).toContain('1000000');
    });

    test('exports partner with all team assignments', () => {
        const partner: PartnerRecord = {
            id: 'partner-2',
            partnerName: 'Full Team Partner',
            pamOwner: 'PAM User',
            pdmOwner: 'PDM User',
            tpmOwner: 'TPM User',
            psmOwner: 'PSM User',
            tamOwner: 'TAM User',
            contractType: 'Distribution',
            tier: 'tier-0',
            ccv: 5000000,
            lrp: 10000000,
            currentGate: 'gate-2',
            gates: {},
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        };

        const csv = exportPartnersToCSV([partner]);
        const lines = csv.split('\n');

        expect(lines[1]).toContain('PAM User');
        expect(lines[1]).toContain('PDM User');
        expect(lines[1]).toContain('TPM User');
        expect(lines[1]).toContain('PSM User');
        expect(lines[1]).toContain('TAM User');
    });

    test('exports partner with gate statuses', () => {
        const partner: PartnerRecord = {
            id: 'partner-3',
            partnerName: 'Gate Progress Partner',
            pamOwner: 'PAM User',
            contractType: 'PPA',
            tier: 'tier-1',
            ccv: 1000000,
            lrp: 2000000,
            currentGate: 'gate-1',
            gates: {
                'pre-contract': {
                    gateId: 'pre-contract',
                    status: 'passed',
                    completedDate: new Date('2024-01-15T12:00:00Z'),
                    questionnaires: {},
                    approvals: []
                },
                'gate-0': {
                    gateId: 'gate-0',
                    status: 'passed',
                    completedDate: new Date('2024-02-15T12:00:00Z'),
                    questionnaires: {},
                    approvals: []
                },
                'gate-1': {
                    gateId: 'gate-1',
                    status: 'in-progress',
                    questionnaires: {},
                    approvals: []
                }
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        };

        const csv = exportPartnersToCSV([partner]);
        const lines = csv.split('\n');

        expect(lines[1]).toContain('passed');
        expect(lines[1]).toContain('in-progress');
        // Check for date presence (format may vary by locale/timezone)
        expect(lines[1]).toMatch(/Jan \d{1,2}, 2024/);
        expect(lines[1]).toMatch(/Feb \d{1,2}, 2024/);
    });

    test('handles partner names with commas', () => {
        const partner: PartnerRecord = {
            id: 'partner-4',
            partnerName: 'Partner, Inc.',
            pamOwner: 'John Doe',
            contractType: 'PPA',
            tier: 'tier-1',
            ccv: 1000000,
            lrp: 2000000,
            currentGate: 'gate-1',
            gates: {},
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        };

        const csv = exportPartnersToCSV([partner]);
        const lines = csv.split('\n');

        // Name with comma should be wrapped in quotes
        expect(lines[1]).toContain('"Partner, Inc."');
    });

    test('handles partner names with quotes', () => {
        const partner: PartnerRecord = {
            id: 'partner-5',
            partnerName: 'Partner "Best" Company',
            pamOwner: 'John Doe',
            contractType: 'PPA',
            tier: 'tier-1',
            ccv: 1000000,
            lrp: 2000000,
            currentGate: 'gate-1',
            gates: {},
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        };

        const csv = exportPartnersToCSV([partner]);
        const lines = csv.split('\n');

        // Quotes should be escaped
        expect(lines[1]).toContain('Partner ""Best"" Company');
    });

    test('exports multiple partners', () => {
        const partners: PartnerRecord[] = [
            {
                id: 'partner-1',
                partnerName: 'Partner One',
                pamOwner: 'PAM 1',
                contractType: 'PPA',
                tier: 'tier-1',
                ccv: 1000000,
                lrp: 2000000,
                currentGate: 'gate-1',
                gates: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'partner-2',
                partnerName: 'Partner Two',
                pamOwner: 'PAM 2',
                contractType: 'Distribution',
                tier: 'tier-0',
                ccv: 5000000,
                lrp: 10000000,
                currentGate: 'gate-2',
                gates: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }
        ];

        const csv = exportPartnersToCSV(partners);
        const lines = csv.split('\n');

        expect(lines.length).toBe(3); // Header + 2 rows
        expect(lines[1]).toContain('Partner One');
        expect(lines[2]).toContain('Partner Two');
    });
});

describe('exportGateMetricsToCSV', () => {
    test('exports empty metrics', () => {
        const csv = exportGateMetricsToCSV([]);
        const lines = csv.split('\n').filter(line => line.trim() !== '');

        expect(lines[0]).toContain('Gate ID');
        expect(lines[0]).toContain('Gate Name');
        expect(lines[0]).toContain('Pass Rate');
        expect(lines.length).toBe(1); // Only header
    });

    test('exports single gate metric', () => {
        const metrics: GateCompletionMetrics[] = [
            {
                gateId: 'gate-1',
                gateName: 'Gate 1: Ready to Sell',
                passed: 10,
                failed: 2,
                inProgress: 5,
                notStarted: 3,
                passRate: 83,
                avgCompletionDays: 45,
                completedCount: 12
            }
        ];

        const csv = exportGateMetricsToCSV(metrics);
        const lines = csv.split('\n');

        expect(lines.length).toBe(2); // Header + 1 row
        expect(lines[1]).toContain('gate-1');
        expect(lines[1]).toContain('Gate 1: Ready to Sell');
        expect(lines[1]).toContain('10');
        expect(lines[1]).toContain('2');
        expect(lines[1]).toContain('5');
        expect(lines[1]).toContain('3');
        expect(lines[1]).toContain('83');
        expect(lines[1]).toContain('45');
        expect(lines[1]).toContain('12');
    });

    test('handles null average completion days', () => {
        const metrics: GateCompletionMetrics[] = [
            {
                gateId: 'gate-0',
                gateName: 'Gate 0: Kickoff',
                passed: 0,
                failed: 0,
                inProgress: 5,
                notStarted: 10,
                passRate: 0,
                avgCompletionDays: null,
                completedCount: 0
            }
        ];

        const csv = exportGateMetricsToCSV(metrics);
        const lines = csv.split('\n');

        expect(lines[1]).toContain('N/A');
    });

    test('exports multiple gate metrics', () => {
        const metrics: GateCompletionMetrics[] = [
            {
                gateId: 'gate-1',
                gateName: 'Gate 1: Ready to Sell',
                passed: 10,
                failed: 2,
                inProgress: 5,
                notStarted: 3,
                passRate: 83,
                avgCompletionDays: 45,
                completedCount: 12
            },
            {
                gateId: 'gate-2',
                gateName: 'Gate 2: Ready to Order',
                passed: 8,
                failed: 1,
                inProgress: 3,
                notStarted: 8,
                passRate: 89,
                avgCompletionDays: 30,
                completedCount: 9
            }
        ];

        const csv = exportGateMetricsToCSV(metrics);
        const lines = csv.split('\n');

        expect(lines.length).toBe(3); // Header + 2 rows
        expect(lines[1]).toContain('Gate 1: Ready to Sell');
        expect(lines[2]).toContain('Gate 2: Ready to Order');
    });

    test('handles gate names with special characters', () => {
        const metrics: GateCompletionMetrics[] = [
            {
                gateId: 'gate-1',
                gateName: 'Gate 1: "Ready to Sell", Phase A',
                passed: 5,
                failed: 1,
                inProgress: 2,
                notStarted: 2,
                passRate: 83,
                avgCompletionDays: 45,
                completedCount: 6
            }
        ];

        const csv = exportGateMetricsToCSV(metrics);
        const lines = csv.split('\n');

        // Should handle quotes and commas properly
        expect(lines[1]).toContain('Gate 1: ""Ready to Sell"", Phase A');
    });
});

describe('generateExportFilename', () => {
    test('generates filename with prefix and timestamp', () => {
        const filename = generateExportFilename('partners');

        expect(filename).toMatch(/^partners-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    test('generates different filenames for different prefixes', () => {
        const filename1 = generateExportFilename('partners');
        const filename2 = generateExportFilename('metrics');

        expect(filename1).toContain('partners-');
        expect(filename2).toContain('metrics-');
    });
});
