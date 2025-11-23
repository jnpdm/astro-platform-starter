# Auth0 Deployment Checklist

Use this checklist to ensure Auth0 is properly configured before deploying to production.

## Pre-Deployment Checklist

### Auth0 Configuration

- [ ] **Auth0 Account Created**
  - Tenant name chosen and created
  - Region selected appropriately

- [ ] **Auth0 Application Created**
  - Application type: Single Page Web Application
  - Application name set
  - Domain and Client ID noted

- [ ] **Callback URLs Configured**
  - Development URL added: `http://localhost:4321`
  - Production URL added: `https://your-site.netlify.app`
  - All URLs tested and verified

- [ ] **Logout URLs Configured**
  - Development URL added: `http://localhost:4321`
  - Production URL added: `https://your-site.netlify.app`

- [ ] **Web Origins Configured**
  - Development URL added: `http://localhost:4321`
  - Production URL added: `https://your-site.netlify.app`

- [ ] **CORS Origins Configured**
  - Development URL added: `http://localhost:4321`
  - Production URL added: `https://your-site.netlify.app`

- [ ] **User Roles Configured**
  - At least one test user created
  - Test user has role assigned in `app_metadata`
  - Role is one of: Admin, PAM, PDM, TPM, PSM, TAM

### Local Environment

- [ ] **Environment Variables Set**
  - `.env` file created from `.env.example`
  - `PUBLIC_AUTH0_DOMAIN` set correctly
  - `PUBLIC_AUTH0_CLIENT_ID` set correctly
  - `PUBLIC_AUTH0_CALLBACK_URL` set to `http://localhost:4321`
  - `AUTH_ENABLED` set to `true`

- [ ] **Local Testing Complete**
  - Development server starts without errors
  - Login flow works correctly
  - User name and role display in header
  - Protected routes require authentication
  - Logout works correctly
  - API endpoints return JSON (not HTML)

### Netlify Configuration

- [ ] **Environment Variables Set in Netlify**
  - Navigate to Site Settings → Environment Variables
  - `PUBLIC_AUTH0_DOMAIN` added
  - `PUBLIC_AUTH0_CLIENT_ID` added
  - `PUBLIC_AUTH0_CALLBACK_URL` set to production URL
  - `AUTH_ENABLED` set to `true`
  - All variables saved

- [ ] **Netlify Identity Disabled**
  - `netlify.toml` does not contain `[identity]` section
  - Old Netlify Identity code removed from codebase

- [ ] **Build Configuration Verified**
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: 18.20.8 or higher

## Deployment Checklist

- [ ] **Code Changes Committed**
  - All Auth0 integration code committed
  - Environment variable references updated
  - Documentation updated

- [ ] **Build Successful**
  - `npm run build` completes without errors
  - No TypeScript errors
  - No linting errors

- [ ] **Tests Passing**
  - Unit tests pass: `npm test`
  - Integration tests pass: `npm run test:integration`
  - Auth0-specific tests pass

- [ ] **Deploy to Netlify**
  - Code pushed to main branch (or deploy manually)
  - Deployment completes successfully
  - No errors in deploy logs

## Post-Deployment Checklist

### Functional Testing

- [ ] **Authentication Flow**
  - Visit production URL
  - Click "Sign In" button
  - Redirected to Auth0 login page
  - Enter credentials
  - Redirected back to application
  - User name and role display correctly

- [ ] **Protected Routes**
  - Try accessing `/partner/new` without authentication
  - Should redirect to home with login prompt
  - After login, can access protected routes
  - Correct role-based access control

- [ ] **API Endpoints**
  - API endpoints return JSON (not HTML)
  - Unauthenticated requests return 401 JSON response
  - Unauthorized requests return 403 JSON response
  - Authenticated requests work correctly

- [ ] **Session Management**
  - Session persists across page refreshes
  - Logout clears session completely
  - Can log back in after logout

- [ ] **Error Handling**
  - Invalid credentials show appropriate error
  - Network errors handled gracefully
  - Expired sessions redirect to login

### Browser Testing

- [ ] **Chrome/Edge**
  - Login works
  - Session persists
  - Logout works

- [ ] **Firefox**
  - Login works
  - Session persists
  - Logout works

- [ ] **Safari**
  - Login works
  - Session persists
  - Logout works

### Security Verification

- [ ] **HTTPS Enabled**
  - Production site uses HTTPS
  - No mixed content warnings

- [ ] **Security Headers**
  - Check headers in browser dev tools
  - Verify CSP, X-Frame-Options, etc.

- [ ] **Token Security**
  - Tokens not exposed in URLs
  - Tokens stored securely in Auth0 SDK
  - No sensitive data in localStorage

### Monitoring Setup

- [ ] **Auth0 Monitoring**
  - Logs enabled in Auth0 Dashboard
  - Anomaly detection enabled
  - Email alerts configured

- [ ] **Netlify Monitoring**
  - Deploy notifications enabled
  - Error tracking configured
  - Analytics enabled

- [ ] **Application Monitoring**
  - Error logging configured
  - Authentication metrics tracked
  - User activity monitored

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   - [ ] Check Netlify deploy logs for errors
   - [ ] Check Auth0 logs for authentication failures
   - [ ] Check browser console for client-side errors

2. **Quick Fixes**
   - [ ] Verify environment variables in Netlify
   - [ ] Verify Auth0 callback URLs match production URL
   - [ ] Clear browser cache and test again

3. **Rollback Procedure**
   - [ ] Revert to previous deployment in Netlify
   - [ ] Notify team of rollback
   - [ ] Document issues encountered
   - [ ] Plan fix and redeployment

## Common Issues and Solutions

### Issue: "Callback URL mismatch"

**Solution:**
- Verify production URL in Netlify matches Auth0 callback URL exactly
- Check for trailing slashes
- Ensure HTTPS is used in production

### Issue: "Authentication not working"

**Solution:**
- Verify environment variables are set in Netlify
- Trigger new deployment after setting variables
- Check Auth0 application is enabled

### Issue: "JSON parsing error"

**Solution:**
- Verify middleware is properly configured
- Check API routes return JSON, not HTML
- Clear browser cache and localStorage

### Issue: "User has no role"

**Solution:**
- Check user's `app_metadata` in Auth0
- Verify role is one of the valid roles
- Default PAM role should be assigned automatically

## Success Criteria

Deployment is successful when:

- ✅ Users can log in via Auth0
- ✅ User name and role display correctly
- ✅ Protected routes require authentication
- ✅ API endpoints return proper JSON responses
- ✅ Session persists across page refreshes
- ✅ Logout works correctly
- ✅ No errors in browser console
- ✅ No errors in Netlify deploy logs
- ✅ No errors in Auth0 logs

## Post-Deployment Tasks

- [ ] **Documentation**
  - Update README with production URL
  - Document any deployment-specific configuration
  - Update user guides if needed

- [ ] **Communication**
  - Notify team of successful deployment
  - Share production URL
  - Provide login instructions

- [ ] **Monitoring**
  - Monitor Auth0 logs for first 24 hours
  - Monitor Netlify analytics
  - Watch for user-reported issues

## Notes

- Keep this checklist updated as the deployment process evolves
- Document any issues encountered and their solutions
- Share learnings with the team

---

**Last Updated:** November 23, 2025
**Auth0 Migration Completed:** Commit 8777216
