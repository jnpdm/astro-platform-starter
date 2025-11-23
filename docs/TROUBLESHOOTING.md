# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Cannot Log In

**Symptoms**: Login button doesn't work, or redirects to error page

**Possible Causes**:
- Auth0 not configured correctly
- User not added to Auth0
- Browser cookies disabled
- Network connectivity issues
- Incorrect callback URLs

**Solutions**:

1. **Verify Auth0 configuration**
   - Check environment variables are set correctly
   - Verify `PUBLIC_AUTH0_DOMAIN` and `PUBLIC_AUTH0_CLIENT_ID` are present
   - Ensure callback URLs match your environment (localhost or production)

2. **Check user exists in Auth0**
   - Go to Auth0 Dashboard → User Management → Users
   - Verify your email is listed
   - Resend invitation if needed

3. **Verify callback URLs**
   - Go to Auth0 Dashboard → Applications → Your App → Settings
   - Ensure Allowed Callback URLs includes your domain
   - For local: `http://localhost:4321`
   - For production: `https://your-domain.netlify.app`

4. **Clear browser cache and cookies**
   ```
   Chrome: Settings → Privacy → Clear browsing data
   Firefox: Settings → Privacy → Clear Data
   Safari: Preferences → Privacy → Manage Website Data
   ```

5. **Try incognito/private mode**
   - This helps identify if browser extensions are interfering

6. **Check network connectivity**
   - Verify you can access other websites
   - Check if firewall is blocking Auth0
   - Try accessing `https://your-tenant.us.auth0.com` directly

7. **Check browser console for errors**
   - Open Developer Tools (F12)
   - Look for Auth0-related errors
   - Note error codes (e.g., `access_denied`, `invalid_request`)

#### Logged Out Unexpectedly

**Symptoms**: Session expires quickly, forced to log in repeatedly

**Possible Causes**:
- Session timeout too short
- Browser not storing session
- Multiple tabs causing conflicts

**Solutions**:

1. **Check session configuration**
   - Review session timeout settings
   - Increase timeout if too short

2. **Enable browser cookies**
   - Ensure cookies are enabled for the site
   - Check third-party cookie settings

3. **Use single tab**
   - Close other tabs with the application
   - Refresh the page

#### Wrong Role Assigned

**Symptoms**: Cannot access expected features, see wrong partners

**Possible Causes**:
- Role not set in Auth0
- Role metadata incorrect
- Cache not cleared after role change
- Token not refreshed

**Solutions**:

1. **Verify role in Auth0**
   - Go to Auth0 Dashboard → User Management → Users
   - Click on your user
   - Scroll to **Metadata** section
   - Check `app_metadata` for role field
   - Should be: `{ "role": "PAM" }` (or PDM, TPM, PSM, TAM, Admin)

2. **Update role metadata in Auth0**
   - In the user's `app_metadata`, add or update:
   ```json
   {
     "role": "PAM"
   }
   ```
   - Click **Save**

3. **Log out and log back in**
   - Clear browser cache and localStorage
   - Log out completely from the application
   - Log back in to get fresh token with updated role
   - Verify role is correct in the header

