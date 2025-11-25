# Questionnaire Page Formatting Fix

## Problem
The questionnaire Astro pages were causing build failures with "Unexpected t" errors due to malformed JSX syntax. The issue was caused by split closing tags and improper formatting that confused the Astro/esbuild parser.

## Root Cause
The main issues were:
1. **Split closing tags**: Tags like `</a>` were split across lines as `</a\n>`, causing parser errors
2. **Inconsistent formatting**: Manual edits and string replacements created inconsistent formatting
3. **Hidden characters**: Some files had formatting issues that weren't visible in normal editors

## Solution
All five questionnaire pages were rewritten from scratch using a Python script to ensure:
- Consistent formatting across all files
- Proper JSX syntax
- No split closing tags
- Clean, readable code structure

### Files Rewritten
- `src/pages/questionnaires/gate-0-kickoff.astro`
- `src/pages/questionnaires/gate-1-ready-to-sell.astro`
- `src/pages/questionnaires/gate-2-ready-to-order.astro`
- `src/pages/questionnaires/gate-3-ready-to-deliver.astro`
- `src/pages/questionnaires/pre-contract-pdm.astro`

## Prevention
Created `src/__tests__/astro-formatting.test.ts` to automatically detect formatting issues:
- Checks for split closing tags
- Validates file structure
- Runs as part of the test suite

### Running the Formatting Tests
```bash
npm test -- astro-formatting.test.ts
```

## Key Formatting Rules for Astro Templates

### ✅ DO:
```astro
<!-- JSX expression followed by text on same line -->
<h1>
    {mode === 'edit' && <span>Editing: </span>}Gate 0
</h1>

<!-- JSX expression in element content -->
<a href={url} class="link">
    {condition ? 'Option A' : 'Option B'}
</a>

<!-- Proper closing tags -->
</a>
</div>
```

### ❌ DON'T:
```astro
<!-- Split closing tags -->
</a
>

<!-- Malformed attributes -->
class="..."
>

<!-- Inconsistent indentation in JSX -->
```

## Build Verification
After the fix:
- ✅ Build completes successfully
- ✅ All 444 tests pass
- ✅ No TypeScript errors
- ✅ Formatting tests pass

## Future Maintenance
1. Always run `npm run build` before committing changes to questionnaire pages
2. Run formatting tests: `npm test -- astro-formatting.test.ts`
3. Use the Python script template if creating new questionnaire pages
4. Let Prettier/IDE auto-formatting handle the formatting when possible
