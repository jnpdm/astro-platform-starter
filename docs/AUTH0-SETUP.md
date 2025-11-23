# Auth0 Setup Guide

This guide provides detailed instructions for setting up Auth0 authentication for the Partner Onboarding Hub.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create Auth0 Account](#step-1-create-auth0-account)
- [Step 2: Create Application](#step-2-create-application)
- [Step 3: Configure Application Settings](#step-3-configure-application-settings)
- [Step 4: Configure User Roles](#step-4-configure-user-roles)
- [Step 5: Set Up Environment Variables](#step-5-set-up-environment-variables)
- [Step 6: Test Authentication](#step-6-test-authentication)
- [Troubleshooting](#troubleshooting)

## Overview

The Partner Onboarding Hub uses Auth0 for:
- User authentication (login/logout)
- Session management
- Role-based access control (RBAC)
- Secure token handling

## Prerequisites

- Admin access to create an Auth0 account
- Access to the Netlify Dashboard for production deployment
- Node.js and npm installed locally

## Step 1: Create Auth0 Account

1. Navigate to [auth0.com](https://auth0.com)
2. Click **Sign Up** and create an account
3. Choose a tenant name (e.g., `kuiper-partner-hub`)
   - This will be part of your domain: `kuiper-partner-hub.us.auth0.com`
4. Select your region (choose closest to your users)
5. Complete the account setup

## Step 2: Create Application

1. In the Auth0 Dashboard, navigate to **Applications** → **Applications**
2. Click **Create Application**
3. Enter application details:
   - **Name**: Partner Onboarding Hub
   - **Application Type**: Single Page Web Applications
4. Click **Create**
5. You'll be redirected to the application settings page

## Step 3: Configure Application Settings

### Basic Information

Note down the following from the **Settings** tab:
- **Domain**: (e.g., `kuiper-partner-hub.us.auth0.com`)
- **Client ID**: (e.g., `abc123xyz456...`)

### Application URIs

Configure the following URLs in the **Settings** tab:

#### Allowed Callback URLs
These are the URLs Auth0 will redirect to after successful login:

```
http://localhost:4321, https://your-production-domain.netlify.app
```

#### Allowed Logout URLs
These are the URLs Auth0 will redirect to after logout:

```
http://localhost:4321, https://your-production-domain.netlify.app
```

#### Allowed Web Origins
These origins are allowed to make requests to Auth0:

```
http://localhost:4321, https://your-production-domain.netlify.app
```

#### Allowed Origins (CORS)
These origins are allowed for CORS requests:

```
http://localhost:4321, https://your-production-domain.netlify.app
```

### Advanced Settings

1. Scroll to **Advanced Settings**
2. Go to **OAuth** tab
3. Ensure **JsonWebToken Signature Algorithm** is set to `RS256`
4. Click **Save Changes** at the bottom of the page

## Step 4: Configure User Roles

Auth0 stores user roles in the `app_metadata` field. You need to manually add roles to each user.

### Add Role to a User

1. Navigate to **User Management** → **Users**
2. Click on a user to edit
3. Scroll to the **Metadata** section
4. Click **Edit** on the `app_metadata` field
5. Add the following JSON:

```json
{
  "role": "PAM"
}
```

6. Click **Save**

### Valid Roles

The application supports the following roles:
- `Admin` - Full system access
- `PAM` - Partner Account Manager
- `PDM` - Partner Development Manager
- `TPM` - Technical Program Manager
- `PSM` - Partner Success Manager
- `TAM` - Technical Account Manager

### Default Role

If a user doesn't have a role assigned, the system will automatically assign the `PAM` role.

### Bulk Role Assignment

For multiple users, you can use the Auth0 Management API:

```bash
curl -X PATCH https://YOUR_DOMAIN.auth0.com/api/v2/users/USER_ID \
  -H "Authorization: Bearer YOUR_MANAGEMENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_metadata": {
      "role": "PAM"
    }
  }'
```

## Step 5: Set Up Environment Variables

### Local Development

1. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

2. Update the `.env` file with your Auth0 credentials:

```env
# Auth0 Configuration
PUBLIC_AUTH0_DOMAIN=kuiper-partner-hub.us.auth0.com
PUBLIC_AUTH0_CLIENT_ID=your-client-id-here
PUBLIC_AUTH0_CALLBACK_URL=http://localhost:4321
PUBLIC_AUTH0_AUDIENCE=

# Application Configuration
AUTH_ENABLED=true
```

### Production (Netlify)

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Add the following variables:

| Key | Value | Example |
|-----|-------|---------|
| `PUBLIC_AUTH0_DOMAIN` | Your Auth0 domain | `kuiper-partner-hub.us.auth0.com` |
| `PUBLIC_AUTH0_CLIENT_ID` | Your Auth0 client ID | `abc123xyz456...` |
| `PUBLIC_AUTH0_CALLBACK_URL` | Your production URL | `https://partner-hub.netlify.app` |
| `PUBLIC_AUTH0_AUDIENCE` | API audience (optional) | Leave empty if not using |
| `AUTH_ENABLED` | Enable authentication | `true` |

5. Click **Save**
6. Redeploy your site for changes to take effect

## Step 6: Test Authentication

### Local Testing

1. Start the development server:

```bash
npm run dev
```

2. Open `http://localhost:4321` in your browser
3. Click the **Sign In** button
4. You should be redirected to Auth0 login page
5. Enter your credentials
6. You should be redirected back to the application
7. Your name and role should appear in the header

### Production Testing

1. Deploy to Netlify:

```bash
npm run build
netlify deploy --prod
```

2. Visit your production URL
3. Test the login flow
4. Verify role-based access control works

## Troubleshooting

### "Callback URL mismatch" Error

**Problem**: Auth0 returns an error about callback URL mismatch.

**Solution**: 
- Verify the callback URL in Auth0 settings matches your application URL exactly
- Check for trailing slashes (they matter!)
- Ensure both HTTP and HTTPS are configured if needed

### "window.netlifyIdentity is undefined"

**Problem**: Old Netlify Identity code is still present.

**Solution**: 
- This is expected during migration
- The Auth0 migration will replace Netlify Identity
- Ignore this error for now

### User Has No Role

**Problem**: User logs in but has no role assigned.

**Solution**:
- The system will assign default `PAM` role
- To assign a specific role, follow [Step 4](#step-4-configure-user-roles)

### "Invalid state" Error

**Problem**: Auth0 returns "invalid state" error during callback.

**Solution**:
- Clear browser cookies and localStorage
- Try logging in again
- Verify `PUBLIC_AUTH0_DOMAIN` is correct

### Development Mode Mock Authentication

**Problem**: Want to develop without Auth0 setup.

**Solution**:
- Leave Auth0 environment variables empty
- The application will use mock authentication
- Console warnings will appear (this is expected)

### CORS Errors

**Problem**: CORS errors in browser console.

**Solution**:
- Add your domain to **Allowed Origins (CORS)** in Auth0 settings
- Ensure the domain matches exactly (including protocol)
- Save changes and wait a few minutes for propagation

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 SPA SDK Documentation](https://auth0.com/docs/libraries/auth0-spa-js)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)

## Support

For issues with Auth0 setup:
1. Check the [Auth0 Community](https://community.auth0.com/)
2. Review Auth0 logs in the dashboard
3. Contact the development team

