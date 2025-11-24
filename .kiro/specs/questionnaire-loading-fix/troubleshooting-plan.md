# Questionnaire Loading Issue - Troubleshooting Plan

## Problem Description
Questionnaire pages only show the header, but the questionnaire content doesn't load. Only the header is visible.

## Potential Causes

### 1. React Component Hydration Failure
**Symptoms**: Loading indicator stays visible, content never appears
**Causes**:
- Component import path incorrect
- Component not exported properly
- React hydration error
- Missing dependencies

### 2. Client-Side JavaScript Error
**Symptoms**: Error boundary might show, or silent failure
**Causes**:
- JavaScript error in component
- Missing props
- Invalid config data
- Context provider issues

### 3. Config File Loading Issue
**Symptoms**: Component receives null/undefined config
**Causes**:
- JSON file not found
- JSON parsing error
- Import path incorrect

### 4. CSS/Display Issue
**Symptoms**: Content is rendered but not visible
**Causes**:
- CSS display:none not being removed
- Z-index issues
- Opacity set to 0

## Troubleshooting Steps

### Step 1: Check Browser Console (CRITICAL)
**Action**: Open browser dev tools and check for:
- JavaScript errors
- Failed network requests
- React hydration warnings
- Component mount errors

**What to look for**:
```
- "Failed to load module"
- "Cannot read property of undefined"
- "Hydration failed"
- "404" errors for component files
```

### Step 2: Verify Component Imports
**Files to check**:
- `src/components/questionnaires/Gate0Questionnaire.tsx`
- `src/components/questionnaires/Gate1Questionnaire.tsx`
- `src/components/questionnaires/PreContractQuestionnaire.tsx`

**Verify**:
- Components exist at these paths
- Components have default exports
- No TypeScript/build errors

### Step 3: Check Config Files
**Files to check**:
- `src/config/questionnaires/gate-0-kickoff.json`
- `src/config/questionnaires/gate-1-ready-to-sell.json`
- `src/config/questionnaires/pre-contract-pdm.json`

**Verify**:
- Files exist
- Valid JSON syntax
- Required fields present

### Step 4: Test Component Hydration
**Check**:
- `client:load` directive is present
- ToastProvider wraps component correctly
- Props are being passed correctly

### Step 5: Inspect DOM
**Action**: Use browser dev tools to inspect the page
**Look for**:
- Is `#questionnaire-content` in the DOM?
- Is it hidden (display:none)?
- Is the loading indicator still visible?
- Is the error boundary showing?

### Step 6: Check Network Tab
**Action**: Open Network tab in dev tools
**Look for**:
- Failed requests for component chunks
- Failed requests for config files
- 404 errors

## Diagnostic Commands

### Check if components exist:
```bash
ls -la src/components/questionnaires/
```

### Check if config files exist:
```bash
ls -la src/config/questionnaires/
```

### Check for build errors:
```bash
npm run build
```

### Check for TypeScript errors:
```bash
npx tsc --noEmit
```

## Quick Fixes to Try

### Fix 1: Verify Component Exports
Ensure components have proper default exports:
```tsx
export default function Gate0Questionnaire(props) {
  // ...
}
```

### Fix 2: Check ToastContext Export
Verify ToastProvider is exported correctly:
```tsx
export { ToastProvider } from './ToastContext';
```

### Fix 3: Add Error Logging
Add console.log to component to verify it's mounting:
```tsx
useEffect(() => {
  console.log('Gate0Questionnaire mounted');
}, []);
```

### Fix 4: Check CSS
Verify loading indicator is being hidden:
```javascript
setTimeout(() => {
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}, 1000);
```

## Expected Behavior

1. Page loads with header visible
2. Loading indicator shows for ~1 second
3. Loading indicator hides
4. Questionnaire component renders
5. Form fields are visible and interactive

## Next Steps

1. Run diagnostic commands
2. Check browser console for errors
3. Verify component and config files exist
4. Test one questionnaire page at a time
5. Add debug logging if needed
