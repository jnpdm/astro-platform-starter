# Reports & Analytics Page

## Overview

The Reports & Analytics page (`src/pages/reports.astro`) provides comprehensive metrics and visualizations for partner onboarding progress, gate completion trends, and resource utilization. This page is designed for sales managers and team leads to monitor overall performance and identify bottlenecks in the onboarding process.

## Features

### 1. Summary Statistics

Four key metrics displayed at the top of the page:

- **Total Partners**: Count of all partners in the system
- **Active Gates**: Partners currently in gates (excluding post-launch)
- **Completed Launches**: Partners who have reached post-launch status
- **Avg. Time to Launch**: Average days from onboarding start to actual launch

### 2. Partner Distribution Across Gates

Visual bar chart showing:
- Number of partners at each gate
- Percentage distribution
- Color-coded bars for easy visualization

### 3. Gate Completion Trends

Time-series visualization showing:
- Gate completions over the last 6 months
- Monthly breakdown
- Trend analysis for capacity planning

### 4. Average Time Per Gate

Detailed table displaying:
- Gate name
- Estimated duration (from configuration)
- Actual average days to complete
- Number of partners who have completed each gate

This helps identify gates that are taking longer than expected.

### 5. Gate Pass/Fail Rates

Comprehensive table showing:
- Number of partners who passed each gate
- Number of partners who failed
- Partners currently in progress
- Partners who haven't started
- Pass rate percentage (color-coded: green ≥80%, yellow ≥60%, red <60%)

### 6. PDM Capacity Utilization

Critical metrics for PDM resource management:
- **Active PDMs**: Number of unique PDM owners
- **Partners in PDM Scope**: Partners in Pre-Contract through Gate 1
- **Avg. Partners per PDM**: Current workload per PDM
- **Capacity Utilization**: Visual gauge showing utilization percentage

**Capacity Calculation**:
- Pre-Contract partners: 1 unit each (10-15 hours/week)
- Gate 0-1 partners: 2 units each (full-time engagement)
- Target: 6-8 concurrent partners per PDM
- Color coding:
  - Yellow: <75% (under-utilized)
  - Green: 75-125% (optimal)
  - Red: >125% (over-capacity)

## Data Sources

The page fetches data from:
- **Partner Records**: Via `listPartners()` from storage utilities
- **Gate Configuration**: From `src/config/gates.json`
- **Role-Based Filtering**: Via `filterPartnersByRole()` from RBAC utilities

## Access Control

The page respects role-based access control:
- Users only see partners they have access to based on their role
- PDMs see Pre-Contract through Gate 1 partners
- TPMs see Gate 2 partners
- PSMs/TAMs see Gate 3 and Post-Launch partners
- Admins see all partners

## Requirements Validation

This page validates the following requirements:

- **Requirement 10.1**: Display summary statistics (total partners, partners by gate, average time per gate)
- **Requirement 10.2**: Show partner distribution across gates
- **Requirement 10.3**: Display gate completion trends over time
- **Requirement 10.4**: Show PDM capacity utilization metrics
- **Requirement 10.5**: Show average time to complete each gate and common failure reasons
- **Requirement 10.6**: Support filtering by date range, gate, tier classification, and team member
- **Requirement 10.7**: Show partners at risk of missing launch dates based on current gate progress
- **Requirement 10.9**: Display PDM capacity with 6-8 concurrent partners target

## Technical Implementation

### Calculations

**Partner Distribution**:
```typescript
const partnersByGate = gateOrder.map((gateId) => {
    const count = partners.filter((p) => p.currentGate === gateId).length;
    return {
        gateId,
        count,
        percentage: totalPartners > 0 ? Math.round((count / totalPartners) * 100) : 0
    };
});
```

**Average Time Per Gate**:
```typescript
const completedGates = partners
    .map((p) => p.gates?.[gateId])
    .filter((gate) => gate?.status === 'passed' && gate?.startedDate && gate?.completedDate);

const totalDays = completedGates.reduce((sum, gate) => {
    const start = new Date(gate.startedDate).getTime();
    const end = new Date(gate.completedDate).getTime();
    return sum + (end - start) / (1000 * 60 * 60 * 24);
}, 0);

const avgDays = Math.round(totalDays / completedGates.length);
```

**PDM Capacity**:
```typescript
const pdmLoad = pdmPartners.reduce((sum, p) => {
    if (p.currentGate === 'pre-contract') return sum + 1; // 1 unit
    return sum + 2; // 2 units for active gates
}, 0);

const capacityUtilization = Math.round((pdmLoad / (pdmCount * targetMax)) * 100);
```

### Styling

The page uses:
- Tailwind CSS for layout and styling
- Consistent color scheme with the rest of the application
- Responsive grid layouts
- Visual indicators (color-coded bars and metrics)

### 7. Common Failure Reasons by Gate

Bottleneck identification showing:
- Top 5 failure reasons for each gate
- Number of occurrences for each reason
- Visual bar chart showing relative frequency
- Aggregates data from:
  - Gate blockers in partner records
  - Section failure reasons from questionnaire submissions

This helps identify systemic issues preventing gate progression.

### 8. Partners at Risk of Missing Launch Dates

Risk analysis table displaying:
- Partners with insufficient time buffer
- Risk levels:
  - **High**: Already behind schedule (estimated days remaining > days until launch)
  - **Medium**: Less than 2 weeks buffer
  - **Low**: Adequate buffer (2+ weeks)
- Current gate and PAM owner
- Target launch date
- Days until launch
- Estimated days remaining (based on historical gate completion times)
- Buffer calculation (days until launch - estimated days remaining)

Sorted by risk level and days until launch for prioritization.

### 9. Filtering

All reports support comprehensive filtering:
- **Gate**: Filter to specific gate (Pre-Contract, Gate 0-3, Post-Launch)
- **Tier**: Filter by partner tier classification (Tier 0, 1, 2)
- **Team Member**: Filter by any team member (PAM, PDM, TPM, PSM, TAM)
- **Date Range**: Filter by onboarding start date range (from/to dates)

Filters are applied via URL query parameters and persist across page refreshes.

## Future Enhancements

Potential improvements for future iterations:

1. **Export Functionality**: CSV export for all reports (Requirement 10.8)
2. **Interactive Charts**: Add interactive visualizations using Chart.js or similar
3. **Real-Time Updates**: WebSocket integration for live metrics
4. **Comparison Views**: Compare current period vs. previous period
5. **Team Performance**: Individual PDM/PAM performance metrics
6. **Predictive Analytics**: ML-based predictions for gate completion times

## Testing

Unit tests are located in `src/pages/reports.test.ts` and cover:
- Partner distribution calculations
- Average time per gate calculations
- Gate pass/fail rate calculations
- PDM capacity utilization calculations
- Edge cases (empty data, missing dates)

Run tests with:
```bash
npm test -- src/pages/reports.test.ts --run
```

## Navigation

The Reports page is accessible from:
- Main navigation bar (📈 Reports)
- Dashboard quick links section
- Direct URL: `/reports`
