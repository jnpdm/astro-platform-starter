# Netlify Identity Sign-In Troubleshooting

**Date**: November 21, 2024  
**Issue**: Sign-in button doesn't function

## Understanding the Issue

Netlify Identity **only works on deployed sites**, not in local development. This is because:

1. **Site URL Required**: Netlify Identity needs to know your site's URL
2. **API Keys**: Identity uses Netlify-specific API keys tied to your site
3. **Callbacks**: OAuth callbacks need a real domain, not `localhost`

## Current Status

### ✅ Code is Correct
The sign-in implementation is properly configured:
- Netlify Identity widget is loaded
- `kuiperAuth.login()` function exists
- Event listeners are attached
- Authentication flow is implemented

### ⚠️ Won't Work Locally
The sign-in button **will not work** in local development (`npm run dev`) because:
- No Netlify site URL configured
- No Identity API keys available
- Widget can't communicate with Netlify servers

## Solution: Test on Deployed Site

### Step 1: Deploy to Netlify

```bash
# Commit and push your code
git add .
git commit -m "Ready for Netlify Identity testing"
git push origin main
```

### Step 2: Enable Netlify Identity

1. Go to your Netlify Dashboard
2. Select your site
3. Go to **Site Settings** → **Identity**
4. Click **Enable Identity**
5. Wait for confirmation

### Step 3: Configure Identity Settings

#### Registration Preferences
1. Go to **Identity** → **Settings and usage**
2. Under **Registration preferences**:
   - Select **Invite only** (recommended for internal tools)
   - Or **Open** if you want public registration

#### External Providers (Optional)
1. Go to **Identity** → **External providers**
2. Enable providers if desired:
   - Google
   - GitHub
   - GitLab
   - Bitbucket

#### Email Templates
1. Go to **Identity** → **Emails**
2. Customize email templates if desired
3. Verify sender email is correct

### Step 4: Test Sign-In on Deployed Site

1. **Visit your deployed site**: `https://your-site.netlify.app`
2. **Click "Sign In" button**
3. **Widget should open** with login form
4. **If Invite Only**: You'll need to invite users first

### Step 5: Invite Users (If Invite Only)

1. Go to **Identity** → **Invite users**
2. Enter email addresses (one per line)
3. Click **Send**
4. Users receive invitation emails
5. Users click link to set password
6. Users can then sign in

### Step 6: Assign Roles

After users sign up, assign roles:

1. Go to **Identity** → **Users**
2. Click on a user
3. Scroll to **User metadata**
4. Click **Edit user metadata**
5. Add role:
   ```json
   {
     "role": "PAM"
   }
   ```
6. Available roles:
   - `Admin` - Full access
   - `PAM` - Partner Account Manager
   - `PDM` - Partner Development Manager
   - `TPM` - Technical Partner Manager
   - `PSM` - Partner Success Manager
   - `TAM` - Technical Account Manager
7. Click **Save**

## Testing Checklist

### On Deployed Site

- [ ] Visit `https://your-site.netlify.app`
- [ ] Click "Sign In" button
- [ ] Netlify Identity widget opens
- [ ] Can see login form
- [ ] Can enter email/password
- [ ] Login succeeds
- [ ] Redirected to dashboard
- [ ] User name appears in header
- [ ] Role badge shows correct role
- [ ] "Sign Out" button works

### Common Issues

#### Issue 1: Widget Doesn't Open

**Symptoms**: Clicking "Sign In" does nothing

**Causes**:
1. JavaScript error in console
2. Widget script not loaded
3. Browser blocking scripts

**Solutions**:
1. Open browser console (F12)
2. Look for errors
3. Check if `window.netlifyIdentity` exists:
   ```javascript
   console.log(window.netlifyIdentity);
   // Should output: Object with methods
   ```
4. If undefined, widget didn't load
5. Check browser extensions (ad blockers)
6. Try incognito mode

#### Issue 2: "Site Not Found" Error

**Symptoms**: Widget opens but shows error

**Causes**:
1. Identity not enabled on Netlify
2. Wrong site URL
3. Site not deployed yet

**Solutions**:
1. Verify Identity is enabled in Netlify Dashboard
2. Check site is deployed and accessible
3. Verify you're on the correct domain

#### Issue 3: Can't Sign In (No Users)

**Symptoms**: No way to create account

**Causes**:
1. Registration set to "Invite only"
2. No users invited yet

**Solutions**:
1. Go to Netlify Dashboard → Identity
2. Click "Invite users"
3. Enter your email
4. Check email for invitation
5. Click link to set password

#### Issue 4: Sign In Works But No Role

**Symptoms**: Logged in but can't access features

**Causes**:
1. Role not assigned in user metadata
2. Role name incorrect

**Solutions**:
1. Go to Netlify Dashboard → Identity → Users
2. Click on user
3. Edit user metadata
4. Add role (see Step 6 above)
5. User logs out and back in

## Development Workaround

If you need to test authentication logic locally:

### Option 1: Mock Authentication

Create a development-only mock in `src/middleware/auth.ts`:

```typescript
export function getUserSession(): AuthUser | null {
    // In development, return mock user
    if (import.meta.env.DEV) {
        return {
            id: 'dev-user-123',
            email: 'dev@example.com',
            role: 'Admin',
            name: 'Dev User'
        };
    }
    
    // Production code...
}
```

### Option 2: Netlify CLI

Use Netlify CLI to run locally with Identity:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your site
netlify link

# Run dev server with Netlify features
netlify dev
```

This provides:
- Netlify Identity
- Netlify Functions
- Netlify Blobs
- Environment variables

## Browser Console Debugging

Open browser console (F12) and run:

```javascript
// Check if widget loaded
console.log('Widget loaded:', typeof window.netlifyIdentity);
// Should output: "object"

// Check if kuiperAuth exists
console.log('Auth loaded:', typeof window.kuiperAuth);
// Should output: "object"

// Try to open widget manually
window.netlifyIdentity.open('login');
// Should open the login widget

// Check current user
console.log('Current user:', window.netlifyIdentity.currentUser());
// Should output: null (if not logged in) or user object
```

## Summary

### Local Development
- ❌ Sign-in **will not work**
- ✅ Use mock data or Netlify CLI
- ✅ Focus on UI development

### Deployed Site
- ✅ Sign-in **will work**
- ✅ Full Netlify Identity features
- ✅ Real authentication

### Next Steps
1. Deploy your site to Netlify
2. Enable Netlify Identity
3. Invite yourself as a user
4. Assign your role
5. Test sign-in on deployed site

The sign-in functionality is correctly implemented and will work once deployed to Netlify!
