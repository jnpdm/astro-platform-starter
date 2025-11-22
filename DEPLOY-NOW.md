# Deploy Now - Fixed Configuration

## Changes Made

### 1. Removed Conflicting Redirect ✅
**File**: `netlify.toml`  
**Change**: Removed manual `/api/*` redirect  
**Reason**: Astro adapter handles routing automatically

### 2. Added Output Mode ✅
**File**: `astro.config.mjs`  
**Change**: Added `output: 'server'`  
**Reason**: Explicitly enables SSR for API routes

## Deploy Steps

### 1. Commit Changes
```bash
git add netlify.toml astro.config.mjs
git commit -m "Fix: Configure Astro adapter for Netlify Functions"
git push origin main
```

### 2. Clear Cache on Netlify
1. Go to Netlify Dashboard
2. **Deploys** → **Trigger deploy**
3. Select **"Clear cache and deploy site"**
4. Wait for deployment

### 3. Verify Deployment
Once deployed, check:

#### A. Functions Tab
- Go to **Functions** tab
- Should see `render` function listed
- Status should be "Active"

#### B. Test API Endpoint
Open in browser:
```
https://your-site.netlify.app/api/partners
```

**Expected**: 
```json
{"success":true,"data":[],"count":0,"totalCount":0}
```

#### C. Test Home Page
Visit:
```
https://your-site.netlify.app
```

**Expected**: Shows "No partners found" (not 404 error)

## What Changed

### Before
```toml
# netlify.toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"  # ← Manual redirect
  status = 200
```

```javascript
// astro.config.mjs
export default defineConfig({
  // No output mode specified
  adapter: netlify()
});
```

### After
```toml
# netlify.toml
# API routes handled by Astro adapter automatically
# (redirect removed)
```

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server', // ← Explicit SSR mode
  adapter: netlify({
    edgeMiddleware: false
  })
});
```

## Why This Fixes It

### Problem
The manual redirect in `netlify.toml` was trying to route `/api/*` to `/.netlify/functions/:splat`, but:
1. Astro adapter creates a single function called `render`
2. The `:splat` variable doesn't match the function name
3. This caused 404 errors

### Solution
1. **Remove manual redirect**: Let Astro adapter handle routing
2. **Add `output: 'server'`**: Explicitly enable SSR mode
3. **Astro generates correct `_redirects`**: Automatically routes all requests to the `render` function

## Expected Build Output

After deploying, you should see in build logs:

```
[@astrojs/netlify] Emitted _redirects
[@astrojs/netlify] Bundling function ../../../build/entry.mjs
[@astrojs/netlify] Generated SSR Function
[build] Server built in X.XXs
[build] Complete!
```

## Troubleshooting

### If Still 404

#### Check 1: Verify Output Mode
```bash
# In astro.config.mjs, should have:
output: 'server'
```

#### Check 2: Verify API Routes Have prerender = false
```typescript
// In src/pages/api/partners.ts
export const prerender = false; // ← Must have this
```

#### Check 3: Check Build Logs
Look for:
- `[@astrojs/netlify] Generated SSR Function` ← Should see this
- Any error messages

#### Check 4: Check Functions Tab
- Should see `render` function
- Not individual API functions

### If Functions Tab Empty

**Cause**: Functions didn't deploy

**Solutions**:
1. Check build logs for errors
2. Verify `@astrojs/netlify` is installed
3. Clear cache and redeploy
4. Check `package.json` has correct adapter version

## Next Steps After Deployment

### 1. Enable Netlify Blobs
1. Go to **Site settings** → **Blobs**
2. Click "Enable Blobs"
3. Confirm

### 2. Test Partner Creation
```bash
curl -X POST https://your-site.netlify.app/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "partnerName": "Test Partner",
    "pamOwner": "John Doe",
    "tier": "tier-1"
  }'
```

**Expected**: Returns success with partner data

### 3. Enable Netlify Identity
1. Go to **Site settings** → **Identity**
2. Click "Enable Identity"
3. Configure settings
4. Invite users

## Summary

✅ **Removed**: Conflicting manual redirect  
✅ **Added**: Explicit SSR output mode  
✅ **Result**: Astro adapter handles routing correctly  
✅ **Ready**: Deploy and test!

**Deploy command**:
```bash
git add .
git commit -m "Fix: Configure Astro adapter for Netlify"
git push origin main
```

Then clear cache and deploy on Netlify!
