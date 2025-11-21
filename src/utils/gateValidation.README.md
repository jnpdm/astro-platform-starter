# Gate Validation Utilities

This module provides utilities for managing gate progression logic in the Partner Onboarding Hub. It handles validation of gate completion, progression rules, and status calculations based on questionnaire submissions.

## Overview

The gate validation system enforces the structured onboarding journey where partners must complete each gate before progressing to the next. Gates follow this progression order:

1. `pre-contract` - Pre-Contract PDM Engagement
2. `gate-0` - Onboarding Kickoff
3. `gate-1` - Ready to Sell
4. `gate-2` - Ready to Order
5. `gate-3` - Ready to Deliver
6. `post-launch` - Post-Launch Operations

## Core Functions

### `calculateGateStatus(gateProgress, submissions)`

Calculates the current status of a gate based on questionnaire submissions.

**Parameters:**
- `gateProgress: GateProgress` - The gate progress record
- `submissions: Record<string, QuestionnaireSubmission>` - Map of submission IDs to submission objects

**Returns:** `GateStatus` - One of: `'not-started' | 'in-progress' | 'passed' | 'failed' | 'blocked'`

**Logic:**
- Returns `'not-started'` if no questionnaires have been submitted
- Returns `'passed'` if all required questionnaires are submitted and passed
- Returns `'failed'` if any questionnaire has failed
- Returns `'in-progress'` if questionnaires are partial or pending

**Example:**
```typescript
import { calculateGateStatus } from './gateValidation';

const gateProgress = partner.gates['gate-0'];
const status = calculateGateStatus(gateProgress, allSubmissions);
console.log(status); // 'passed', 'failed', 'in-progress', etc.
```

### `canProgressToGate(partner, targetGate, submissions)`

Checks if a partner can progress to a specific gate by validating that all previous gates are complete.

**Parameters:**
- `partner: PartnerRecord` - The partner record
- `targetGate: GateId` - The gate to check progression to
- `submissions: Record<string, QuestionnaireSubmission>` - Map of submission IDs to submission objects

**Returns:** `{ canProgress: boolean; reason?: string }`

**Logic:**
- Always allows access to `pre-contract`
- Checks if previous gate exists and is completed
- Returns reason if progression is blocked

**Example:**
```typescript
import { canProgressToGate } from './gateValidation';

const result = canProgressToGate(partner, 'gate-1', allSubmissions);
if (!result.canProgress) {
    console.log(`Blocked: ${result.reason}`);
    // "Previous gate "Gate 0: Onboarding Kickoff" must be completed before progressing to gate-1"
}
```

### `completeGate(partner, gateId, approvedBy, approvedByRole, signature, notes?)`

Updates a partner record when a gate is completed, marking it as passed and advancing to the next gate.

**Parameters:**
- `partner: PartnerRecord` - The partner record to update
- `gateId: GateId` - The gate that was completed
- `approvedBy: string` - Email of the approving user
- `approvedByRole: string` - Role of the approving user (PAM, PDM, etc.)
- `signature: { type: 'typed' | 'drawn'; data: string }` - Approval signature
- `notes?: string` - Optional approval notes

**Returns:** `PartnerRecord` - Updated partner record

**Side Effects:**
- Sets gate status to `'passed'`
- Records completion date
- Adds approval record with signature
- Clears any blockers
- Advances `currentGate` to next gate
- Initializes next gate if not present
- Updates `updatedAt` timestamp

**Example:**
```typescript
import { completeGate } from './gateValidation';

const updatedPartner = completeGate(
    partner,
    'gate-0',
    'john.doe@example.com',
    'PAM',
    { type: 'typed', data: 'John Doe' },
    'All criteria met, ready to proceed'
);

// Save updatedPartner to storage
await savePartner(updatedPartner);
```

### `blockGate(partner, gateId, blockers)`

Marks a gate as blocked with specific reasons.

**Parameters:**
- `partner: PartnerRecord` - The partner record to update
- `gateId: GateId` - The gate to block
- `blockers: string[]` - Array of reasons why the gate is blocked

**Returns:** `PartnerRecord` - Updated partner record

**Example:**
```typescript
import { blockGate } from './gateValidation';

const updatedPartner = blockGate(
    partner,
    'pre-contract',
    [
        'Missing executive sponsorship confirmation',
        'CCV below strategic threshold'
    ]
);
```

### `getGateBlockers(partner, targetGate, submissions)`

Gets all blockers preventing progression to a gate, including both progression blockers and gate-specific blockers.

**Parameters:**
- `partner: PartnerRecord` - The partner record
- `targetGate: GateId` - The gate to check
- `submissions: Record<string, QuestionnaireSubmission>` - Map of submission IDs to submission objects

**Returns:** `string[]` - Array of blocker descriptions

**Example:**
```typescript
import { getGateBlockers } from './gateValidation';

const blockers = getGateBlockers(partner, 'gate-1', allSubmissions);
if (blockers.length > 0) {
    console.log('Cannot proceed due to:');
    blockers.forEach(blocker => console.log(`- ${blocker}`));
}
```

