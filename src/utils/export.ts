/**
 * Export utilities for generating CSV files from partner and gate data
 * Implements CSV export functionality for reports and analytics
 */

import type { PartnerRecord, GateId } from '../types/partner';

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
function escapeCSVField(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Converts an array of objects to CSV format
 */
function arrayToCSV(headers: string[], rows: any[][]): string {
    const csvHeaders = headers.map(escapeCSVField).join(',');
    const csvRows = rows.map((row) => row.map(escapeCSVField).join(',')).join('\n');

    return `${csvHeaders}\n${csvRows}`;
}

/**
 * Formats a date for CSV export
 */
function formatDate(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Exports partner list with gate statuses to CSV
 */
export function exportPartnersToCSV(partners: PartnerRecord[]): string {
    const headers = [
        'Partner ID',
        'Partner Name',
        'PAM Owner',
        'PDM Owner',
        'PSM Owner',
        'TAM Owner',
        'Tier',
        'CCV',
        'LRP',
        'Contract Type',
        'Contract Signed Date',
        'Current Gate',
        'Onboarding Start Date',
        'Target Launch Date',
        'Actual Launch Date',
        'Pre-Contract Status',
        'Gate 0 Status',
        'Gate 1 Status',
        'Gate 2 Status',
        'Gate 3 Status',
        'Post-Launch Status',
        'Pre-Contract Completed',
        'Gate 0 Completed',
        'Gate 1 Completed',
        'Gate 2 Completed',
        'Gate 3 Completed',
        'Post-Launch Completed'
    ];

    const rows = partners.map((partner) => {
        const gateIds: GateId[] = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

        return [
            partner.id,
            partner.partnerName,
            partner.pamOwner,
            partner.pdmOwner || '',
            partner.psmOwner || '',
            partner.tamOwner || '',
            partner.tier,
            partner.ccv,
            partner.lrp,
            partner.contractType,
            formatDate(partner.contractSignedDate),
            partner.currentGate,
            formatDate(partner.onboardingStartDate),
            formatDate(partner.targetLaunchDate),
            formatDate(partner.actualLaunchDate),
            ...gateIds.map((gateId) => partner.gates?.[gateId]?.status || 'not-started'),
            ...gateIds.map((gateId) => formatDate(partner.gates?.[gateId]?.completedDate))
        ];
    });

    return arrayToCSV(headers, rows);
}

/**
 * Gate completion metrics for export
 */
export interface GateCompletionMetrics {
    gateId: string;
    gateName: string;
    passed: number;
    failed: number;
    inProgress: number;
    notStarted: number;
    passRate: number;
    avgCompletionDays: number | null;
    completedCount: number;
}

/**
 * Exports gate completion metrics to CSV
 */
export function exportGateMetricsToCSV(metrics: GateCompletionMetrics[]): string {
    const headers = [
        'Gate ID',
        'Gate Name',
        'Passed',
        'Failed',
        'In Progress',
        'Not Started',
        'Pass Rate (%)',
        'Avg Completion Days',
        'Completed Count'
    ];

    const rows = metrics.map((metric) => [
        metric.gateId,
        metric.gateName,
        metric.passed,
        metric.failed,
        metric.inProgress,
        metric.notStarted,
        metric.passRate,
        metric.avgCompletionDays !== null ? metric.avgCompletionDays : 'N/A',
        metric.completedCount
    ]);

    return arrayToCSV(headers, rows);
}

/**
 * Triggers a browser download of CSV content
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Generates a timestamped filename for exports
 */
export function generateExportFilename(prefix: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.csv`;
}
