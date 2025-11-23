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
- [Step 6: Deploy to Netlify](#step-6-deploy-to-netlify)
- [Step 7: Test Authentication](#step-7-test-authentication)
- [Security Considerations](#security-considerations)
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

## Step 6: Deploy to Netlify

### Configure Netlify Environment Variables

**CRITICAL**: You must configure Auth0 environment variables in Netlify before authentication will work in production.

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Add the following variables:

| Key | Value | Example | Required |
|-----|-------|---------|----------|
| `PUBLIC_AUTH0_DOMAIN` | Your Auth0 domain | `kuiper-partner-hub.us.auth0.com` | ✅ Yes |
| `PUBLIC_AUTH0_CLIENT_ID` | Your Auth0 client ID | `abc123xyz456...` | ✅ Yes |
| `PUBLIC_AUTH0_CALLBACK_URL` | Your production URL | `https://partner-hub.netlify.app` | ✅ Yes |
| `PUBLIC_AUTH0_AUDIENCE` | API audience (optional) | Leave empty if not using | ❌ No |
| `AUTH_ENABLED` | Enable authentication | `true` | ✅ Yes |

5. Click **Save**
6. **Important**: Trigger a new deployment for the environment variables to take effect

### Verify Configuration

After setting environment variables:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete
4. Check the deploy log to ensure no Auth0-related errors

### Update Auth0 Callback URLs

Make sure your production URL is added to Auth0:

1. Go to Auth0 Dashboard → Applications → Your Application
2. Add your Netlify production URL to:
   - Allowed Callback URLs: `https://your-site.netlify.app`
   - Allowed Logout URLs: `https://your-site.netlify.app`
   - Allowed Web Origins: `https://your-site.netlify.app`
   - Allowed Origins (CORS): `https://your-site.netlify.app`
3. Click **Save Changes**

## Step 7: Test Authentication

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

1. Visit your production URL (e.g., `https://your-site.netlify.app`)
2. Click the **Sign In** button
3. Test the complete login flow
4. Verify your name and role appear in the header
5. Test accessing protected routes (e.g., `/partner/new`)
6. Test logout functionality
7. Verify role-based access control works

### Verification Checklist

- [ ] Environment variables are set in Netlify
- [ ] Production URL is added to Auth0 callback URLs
- [ ] Login redirects to Auth0 correctly
- [ ] After login, user is redirected back to the application
- [ ] User name and role display in header
- [ ] Protected routes require authentication
- [ ] Logout clears session and redirects properly
- [ ] API endpoints return JSON (not HTML) for unauthenticated requests

## Security Considerations

### Session Management

The current implementation uses client-side session storage (localStorage) with Auth0 token validation. While Auth0 SDK validates tokens, be aware:

- **Session data is cached in localStorage**: This improves performance but means expired sessions may not be immediately detected
- **Token validation**: Auth0 SDK validates tokens on each request, providing security
- **Session expiration**: Sessions expire after 24 hours and require re-authentication

### Recommendations for Production

1. **Monitor Authentication Errors**: Set up logging and monitoring for authentication failures
2. **Regular Security Audits**: Review Auth0 logs regularly for suspicious activity
3. **Token Refresh**: Consider implementing token refresh for long-running sessions
4. **Server-Side Validation**: For highly sensitive operations, consider adding server-side token validation via Netlify Functions

### CDN Dependency

The Auth0 SDK is currently loaded from CDN (`https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js`). This:

- ✅ Reduces bundle size
- ✅ Leverages browser caching
- ❌ Creates external dependency
- ❌ Requires CDN availability

**Alternative**: Install as npm dependency for better reliability:

```bash
npm install @auth0/auth0-spa-js
```

Then import in your code instead of using CDN script tag. This provides:
- Better version control
- Offline development capability
- No external CDN dependency
- Bundled with your application

## Troubleshooting

### "Callback URL mismatch" Error

**Problem**: Auth0 returns an error about callback URL mismatch.

**Solution**: 
- Verify the callback URL in Auth0 settings matches your application URL exactly
- Check for trailing slashes (they matter!)
- Ensure both HTTP and HTTPS are configured if needed

### "Authentication not working in production"

**Problem**: Authentication works locally but not in production.

**Solution**:
- Verify environment variables are set in Netlify Dashboard
- Check that `PUBLIC_AUTH0_CALLBACK_URL` matches your production URL exactly
- Ensure production URL is added to Auth0 Allowed Callback URLs
- Trigger a new deployment after setting environment variables
- Check Netlify deploy logs for Auth0-related errors

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

### JSON Parsing Error on Index Page

**Problem**: Error "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Solution**:
- This was fixed in commit 8777216 (JSON / Middleware fix)
- The middleware now returns proper JSON responses for API routes
- If you still see this error:
  - Clear browser cache and localStorage
  - Verify you're on the latest deployment
  - Check that middleware is properly configured

### Mock Authentication in Production

**Problem**: Production is using mock authentication instead of Auth0.

**Solution**:
- This happens when Auth0 environment variables are not set
- Go to Netlify Dashboard → Site Settings → Environment Variables
- Verify all required variables are present (see Step 6)
- Trigger a new deployment
- Check browser console for Auth0 initialization messages

## Migration Notes

### Recent Changes

The Auth0 migration was completed recently (commit 8777216). Key changes:

1. **Removed Netlify Identity**: The old `netlify.toml` Identity configuration has been removed
2. **Fixed API Middleware**: API routes now return JSON errors instead of HTML redirects
3. **Added TypeScript Declarations**: Global `window.kuiperAuth` object now has proper types
4. **Improved Error Handling**: Better error messages for authentication failures

### Known Limitations

1. **Client-Side Session Storage**: Sessions are stored in localStorage, which is client-side only
2. **CDN Dependency**: Auth0 SDK is loaded from CDN (consider npm package for production)
3. **No Token Refresh**: Long-running sessions require re-authentication after 24 hours
4. **Manual Role Assignment**: User roles must be manually assigned in Auth0 Dashboard

### Future Improvements

Consider implementing:
- Server-side token validation for sensitive operations
- Automatic token refresh for better UX
- Auth0 Rules or Actions for automatic role assignment
- Installing Auth0 SDK as npm dependency instead of CDN

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 SPA SDK Documentation](https://auth0.com/docs/libraries/auth0-spa-js)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## Support

For issues with Auth0 setup:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [Auth0 Community](https://community.auth0.com/)
3. Check Auth0 logs in the dashboard (Monitoring → Logs)
4. Review Netlify deploy logs for errors
5. Contact the development team

## Monitoring and Maintenance

### Auth0 Dashboard Monitoring

Regularly check:
- **Logs**: Monitor authentication attempts and failures
- **Users**: Review user activity and role assignments
- **Applications**: Verify configuration remains correct
- **Anomaly Detection**: Enable and monitor for suspicious activity

### Netlify Monitoring

Monitor:
- **Deploy logs**: Check for Auth0-related errors during deployment
- **Function logs**: Review serverless function execution for auth issues
- **Analytics**: Track authentication success/failure rates

### Recommended Alerts

Set up alerts for:
- High authentication failure rates
- Unusual login patterns
- Token validation errors
- API authentication errors (401/403 responses)

