# Error Handling and User Feedback System

This document describes the error handling and user feedback system implemented for the Partner Onboarding Hub.

## Components

### 1. ErrorBoundary

A React error boundary component that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Location**: `src/components/ErrorBoundary.tsx`

**Usage**:
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features**:
- Catches and logs component errors
- Displays user-friendly error message
- Provides "Try Again" and "Go Home" actions
- Supports custom fallback UI
- Optional error callback for logging

**Props**:
- `children`: React components to wrap
- `fallback?`: Custom fallback UI to display on error
- `onError?`: Callback function called when error occurs

### 2. Toast Notifications

A toast notification system for displaying success, error, warning, and info messages.

**Location**: `src/components/Toast.tsx`, `src/contexts/ToastContext.tsx`

**Usage**:
```tsx
import { ToastProvider, useToast } from './contexts/ToastContext';

// Wrap your app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// Use toast in components
function MyComponent() {
  const toast = useToast();
  
  const handleSuccess = () => {
    toast.showSuccess('Operation completed successfully!');
  };
  
  const handleError = () => {
    toast.showError('Something went wrong');
  };
  
  return <button onClick={handleSuccess}>Submit</button>;
}
```

**Toast Types**:
- `success`: Green toast for successful operations
- `error`: Red toast for errors
- `warning`: Yellow toast for warnings
- `info`: Blue toast for informational messages

**Toast Methods**:
- `showToast(message, type, duration?)`: Show a toast with custom type
- `showSuccess(message, duration?)`: Show success toast
- `showError(message, duration?)`: Show error toast
- `showWarning(message, duration?)`: Show warning toast
- `showInfo(message, duration?)`: Show info toast

**Features**:
- Auto-dismiss after configurable duration (default 5 seconds)
- Manual dismiss with close button
- Multiple toasts stack vertically
- Smooth animations
- Accessible with ARIA attributes

### 3. API Client with Retry Logic

A utility for making API requests with automatic retry on transient failures.

**Location**: `src/utils/apiClient.ts`

**Usage**:
```tsx
import { apiGet, apiPost, ApiClientError, getErrorMessage } from './utils/apiClient';

// GET request
try {
  const data = await apiGet('/api/partners');
  console.log(data);
} catch (error) {
  const message = getErrorMessage(error);
  toast.showError(message);
}

// POST request with custom retry config
try {
  const result = await apiPost(
    '/api/submissions',
    { data: 'value' },
    { maxRetries: 5, retryDelay: 2000 }
  );
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log('Status:', error.status);
    console.log('Code:', error.code);
  }
}
```

**Features**:
- Automatic retry with exponential backoff
- Configurable retry attempts and delay
- Retries on network errors and specific status codes (408, 429, 500, 502, 503, 504)
- Structured error responses
- Type-safe API responses

**Retry Configuration**:
```typescript
interface RetryConfig {
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  retryableStatuses?: number[]; // Default: [408, 429, 500, 502, 503, 504]
}
```

**API Methods**:
- `apiGet<T>(url, retryConfig?)`: GET request
- `apiPost<T>(url, body, retryConfig?)`: POST request
- `apiPut<T>(url, body, retryConfig?)`: PUT request
- `apiDelete<T>(url, retryConfig?)`: DELETE request
- `getErrorMessage(error)`: Extract user-friendly error message

## Integration Examples

### QuestionnaireForm with Error Handling

```tsx
import { ErrorBoundary } from '../ErrorBoundary';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import { apiPost, getErrorMessage } from '../../utils/apiClient';

function QuestionnaireFormWithErrorHandling() {
  const toast = useToast();
  
  const handleSubmit = async (data) => {
    try {
      await apiPost('/api/submissions', data);
      toast.showSuccess('Questionnaire submitted successfully!');
    } catch (error) {
      const message = getErrorMessage(error);
      toast.showError(message);
    }
  };
  
  return <QuestionnaireForm onSubmit={handleSubmit} />;
}

// Wrap with providers
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QuestionnaireFormWithErrorHandling />
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### API Route Error Handling

API routes already include comprehensive error handling:

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
    
    if (error instanceof StorageError) {
      return new Response(
        JSON.stringify({ success: false, error: error.message, code: error.code }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

## Inline Validation Errors

Form fields display inline validation errors:

```tsx
{error && (
  <p className="mt-1 text-sm text-red-600" role="alert">
    {error}
  </p>
)}
```

**Features**:
- Errors appear below the field
- Red border on invalid fields
- ARIA attributes for accessibility
- Real-time validation as user types
- Clear error messages

## Best Practices

1. **Always wrap interactive components with ErrorBoundary**
   ```tsx
   <ErrorBoundary>
     <InteractiveComponent />
   </ErrorBoundary>
   ```

2. **Use ToastProvider at the app level**
   ```tsx
   <ToastProvider>
     <App />
   </ToastProvider>
   ```

3. **Use apiClient for all API requests**
   ```tsx
   import { apiPost } from './utils/apiClient';
   await apiPost('/api/endpoint', data);
   ```

4. **Show success feedback for user actions**
   ```tsx
   toast.showSuccess('Changes saved successfully');
   ```

5. **Display user-friendly error messages**
   ```tsx
   const message = getErrorMessage(error);
   toast.showError(message);
   ```

6. **Validate input before submission**
   ```tsx
   if (!isValid) {
     toast.showError('Please fix validation errors');
     return;
   }
   ```

7. **Log errors for debugging**
   ```tsx
   console.error('Operation failed:', error);
   ```

## Testing

All error handling components include unit tests:

- `src/components/ErrorBoundary.test.tsx`
- `src/components/Toast.test.tsx`
- `src/utils/apiClient.test.ts`

Run tests with:
```bash
npm run test
```

## Accessibility

All error handling components follow accessibility best practices:

- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML
- Color contrast compliance
- Touch-friendly targets (44px minimum)
