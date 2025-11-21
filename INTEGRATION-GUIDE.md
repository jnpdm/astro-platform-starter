# Error Handling Integration Guide

This guide shows how to integrate the new error handling and user feedback system into existing components.

## Quick Start

### 1. Wrap Components with Error Boundary and Toast Provider

For React components used in Astro pages, wrap them with the error boundary and toast provider:

```tsx
// src/components/questionnaires/PreContractQuestionnaire.tsx
import { ErrorBoundary } from '../ErrorBoundary';
import { ToastProvider } from '../../contexts/ToastContext';
import QuestionnaireForm from './QuestionnaireForm';

export default function PreContractQuestionnaire(props) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QuestionnaireForm {...props} />
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### 2. Use Toast Notifications in Components

```tsx
import { useToast } from '../../contexts/ToastContext';

function MyComponent() {
  const toast = useToast();
  
  const handleSubmit = async () => {
    try {
      await submitData();
      toast.showSuccess('Submitted successfully!');
    } catch (error) {
      toast.showError('Failed to submit');
    }
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

### 3. Use API Client for API Requests

Replace direct `fetch` calls with the API client:

**Before:**
```tsx
const response = await fetch('/api/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  throw new Error('Failed to submit');
}

const result = await response.json();
```

**After:**
```tsx
import { apiPost, getErrorMessage } from '../../utils/apiClient';

try {
  const result = await apiPost('/api/submissions', data);
  toast.showSuccess('Submitted successfully!');
} catch (error) {
  const message = getErrorMessage(error);
  toast.showError(message);
}
```

## Component Updates

### QuestionnaireForm

The QuestionnaireForm component has been updated to:
- Use toast notifications for success/error feedback
- Display inline validation errors
- Show user-friendly error messages

**Usage:**
```tsx
import { ToastProvider } from '../../contexts/ToastContext';
import QuestionnaireForm from './QuestionnaireForm';

<ToastProvider>
  <QuestionnaireForm
    config={config}
    mode="edit"
    onSubmit={handleSubmit}
    partnerId={partnerId}
  />
</ToastProvider>
```

### SignatureCapture

The SignatureCapture component has been updated to:
- Show validation errors via toast
- Confirm successful signature capture
- Provide clear error messages

**Usage:**
```tsx
import { ToastProvider } from '../../contexts/ToastContext';
import { SignatureCapture } from './SignatureCapture';

<ToastProvider>
  <SignatureCapture
    onSignature={handleSignature}
    mode="typed"
    signerEmail="user@example.com"
  />
</ToastProvider>
```

## API Route Error Handling

API routes already include comprehensive error handling. No changes needed, but here's the pattern:

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate input
    const validationError = validateData(body);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Process request
    const result = await processData(body);
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

## Testing

Run tests to verify error handling:

```bash
npm run test -- --run src/components/ErrorBoundary.test.tsx
npm run test -- --run src/components/Toast.test.tsx
npm run test -- --run src/utils/apiClient.test.ts
```

## Checklist

- [ ] Wrap React components with ErrorBoundary
- [ ] Add ToastProvider at component root
- [ ] Replace fetch calls with apiClient
- [ ] Add success notifications for user actions
- [ ] Display error messages via toast
- [ ] Test error scenarios
- [ ] Verify inline validation errors display correctly
- [ ] Check accessibility with screen reader

## Common Patterns

### Form Submission with Error Handling

```tsx
import { useToast } from '../../contexts/ToastContext';
import { apiPost, getErrorMessage } from '../../utils/apiClient';

function FormComponent() {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      await apiPost('/api/endpoint', data);
      toast.showSuccess('Form submitted successfully!');
      // Navigate or reset form
    } catch (error) {
      const message = getErrorMessage(error);
      toast.showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Data Fetching with Error Handling

```tsx
import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { apiGet, getErrorMessage } from '../../utils/apiClient';

function DataComponent() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await apiGet('/api/data');
        setData(result);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.showError(message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;
  
  return <div>{/* render data */}</div>;
}
```

### Retry Failed Operations

```tsx
import { apiPost } from '../../utils/apiClient';

// Retry with custom configuration
const result = await apiPost(
  '/api/endpoint',
  data,
  {
    maxRetries: 5,
    retryDelay: 2000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
);
```

## Next Steps

1. Update remaining questionnaire components to use error handling
2. Add error boundaries to all major page sections
3. Implement error logging service integration
4. Add performance monitoring for API calls
5. Create user documentation for error messages
