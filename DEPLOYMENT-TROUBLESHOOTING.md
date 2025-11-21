# Deployment Troubleshooting - Action Items

**Date**: November 21, 2024
**Priority**: HIGH

## 🔴 Issue 3: "Failed to load partner data" (HIGHEST PRIORITY)

### Root Cause Analysis

The error message appears because:
1. **Netlify Blobs might not be initialized** - First time accessing Blobs
2. **No partners exist yet** - Empty database showing as error
3. **API route failing** - Check function logs

### Immediate Diagnostic Steps

**Step 1: Check Browser Console**
```
1. Open site in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for error messages
5. Share the exact error text
```

**Step 2: Check Network Tab**
```
1. In DevTools, go to Network tab
2. Refresh the page
3. Find the request to /api/partners
4. Click on it
5. Check:
   - Status code: _____ (should be 200)
   - Response: _____ (should be [] or array of partners)
   - Error message: _____
```

**Step 3: Check Netlify Function Logs**
```
1. Go to Netlify Dashboard
2. Navigate to: Functions
3. Look for recent invocations
4. Check for errors
5. Share any error messages
```

### Likely Scenarios and Fixes

#### Scenario A: Empty Partner List (Most Likely)

**Symptoms**:
- API returns `[]` (empty array)
- Status code: 200
- No errors in console

**This is NORMAL!** The system has no partners yet.

**Fix**: Update dashboard to show friendly empty state instead of error.

**Code change needed in `src/pages/index.astro`**:

```astro
---
// Around line 15-25, update error handling:

let allPartners: PartnerRecord[] = [];
let error: string | null = null;
let isLoading = false;

try {
    allPartners = await listPartners();
    // If we get here, Blobs is working - empty array is OK
} catch (e) {
    console.error('Failed to load partners:', e);
    // Only show error if it's a real error, not empty data
    if (e.message && !e.message.includes('not found')) {
        error = 'Failed to load partner data. Please try again later.';
    }
}
---

<!-- In template, around line 135 -->
{error && (
    <div class="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded mb-6">
        {error}
    </div>
)}

{!error && totalPartners === 0 && (
    <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <h2 class="text-2xl font-bold mb-4">No Partners Yet</h2>
        <p class="text-gray-400 mb-6">Get started by creating your first partner.</p>
        <a href="/partner/new" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Create First Partner
        </a>
    </div>
)}
```

#### Scenario B: Netlify Blobs Not Configured

**Symptoms**:
- API returns 500 error
- Error message mentions "Blobs" or "MissingBlobsEnvironmentError"
- Function logs show Blobs error

**Fix**:

1. **Verify Blobs is Enabled**:
   - Go to Netlify Dashboard → Site Settings → Blobs
   - Should show "Enabled"
   - If not, enable it

2. **Check Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Verify `NETLIFY_BLOBS_CONTEXT` = `production`
   - If missing, add it

3. **Redeploy**:
   - Go to Deploys
   - Click "Trigger deploy" → "Clear cache and deploy site"

#### Scenario C: API Route Not Deployed

**Symptoms**:
- API returns 404
- Network tab shows "Not Found"

**Fix**:

1. **Check Functions**:
   - Go to Netlify Dashboard → Functions
   - Should see functions listed
   - If empty, functions didn't deploy

2. **Verify netlify.toml**:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

3. **Redeploy**:
   - Trigger a new deploy
   - Check build logs for function bundling

---

## 🟡 Issue 2: Password Set Page Not Working

### Root Cause

Netlify Identity widget might not be properly initialized or email template is incorrect.

### Immediate Fixes

#### Fix 1: Verify Widget Initialization

**Check in browser console**:
```javascript
console.log('Widget loaded:', typeof window.netlifyIdentity);
// Should output: "object"
```

If it outputs "undefined", the widget isn't loaded.

#### Fix 2: Test Invitation Flow

1. **Send Test Invitation**:
   - Go to Netlify Dashboard → Identity
   - Click "Invite users"
   - Enter your email
   - Click "Send"

2. **Check Email**:
   - Look for invitation email
   - Check spam folder if not in inbox
   - Email should have a link

3. **Click Link**:
   - Should redirect to your site
   - URL should have `#invite_token=...`
   - Widget should automatically open

4. **If Widget Doesn't Open**:
   - Open browser console
   - Run: `window.netlifyIdentity.open('signup')`
   - This should manually open the widget

#### Fix 3: Check Email Template

1. Go to Netlify Dashboard → Site Settings → Identity → Emails
2. Click "Invitation template"
3. Verify it contains:
   ```
   {{ .SiteURL }}/#invite_token={{ .Token }}
   ```
4. If different, update it

#### Fix 4: Manual Widget Trigger

If automatic opening doesn't work, add this to your layout:

```html
<script>
  // Check for invite token in URL
  const hash = window.location.hash;
  if (hash.includes('invite_token') && window.netlifyIdentity) {
    // Automatically open the widget
    window.netlifyIdentity.open('signup');
  }
</script>
```

---

## 🟢 Issue 1: Roles Not Set (Workaround Available)

### Current Workaround

**Manual role assignment is required** - this is expected behavior with Netlify Identity.

### Process:

1. **User accepts invitation** → Account created
2. **Admin assigns role** → Manual step in Netlify dashboard
3. **User logs out and back in** → Role takes effect

### Long-Term Solution

Implement Netlify Identity webhook to auto-assign roles:

**Create webhook function** (`netlify/functions/identity-signup.js`):

```javascript
exports.handler = async (event) => {
  const { user, event: eventType } = JSON.parse(event.body);
  
  // Only handle signup events
  if (eventType !== 'signup') {
    return { statusCode: 200 };
  }
  
  // Determine role based on email domain or other logic
  let role = 'PAM'; // default role
  
  if (user.email.includes('admin')) {
    role = 'Admin';
  } else if (user.email.includes('pdm')) {
    role = 'PDM';
  } else if (user.email.includes('tpm')) {
    role = 'TPM';
  }
  // Add more logic as needed
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        role: role
      }
    })
  };
};
```

**Configure webhook**:
1. Go to Site Settings → Identity → Webhooks
2. Add webhook for "signup" event
3. URL: `https://your-site.netlify.app/.netlify/functions/identity-signup`

---

## Summary of Actions Needed

### Immediate (Do Now):

1. **Run diagnostic script** in browser console (see above)
2. **Check Netlify function logs** for actual errors
3. **Verify Netlify Blobs is enabled**
4. **Test API endpoint** directly: `/api/partners`
5. **Share diagnostic results** for specific guidance

### Short-Term (Next Hour):

1. **Fix empty state** on dashboard if that's the issue
2. **Test invitation flow** with a real email
3. **Manually assign roles** to existing users
4. **Document the process** for team

### Long-Term (Next Sprint):

1. **Implement webhook** for automatic role assignment
2. **Add better error messages** with specific guidance
3. **Create admin UI** for role management
4. **Add health check endpoint** for monitoring

---

## Need Help?

**Share this information**:
1. Browser console output (from diagnostic script)
2. Network tab screenshot showing /api/partners request
3. Netlify function logs (if any errors)
4. Exact error message from dashboard

This will help diagnose the specific issue quickly!
