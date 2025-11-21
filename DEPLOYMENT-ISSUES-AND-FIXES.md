# Deployment Issues and Fixes

**Date**: November 21, 2024
**Status**: 🔧 Troubleshooting

## Issues Encountered

### Issue 1: Roles Not Set When Enabling Netlify Identity ❌

**Problem**: When users are invited through Netlify Identity, their roles are not automatically set.

**Root Cause**: Netlify Identity doesn't automatically add custom metadata (like roles) when users are invited. This must be done manually after the user accepts the invitation.

**Solution**:

#### Option A: Manual Role Assignment (Current Method)
1. User accepts invitation and creates account
2. Admin goes to Netlify Identity dashboard
3. Admin clicks on the user
4. Admin adds user metadata manually:
   ```json
   {
     "role": "PAM"
   }
   ```

#### Option B: Use Netlify Identity Webhooks (Recommended)
Set up a webhook to automatically assign a default role when users sign up.

**Implementation**:

1. Create a Netlify Function to handle user signup:

```javascript
// netlify/functions/identity-signup.js
exports.handler = async (event) => {
  const { user } = JSON.parse(event.body);
  
  // Assign default role based on email domain or other logic
  const defaultRole = 'PAM'; // or determine based on email
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        role: defaultRole
      }
    })
  };
};
```

2. Configure webhook in Netlify Identity settings:
   - Go to Site Settings → Identity → Webhooks
   - Add webhook for "signup" event
   - Point to: `/.netlify/functions/identity-signup`

#### Option C: Pre-assign Roles in Invitation (Best for Small Teams)
When inviting users, include role in the invitation metadata (requires Netlify API):

```bash
curl -X POST https://api.netlify.com/api/v1/sites/{site_id}/identity/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "user_metadata": {
      "role": "PAM"
    }
  }'
```

**Workaround for Now**:
- Document that admins must manually assign roles after users accept invitations
- Create a checklist for user onboarding
- Consider creating a simple admin UI to assign roles

---

### Issue 2: Password Set Page Not Working ❌

**Problem**: When users accept an invitation, they cannot set their password.

**Root Cause**: Netlify Identity widget may not be properly initialized or configured on the site.

**Solution**:

#### Step 1: Verify Netlify Identity Widget is Loaded

Check `src/layouts/HubLayout.astro` to ensure the widget is properly included:

```astro
---
// In the frontmatter
---

<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... other head content ... -->
    
    <!-- Netlify Identity Widget -->
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
    <!-- ... body content ... -->
    
    <!-- Initialize Netlify Identity -->
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
</body>
</html>
```

#### Step 2: Check Netlify Identity Configuration

1. Go to Netlify Dashboard → Site Settings → Identity
2. Verify these settings:
   - ✅ Identity is enabled
   - ✅ Registration is set to "Invite only"
   - ✅ Email confirmations are enabled
   - ✅ External providers are configured (if using)

#### Step 3: Check Email Templates

1. Go to Site Settings → Identity → Emails
2. Verify invitation email template includes correct link
3. Default template should have: `{{ .SiteURL }}/#invite_token={{ .Token }}`

#### Step 4: Test the Flow

1. Send a test invitation to yourself
2. Check email for invitation link
3. Click link - should redirect to your site with `#invite_token=...` in URL
4. Netlify Identity widget should automatically open password set form

**If Still Not Working**:

Create a dedicated invitation acceptance page:

```astro
---
// src/pages/accept-invite.astro
export const prerender = false;
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accept Invitation</title>
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
        <div style="text-align: center;">
            <h1>Setting up your account...</h1>
            <p>Please wait while we process your invitation.</p>
        </div>
    </div>
    
    <script>
      if (window.netlifyIdentity) {
        // Open the widget automatically
        window.netlifyIdentity.open();
        
        // Handle successful signup
        window.netlifyIdentity.on("signup", user => {
          window.netlifyIdentity.close();
          alert("Account created! Please wait for an admin to assign your role.");
          window.location.href = "/";
        });
        
        // Handle errors
        window.netlifyIdentity.on("error", err => {
          console.error("Error:", err);
          alert("There was an error setting up your account. Please contact support.");
        });
      }
    </script>
</body>
</html>
```

Then update invitation email template to point to: `{{ .SiteURL }}/accept-invite#invite_token={{ .Token }}`

---

### Issue 3: Home Page Shows "Failed to load partner data" ❌

**Problem**: Dashboard displays error message instead of partner list.

**Root Cause**: Netlify Blobs is not properly configured or the API route is failing.

**Diagnosis Steps**:

#### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed API calls

#### Step 2: Check Netlify Function Logs
1. Go to Netlify Dashboard → Functions
2. Look for errors in the logs
3. Check if `/api/partners` function is being called

