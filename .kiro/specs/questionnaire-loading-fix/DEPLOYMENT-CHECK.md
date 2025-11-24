# Deployment Verification Checklist

## Current Issue
Scripts are not appearing in browser console, even though page loads (200 status).

## Possible Causes
1. **Stale deployment** - Viewing old build without our changes
2. **Build cache** - Netlify using cached build
3. **Script stripping** - Something removing scripts during build/deploy
4. **CSP headers** - Content Security Policy blocking inline scripts

## What I Just Added

### Visual Debug Indicator
Added a **bright yellow box** under the header that says:
```
🔍 Debug Info (v3):
Config ID: gate-0-kickoff
Partner ID: test
Mode: edit
If you see this yellow box, the page is loading!
```

### Inline Script at Top of Page
```html
<script is:inline>
    console.log('=== GATE 0 PAGE LOADED ===');
    console.log('Document ready state:', document.readyState);
    console.log('Location:', window.location.href);
</script>
```

## Verification Steps

### Step 1: Check for Yellow Debug Box
1. Go to: https://pdmgates.netlify.app/questionnaires/gate-0-kickoff?partnerId=test
2. Look for a **yellow box with border** under the header
3. It should say "Debug Info (v3)"

**If you DON'T see the yellow box:**
→ You're viewing an old deployment. Need to trigger new deploy.

**If you DO see the yellow box:**
→ New code is deployed, but scripts still not running. Continue to Step 2.

### Step 2: View Page Source
1. Right-click on page → "View Page Source"
2. Search for "=== GATE 0 PAGE LOADED ==="
3. Search for "is:inline"

**If you find the script:**
→ Script is in HTML but not executing. Likely CSP or browser issue.

**If you DON'T find the script:**
→ Astro is stripping scripts during build. Need different approach.

### Step 3: Check Console Again
After confirming yellow box is visible:
1. Open Console (F12)
2. Refresh page (Cmd+Shift+R or Ctrl+Shift+R to bypass cache)
3. Look for "=== GATE 0 PAGE LOADED ==="

**If you see it:**
→ Scripts are working! Move to next diagnostic step.

**If you DON'T see it:**
→ Scripts are blocked or not executing.

### Step 4: Check Network Tab
1. Open Dev Tools → Network tab
2. Refresh page
3. Look for any blocked requests (red)
4. Check if any .js files are failing to load

### Step 5: Check for CSP Errors
In Console, look for errors like:
```
Refused to execute inline script because it violates Content Security Policy
```

If you see this, we need to adjust the CSP headers in netlify.toml.

## Quick Fixes to Try

### Fix 1: Force New Deployment
If yellow box doesn't appear:
1. Make a small change (add a space somewhere)
2. Commit and push
3. Wait for Netlify to rebuild
4. Clear browser cache and test

### Fix 2: Clear Netlify Cache
In Netlify dashboard:
1. Go to Site Settings
2. Build & Deploy → Clear cache and retry deploy

### Fix 3: Check CSP Headers
If scripts are in source but not executing:
1. Open Network tab
2. Click on the HTML document
3. Check Response Headers for "Content-Security-Policy"
4. If it blocks inline scripts, we need to add 'unsafe-inline' or use nonces

## What to Report Back

Please provide:
1. **Do you see the yellow debug box?** (Yes/No)
2. **What does it say?** (Copy the text)
3. **View Source - do you see "=== GATE 0 PAGE LOADED ==="?** (Yes/No)
4. **Console - any messages at all?** (Copy everything)
5. **Network tab - any failed requests?** (List them)

This will tell us exactly where the problem is!

## Next Steps Based on Results

### If yellow box appears + scripts in source + no console messages:
→ **CSP blocking scripts** - Need to adjust headers

### If yellow box appears + scripts NOT in source:
→ **Astro stripping scripts** - Need to use different approach (external JS file)

### If yellow box DOESN'T appear:
→ **Old deployment** - Need to force new build

### If yellow box appears + scripts work:
→ **Success!** - Can proceed to fix React hydration