4. **Clear session storage**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```
   - Then refresh the page and log in again

### Data Persistence Issues

#### Questionnaire Data Not Saving

**Symptoms**: Form data disappears, submission fails

**Possible Causes**:
- Netlify Blobs not configured
- Network error during save
- Validation errors preventing save
- Browser storage full

**Solutions**:

1. **Check Netlify Blobs configuration**
   - Verify `NETLIFY_BLOBS_CONTEXT` environment variable is set
   - Check Netlify Dashboard for Blobs status

2. **Check browser console for errors**
   - Open Developer Tools (F12)
   - Look for error messages
   - Note any failed network requests

3. **Verify form validation**
   - Ensure all required fields are filled
   - Check for validation error messages
   - Fix any validation issues

4. **Clear browser storage**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

5. **Try different browser**
   - Test in Chrome, Firefox, or Safari
   - Helps identify browser-specific issues

#### Cannot Retrieve Saved Data

**Symptoms**: Previously saved data not loading, blank forms

**Possible Causes**:
- Data not saved correctly
- Netlify Blobs connection issue
- Incorrect data key
- Data corruption

**Solutions**:

1. **Check Netlify Blobs**
   - Go to Netlify Dashboard → Blobs
   - Verify data exists
   - Check data structure

2. **Verify API endpoints**
   - Check browser Network tab
   - Look for failed API requests
   - Note error responses

3. **Check data key format**
   - Ensure partner ID is correct
   - Verify questionnaire ID matches

4. **Contact support**
   - Provide partner ID
   - Provide questionnaire ID
   - Include error messages

### Form and Validation Issues

#### Form Fields Not Appearing

**Symptoms**: Some or all form fields missing

**Possible Causes**:
- Questionnaire configuration error
- JavaScript error preventing render
- Browser compatibility issue

**Solutions**:

1. **Check browser console**
   - Look for JavaScript errors
   - Note any configuration errors

2. **Verify questionnaire configuration**
   - Check JSON syntax is valid
   - Ensure all required fields present
   - Validate field types are supported

3. **Clear cache and reload**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Reload page

4. **Try different browser**
   - Test in Chrome, Firefox, or Safari

#### Validation Errors Not Clearing

**Symptoms**: Error messages persist after fixing issues

**Possible Causes**:
- Form state not updating
- Validation logic error
- Browser cache issue

**Solutions**:

1. **Refresh the page**
   - Save your work if possible
   - Reload the page
   - Re-enter data

2. **Clear form and start over**
   - Click "Clear Form" if available
   - Refresh page
   - Re-enter data

3. **Check validation rules**
   - Ensure data meets requirements
   - Review help text for guidance

#### Signature Capture Not Working

**Symptoms**: Cannot draw or type signature

**Possible Causes**:
- Canvas not loading
- Touch events not working
- Browser compatibility

**Solutions**:

1. **Try different signature mode**
   - Switch between typed and drawn
   - Use mode that works

2. **Check browser compatibility**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Update browser to latest version

3. **Clear canvas and try again**
   - Click "Clear" button
   - Try drawing/typing again

4. **Disable browser extensions**
   - Try in incognito/private mode
   - Disable extensions one by one

### Dashboard and Display Issues

#### Partners Not Appearing

**Symptoms**: Dashboard empty or missing partners

**Possible Causes**:
- No partners created yet
- Role-based filtering hiding partners
- Data loading error
- Network issue

**Solutions**:

1. **Verify partners exist**
   - Check with PAM or admin
   - Verify you should see partners

2. **Check your role**
   - PDM only sees Pre-Contract through Gate 1
   - TPM only sees Gate 2
   - PSM/TAM only see Gate 3 and Post-Launch
   - PAM sees all partners they own

3. **Check browser console**
   - Look for API errors
   - Note failed requests

4. **Refresh the page**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

5. **Try different browser**
   - Test in Chrome, Firefox, or Safari

#### Gate Status Not Updating

**Symptoms**: Gate status shows old information

**Possible Causes**:
- Cache not cleared
- Data not saved correctly
- Calculation error

**Solutions**:

1. **Refresh the page**
   - Hard refresh to clear cache

2. **Verify questionnaire was submitted**
   - Check submission confirmation
   - Review submission history

3. **Check pass/fail criteria**
   - Ensure all sections passed
   - Review failure reasons

4. **Contact support**
   - Provide partner ID
   - Provide gate information

### Performance Issues

#### Slow Page Load

**Symptoms**: Pages take long time to load

**Possible Causes**:
- Large data sets
- Network latency
- Server issues
- Browser performance

**Solutions**:

1. **Check network speed**
   - Test internet connection
   - Try different network

2. **Clear browser cache**
   - Clear cache and cookies
   - Restart browser

3. **Close unnecessary tabs**
   - Reduce browser memory usage
   - Close other applications

4. **Check Netlify status**
   - Visit Netlify status page
   - Check for service issues

#### Form Submission Slow

**Symptoms**: Form takes long time to submit

**Possible Causes**:
- Large form data
- Network latency
- Server processing time

**Solutions**:

1. **Wait for completion**
   - Don't refresh or close page
   - Wait for confirmation message

2. **Check network connection**
   - Ensure stable connection
   - Try different network if available

3. **Reduce data size**
   - Shorten text responses if very long
   - Remove unnecessary data

### Report and Export Issues

#### Reports Not Loading

**Symptoms**: Reports page blank or shows errors

**Possible Causes**:
- No data available
- Data loading error
- Calculation error

**Solutions**:

1. **Verify data exists**
   - Check that partners and submissions exist
   - Verify you have access to data

2. **Check browser console**
   - Look for errors
   - Note failed API requests

3. **Refresh the page**
   - Hard refresh to clear cache

4. **Try different date range**
   - Adjust filters
   - Try broader date range

#### Export Not Working

**Symptoms**: CSV export fails or downloads empty file

**Possible Causes**:
- No data to export
- Browser blocking download
- Export function error

**Solutions**:

1. **Check data exists**
   - Verify reports show data
   - Apply filters if needed

2. **Allow downloads**
   - Check browser download settings
   - Allow downloads from site

3. **Try different browser**
   - Test in Chrome, Firefox, or Safari

4. **Check popup blocker**
   - Disable popup blocker for site
   - Allow downloads

### Documentation Issues

#### Documentation Links Not Working

**Symptoms**: Clicking documentation links shows 404 or error

**Possible Causes**:
- Link URL incorrect
- Resource moved or deleted
- Network issue

**Solutions**:

1. **Verify link URL**
   - Check if URL is correct
   - Try accessing directly

2. **Report broken link**
   - Note which link is broken
   - Contact support or admin

3. **Use alternative resources**
   - Check documentation hub
   - Search for alternative guides

#### Documentation Not Loading

**Symptoms**: Documentation hub empty or not loading

**Possible Causes**:
- Configuration error
- Data loading error
- Network issue

**Solutions**:

1. **Refresh the page**
   - Hard refresh to clear cache

2. **Check browser console**
   - Look for errors
   - Note failed requests

3. **Try different browser**
   - Test in Chrome, Firefox, or Safari

## Error Messages

### "Authentication Required"

**Meaning**: You need to log in to access this page

**Solution**: Click "Log In" and enter your credentials

### "Access Denied"

**Meaning**: You don't have permission to access this resource

**Solution**: 
- Verify your role is correct
- Contact admin if you should have access
- Check if you're accessing the right partner

### Auth0-Specific Errors

#### "Login required"

**Meaning**: Your session has expired or you're not logged in

**Solution**: Click "Sign In" to authenticate with Auth0

#### "Consent required"

**Meaning**: Auth0 requires user consent for the application

**Solution**: 
- Click "Accept" on the Auth0 consent screen
- Contact admin if consent screen keeps appearing

#### "Access denied"

**Meaning**: Auth0 denied access (user cancelled login or insufficient permissions)

**Solution**:
- Try logging in again
- Verify your account has the correct permissions
- Contact admin if you should have access

#### "Invalid state"

**Meaning**: OAuth state parameter mismatch (possible CSRF attack or session issue)

**Solution**:
- Clear browser cache and cookies
- Try logging in again
- If persists, contact support

#### "Configuration error"

**Meaning**: Auth0 environment variables are missing or incorrect

**Solution**:
- Verify `.env` file has correct Auth0 credentials
- Check `PUBLIC_AUTH0_DOMAIN` and `PUBLIC_AUTH0_CLIENT_ID`
- In production, verify Netlify environment variables are set
- See [Auth0 Setup Guide](../README.md#auth0-setup)

#### "Network error during authentication"

**Meaning**: Cannot connect to Auth0 servers

**Solution**:
- Check internet connection
- Verify Auth0 domain is accessible
- Try again in a few moments
- Check if firewall is blocking Auth0

#### "Token validation failed"

**Meaning**: Auth0 token is invalid or expired

**Solution**:
- Log out and log back in
- Clear browser storage
- If persists, contact support

### "Validation Error"

**Meaning**: Form data doesn't meet requirements

**Solution**:
- Review error messages on form
- Fix validation issues
- Ensure all required fields filled

### "Network Error"

**Meaning**: Cannot connect to server

**Solution**:
- Check internet connection
- Try again in a few moments
- Contact support if persists

### "Data Not Found"

**Meaning**: Requested data doesn't exist

**Solution**:
- Verify ID is correct
- Check if data was deleted
- Contact support if data should exist

### "Server Error"

**Meaning**: Server encountered an error

**Solution**:
- Try again in a few moments
- Check Netlify status page
- Contact support if persists

## Browser-Specific Issues

### Chrome

**Issue**: Forms not submitting
**Solution**: Disable extensions, try incognito mode

**Issue**: Slow performance
**Solution**: Clear cache, close unnecessary tabs

### Firefox

**Issue**: Signature capture not working
**Solution**: Update Firefox, check canvas settings

**Issue**: Authentication issues
**Solution**: Check cookie settings, allow third-party cookies

### Safari

**Issue**: Forms not saving
**Solution**: Check privacy settings, allow cookies

**Issue**: Display issues
**Solution**: Update Safari, clear cache

### Edge

**Issue**: Compatibility issues
**Solution**: Update Edge, try Chrome

## Mobile and Tablet Issues

### Touch Events Not Working

**Solution**:
- Ensure device is updated
- Try different browser
- Use desktop if available

### Display Issues

**Solution**:
- Rotate device to landscape
- Zoom in/out to adjust
- Use desktop for complex forms

### Performance Issues

**Solution**:
- Close other apps
- Clear browser cache
- Use WiFi instead of cellular

## Auth0 Troubleshooting

### Development Mode Issues

#### Mock Authentication Warning

**Symptoms**: Console shows "Using mock authentication" warning

**Meaning**: Auth0 is not configured, using mock authentication for development

**Solution**:
- This is expected if you haven't set up Auth0 yet
- To use real Auth0, follow the [Auth0 Setup Guide](../README.md#auth0-setup)
- Mock authentication allows UI development without Auth0

#### Auth0 Not Loading in Development

**Symptoms**: Login button doesn't work in local development

**Possible Causes**:
- Environment variables not loaded
- Callback URL not configured for localhost
- Auth0 SDK not loading

**Solutions**:

1. **Check environment variables**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   ```