#### Step 3: Verify Netlify Blobs is Enabled
1. Go to Netlify Dashboard → Site Settings → Blobs
2. Verify "Enabled" status
3. Check if stores are created (they're created on first use)

**Common Causes and Solutions**:

#### Cause A: Netlify Blobs Not Configured

**Solution**: Netlify Blobs should be automatically available, but verify environment:

1. Check environment variables in Netlify Dashboard:
   - `NETLIFY_BLOBS_CONTEXT` should be set to `production`

2. Verify the site is deployed (not just previewing locally)

#### Cause B: Empty Partner List (Expected Behavior)

**Solution**: The error might actually be correct - there are no partners yet!

Update the dashboard to handle empty state better:

```astro
---
// src/pages/index.astro
// In the script section, update error handling:

let partners = [];
let error = null;

try {
  const response = await fetch('/api/partners');
  if (response.ok) {
    partners = await response.json();
  } else if (response.status === 404 || response.status === 204) {
    // No partners yet - this is OK
    partners = [];
  } else {
    error = 'Failed to load partner data';
  }
} catch (e) {
  console.error('Error loading partners:', e);
  error = 'Failed to load partner data';
}
---

<!-- In the template -->
{error && (
  <div class="error-message">
    {error}. Please try again later.
  </div>
)}

{!error && partners.length === 0 && (
  <div class="empty-state">
    <h2>No Partners Yet</h2>
    <p>Get started by creating your first partner.</p>
    <a href="/partner/new" class="button">Create Partner</a>
  </div>
)}

{!error && partners.length > 0 && (
  <!-- Display partners -->
)}
```

#### Cause C: API Route Not Deployed

**Solution**: Verify API routes are deployed:

1. Check Netlify Dashboard → Functions
2. Should see functions listed
3. Test API directly: `https://your-site.netlify.app/api/partners`

If not deployed, check `netlify.toml`:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### Cause D: Authentication Blocking API Access

**Solution**: Check if middleware is blocking unauthenticated requests:

```typescript
// src/middleware/auth.ts
// Ensure API routes allow access or handle auth properly

export function onRequest(context, next) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Allow API routes to handle their own auth
  if (url.pathname.startsWith('/api/')) {
    return next();
  }
  
  // ... rest of auth logic
}
```

#### Cause E: CORS Issues

**Solution**: Add CORS headers to API responses:

```typescript
// src/pages/api/partners.ts
export const GET: APIRoute = async ({ request }) => {
  try {
    const partners = await listPartners();
    
    return new Response(JSON.stringify(partners), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Or your specific domain
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load partners' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
```

---

## Quick Fixes Summary

### Fix 1: Role Assignment
**Immediate**: Manually assign roles after user signup
**Long-term**: Implement Netlify Identity webhook

### Fix 2: Password Set Page
**Check**: Netlify Identity widget is loaded on all pages
**Verify**: Email template has correct invitation link
**Test**: Send test invitation and follow the flow

### Fix 3: Partner Data Loading
**Check**: Browser console for specific error
**Verify**: Netlify Blobs is enabled
**Test**: API endpoint directly: `/api/partners`
**Fix**: Handle empty state gracefully

---

## Testing Checklist

### Test Identity Flow
- [ ] Send invitation email
- [ ] Receive email with invitation link
- [ ] Click link - redirects to site
- [ ] Password set form appears
- [ ] Can set password successfully
- [ ] Redirected to dashboard after signup
- [ ] Admin assigns role
- [ ] User can log in with role

### Test Dashboard
- [ ] Dashboard loads without errors
- [ ] Empty state shows when no partners
- [ ] Can create first partner
- [ ] Partner appears in list
- [ ] Can view partner details
- [ ] Can edit partner
- [ ] Role-based access works

### Test API Routes
- [ ] `/api/partners` returns 200 or empty array
- [ ] `/api/partners` POST creates partner
- [ ] `/api/partner/[id]` GET retrieves partner
- [ ] `/api/partner/[id]` PUT updates partner
- [ ] Error responses are properly formatted

---

## Debugging Commands

### Check Netlify Function Logs
```bash
netlify functions:list
netlify functions:invoke partners
```

### Test API Locally
```bash
npm run dev
curl http://localhost:4321/api/partners
```

### Check Netlify Blobs
```bash
netlify blobs:list
```

---

## Support Resources

- **Netlify Identity Docs**: https://docs.netlify.com/visitor-access/identity/
- **Netlify Blobs Docs**: https://docs.netlify.com/blobs/overview/
- **Netlify Functions Docs**: https://docs.netlify.com/functions/overview/

---

## Next Steps

1. **Diagnose Issue 3 First** (Partner data loading)
   - Check browser console
   - Check Netlify function logs
   - Verify Blobs is enabled

2. **Fix Issue 2** (Password set page)
   - Verify widget is loaded
   - Test invitation flow
   - Check email templates

3. **Document Issue 1** (Role assignment)
   - Create admin checklist
   - Consider webhook implementation
   - Update user documentation

---

**Status**: Ready for troubleshooting
**Priority**: Issue 3 (blocking), Issue 2 (critical), Issue 1 (workaround available)
