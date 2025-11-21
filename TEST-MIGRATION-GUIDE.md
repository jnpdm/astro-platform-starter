# Test Migration Guide for Error Handling

## Overview

The QuestionnaireForm and SignatureCapture components now use the `useToast` hook, which requires components to be wrapped with `ToastProvider`. Existing tests need to be updated to include this provider.

## Quick Fix

### Option 1: Use the Test Utility (Recommended)

Replace imports in test files:

**Before:**
```tsx
import { render, screen } from '@testing-library/react';
```

**After:**
```tsx
import { render, screen } from '../test-utils';
```

The custom `render` function from `test-utils.tsx` automatically wraps components with `ToastProvider` and `ErrorBoundary`.

### Option 2: Manual Wrapping

Wrap components manually in tests:

```tsx
import { render, screen } from '@testing-library/react';
import { ToastProvider } from '../contexts/ToastContext';

test('my test', () => {
  render(
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
  
  // assertions...
});
```

## Files That Need Updates

The following test files need to be updated to use the ToastProvider:

1. `src/components/questionnaires/QuestionnaireForm.test.tsx` - Already passing (likely already wrapped)
2. `src/components/questionnaires/SignatureCapture.test.tsx` - Needs update
3. `src/components/questionnaires/Gate0Questionnaire.test.tsx` - Needs update
4. `src/components/questionnaires/Gate1Questionnaire.test.tsx` - Needs update
5. `src/components/questionnaires/Gate2Questionnaire.test.tsx` - Needs update
6. `src/components/questionnaires/Gate3Questionnaire.test.tsx` - Needs update
7. `src/components/questionnaires/PreContractQuestionnaire.test.tsx` - Needs update

## Example Migration

### Before

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignatureCapture } from './SignatureCapture';

describe('SignatureCapture', () => {
  it('renders with typed mode by default', () => {
    const onSignature = vi.fn();
    render(<SignatureCapture onSignature={onSignature} />);
    
    expect(screen.getByText('Type Name')).toBeInTheDocument();
  });
});
```

### After

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils'; // Changed import
import { SignatureCapture } from './SignatureCapture';

describe('SignatureCapture', () => {
  it('renders with typed mode by default', () => {
    const onSignature = vi.fn();
    render(<SignatureCapture onSignature={onSignature} />);
    
    expect(screen.getByText('Type Name')).toBeInTheDocument();
  });
});
```

## Alternative: Make Toast Optional

If you prefer not to update all tests immediately, you can make the toast hook optional:

```tsx
// In QuestionnaireForm.tsx
import { useToast } from '../../contexts/ToastContext';

export default function QuestionnaireForm(props) {
  // Try to use toast, but don't fail if not available
  let toast;
  try {
    toast = useToast();
  } catch (error) {
    // Toast provider not available (e.g., in tests)
    toast = {
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
    };
  }
  
  // Rest of component...
}
```

However, this approach is **not recommended** as it hides the requirement for the provider and makes tests less realistic.

## Batch Update Script

You can use this sed command to update all test files at once (macOS/Linux):

```bash
# Update imports in all test files
find src -name "*.test.tsx" -type f -exec sed -i '' \
  "s/from '@testing-library\/react'/from '..\/test-utils'/g" {} \;

# For nested directories, adjust the path
find src/components/questionnaires -name "*.test.tsx" -type f -exec sed -i '' \
  "s/from '@testing-library\/react'/from '..\/..\/test-utils'/g" {} \;
```

## Verification

After updating tests, run:

```bash
npm run test -- --run
```

All tests should pass with the ToastProvider properly configured.

## Notes

- The `test-utils.tsx` file provides a centralized place to configure test providers
- This pattern is recommended by React Testing Library
- Future provider additions only need to be added to `test-utils.tsx`
- Tests become more realistic by including actual providers