2. **Verify callback URL in Auth0**
   - Go to Auth0 Dashboard → Applications → Settings
   - Ensure `http://localhost:4321` is in Allowed Callback URLs

3. **Restart development server**
   ```bash
   npm run dev
   ```

4. **Check browser console**
   - Look for Auth0 SDK loading errors
   - Verify no CORS errors

### Production Deployment Issues

#### Auth0 Works Locally But Not in Production

**Symptoms**: Authentication works in development but fails in production

**Possible Causes**:
- Environment variables not set in Netlify
- Callback URLs not configured for production domain
- CORS settings incorrect

**Solutions**:

1. **Verify Netlify environment variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Ensure all Auth0 variables are set:
     - `PUBLIC_AUTH0_DOMAIN`
     - `PUBLIC_AUTH0_CLIENT_ID`
     - `PUBLIC_AUTH0_CALLBACK_URL` (should be production URL)

2. **Update Auth0 callback URLs**
   - Go to Auth0 Dashboard → Applications → Settings
   - Add production URL to:
     - Allowed Callback URLs: `https://your-domain.netlify.app`
     - Allowed Logout URLs: `https://your-domain.netlify.app`
     - Allowed Web Origins: `https://your-domain.netlify.app`

3. **Redeploy the site**
   ```bash
   netlify deploy --prod
   ```

