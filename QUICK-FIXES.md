# Quick Fixes for Deployment Issues

## Issue 3: "Failed to load partner data" - IMMEDIATE FIX

This is likely because there are no partners in the system yet, but the error message is misleading.

### Fix: Better Error Handling and Empty State

The dashboard needs to distinguish between:
1. **No partners exist** (empty state - OK)
2. **Actual error** (Blobs not configured, network error, etc.)

### Diagnosis First:

**Check what the actual error is:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the error message
4. Go to Network tab
5. Find the `/api/partners` request
6. Check the response

**Possible scenarios:**

#### Scenario A: API returns empty array `[]`
- **Status**: 200 OK
- **Response**: `[]`
- **Meaning**: No partners yet (this is normal!)
- **Fix**: Show empty state instead of error

#### Scenario B: API returns 500 error
- **Status**: 500 Internal Server Error
- **Response**: Error message
- **Meaning**: Netlify Blobs not configured or actual error
- **Fix**: Check Netlify Blobs configuration

#### Scenario C: API returns 404
- **Status**: 404 Not Found
- **Meaning**: API route not deployed
- **Fix**: Redeploy the site

---

## Immediate Workarounds

### Workaround 1: Create a Test Partner

The easiest way to verify everything works is to create a test partner:

1. Open browser console (F12)
2. Run this command:

```javascript
fetch('/api/partners', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    partnerName: 'Test Partner Inc',
    pamOwner: 'test@example.com',
    contractType: 'PPA',
    tier: 'tier-1',
    ccv: 1000000,
    lrp: 2000000,
    currentGate: 'pre-contract'
  })
})
.then(r => r.json())
.then(data => console.log('Partner created:', data))
.catch(err => console.error('Error:', err));
```

3. Refresh the page
4. If partner appears, everything is working!

### Workaround 2: Check Netlify Blobs

1. Go to Netlify Dashboard
2. Navigate to: Site Settings → Blobs
3. Verify "Enabled" status
4. If not enabled, enable it
5. Redeploy the site

### Workaround 3: Check Function Logs

1. Go to Netlify Dashboard
2. Navigate to: Functions
3. Look for errors in recent invocations
4. Check if `partners` function exists

---

## Issue 2: Password Set Page - IMMEDIATE FIX

### Quick Check:

1. **View Page Source** of your deployed site
2. Search for: `netlify-identity-widget.js`
3. If NOT found, the widget isn't loaded!

### Fix: Ensure Widget is Loaded

Check if `src/layouts/HubLayout.astro` or `src/layouts/Layout.astro` includes the widget:

**Should have in `<head>`:**
```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

**Should have before `</body>`:**
```html
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/";
        });
      }
    });
  }
</script>
```

### Test the Invitation Flow:

1. Go to Netlify Dashboard → Identity
2. Click "Invite users"
3. Enter your email
4. Check email
5. Click invitation link
6. Should see password set form

**If form doesn't appear:**
- Check browser console for errors
- Verify URL has `#invite_token=...`
- Try opening in incognito/private window

---

## Issue 1: Roles Not Set - IMMEDIATE WORKAROUND

### Manual Role Assignment (Do This Now):

For each user that has accepted an invitation:

1. Go to Netlify Dashboard
2. Navigate to: Identity → Users
3. Click on the user
4. Scroll to "User metadata"
5. Click "Edit"
6. Add this JSON:
   ```json
   {
     "role": "Admin"
   }
   ```
7. Replace "Admin" with appropriate role: PAM, PDM, TPM, PSM, TAM, or Admin
8. Click "Save"
9. User must log out and log back in for role to take effect

### Create Admin Checklist:

**After each user accepts invitation:**
- [ ] Go to Netlify Identity dashboard
- [ ] Find the new user
- [ ] Click on user
- [ ] Add role metadata
- [ ] Notify user to log out and back in

---

## Priority Order

### 1. Fix Issue 3 First (Blocking)

**Action**: Check browser console and Netlify function logs to see actual error

**Quick test**:
```bash
# If you have Netlify CLI installed
netlify functions:invoke partners --identity
```

**Or test in browser**:
```javascript
// Open console and run:
fetch('/api/partners')
  .then(r => r.text())
  .then(text => console.log('Response:', text))
  .catch(err => console.error('Error:', err));
```

### 2. Fix Issue 2 (Critical)

**Action**: Verify Netlify Identity widget is loaded on all pages

**Quick test**:
```javascript
// Open console and run:
console.log('Widget loaded:', typeof window.netlifyIdentity !== 'undefined');
```

### 3. Document Issue 1 (Workaround Available)

**Action**: Manually assign roles as users sign up

---

## Emergency Contact Info

If issues persist:

1. **Check Netlify Status**: https://www.netlifystatus.com/
2. **Netlify Support**: https://www.netlify.com/support/
3. **Community Forum**: https://answers.netlify.com/

---

## Diagnostic Script

Run this in browser console to diagnose all issues:

```javascript
console.log('=== Diagnostic Report ===');

// Check 1: Netlify Identity Widget
console.log('1. Identity Widget:', typeof window.netlifyIdentity !== 'undefined' ? '✅ Loaded' : '❌ Not Loaded');

// Check 2: Current User
if (window.netlifyIdentity) {
  const user = window.netlifyIdentity.currentUser();
  console.log('2. Current User:', user ? '✅ Logged In' : '❌ Not Logged In');
  if (user) {
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.user_metadata?.role || '❌ No Role Set');
  }
}

// Check 3: API Access
fetch('/api/partners')
  .then(r => {
    console.log('3. API Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('   - Partners:', Array.isArray(data) ? `✅ ${data.length} partners` : '❌ Invalid response');
  })
  .catch(err => {
    console.log('3. API Status: ❌ Error');
    console.error('   - Error:', err.message);
  });

console.log('=== End Report ===');
```

Copy the output and share it for faster troubleshooting!

---

## Expected Behavior After Fixes

### Successful Deployment Should Show:

1. **Dashboard loads** with either:
   - Empty state: "No Partners Yet" with "Create Partner" button
   - Partner list if partners exist

2. **Invitation flow works**:
   - User receives email
   - Clicks link
   - Sees password set form
   - Creates password
   - Redirected to dashboard

3. **Role assignment**:
   - Admin assigns role manually (for now)
   - User logs out and back in
   - User sees role-appropriate content

---

**Next Steps**: Run the diagnostic script and share the output!
