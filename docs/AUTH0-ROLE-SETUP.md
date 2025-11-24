# Auth0 Role Setup Guide

## Overview

The Partner Onboarding Hub uses a simplified two-role system:
- **PAM** (Partner Account Manager): Can view and manage partners they own
- **PDM** (Partner Development Manager): Admin role with full access to all partners

## Problem: Roles Not Appearing

By default, Auth0's SPA SDK doesn't include `app_metadata` or `user_metadata` in the user object returned to the client. You need to configure Auth0 to include role information in the ID token.

## Solution Options

### Option 1: Use Auth0 Actions (Recommended)

Auth0 Actions are the modern way to customize tokens. This is the recommended approach.

#### Step 1: Create an Action

1. Go to **Auth0 Dashboard** → **Actions** → **Library**
2. Click **Build Custom** → **Build from scratch**
3. Name: `Add User Roles to Token`
4. Trigger: **Login / Post Login**
5. Add this code:

```javascript
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Define a namespace for custom claims (must be a URL you control)
  const namespace = 'https://your-app.com';
  
  // Get role from user_metadata (easier to set) or app_metadata
  const role = event.user.user_metadata?.role || 
               event.user.app_metadata?.role || 
               'PAM'; // Default to PAM
  
  // Validate role
  const validRoles = ['PAM', 'PDM'];
  const userRole = validRoles.includes(role) ? role : 'PAM';
  
  // Add role to ID token as custom claim
  api.idToken.setCustomClaim(`${namespace}/role`, userRole);
  
  // Also add full metadata for compatibility
  api.idToken.setCustomClaim(`${namespace}/user_metadata`, {
    role: userRole
  });
  
  console.log(`User ${event.user.email} assigned role: ${userRole}`);
};
```

6. Click **Deploy**

#### Step 2: Add Action to Login Flow

1. Go to **Actions** → **Flows** → **Login**
2. Click **Custom** tab on the right
3. Drag your **Add User Roles to Token** action into the flow (between Start and Complete)
4. Click **Apply**

#### Step 3: Set User Roles

Now you can assign roles to users:

1. Go to **User Management** → **Users**
2. Click on a user
3. Scroll to **Metadata** section
4. In **user_metadata**, add:

```json
{
  "role": "PDM"
}
```

or

```json
{
  "role": "PAM"
}
```

5. Click **Save**

### Option 2: Use Management API (Programmatic)

If you want to set roles programmatically:

```javascript
// Using Auth0 Management API
const ManagementClient = require('auth0').ManagementClient;

const management = new ManagementClient({
  domain: 'YOUR_DOMAIN.auth0.com',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});

// Set user role
management.updateUserMetadata(
  { id: 'USER_ID' },
  { role: 'PDM' }
);
```

### Option 3: Manual Setup via Dashboard (Simplest for Testing)

For quick testing, you can manually set roles:

1. Go to **User Management** → **Users**
2. Click on a user
3. Go to **Metadata** tab
4. Add to **user_metadata**:
   ```json
   {
     "role": "PDM"
   }
   ```
5. Save

**Important**: You still need the Action (Option 1) to include this metadata in the token!

## Verifying Role Setup

### 1. Check the Action is Running

After logging in, check the browser console. You should see:
```
Role from user_metadata: PDM
```
or
```
Role from custom claim: PDM
```

### 2. Check the ID Token

You can inspect the ID token to verify the role is included:

1. Open browser DevTools → Application → Local Storage
2. Find the Auth0 cache entry
3. Decode the ID token (use jwt.io)
4. Look for the custom claim: `https://your-app.com/role`

### 3. Test in the Application

After logging in:
- PDM users should see: "Viewing all partners across all gates (Admin)"
- PAM users should see: "Viewing your assigned partners across all gates"

## Troubleshooting

### Role Not Appearing

**Problem**: User logs in but role defaults to PAM

**Solutions**:
1. Verify the Action is deployed and added to the Login flow
2. Check that user_metadata contains the role
3. Clear browser cache and localStorage
4. Log out and log back in
5. Check browser console for role-related logs

### Action Not Running

**Problem**: Action is deployed but not executing

**Solutions**:
1. Go to **Actions** → **Flows** → **Login**
2. Verify the action is in the flow (between Start and Complete)
3. Click **Apply** to save the flow
4. Try logging in again

### Wrong Namespace

**Problem**: Custom claim not appearing in token

**Solution**: The namespace in the Action must match the namespace in the code. Update `src/utils/auth0.ts` if you change the namespace:

```typescript
const namespace = 'https://your-app.com'; // Must match Action
```

## Role Permissions

### PDM (Admin)
- ✅ View all partners
- ✅ Edit all partners
- ✅ Create new partners
- ✅ Submit questionnaires for any partner
- ✅ Access all gates
- ✅ Full system access

### PAM
- ✅ View partners they own (pamOwner field)
- ✅ Edit partners they own
- ✅ Create new partners
- ✅ Submit questionnaires for their partners
- ✅ Access all gates for their partners
- ❌ Cannot access other users' partners

## Default Behavior

If no role is set or the role is invalid:
- User defaults to **PAM** role
- Console warning is logged
- User can still access the system with PAM permissions

## Best Practices

1. **Always use Actions** to add roles to tokens (don't rely on client-side metadata)
2. **Set roles in user_metadata** (easier to manage than app_metadata)
3. **Validate roles** in both the Action and application code
4. **Log role assignments** for debugging
5. **Test with both roles** before deploying to production

## Quick Setup Checklist

- [ ] Create Auth0 Action with role logic
- [ ] Deploy the Action
- [ ] Add Action to Login flow
- [ ] Apply the flow changes
- [ ] Set user_metadata.role for test users
- [ ] Log out and log back in
- [ ] Verify role appears in console logs
- [ ] Test PDM admin access
- [ ] Test PAM limited access