### `getGateCompletionPercentage(gateProgress, submissions)`

Calculates the completion percentage for a gate based on questionnaire completion.

**Parameters:**
- `gateProgress: GateProgress` - The gate progress record
- `submissions: Record<string, QuestionnaireSubmission>` - Map of submission IDs to submission objects

**Returns:** `number` - Percentage (0-100)

**Example:**
```typescript
import { getGateCompletionPercentage } from './gateValidation';

const percentage = getGateCompletionPercentage(
    partner.gates['gate-1'],
    allSubmissions
);
console.log(`Gate 1 is ${percentage}% complete`);
```

## Helper Functions

### `isGateComplete(gateProgress)`

Simple check if a gate is complete (status is 'passed').

**Example:**
```typescript
import { isGateComplete } from './gateValidation';

if (isGateComplete(partner.gates['gate-0'])) {
    console.log('Gate 0 is complete!');
}
```

### `areAllQuestionnairesComplete(gateProgress, submissions)`

Checks if all required questionnaires for a gate have been submitted and passed.

**Example:**
```typescript
import { areAllQuestionnairesComplete } from './gateValidation';

const allComplete = areAllQuestionnairesComplete(
    partner.gates['gate-1'],
    allSubmissions
);
```

### `initializeGateProgress(gateId)`

Creates a new gate progress record with default values.

**Example:**
```typescript
import { initializeGateProgress } from './gateValidation';

const newGateProgress = initializeGateProgress('gate-0');
partner.gates['gate-0'] = newGateProgress;
```

## Usage Patterns

### Checking if Partner Can Access a Questionnaire

```typescript
import { canProgressToGate } from './gateValidation';

// In questionnaire page
const { canProgress, reason } = canProgressToGate(
    partner,
    'gate-1',
    allSubmissions
);

if (!canProgress) {
    return <Alert type="error">{reason}</Alert>;
}
```

### Updating Partner After Questionnaire Submission

```typescript
import { calculateGateStatus } from './gateValidation';

// After questionnaire submission
const gateProgress = partner.gates[gateId];
gateProgress.questionnaires[questionnaireId] = submissionId;

// Recalculate gate status
const newStatus = calculateGateStatus(gateProgress, allSubmissions);
gateProgress.status = newStatus;

// If all questionnaires passed, complete the gate
if (newStatus === 'passed') {
    const updatedPartner = completeGate(
        partner,
        gateId,
        currentUser.email,
        currentUser.role,
        signature
    );
    await savePartner(updatedPartner);
}
```

### Displaying Gate Progress on Dashboard

```typescript
import { getGateCompletionPercentage, getGateBlockers } from './gateValidation';

// For each gate
const percentage = getGateCompletionPercentage(
    partner.gates[gateId],
    allSubmissions
);

const blockers = getGateBlockers(partner, gateId, allSubmissions);

return (
    <GateCard
        name={gate.name}
        percentage={percentage}
        blockers={blockers}
    />
);
```

### Validating Gate Chain Before Launch

```typescript
import { canProgressToGate } from './gateValidation';

// Before allowing launch
const { canProgress } = canProgressToGate(
    partner,
    'post-launch',
    allSubmissions
);

if (!canProgress) {
    throw new Error('Cannot launch: not all gates are complete');
}
```

## Integration with API Routes

### Example: Gate Completion Endpoint

```typescript
// src/pages/api/partner/[id]/complete-gate.ts
import type { APIRoute } from 'astro';
import { getPartner, savePartner } from '../../../utils/storage';
import { completeGate, canProgressToGate } from '../../../utils/gateValidation';

export const POST: APIRoute = async ({ params, request }) => {
    const { id } = params;
    const { gateId, signature, notes } = await request.json();
    
    // Get partner and submissions
    const partner = await getPartner(id);
    const submissions = {}; // Load from storage
    
    // Validate can complete
    const { canProgress, reason } = canProgressToGate(partner, gateId, submissions);
    if (!canProgress) {
        return new Response(JSON.stringify({ error: reason }), {
            status: 400
        });
    }
    
    // Complete gate
    const updatedPartner = completeGate(
        partner,
        gateId,
        request.headers.get('user-email'),
        request.headers.get('user-role'),
        signature,
        notes
    );
    
    await savePartner(updatedPartner);
    
    return new Response(JSON.stringify(updatedPartner), {
        status: 200
    });
};
```

## Testing

The module includes comprehensive unit tests covering:
- Gate completion checks
- Questionnaire completion validation
- Status calculation logic
- Progression validation
- Gate completion and blocking
- Blocker retrieval
- Completion percentage calculation

Run tests with:
```bash
npm test -- src/utils/gateValidation.test.ts
```

## Requirements Coverage

This implementation satisfies the following requirements:

- **Requirement 1.3**: Partners cannot advance without meeting all criteria at each gate
- **Requirement 1.4**: System blocks progression and displays specific failure reasons
- **Requirement 6.3**: Partners cannot access next gate's questionnaire without completing previous gate
- **Requirement 6.4**: Gate is marked as passed when all questionnaires complete with passing status
