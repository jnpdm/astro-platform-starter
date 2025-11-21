# Netlify Blobs Storage Utilities

This module provides CRUD operations for partner records and questionnaire submissions using Netlify Blobs as the storage backend.

## Features

- **Partner Management**: Create, read, update, delete, and list partner records
- **Submission Management**: Save and retrieve questionnaire submissions
- **Error Handling**: Custom `StorageError` class with error codes for better debugging
- **Retry Logic**: Automatic retry with exponential backoff for transient failures (3 retries)
- **Type Safety**: Full TypeScript support with proper type definitions
- **Date Serialization**: Automatic conversion between Date objects and ISO strings

## Usage

### Partner Operations

```typescript
import { 
  getPartner, 
  savePartner, 
  listPartners, 
  deletePartner 
} from './utils/storage';

// Get a partner by ID
const partner = await getPartner('partner-123');

// Save a new or updated partner
await savePartner({
  id: 'partner-123',
  partnerName: 'Acme Corp',
  pamOwner: 'john.doe@example.com',
  contractType: 'PPA',
  tier: 'tier-1',
  ccv: 1000000,
  lrp: 2000000,
  currentGate: 'gate-0',
  gates: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

// List all partners
const allPartners = await listPartners();

// Delete a partner
await deletePartner('partner-123');
```

### Submission Operations

```typescript
import { 
  saveSubmission, 
  getSubmission, 
  listSubmissionsByPartner,
  deleteSubmission 
} from './utils/storage';

// Save a questionnaire submission
await saveSubmission({
  id: 'submission-456',
  questionnaireId: 'pre-contract-pdm',
  version: '1.0.0',
  partnerId: 'partner-123',
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
});

// Get a submission by ID
const submission = await getSubmission('submission-456');

// List all submissions for a partner
const partnerSubmissions = await listSubmissionsByPartner('partner-123');

// Delete a submission
await deleteSubmission('submission-456');
```

### Error Handling

```typescript
import { StorageError } from './utils/storage';

try {
  const partner = await getPartner('partner-123');
} catch (error) {
  if (error instanceof StorageError) {
    console.error(`Storage error: ${error.code}`, error.message);
    console.error('Original error:', error.originalError);
  }
}
```

## Error Codes

- `GET_PARTNER_ERROR`: Failed to retrieve a partner record
- `SAVE_PARTNER_ERROR`: Failed to save a partner record
- `LIST_PARTNERS_ERROR`: Failed to list partner records
- `DELETE_PARTNER_ERROR`: Failed to delete a partner record
- `SAVE_SUBMISSION_ERROR`: Failed to save a submission
- `GET_SUBMISSION_ERROR`: Failed to retrieve a submission
- `LIST_SUBMISSIONS_ERROR`: Failed to list submissions
- `DELETE_SUBMISSION_ERROR`: Failed to delete a submission

## Retry Configuration

The storage utilities automatically retry failed operations up to 3 times with exponential backoff:

- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 3 seconds delay

After 3 failed retries, a `StorageError` is thrown.

## Storage Structure

### Netlify Blobs Stores

- `partners`: Stores partner records keyed by partner ID
- `submissions`: Stores questionnaire submissions keyed by submission ID

### Data Serialization

Date objects are automatically serialized to ISO strings when saving and deserialized back to Date objects when retrieving. This ensures proper date handling across storage operations.

## Testing

Run the unit tests with:

```bash
npm test
```

The test suite includes:
- CRUD operations for partners and submissions
- Error handling scenarios
- Retry logic verification
- Date serialization/deserialization
- Edge cases (null values, empty lists, etc.)
