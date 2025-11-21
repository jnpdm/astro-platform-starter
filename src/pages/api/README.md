# API Routes Documentation

This directory contains the API routes for the Kuiper Partner Onboarding Hub. All routes return JSON responses with a consistent structure.

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // Optional, for StorageError
}
```

## Partner Routes

### GET /api/partners

List all partner records.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "partner-123",
      "partnerName": "Example Partner",
      "pamOwner": "john.doe@example.com",
      "contractType": "PPA",
      "tier": "tier-1",
      "ccv": 1000000,
      "lrp": 2000000,
      "currentGate": "gate-0",
      "gates": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST /api/partners

Create a new partner record.

**Request Body:**
```json
{
  "partnerName": "Example Partner",
  "pamOwner": "john.doe@example.com",
  "pdmOwner": "jane.smith@example.com",
  "contractType": "PPA",
  "tier": "tier-1",
  "ccv": 1000000,
  "lrp": 2000000,
  "currentGate": "pre-contract",
  "contractSignedDate": "2024-01-15T00:00:00.000Z",
  "targetLaunchDate": "2024-06-01T00:00:00.000Z"
}
```

**Required Fields:**
- `partnerName` (string)
- `pamOwner` (string)

**Optional Fields:**
- `id` (string) - Auto-generated if not provided
- `pdmOwner` (string)
- `tpmOwner` (string)
- `psmOwner` (string)
- `tamOwner` (string)
- `contractType` (enum: 'PPA', 'Distribution', 'Sales-Agent', 'Other') - Default: 'Other'
- `tier` (enum: 'tier-0', 'tier-1', 'tier-2') - Default: 'tier-2'
- `ccv` (number >= 0) - Default: 0
- `lrp` (number >= 0) - Default: 0
- `currentGate` (enum: 'pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch') - Default: 'pre-contract'
- `contractSignedDate` (ISO date string)
- `targetLaunchDate` (ISO date string)
- `actualLaunchDate` (ISO date string)
- `onboardingStartDate` (ISO date string)
- `gates` (object)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "partner-1234567890-abc123",
    "partnerName": "Example Partner",
    ...
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### GET /api/partner/[id]

Retrieve a specific partner record by ID.

**URL Parameters:**
- `id` (string) - Partner ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "partner-123",
    "partnerName": "Example Partner",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing partner ID
- `404` - Partner not found
- `500` - Server error

---

### PUT /api/partner/[id]

Update a specific partner record.

**URL Parameters:**
- `id` (string) - Partner ID

**Request Body:**
Any fields from the partner record can be updated except:
- `id` - Cannot be changed
- `createdAt` - Preserved from original

```json
{
  "partnerName": "Updated Partner Name",
  "currentGate": "gate-1",
  "pdmOwner": "new.pdm@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "partner-123",
    "partnerName": "Updated Partner Name",
    ...
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error or missing partner ID
- `404` - Partner not found
- `500` - Server error

---

## Submission Routes

### POST /api/submissions

Create a new questionnaire submission.

**Request Body:**
```json
{
  "questionnaireId": "pre-contract-pdm",
  "partnerId": "partner-123",
  "version": "1.0.0",
  "submittedBy": "john.doe@example.com",
  "submittedByRole": "PAM",
  "signature": {
    "type": "typed",
    "data": "John Doe",
    "signerName": "John Doe",
    "signerEmail": "john.doe@example.com"
  },
  "sections": [
    {
      "sectionId": "executive-sponsorship",
      "fields": {
        "executiveName": "Jane CEO",
        "executiveTitle": "CEO"
      },
      "status": {
        "result": "pass"
      }
    }
  ],
  "sectionStatuses": {
    "executive-sponsorship": {
      "result": "pass",
      "evaluatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "overallStatus": "pass"
}
```

**Required Fields:**
- `questionnaireId` (string)
- `partnerId` (string)
- `submittedBy` (string)
- `submittedByRole` (enum: 'PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin')
- `signature` (object)
  - `type` (enum: 'typed', 'drawn')
  - `data` (string)
  - `signerName` (string)
  - `signerEmail` (string - valid email format)

**Optional Fields:**
- `id` (string) - Auto-generated if not provided
- `version` (string) - Default: '1.0.0'
- `sections` (array)
- `sectionStatuses` (object)
- `overallStatus` (enum: 'pass', 'fail', 'partial', 'pending') - Default: 'pending'
- `submittedAt` (ISO date string) - Default: current timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission-1234567890-abc123",
    "questionnaireId": "pre-contract-pdm",
    "partnerId": "partner-123",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    ...
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

**Notes:**
- IP address and user agent are automatically captured from the request headers
- The signature timestamp is set to the current time if not provided
- All date fields are converted to Date objects internally

---

### GET /api/submission/[id]

Retrieve a specific questionnaire submission by ID.

**URL Parameters:**
- `id` (string) - Submission ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission-123",
    "questionnaireId": "pre-contract-pdm",
    "partnerId": "partner-123",
    "sections": [...],
    "signature": {...},
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing submission ID
- `404` - Submission not found
- `500` - Server error

---

## Error Handling

All routes implement comprehensive error handling:

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid field types
   - Invalid enum values
   - Invalid email format
   - Negative numbers where non-negative required

2. **Not Found Errors** (404)
   - Partner or submission doesn't exist

3. **Storage Errors** (500)
   - Netlify Blobs connection issues
   - Data persistence failures
   - Includes retry logic (3 attempts with exponential backoff)

4. **JSON Parse Errors** (400)
   - Invalid JSON in request body

## Data Persistence

All data is stored in Netlify Blobs with the following stores:
- `partners` - Partner records
- `submissions` - Questionnaire submissions

The storage layer includes:
- Automatic retry logic (3 attempts)
- Exponential backoff for transient failures
- Date serialization/deserialization
- Comprehensive error handling

## Testing

API route validation logic is tested in:
- `src/pages/api/__tests__/partners.test.ts`
- `src/pages/api/__tests__/submissions.test.ts`

Run tests with:
```bash
npm test
```

## Usage Examples

### Create a Partner
```javascript
const response = await fetch('/api/partners', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    partnerName: 'Acme Corp',
    pamOwner: 'john@example.com',
    tier: 'tier-1',
    ccv: 5000000
  })
});

const result = await response.json();
if (result.success) {
  console.log('Partner created:', result.data.id);
}
```

### Submit a Questionnaire
```javascript
const response = await fetch('/api/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionnaireId: 'pre-contract-pdm',
    partnerId: 'partner-123',
    submittedBy: 'john@example.com',
    submittedByRole: 'PAM',
    signature: {
      type: 'typed',
      data: 'John Doe',
      signerName: 'John Doe',
      signerEmail: 'john@example.com'
    },
    sections: [...],
    overallStatus: 'pass'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Submission created:', result.data.id);
}
```

### Update a Partner
```javascript
const response = await fetch('/api/partner/partner-123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentGate: 'gate-1',
    pdmOwner: 'jane@example.com'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Partner updated');
}
```
