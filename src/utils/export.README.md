# Export Utilities

This module provides CSV export functionality for partner data and gate completion metrics from the reports page.

## Features

- **Partner List Export**: Export all partners with their gate statuses, team assignments, and timeline information
- **Gate Metrics Export**: Export gate completion statistics including pass/fail rates and average completion times
- **CSV Formatting**: Proper handling of special characters (commas, quotes, newlines) in CSV fields
- **Browser Download**: Automatic file download with timestamped filenames

## Usage

### Exporting Partners

```typescript
import { exportPartnersToCSV, downloadCSV, generateExportFilename } from '../utils/export';

const partners = await listPartners();
const csv = exportPartnersToCSV(partners);
const filename = generateExportFilename('partners');
downloadCSV(csv, filename);
```

### Exporting Gate Metrics

```typescript
import { exportGateMetricsToCSV, downloadCSV, generateExportFilename } from '../utils/export';
import type { GateCompletionMetrics } from '../utils/export';

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
const filename = generateExportFilename('gate-metrics');
downloadCSV(csv, filename);
```

## Partner Export Fields

The partner export includes the following columns:

- **Identification**: Partner ID, Partner Name
- **Team Assignments**: PAM Owner, PDM Owner, TPM Owner, PSM Owner, TAM Owner
- **Classification**: Tier, CCV, LRP, Contract Type
- **Timeline**: Contract Signed Date, Onboarding Start Date, Target Launch Date, Actual Launch Date
- **Current Status**: Current Gate
- **Gate Statuses**: Status for each gate (Pre-Contract, Gate 0-3, Post-Launch)
- **Gate Completion Dates**: Completion date for each gate

## Gate Metrics Export Fields

The gate metrics export includes:

- **Gate ID**: Unique identifier for the gate
- **Gate Name**: Display name of the gate
- **Passed**: Number of partners who passed the gate
- **Failed**: Number of partners who failed the gate
- **In Progress**: Number of partners currently in the gate
- **Not Started**: Number of partners who haven't started the gate
- **Pass Rate (%)**: Percentage of partners who passed (of those who attempted)
- **Avg Completion Days**: Average number of days to complete the gate
- **Completed Count**: Total number of partners who completed the gate

## CSV Formatting

The export utilities handle special characters properly:

- **Commas**: Fields containing commas are wrapped in quotes
- **Quotes**: Internal quotes are escaped by doubling them (`"` becomes `""`)
- **Newlines**: Fields with newlines are wrapped in quotes
- **Empty Values**: Null/undefined values are exported as empty strings

## File Naming

Export files are automatically named with timestamps:

- Format: `{prefix}-{timestamp}.csv`
- Example: `partners-2024-11-21T14-30-45.csv`
- Timestamp format: ISO 8601 with colons replaced by hyphens

## Integration with Reports Page

The reports page (`src/pages/reports.astro`) includes export buttons that:

1. Serialize partner and metrics data to JSON in hidden script tags
2. Parse the data on the client side
3. Generate CSV when export buttons are clicked
4. Trigger browser download with timestamped filename

## Testing

Unit tests are provided in `src/utils/export.test.ts` covering:

- Empty data exports
- Single and multiple record exports
- Special character handling (commas, quotes)
- Date formatting
- Null value handling
- Filename generation

Run tests with:

```bash
npm test -- src/utils/export.test.ts
```

## Requirements

Implements **Requirement 10.8**: Report export functionality

- CSV export for partner list with gate statuses ✓
- CSV export for gate completion metrics ✓
- Export utility in `src/utils/export.ts` ✓
