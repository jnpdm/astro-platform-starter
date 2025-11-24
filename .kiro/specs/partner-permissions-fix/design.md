# Design Document

## Overview

This design addresses three critical bugs in the partner management system:

1. **Partner Edit Link Bug**: The "Edit Partner" button on the partner detail page incorrectly links to `/api/partner/${id}` (an API endpoint) instead of a proper edit page
2. **API Authentication Bug**: The GET and PUT endpoints in `/api/partner/[id].ts` fail to read user sessions from cookies, causing false "access denied" errors
3. **Gate Page Content Loading**: Gate questionnaire pages may not be rendering content properly due to component hydration issues

The fixes involve creating a partner edit page, correcting cookie handling in API endpoints, and ensuring proper component loading on gate pages.

## Architecture

### Component Structure

```
src/pages/
├── partner/
│   ├── [id].astro          # Detail page (fix link)
│   ├── new.astro           # Create page (reference)
│   └── edit/
│       └── [id].astro      # NEW: Edit page
├── api/
│   └── partner/
│       └── [id].ts         # Fix cookie handling
└── questionnaires/
    ├── gate-0-kickoff.astro
    ├── gate-1-ready-to-sell.astro
    ├── gate-2-ready-to-order.astro
    └── gate-3-ready-to-deliver.astro
```

### Data Flow

1. **Edit Flow**:
   - User clicks "Edit Partner" → Navigate to `/partner/edit/${id}`
   - Edit page loads partner data via GET `/api/partner/${id}` (with cookies)
   - User submits form → PUT `/api/partner/${id}` (with cookies)
   - Redirect to `/partner/${id}` on success

2. **API Authentication Flow**:
   - Request arrives with cookie header
   - Extract cookie header: `request.headers.get('cookie')`
   - Pass to `getUserSession(cookieHeader || undefined)`
   - Apply RBAC rules based on user session

## Components and Interfaces

### Partner Edit Page (`src/pages/partner/edit/[id].astro`)

**Purpose**: Provide a form interface for editing existing partner records

**Structure**:
- Server-side: Load partner data, check edit permissions
- Client-side: Form with validation, submit handler
- Reuses form structure from `partner/new.astro`

**Key Differences from New Page**:
- Pre-populates form with existing partner data
- Uses PUT instead of POST
- Includes all partner fields (not just basic info)
- Validates edit permissions before rendering

### API Endpoint Fixes (`src/pages/api/partner/[id].ts`)

**Changes Required**:
- GET handler: Add cookie header extraction and pass to `getUserSession()`
- PUT handler: Add cookie header extraction and pass to `getUserSession()`
- Maintain consistency with DELETE handler (already correct)

**Pattern to Follow**:
```typescript
const cookieHeader = request.headers.get('cookie');
const currentUser = getUserSession(cookieHeader || undefined);
```

### Gate Page Component Loading

**Current Implementation**:
- Gate pages import React components (e.g., `Gate0Questionnaire`)
- Components wrapped in `ToastProvider` with `client:load`
- Components receive config and props

**Potential Issues**:
- Missing `client:load` directive on components
- Import path errors
- Component not exported properly
- ToastProvider not wrapping correctly

## Data Models

### Partner Edit Form Data

```typescript
interface PartnerEditData {
  // Basic Information
  partnerName: string;
  tier: 'tier-0' | 'tier-1' | 'tier-2';
  
  // Team Assignments
  pamOwner: string;
  pdmOwner?: string;
  tpmOwner?: string;
  psmOwner?: string;
  tamOwner?: string;
  
  // Contract Details
  contractType: 'PPA' | 'Distribution' | 'Sales-Agent' | 'Other';
  contractSignedDate?: Date;
  ccv: number;
  lrp: number;
  
  // Timeline
  onboardingStartDate?: Date;
  targetLaunchDate?: Date;
  actualLaunchDate?: Date;
  
  // Gate Progression
  currentGate: GateId;
  
  // Additional
  description?: string;
  notes?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Edit page navigation

*For any* partner detail page with a user who has edit permissions, clicking the "Edit Partner" button should navigate to `/partner/edit/${partnerId}` and not to an API endpoint
**Validates: Requirements 1.1**

### Property 2: Edit form pre-population

*For any* partner record, when the edit page loads, all form fields should be populated with the current partner data values
**Validates: Requirements 1.2**

### Property 3: Edit form submission

*For any* valid partner edit form submission, the system should successfully update the partner record and redirect to the detail page
**Validates: Requirements 1.3**

### Property 4: Edit button visibility

*For any* user without edit permissions viewing a partner detail page, the "Edit Partner" button should not be rendered
**Validates: Requirements 1.4**

### Property 5: GET endpoint authentication

*For any* GET request to `/api/partner/[id]`, the system should extract and use the cookie header to authenticate the user
**Validates: Requirements 2.1**

### Property 6: PUT endpoint authentication

*For any* PUT request to `/api/partner/[id]`, the system should extract and use the cookie header to authenticate the user
**Validates: Requirements 2.2**

### Property 7: Authenticated access control

*For any* authenticated API request with valid user session, the system should apply role-based access control rules correctly
**Validates: Requirements 2.3**

### Property 8: Unauthenticated request rejection

*For any* API request without a valid user session in cookies, the system should return a 401 Unauthorized response
**Validates: Requirements 2.4**

### Property 9: Gate page component rendering

*For any* gate questionnaire page navigation, the questionnaire form component should render with all sections and fields visible
**Validates: Requirements 3.1, 3.2**

### Property 10: Gate page interactivity

*For any* rendered gate questionnaire form, user interactions with form fields should trigger appropriate responses and validation
**Validates: Requirements 3.3**

## Error Handling

### Edit Page Errors

1. **Partner Not Found**: Redirect to dashboard with error message
2. **Access Denied**: Redirect to dashboard with error message
3. **Load Failure**: Display error banner, allow retry
4. **Submit Failure**: Display inline error, preserve form data

### API Endpoint Errors

1. **Missing Cookie Header**: Return 401 with clear message
2. **Invalid Session**: Return 401 with clear message
3. **Access Denied**: Return 403 with role-specific message
4. **Validation Errors**: Return 400 with field-specific errors
5. **Storage Errors**: Return 500 with generic message (log details)

### Gate Page Errors

1. **Component Load Failure**: Display error message with retry option
2. **Config Load Failure**: Display error message, link to dashboard
3. **Hydration Errors**: Log to console, attempt graceful degradation

## Testing Strategy

### Unit Tests

- Test `getUserSession()` with various cookie strings
- Test RBAC functions with different user roles
- Test form validation logic
- Test API endpoint request/response handling

### Property-Based Tests

Property-based tests will use **fast-check** (JavaScript/TypeScript PBT library) to verify universal properties across many randomly generated inputs.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: partner-permissions-fix, Property {number}: {property_text}**`
- Implement exactly one correctness property from the design document

### Integration Tests

- Test complete edit flow: load → edit → submit → verify
- Test API authentication flow with real cookie headers
- Test gate page rendering with real components
- Test error scenarios end-to-end

### Manual Testing Checklist

1. Verify "Edit Partner" button links to edit page
2. Verify edit form loads with correct data
3. Verify edit form submission updates partner
4. Verify API endpoints work with authenticated requests
5. Verify gate pages render questionnaire content
6. Verify error messages display correctly
