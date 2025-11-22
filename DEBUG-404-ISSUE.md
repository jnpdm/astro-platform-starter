# Debugging 404 Error on /api/partners

**Issue**: Index page shows "Failed to load partners: 404 Not Found"

## Quick Diagnosis

### Step 1: Check What URL is Being Requested

Open your browser console (F12) and run:

```javascript
// Check current page URL
console.log('Current URL:', window.location.href);

// Try fetching the API
fetch('/api/partners')
  .then(r => {
    console.log('Status:', r.status);
    console.log('URL:', r.url);
    return r.text();
  })
  .then(text => console.log('Response:', text))
  .catch(err => console.error('Error:', err));
```

### Step 2: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for the `/api/partners` request
5. Click on it to see:
   - **Request URL**: What URL was actually requested?
   - **Status Code**: What status did it return?
   - **Response**: What was the response body?

### Step 3: Test API Directly

Open a new browser tab and go to:
```
http://localhost:4321/api/partners
```

**Expected**: Should show JSON like `{"success":true,"data":[],"count":0,"totalCount":0}`

**If you see 404**: The API route isn't being served

**If you see JSON**: The API works, but the page is fetching from wrong URL

## Common Causes & Solutions

### Cause 1: Browser Cache

**Symptoms**: API works in new tab but not on index page

**Solution**:
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or clear cache: DevTools → Network tab → Check "Disable cache"
3. Refresh page

### Cause 2: Service Worker

**Symptoms**: Old version of site is cached

**Solution**:
1. Open DevTools → Application tab
2. Click "Service Workers"
3. Click "Unregister" for any service workers
4. Refresh page

### Cause 3: Dev Server Not Restarted

**Symptoms**: Changes not reflected

**Solution**:
```bash
# Stop dev server (Ctrl+C)
# Restart it
npm run dev
```

### Cause 4: Wrong Base URL

**Symptoms**: Fetch goes to wrong domain

**Check in console**:
```javascript
console.log('Fetching from:', new URL('/api/partners', window.location.origin).href);
```

**Should output**: `http://localhost:4321/api/partners`

### Cause 5: CORS or Proxy Issue

**Symptoms**: Request blocked or redirected

**Check in console**: Look for CORS errors

**Solution**: Shouldn't happen with same-origin requests, but if it does:
```javascript
// In astro.config.mjs, add:
server: {
  port: 4321,
  host: true
}
```

## Detailed Debugging Steps

### 1. Verify API Route Exists

```bash
# Check if file exists
ls -la src/pages/api/partners.ts

# Should show the file
```

### 2. Check API Route Content

The file should have:
```typescript
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  // ... implementation
};
```

### 3. Test API with curl

```bash
# Test from command line
curl http://localhost:4321/api/partners

# Should return JSON
```

### 4. Check Browser Request

In DevTools Network tab, look for:
- **Request URL**: Should be `http://localhost:4321/api/partners`
- **Request Method**: Should be `GET`
- **Status Code**: Should be `200` (not `404`)

### 5. Check for Redirects

In Network tab, look for:
- Any redirects (status 301, 302, 307, 308)
- Multiple requests to same URL
- Requests to different domains

## Solutions by Scenario

### Scenario A: API Works in curl, Fails in Browser

**Cause**: Browser cache or service worker

**Solution**:
1. Clear browser cache
2. Disable service workers
3. Hard refresh

### Scenario B: API Returns 404 Everywhere

**Cause**: Route not properly configured

**Solution**:
1. Check `src/pages/api/partners.ts` exists
2. Verify it has `export const prerender = false;`
3. Restart dev server
4. Check astro.config.mjs for adapter configuration

### Scenario C: API Works Sometimes

**Cause**: Race condition or timing issue

**Solution**:
1. Add retry logic to fetch
2. Add delay before fetching
3. Check if page loads before API is ready

### Scenario D: Wrong URL Being Fetched

**Cause**: Base URL or routing issue

**Solution**:
1. Check if page is at correct URL (`http://localhost:4321/`)
2. Verify fetch uses correct path (`/api/partners` not `api/partners`)
3. Check for base tag in HTML

## Quick Fix: Force Absolute URL

If relative URLs aren't working, try absolute URL:

```javascript
// In src/pages/index.astro, change:
const response = await fetch('/api/partners');

// To:
const response = await fetch('http://localhost:4321/api/partners');

// Or use window.location.origin:
const response = await fetch(`${window.location.origin}/api/partners`);
```

## Verify Fix

After applying solution:

1. **Clear cache**: Hard refresh (Ctrl+Shift+R)
2. **Open DevTools**: Check Network tab
3. **Refresh page**: Should see successful request
4. **Check console**: Should see partner data logged
5. **Check page**: Should show "No partners found" (not error)

## Still Not Working?

### Collect Debug Info

Run this in browser console:

```javascript
console.log('=== DEBUG INFO ===');
console.log('Page URL:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Pathname:', window.location.pathname);
console.log('API URL:', new URL('/api/partners', window.location.origin).href);

// Test fetch
fetch('/api/partners')
  .then(r => {
    console.log('Fetch Status:', r.status);
    console.log('Fetch URL:', r.url);
    console.log('Fetch OK:', r.ok);
    return r.text();
  })
  .then(text => {
    console.log('Response Text:', text);
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', json);
    } catch (e) {
      console.log('Not JSON');
    }
  })
  .catch(err => {
    console.error('Fetch Error:', err);
    console.error('Error Type:', err.constructor.name);
    console.error('Error Message:', err.message);
  });
```

Share the output from this script for further diagnosis.

## Most Likely Solution

Based on the symptoms, the most likely cause is **browser cache**. Try this:

1. **Hard refresh**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **If that doesn't work**: Clear browser cache completely
3. **If still not working**: Try in incognito/private window
4. **Last resort**: Restart dev server

The API is working (confirmed by curl), so it's likely a browser-side caching issue.