4. **Check Netlify deploy logs**
   - Look for build errors
   - Verify environment variables are loaded

#### Infinite Redirect Loop

**Symptoms**: Page keeps redirecting between app and Auth0

**Possible Causes**:
- Callback URL mismatch
- Session storage issue
- Middleware configuration error

**Solutions**:

1. **Verify callback URL matches exactly**
   - Check Auth0 settings
   - Ensure no trailing slashes
   - Verify protocol (http vs https)

2. **Clear browser storage**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Check middleware configuration**
   - Verify protected routes are configured correctly
   - Ensure middleware isn't blocking callback URL

4. **Disable browser extensions**
   - Try in incognito mode
   - Disable ad blockers and privacy extensions

### Token and Session Issues

#### Session Expires Too Quickly

**Symptoms**: Logged out after short period of time

**Possible Causes**:
- Auth0 session timeout too short
- Token expiration settings
- Browser not storing session

**Solutions**:

1. **Check Auth0 session settings**
   - Go to Auth0 Dashboard → Applications → Settings → Advanced Settings
   - Review session timeout settings

2. **Enable "Remember Me"**
   - Use persistent login option if available

3. **Check browser cookie settings**
   - Ensure cookies are enabled
   - Allow cookies for Auth0 domain

#### "Token expired" Error

**Symptoms**: Error message about expired token

**Solution**:
- Log out and log back in
- This is expected behavior after long inactivity
- Session will be refreshed on login

### Role and Permission Issues

#### Default Role Always Assigned

**Symptoms**: Always get "PAM" role regardless of Auth0 settings

**Possible Causes**:
- Role not set in Auth0 `app_metadata`
- Metadata not being sent in token
- Role extraction logic error

**Solutions**:

