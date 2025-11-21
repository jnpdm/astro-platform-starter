# User Management Guide

## Overview

The Kuiper Partner Onboarding Hub uses **Netlify Identity** for user authentication and management. This guide explains how to add, manage, and configure users with appropriate roles.

## Current State

**Test Users**: ❌ No test users are pre-created
**User Database**: Managed by Netlify Identity (not in code)
**Role Assignment**: Done through Netlify Identity dashboard

## User Roles

The system supports 6 user roles:

| Role | Access Level | Description |
|------|-------------|-------------|
| **PAM** | Partner Account Manager | Full access to owned partners across all gates |
| **PDM** | Partner Development Manager | Pre-Contract through Gate 1 (Ready to Sell) |
| **TPM** | Technical Partner Manager | Gate 2 (Ready to Order) access |
| **PSM** | Partner Success Manager | Gate 3 (Ready to Deliver) and Post-Launch |
| **TAM** | Technical Account Manager | Gate 3 (Ready to Deliver) and Post-Launch |
| **Admin** | Administrator | Unrestricted access to all features and partners |

## Adding Users

### Method 1: Netlify Identity Dashboard (Recommended)

1. **Access Netlify Dashboard**
   ```
   https://app.netlify.com/sites/[your-site-name]/identity
   ```

2. **Enable Identity** (if not already enabled)
   - Go to Site Settings → Identity
   - Click "Enable Identity"

3. **Invite a User**
   - Click "Invite users" button
   - Enter email address(es)
   - User will receive an invitation email
   - They click the link to set their password

4. **Assign Role**
   - After user accepts invitation, find them in the user list
   - Click on the user
   - Scroll to "User metadata"
   - Add custom metadata:
     ```json
     {
       "role": "PAM"
     }
     ```
   - Replace "PAM" with appropriate role (PAM, PDM, TPM, PSM, TAM, Admin)
   - Click "Save"

### Method 2: Netlify CLI

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Invite a user
netlify identity:invite user@example.com

