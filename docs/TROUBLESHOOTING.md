# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Cannot Log In

**Symptoms**: Login button doesn't work, or redirects to error page

**Possible Causes**:
- Netlify Identity not configured
- User not added to Identity
- Browser cookies disabled
- Network connectivity issues

**Solutions**:

1. **Verify Netlify Identity is enabled**
   - Go to Netlify Dashboard → Site Settings → Identity
   - Ensure Identity is enabled
   - Check registration preferences

2. **Check user exists**
   - Go to Netlify Dashboard → Identity → Users
   - Verify your email is listed
   - Resend invitation if needed

3. **Clear browser cache and cookies**
   ```
   Chrome: Settings → Privacy → Clear browsing data
   Firefox: Settings → Privacy → Clear Data
   Safari: Preferences → Privacy → Manage Website Data
   ```

4. **Try incognito/private mode**
   - This helps identify if browser extensions are interfering

5. **Check network connectivity**
   - Verify you can access other websites
   - Check if firewall is blocking Netlify

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
- Role not set in Netlify Identity
- Role metadata incorrect
- Cache not cleared after role change

**Solutions**:

1. **Verify role in Netlify Identity**
   - Go to Netlify Dashboard → Identity → Users
   - Click on your user
   - Check user metadata for role field
   - Should be: `{ "role": "PAM" }` (or PDM, TPM, PSM, TAM)

2. **Update role metadata**
   ```json
   {
     "role": "PAM",
     "name": "Your Name"
   }
   ```

3. **Log out and log back in**
   - Clear browser cache
   - Log out completely
   - Log back in
   - Verify role is correct

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