1. **Verify role in Auth0 metadata**
   - Go to Auth0 Dashboard → Users → Select User
   - Check `app_metadata` has `role` field
   - Should be in `app_metadata`, not `user_metadata`

2. **Check token includes metadata**
   - In browser console after login:
   ```javascript
   // Check stored user data
   console.log(localStorage.getItem('kuiper_user'));
   ```

3. **Contact admin**
   - Provide your email
   - Request role assignment in Auth0

#### Cannot Access Features for My Role

**Symptoms**: Features are hidden or inaccessible

**Possible Causes**:
- Role-based access control blocking access
- Role not recognized
- Feature not available for role

**Solutions**:

1. **Verify your role**
   - Check header shows correct role
   - Log out and log back in

2. **Review role permissions**
   - PAM: All partners they own, all gates
   - PDM: Pre-Contract through Gate 1
   - TPM: Gate 2
   - PSM/TAM: Gate 3 and Post-Launch

3. **Contact admin**
   - Verify you should have access
   - Request role change if needed

### CORS and Network Issues

#### CORS Error in Browser Console

**Symptoms**: Console shows "CORS policy" error

**Possible Causes**:
- Auth0 allowed origins not configured
- Browser blocking cross-origin requests

**Solutions**:

1. **Update Auth0 CORS settings**
   - Go to Auth0 Dashboard → Applications → Settings
   - Add your domain to Allowed Origins (CORS)
   - Include both localhost and production URLs

2. **Verify domain matches exactly**
   - No trailing slashes
   - Correct protocol (http/https)
   - Correct port for localhost

#### Network Request Failed

**Symptoms**: Authentication fails with network error

**Possible Causes**:
- Internet connectivity issue
- Auth0 service outage
- Firewall blocking Auth0

**Solutions**:

1. **Check internet connection**
   - Verify other websites load
   - Try different network

2. **Check Auth0 status**
   - Visit [Auth0 Status Page](https://status.auth0.com)
   - Check for service disruptions

3. **Check firewall settings**
   - Ensure Auth0 domain is not blocked
   - Try from different network

4. **Contact IT support**
   - Request Auth0 domain be whitelisted
   - Provide Auth0 domain: `*.auth0.com`

## Getting Help

### Before Contacting Support

1. **Check this troubleshooting guide**
2. **Review user guide for your role**
3. **Check browser console for errors**
4. **Try different browser**
5. **Clear cache and cookies**

### When Contacting Support

Provide the following information:

- **Your role**: PAM, PDM, TPM, PSM, or TAM
- **Browser and version**: Chrome 120, Firefox 121, etc.
- **Operating system**: Windows 11, macOS 14, etc.
- **What you were trying to do**: Specific action
- **What happened**: Actual result
- **Error messages**: Exact text or screenshot
- **Steps to reproduce**: How to recreate the issue
- **Partner ID**: If relevant
- **Questionnaire ID**: If relevant

### Support Channels

- **Email**: [support-email]
- **Slack**: #partner-onboarding-support
- **Phone**: [support-phone] (urgent issues only)

### Response Times

- **Critical** (system down): 1 hour
- **High** (major feature broken): 4 hours
- **Medium** (minor issue): 1 business day
- **Low** (question or enhancement): 3 business days

## Preventive Measures

### Best Practices

1. **Save work frequently**: Use auto-save or save drafts
2. **Use modern browser**: Keep browser updated
3. **Stable network**: Use reliable internet connection
4. **Clear cache regularly**: Prevent cache-related issues
5. **Log out when done**: Especially on shared computers

### Regular Maintenance

1. **Update browser**: Keep browser up to date
2. **Clear cache weekly**: Prevent accumulation
3. **Check for updates**: Review release notes
4. **Provide feedback**: Report issues and suggestions

## Known Issues

### Current Known Issues

Check the [Known Issues](./KNOWN-ISSUES.md) document for current known issues and workarounds.

### Reporting New Issues

If you encounter an issue not listed here:

1. Document the issue thoroughly
2. Check if others have reported it
3. Contact support with details
4. Follow up on resolution

## Additional Resources

- [User Guides](./user-guides/) - Role-specific guides
- [Configuration Guide](./QUESTIONNAIRE-CONFIG.md) - Questionnaire configuration
- [Deployment Checklist](./DEPLOYMENT-CHECKLIST.md) - Deployment procedures
- [README](../README.md) - General information