# Note: Role must be assigned through dashboard after invitation
```

### Method 3: Netlify Identity API

For programmatic user creation:

```javascript
// Using Netlify Identity API
const inviteUser = async (email, role) => {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/[SITE_ID]/identity/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer [NETLIFY_ACCESS_TOKEN]`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        user_metadata: {
          role: role
        }
      })
    }
  );
  return response.json();
};

// Usage
await inviteUser('john.doe@example.com', 'PAM');
```

## Creating Test Users

### For Development/Testing

1. **Create Test Accounts**
   ```bash
   # Invite test users for each role
   netlify identity:invite pam-test@example.com
   netlify identity:invite pdm-test@example.com
   netlify identity:invite tpm-test@example.com
   netlify identity:invite psm-test@example.com
   netlify identity:invite tam-test@example.com
   netlify identity:invite admin-test@example.com
   ```

2. **Assign Roles via Dashboard**
   - Go to Netlify Identity dashboard
   - For each user, add role metadata:
     - `pam-test@example.com` → role: "PAM"
     - `pdm-test@example.com` → role: "PDM"
     - `tpm-test@example.com` → role: "TPM"
     - `psm-test@example.com` → role: "PSM"
     - `tam-test@example.com` → role: "TAM"
     - `admin-test@example.com` → role: "Admin"

3. **Accept Invitations**
   - Check email for each test account
   - Click invitation link
   - Set password
   - Confirm account

### Recommended Test Users

```
PAM Test User
- Email: pam.test@yourcompany.com
- Role: PAM
- Purpose: Test partner creation and full access

PDM Test User
- Email: pdm.test@yourcompany.com
- Role: PDM
- Purpose: Test Pre-Contract through Gate 1 access

TPM Test User
- Email: tpm.test@yourcompany.com
- Role: TPM
- Purpose: Test Gate 2 technical integration access

PSM Test User
- Email: psm.test@yourcompany.com
- Role: PSM
- Purpose: Test Gate 3 and Post-Launch access

TAM Test User
- Email: tam.test@yourcompany.com
- Role: TAM
- Purpose: Test Gate 3 and Post-Launch access

Admin Test User
- Email: admin.test@yourcompany.com
- Role: Admin
- Purpose: Test full system access and admin features
```

## Managing Existing Users

### View All Users

**Via Dashboard**:
1. Go to `https://app.netlify.com/sites/[your-site-name]/identity`
2. View list of all users
3. See status (Invited, Active, Disabled)

**Via CLI**:
```bash
netlify identity:list
```

### Update User Role

1. Go to Netlify Identity dashboard
2. Click on user
3. Edit "User metadata"
4. Update role value
5. Click "Save"

### Disable User

1. Go to Netlify Identity dashboard
2. Click on user
3. Click "Disable user"
4. Confirm action

User can no longer log in but data is preserved.

### Delete User

1. Go to Netlify Identity dashboard
2. Click on user
3. Click "Delete user"
4. Confirm action

⚠️ **Warning**: This permanently deletes the user account.

### Reset User Password

**User-Initiated**:
1. User clicks "Forgot Password" on login page
2. Receives password reset email
3. Follows link to set new password

**Admin-Initiated**:
1. Go to Netlify Identity dashboard
2. Click on user
3. Click "Send password recovery email"
4. User receives email with reset link

## Bulk User Management

### Import Multiple Users

Create a script to invite multiple users:

```javascript
// invite-users.js
const users = [
  { email: 'user1@example.com', role: 'PAM' },
  { email: 'user2@example.com', role: 'PDM' },
  { email: 'user3@example.com', role: 'TPM' },
  // ... more users
];

async function inviteUsers() {
  for (const user of users) {
    console.log(`Inviting ${user.email} with role ${user.role}...`);
    // Use Netlify API to invite user
    // Then manually assign role via dashboard
  }
}

inviteUsers();
```

### Export User List

```bash
# Using Netlify CLI
netlify identity:list > users.txt
```

## Role-Based Access Control

### How Roles Work

The system checks user roles in two places:

1. **Middleware** (`src/middleware/auth.ts`)
   - Validates user is authenticated
   - Extracts role from user metadata
   - Blocks access to protected routes

2. **RBAC Utilities** (`src/utils/rbac.ts`)
   - Filters partners by role
   - Checks partner ownership
   - Validates gate access

### Role Metadata Structure

```json
{
  "role": "PAM",
  "full_name": "John Doe",
  "department": "Sales",
  "employee_id": "EMP001"
}
```

Only `role` is required. Other fields are optional.

## Configuration

### Identity Settings

Configure in Netlify Dashboard → Site Settings → Identity:

**Registration**:
- ✅ Invite only (recommended for internal app)
- ❌ Open registration (not recommended)

**External Providers** (optional):
- Google OAuth
- GitHub OAuth
- GitLab OAuth
- Bitbucket OAuth

**Email Templates**:
- Customize invitation email
- Customize confirmation email
- Customize password recovery email

**JWT Secret**:
- Auto-generated by Netlify
- Used for token signing

### Email Configuration

**Default**: Uses Netlify's email service

**Custom SMTP** (optional):
1. Go to Site Settings → Identity → Emails
2. Click "Use custom SMTP"
3. Enter SMTP server details
4. Test configuration

## Security Best Practices

### Password Requirements

Configure in Netlify Identity settings:
- Minimum length: 8 characters (recommended: 12+)
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters

### Multi-Factor Authentication (MFA)

**Enable MFA**:
1. Go to Site Settings → Identity
2. Enable "Multi-factor authentication"
3. Users can enable MFA in their account settings

### Session Management

**Session Duration**:
- Default: 1 week
- Configurable in Identity settings
- Automatic logout after inactivity

**Token Refresh**:
- Tokens automatically refresh
- Users stay logged in across sessions

## Troubleshooting

### User Can't Log In

**Check**:
1. User status is "Active" (not "Invited" or "Disabled")
2. User has confirmed their email
3. Password is correct
4. Identity is enabled for the site

**Solution**:
- Resend confirmation email
- Send password reset email
- Check Netlify Identity logs

### User Has Wrong Permissions

**Check**:
1. User metadata has correct role
2. Role spelling is exact (case-sensitive)
3. Valid role: PAM, PDM, TPM, PSM, TAM, Admin

**Solution**:
- Update user metadata in dashboard
- User may need to log out and back in

### User Not Receiving Emails

**Check**:
1. Email address is correct
2. Check spam folder
3. Netlify email service is working
4. Custom SMTP is configured correctly (if used)

**Solution**:
- Verify email address
- Resend invitation
- Check Netlify status page
- Test SMTP configuration

## API Reference

### Get User Info

```javascript
// In client-side code
const user = netlifyIdentity.currentUser();
console.log(user.email);
console.log(user.user_metadata.role);
```

### Check User Role

```javascript
// In server-side code (middleware)
import { getUserRole } from './utils/rbac';

const role = getUserRole(user);
if (role === 'Admin') {
  // Allow access
}
```

### Update User Metadata

```javascript
// Via Netlify Identity API
const updateUserRole = async (userId, newRole) => {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/[SITE_ID]/identity/users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer [NETLIFY_ACCESS_TOKEN]`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_metadata: {
          role: newRole
        }
      })
    }
  );
  return response.json();
};
```

## Quick Start Checklist

For setting up users in a new deployment:

- [ ] Enable Netlify Identity
- [ ] Configure registration settings (invite only)
- [ ] Customize email templates
- [ ] Create admin user
- [ ] Assign admin role
- [ ] Create test users for each role
- [ ] Assign roles to test users
- [ ] Test login for each role
- [ ] Verify role-based access works
- [ ] Document user credentials securely

## Support

For issues with user management:
- **Netlify Identity Docs**: https://docs.netlify.com/visitor-access/identity/
- **Netlify Support**: https://www.netlify.com/support/
- **Internal Support**: [Your support channel]

---

**Last Updated**: November 21, 2024
**Version**: 1.0.0
