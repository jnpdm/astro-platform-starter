# Netlify 404 Error - Diagnosis Guide

**Issue**: `/api/partners` returns 404 on deployed Netlify site

## Quick Checks

### 1. Check Netlify Functions Dashboard

1. Go to your Netlify Dashboard
2. Select your site
3. Go to **Functions** tab
4. Look for functions listed

**Expected**: Should see serverless functions for your API routes  
**If empty**: Functions didn't deploy

### 2. Check Build Logs

1. Go to **Deploys** tab
2. Click on latest deploy
3. Scroll through build log
4. Look for:
   ```
   [@astrojs/netlify] Generated SSR Function
   [@astrojs/netlify] Bundling function
   ```

**Expected**: Should see Netlify adapter bundling functions  
**If missing**: Adapter not working correctly

### 3. Test API Directly

Open browser and go to:
```
https://your-site.netlify.app/.netlify/functions/render
```

**Expected**: Should return HTML or error (not 404)  
**If 404**: Functions not deployed

### 4. Check _redirects File

In your deployed site, check if `_redirects` file exists:
1. Go to **Deploys** → Latest deploy
2. Click "Browse deploy"
3. Look for `_redirects` file

**Expected**: Should contain redirect rules  
**Content should include**:
```
/api/*  /.netlify/functions/render  200
/*      /.netlify/functions/render  200
```

## Common Causes

### Cause 1: Astro Adapter Not Configured

**Check `astro.config.mjs`**:
```javascript
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify(),
  // ...
});
```

**Solution**: Ensure adapter is imported and configured

### Cause 2: API Routes Not Marked for SSR

**Check API files** (e.g., `src/pages/api/partners.ts`):
```typescript
export const prerender = false; // ← Must have this!

export const GET: APIRoute = async ({ request }) => {
  // ...
};
```

**Solution**: Add `export const prerender = false;` to all API routes

### Cause 3: Build Failed Silently

**Check build logs** for errors:
- TypeScript errors
- Missing dependencies
- Build failures

**Solution**: Fix any build errors and redeploy

### Cause 4: Wrong Adapter Configuration

**Check if using correct adapter**:
```javascript
// CORRECT for Netlify
import netlify from '@astrojs/netlify';

// WRONG - don't use these on Netlify
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
```

## Solutions

### Solution 1: Verify Astro Config

Ensure `astro.config.mjs` has:

```javascript
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  adapter: netlify(),
  output: 'server', // or 'hybrid'
});
```

### Solution 2: Check Package.json

Ensure you have the Netlify adapter installed:

```json
{
  "dependencies": {
    "@astrojs/netlify": "^5.0.0",
    "astro": "^4.0.0"
  }
}
```

If missing:
```bash
npm install @astrojs/netlify
```

### Solution 3: Clear Cache and Redeploy

1. Go to Netlify Dashboard
2. **Deploys** → **Trigger deploy**
3. Select **Clear cache and deploy site**
4. Wait for deployment to complete

### Solution 4: Check Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Verify these are set:
   ```
   NODE_VERSION=18.20.8
   NETLIFY_BLOBS_CONTEXT=production
   ```

### Solution 5: Manual Function Test

Create a simple test function to verify Functions work:

1. Create `netlify/functions/test.js`:
```javascript
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Functions work!' })
  };
};
```

2. Deploy
3. Test: `https://your-site.netlify.app/.netlify/functions/test`

If this works but API routes don't, it's an Astro adapter issue.

## Debugging Steps

### Step 1: Check What Was Deployed

1. Go to **Deploys** → Latest deploy
2. Click **"Browse deploy"**
3. Check file structure:
   ```
   dist/
   ├── _redirects
   ├── index.html
   └── ...
   
   .netlify/
   └── functions/
       └── render/
           └── (function files)
   ```

### Step 2: Check Build Command

In **Site settings** → **Build & deploy** → **Build settings**:

**Build command**: `npm run build`  
**Publish directory**: `dist`

### Step 3: Check Logs for Errors

Look for these in build logs:

**Good signs**:
```
✓ Completed in XXs
[@astrojs/netlify] Generated SSR Function
[build] Complete!
```

**Bad signs**:
```
Error: ...
Build failed
Module not found
```

### Step 4: Test Locally with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your site
netlify link

# Build
npm run build

# Test locally with Netlify
netlify dev

# Or serve the build
netlify serve
```

Test: `http://localhost:8888/api/partners`

## Quick Fix Attempts

### Fix 1: Remove Conflicting Redirect

The `netlify.toml` has a redirect that might conflict:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**Try removing this** - Astro adapter handles routing automatically.

**Updated `netlify.toml`**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

# Remove the [[redirects]] section for /api/*
# Astro adapter handles this automatically
```

### Fix 2: Ensure Output Mode

In `astro.config.mjs`, explicitly set output mode:

```javascript
export default defineConfig({
  output: 'server', // Force server mode
  adapter: netlify(),
  // ...
});
```

### Fix 3: Reinstall Dependencies

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build

# Commit and push
git add .
git commit -m "Reinstall dependencies"
git push
```

## Expected Behavior

### Correct Setup

When properly configured:

1. **Build**: Astro bundles API routes into serverless function
2. **Deploy**: Function deployed to `/.netlify/functions/render`
3. **Routing**: Astro handles routing internally
4. **Request**: `/api/partners` → routed to function → returns data

### File Structure After Build

```
dist/
├── _redirects          # Generated by Astro adapter
├── index.html
└── ...

.netlify/
└── functions/
    └── render/         # Main SSR function
        ├── entry.mjs   # Your API routes
        └── ...
```

## Still Not Working?

### Collect This Information

1. **Netlify site URL**: `https://your-site.netlify.app`
2. **Build log**: Copy full build log
3. **Functions list**: Screenshot of Functions tab
4. **Error message**: Exact error from browser console
5. **Network tab**: Screenshot showing 404 request

### Check These Files

Share contents of:
- `astro.config.mjs`
- `package.json` (dependencies section)
- `src/pages/api/partners.ts` (first 20 lines)
- Build log (last 50 lines)

## Most Likely Issue

Based on the symptoms, the most likely cause is:

**The Astro Netlify adapter isn't bundling the API routes as serverless functions.**

This usually happens because:
1. `prerender = false` is missing from API routes
2. Adapter not properly configured
3. Build cache causing issues

**Try this**:
1. Verify `export const prerender = false;` in all API files
2. Clear Netlify cache and redeploy
3. Check build logs for adapter messages

The API routes work locally, so the code is correct - it's a deployment configuration issue.
