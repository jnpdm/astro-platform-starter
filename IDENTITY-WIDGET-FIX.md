# Netlify Identity Widget Fix

**Issue**: `window.netlifyIdentity` and `window.kuiperAuth` returning `undefined`

## Root Cause

The initialization script was running before the Netlify Identity widget finished loading, causing:
- `window.netlifyIdentity` to be `undefined`
- Event listeners not being attached
- Sign-in button not working

## Solution Applied

Updated `src/layouts/HubLayout.astro` to:

### 1. Wait for Widget to Load
```javascript
function initializeNetlifyIdentity() {
    if (!window.netlifyIdentity) {
        // Retry every 100ms until widget loads
        setTimeout(initializeNetlifyIdentity, 100);
        return;
    }
    // Widget loaded, proceed with initialization
}
```

### 2. Add Debug Logging
```javascript
console.log('Netlify Identity widget loaded successfully');
console.log('User logged in:', user?.email);
console.log('Opening login dialog');
```

### 3. Call init() Method
```javascript
window.netlifyIdentity.init();
```

### 4. Make kuiperAuth Available Immediately
```javascript
// Set up kuiperAuth before waiting for widget
window.kuiperAuth = {
    login: () => {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open('login');
        } else {
            console.error('Widget not loaded');
        }
    },
    // ...
};
```

## Testing

### In Browser Console

After deploying, open browser console and run:

```javascript
// Check if widget loaded
console.log('Widget:', typeof window.netlifyIdentity);
// Should output: "object"

// Check if auth loaded
console.log('Auth:', typeof window.kuiperAuth);
// Should output: "object"

// Try to open login
window.kuiperAuth.login();
// Should open the login dialog
```

### Expected Console Output

When page loads, you should see:
```
Netlify Identity widget loaded successfully
Netlify Identity initialized without user
```

When you click "Sign In":
```
Opening login dialog
```

When you log in:
```
User logged in: user@example.com
```

## Deploy

```bash
git add src/layouts/HubLayout.astro
git commit -m "Fix: Wait for Netlify Identity widget to load"
git push origin main
```

## Verification Steps

### 1. Check Console Logs
- Open deployed site
- Open browser console (F12)
- Look for "Netlify Identity widget loaded successfully"
- Should NOT see "widget not loaded yet, retrying..."

### 2. Test Sign-In Button
- Click "Sign In" button
- Should see "Opening login dialog" in console
- Login widget should open

### 3. Test Debug Commands
```javascript
// Should return "object"
typeof window.netlifyIdentity

// Should return "object"  
typeof window.kuiperAuth

// Should open login dialog
window.kuiperAuth.login()
```

## Troubleshooting

### If Still Undefined

#### Check 1: Widget Script Loading
View page source and verify:
```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

#### Check 2: Network Tab
- Open DevTools → Network tab
- Look for `netlify-identity-widget.js`
- Should show 200 status
- If 404 or blocked, widget isn't loading

#### Check 3: Console Errors
Look for:
- "Failed to load resource"
- "Blocked by CORS"
- "Content Security Policy"

#### Check 4: Identity Enabled
- Go to Netlify Dashboard
- Site Settings → Identity
- Should show "Enabled"

### If Widget Loads But Login Doesn't Work

#### Check 1: Identity Configuration
- Netlify Dashboard → Identity
- Verify "Registration preferences" is set
- Check "External providers" if using OAuth

#### Check 2: Site URL
- Site Settings → Identity → Settings
- Verify "Site URL" matches your actual URL

#### Check 3: Console Logs
When clicking "Sign In", should see:
```
Opening login dialog
```

If you see:
```
Netlify Identity widget not loaded
```

The widget still isn't loading properly.

## What Changed

### Before
```javascript
// Ran immediately, widget might not be loaded
if (window.netlifyIdentity) {
    // Setup event listeners
}
```

**Problem**: `window.netlifyIdentity` was `undefined` because script ran before widget loaded.

### After
```javascript
// Wait for widget to load
function initializeNetlifyIdentity() {
    if (!window.netlifyIdentity) {
        setTimeout(initializeNetlifyIdentity, 100);
        return;
    }
    // Now widget is definitely loaded
    window.netlifyIdentity.init();
    // Setup event listeners
}
```

**Solution**: Retry until widget is available, then initialize.

## Additional Improvements

### 1. Better Error Messages
```javascript
if (!window.netlifyIdentity) {
    console.error('Netlify Identity widget not loaded');
}
```

### 2. Explicit Initialization
```javascript
window.netlifyIdentity.init();
```

### 3. Debug Logging
```javascript
console.log('Netlify Identity widget loaded successfully');
console.log('User logged in:', user?.email);
```

## Summary

✅ **Fixed**: Widget loading race condition  
✅ **Added**: Retry logic with timeout  
✅ **Added**: Debug logging for troubleshooting  
✅ **Added**: Explicit `init()` call  
✅ **Result**: Widget and auth now load reliably  

Deploy and test - the sign-in button should now work!
