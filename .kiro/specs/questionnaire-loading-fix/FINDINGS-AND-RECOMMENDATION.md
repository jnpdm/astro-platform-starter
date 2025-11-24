# Questionnaire Loading Issue - Findings & Recommendation

## What We've Learned

### 1. The Problem
- Questionnaire pages show header but no content
- No scripts execute (no console messages, no alerts)
- React components don't hydrate
- Issue exists in both deployed and local environments

### 2. What We Tried
- ✅ Added debug logging - scripts never executed
- ✅ Added `is:inline` directive - still didn't work
- ✅ Added external script file - caused 502 error
- ✅ Verified files are committed and deployed
- ✅ Confirmed user is authenticated
- ❌ Scripts simply don't run on the page

### 3. Root Cause Analysis

The issue is likely **React component hydration failure**. Here's why:

1. **Scripts don't execute** → Client-side JavaScript isn't running
2. **Components use `client:load`** → Requires client-side hydration
3. **Local dev shows React module error** → Import issues with React
4. **No error messages in browser** → Silent failure

The React components are probably failing to hydrate due to:
- Module import issues (we saw `ReactNode` import error)
- SSR/client mismatch
- Missing dependencies

## Recommended Solution

### Option 1: Use `client:only="react"` (Recommended)

This skips server-side rendering entirely and only renders on the client.

**Pros:**
- Avoids SSR/hydration mismatches
- Simpler - no server/client coordination needed
- Will definitely render if client JS works

**Cons:**
- Slower initial load (no SSR)
- SEO impact (but questionnaires don't need SEO)

**Implementation:**
```astro
<ToastProvider client:only="react">
    <Gate0Questionnaire 
        client:only="react" 
        config={gate0Config} 
        existingData={existingSubmission} 
        partnerId={partnerId} 
        mode={mode} 
    />
</ToastProvider>
```

### Option 2: Fix React Import Issues

The local dev error showed:
```
Named export 'ReactNode' not found
```

This suggests TypeScript/React import issues in the components.

**Implementation:**
1. Check all React imports in questionnaire components
2. Change from: `import { ReactNode } from 'react'`
3. To: `import type { ReactNode } from 'react'`
4. Or: `import React from 'react'; type ReactNode = React.ReactNode`

### Option 3: Simplify to Plain HTML/JS

Convert questionnaires to use plain HTML forms with vanilla JavaScript instead of React.

**Pros:**
- No hydration issues
- Faster, simpler
- Guaranteed to work

**Cons:**
- Major refactor required
- Lose React component benefits

## Recommended Next Steps

1. **Test Option 1 locally first**:
   - Change `client:load` to `client:only="react"`
   - Start dev server
   - Test if questionnaire appears
   - If it works, deploy

2. **If Option 1 fails, try Option 2**:
   - Fix React import issues
   - Test locally
   - Deploy if successful

3. **If both fail, consider Option 3**:
   - This is a larger refactor
   - Would need separate planning

## Testing Protocol (No More Blind Deploys!)

1. Make change locally
2. Run `npm run build` - must succeed
3. Start dev server - must start without errors
4. Test in browser at localhost
5. Verify functionality works
6. ONLY THEN commit and deploy

## Quick Win to Try First

Change just the Gate 0 page to use `client:only="react"` and test locally:

```astro
<div id="questionnaire-content">
    <ToastProvider client:only="react">
        <Gate0Questionnaire 
            client:only="react" 
            config={gate0Config} 
            existingData={existingSubmission} 
            partnerId={partnerId} 
            mode={mode} 
        />
    </ToastProvider>
</div>
```

This is a 2-minute change that might solve everything.

## Summary

The questionnaires aren't loading because React components aren't hydrating. The fastest fix is to use `client:only="react"` which skips SSR and renders only on the client. We should test this locally before any more deployments.
