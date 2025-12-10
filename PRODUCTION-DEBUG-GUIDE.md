# Production Questionnaire Loading Debug Guide

## Issue Description
- Login shows success in browser console
- Questionnaire page hangs and doesn't load the form
- Works in development but fails in production

## Diagnostic Steps

### 1. Check Browser Console Logs

Open browser developer tools (F12) and check for:

```javascript
// Look for these log messages:
[Middleware] Request to: /questionnaires/gate-0-kickoff
[Middleware] Auth enabled: true
[Middleware] User session: { email: "...", role: "..." }
[Gate0Questionnaire] Component rendering
[Gate0Questionnaire] Component mounted successfully
```

### 2. Check Network Tab

In browser dev tools Network tab, look for:
- Any failed requests (red entries)
- 401/403 responses
- Redirects to login page

### 3. Check Application Tab (Storage)

In browser dev tools Application tab:
- **Cookies**: Look for `kuiper_user` and `kuiper_user_role` cookies
- **Local Storage**: Check for `kuiper_user`, `kuiper_user_role`, `kuiper_session_metadata`

### 4. Manual Session Check

Add this to browser console to check session:

```javascript
// Check localStorage
console.log('LocalStorage user:', localStorage.getItem('kuiper_user'));
console.log('LocalStorage role:', localStorage.getItem('kuiper_user_role'));

// Check cookies
console.log('All cookies:', document.cookie);

// Check if cookies contain user data
const cookies = document.cookie.split(';');
const userCookie = cookies.find(c => c.trim().startsWith('kuiper_user='));
console.log('User cookie:', userCookie);
```

## Common Issues and Solutions

### Issue 1: Session Not Persisting to Cookies

**Symptoms**: LocalStorage has user data, but cookies are empty

**Solution**: Add this after successful login:

```javascript
// Force cookie creation after login
function forceSetSessionCookies(user) {
    const maxAge = 24 * 60 * 60; // 24 hours
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
    
    document.cookie = `kuiper_user=${encodeURIComponent(JSON.stringify(user))}; ${cookieOptions}`;
    document.cookie = `kuiper_user_role=${encodeURIComponent(user.role)}; ${cookieOptions}`;
    
    console.log('Forced cookie creation:', document.cookie);
}
```

### Issue 2: React Component Not Mounting

**Symptoms**: Page loads but questionnaire form never appears

**Solution**: Check for JavaScript errors and add debug logging:

```javascript
// Add to questionnaire page
window.addEventListener('load', () => {
    console.log('Page loaded, checking for React component...');
    
    setTimeout(() => {
        const container = document.getElementById('questionnaire-content');
        const hasReactComponent = container && container.children.length > 0;
        console.log('React component mounted:', hasReactComponent);
        
        if (!hasReactComponent) {
            console.error('React component failed to mount!');
            // Force show error message
            const errorBoundary = document.getElementById('error-boundary');
            if (errorBoundary) {
                errorBoundary.classList.remove('hidden');
            }
        }
    }, 5000);
});
```

### Issue 3: Middleware Session Reading Issue

**Symptoms**: Cookies exist but middleware can't read them

**Solution**: Add server-side logging to check cookie parsing:

```javascript
// In middleware/index.ts, add more detailed logging:
console.log('[Middleware] Raw cookie header:', cookieHeader);
console.log('[Middleware] Parsed user session:', user);

// Check if cookies are being parsed correctly
if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const userCookie = cookies.find(c => c.startsWith('kuiper_user='));
    console.log('[Middleware] Found user cookie:', !!userCookie);
}
```

## Quick Fixes to Try

### Fix 1: Force Page Refresh After Login

Add this to the authentication success handler:

```javascript
// After successful login and session storage
storeUserSession(user);

// Force page refresh to ensure cookies are available to server
setTimeout(() => {
    window.location.reload();
}, 100);
```

### Fix 2: Add Session Validation Check

Add this to questionnaire pages:

```javascript
// Check session before loading questionnaire
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('kuiper_user');
    const cookies = document.cookie;
    
    if (user && !cookies.includes('kuiper_user=')) {
        console.log('Session exists in localStorage but not in cookies, refreshing...');
        // Re-store session to ensure cookies are set
        const userData = JSON.parse(user);
        storeUserSession(userData);
        
        // Refresh page after short delay
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
});
```

### Fix 3: Add Fallback Authentication Check

Add this to the questionnaire page script:

```javascript
// Fallback: If component doesn't load, check authentication
setTimeout(() => {
    const container = document.getElementById('questionnaire-content');
    const isVisible = container && container.style.display !== 'none';
    
    if (!isVisible) {
        console.log('Questionnaire not loaded, checking authentication...');
        
        // Check if we have a valid session
        const user = localStorage.getItem('kuiper_user');
        if (!user) {
            console.log('No user session, redirecting to login...');
            window.location.href = '/?redirect=' + encodeURIComponent(window.location.pathname);
        } else {
            console.log('User session exists, but component failed to load');
            // Show error message
            const errorBoundary = document.getElementById('error-boundary');
            if (errorBoundary) {
                errorBoundary.classList.remove('hidden');
            }
        }
    }
}, 10000); // Wait 10 seconds before giving up
```

## Testing Commands

### Check Session in Production

```bash
# Check if cookies are being set correctly
curl -I https://your-domain.netlify.app/questionnaires/gate-0-kickoff \
  -H "Cookie: kuiper_user=...; kuiper_user_role=..."

# Should return 200, not 302 redirect
```

### Verify Environment Variables

```bash
# In Netlify dashboard, check these are set:
AUTH_ENABLED=true
PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
PUBLIC_AUTH0_CLIENT_ID=your-client-id
PUBLIC_AUTH0_CALLBACK_URL=https://your-domain.netlify.app
```

## Next Steps

1. **Implement diagnostic logging** in production
2. **Check browser console** for specific error messages
3. **Verify session storage** is working correctly
4. **Test cookie persistence** across page loads
5. **Add fallback error handling** for failed component mounting

If the issue persists, the most likely solutions are:
- Force page refresh after login
- Add session validation and re-storage
- Implement better error boundaries and fallback UI