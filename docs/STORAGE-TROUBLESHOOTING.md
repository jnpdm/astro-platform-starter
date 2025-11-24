# Storage Troubleshooting Guide

## Overview

The application uses Netlify Blobs for persistent storage of partner records and questionnaire submissions.

## Testing Storage

### 1. Test Endpoint

Visit `/api/storage-test` to run a comprehensive storage test that will:
- Check environment variables
- Test write operations
- Test read operations
- Test list operations
- Test delete operations

### 2. Check Browser Console

When creating a partner, check the browser console for:
```
[Storage] Attempting to save partner: <partner-id>
[Storage] Environment: { isDev: false, mode: 'production', prod: true }
[Storage] Got store: partners
[Storage] Calling setJSON...
[Storage] Successfully saved partner: <partner-id>
```

### 3. Check Server Logs

In Netlify dashboard, check the function logs for:
- Storage initialization messages
- Any error messages from `@netlify/blobs`
- Environment variable values

## Common Issues

### Issue 1: Netlify Blobs Not Enabled

**Symptoms:**
- Partners don't save
- Error: "Netlify Blobs not available"

**Solution:**
1. Check `netlify.toml` has:
   ```toml
   [blobs]
   enabled = true
   ```
2. Redeploy the site

### Issue 2: Environment Variables Missing

**Symptoms:**
- Storage test shows missing `NETLIFY_BLOBS_CONTEXT`
- Errors about store initialization

**Solution:**
1. Check Netlify dashboard → Site settings → Environment variables
2. Ensure `NETLIFY_BLOBS_CONTEXT` is set to `production`
3. Redeploy

### Issue 3: Development Mode

**Symptoms:**
- Partners save in production but not locally
- Console shows "Netlify Blobs not available in development"

**Expected Behavior:**
- This is normal! Netlify Blobs only works in production
- In development, partners are logged to console but not persisted
- Use the deployed site for testing storage

### Issue 4: Permissions

**Symptoms:**
- 403 errors when accessing storage
- "Access denied" messages

**Solution:**
1. Check Netlify site has Blobs enabled in the dashboard
2. Verify the site is on a plan that supports Blobs
3. Check if there are any IP restrictions

## Debugging Steps

1. **Visit `/api/storage-test`** - This will show if basic storage operations work

2. **Check Environment** - Verify these are set correctly:
   - `NODE_ENV` should be `production`
   - `NETLIFY` should be `true`
   - `CONTEXT` should be `production`
   - `NETLIFY_BLOBS_CONTEXT` should be `production`

3. **Check Logs** - Look for:
   ```
   [Storage] Attempting to save partner: ...
   [Storage] Successfully saved partner: ...
   ```

4. **Test Partner Creation**:
   - Create a partner
   - Check browser console for storage logs
   - Check Netlify function logs
   - Try listing partners at `/api/partners`

5. **Verify Netlify Blobs Dashboard**:
   - Go to Netlify dashboard → Blobs
   - Check if the `partners` store exists
   - Check if there are any blobs in the store

## Manual Verification

### Check if Partners are Stored

```bash
# Using Netlify CLI
netlify blobs:list --store partners

# Or via API
curl https://your-site.netlify.app/api/partners
```

### Check Storage Test

```bash
curl https://your-site.netlify.app/api/storage-test
```

## Contact Support

If storage still doesn't work after trying these steps:

1. Collect the following information:
   - Output from `/api/storage-test`
   - Browser console logs when creating a partner
   - Netlify function logs
   - Screenshot of Netlify Blobs dashboard

2. Check Netlify status page: https://www.netlifystatus.com/

3. Contact Netlify support with the collected information
