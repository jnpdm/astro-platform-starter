# Authentication Middleware

This module provides authentication and authorization functionality for the Kuiper Partner Onboarding Hub using Netlify Identity.

## Overview

The authentication system integrates Netlify Identity to provide:
- User authentication (login/logout)
- Role-based access control (RBAC)
- Session management
- Route protection
- User role management

## User Roles

The system supports six user roles:

- **PAM** (Partner Account Manager): Manages all partners, full access to all gates
- **PDM** (Partner Development Manager): Pre-Contract through Gate 1 (Ready to Sell)
- **TPM** (Technical Program Manager): Gate 2 (Ready to Order) - integration focus
- **PSM** (Partner Success Manager): Gate 3 (Ready to Deliver) and Post-Launch
- **TAM** (Technical Account Manager): Gate 3 (Ready to Deliver) and Post-Launch
- **Admin**: Full access to all features and routes

## Setup

### 1. Enable Netlify Identity

In your Netlify site dashboard:
1. Go to Site Settings > Identity
2. Enable Identity
3. Configure registration preferences (Invite only recommended)
4. Set up external providers if needed (Google, GitHub, etc.)

### 2. Configure User Roles

User roles are stored in Netlify Identity's `app_metadata`. You can set roles via:

**Option A: Netlify UI**
1. Go to Identity tab in Netlify dashboard
2. Select a user
3. Edit user metadata
4. Add to `app_metadata`:
```json
{
  "role": "PDM"
}
```

**Option B: Netlify Identity API**
```javascript
// Using Netlify Identity Admin API
const response = await fetch(`https://your-site.netlify.app/.netlify/identity/admin/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    app_metadata: {
      role: 'PDM'
    }
  })
});
```

### 3. Environment Variables

No additional environment variables are required. Netlify Identity is automatically configured when enabled on your site.

## Usage

### Client-Side Authentication

The authentication system is automatically initialized in `HubLayout.astro`. Users can authenticate using the global `kuiperAuth` object:

```javascript
// Login
window.kuiperAuth.login();

// Logout
window.kuiperAuth.logout();

// Get current user
const user = window.kuiperAuth.getCurrentUser();
```

### Route Protection

Routes are automatically protected based on the `PROTECTED_ROUTES` configuration:

```typescript
export const PROTECTED_ROUTES = [
  '/partner',
  '/questionnaires',
  '/reports',
  '/api/partners',
  '/api/partner',
  '/api/submissions',
  '/api/submission',
];
```

Public routes (accessible without authentication):
```typescript
export const PUBLIC_ROUTES = [
  '/',
  '/documentation',
];
```

### Role-Based Access Control

Check user permissions in your code:

```typescript
import { canAccessRoute, hasRole, isAdmin } from '../middleware/auth';

// Check if user can access a specific route
if (canAccessRoute(user, '/questionnaires/gate-2-ready-to-order')) {
  // Allow access
}

// Check specific role
if (hasRole(user, 'PDM')) {
  // PDM-specific logic
}

// Check if user is admin
if (isAdmin(user)) {
  // Admin-only features
}
```

### Session Management

User sessions are automatically managed:

```typescript
import { storeUserSession, getUserSession, clearUserSession } from '../middleware/auth';

// Store user session (automatically called on login)
storeUserSession(authUser);

// Retrieve current session
const user = getUserSession();

// Clear session (automatically called on logout)
clearUserSession();
```

## Role-Based Route Access

The system enforces role-based access to specific routes:

| Route | Allowed Roles |
|-------|---------------|
| `/questionnaires/pre-contract-pdm` | PAM, PDM, Admin |
| `/questionnaires/gate-0-kickoff` | PAM, PDM, Admin |
| `/questionnaires/gate-1-ready-to-sell` | PAM, PDM, TPM, Admin |
| `/questionnaires/gate-2-ready-to-order` | TPM, Admin |
| `/questionnaires/gate-3-ready-to-deliver` | PSM, TAM, Admin |
| `/reports` | Admin, PAM |
| `/partner/*` | All authenticated users |

## API Route Protection

To protect API routes, check authentication in your endpoint:

```typescript
// src/pages/api/partners.ts
import type { APIRoute } from 'astro';
import { isAuthenticated, transformUser } from '../../middleware/auth';

export const GET: APIRoute = async ({ request }) => {
  // Get user from Netlify Identity (server-side)
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify token and get user
  // Implementation depends on your server-side auth setup
  
  // ... rest of your API logic
};
```

## Testing

The authentication middleware includes comprehensive tests:

```bash
npm test -- src/middleware/auth.test.ts
```

Tests cover:
- User role extraction
- User transformation
- Authentication checks
- Role-based access control
- Session management
- Route protection

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: Consider using HTTP-only cookies for session storage in production
3. **Token Expiration**: Netlify Identity tokens expire after 1 hour by default
4. **Role Validation**: Always validate roles server-side for sensitive operations
5. **CORS**: Configure CORS appropriately for API routes

## Troubleshooting

### User not authenticated after login
- Check browser console for errors
- Verify Netlify Identity is enabled on your site
- Check that the Identity widget script is loaded

### Role not recognized
- Verify role is set in user's `app_metadata`
- Check that role value matches exactly (case-sensitive)
- Refresh the page after updating roles

### Protected route accessible without login
- Verify route is listed in `PROTECTED_ROUTES`
- Check that authentication script is running
- Clear browser cache and localStorage

## Future Enhancements

Potential improvements for production:

1. **Server-Side Session Management**: Move from localStorage to HTTP-only cookies
2. **Token Refresh**: Implement automatic token refresh before expiration
3. **Multi-Factor Authentication**: Add MFA support via Netlify Identity
4. **Audit Logging**: Log all authentication events
5. **Rate Limiting**: Implement rate limiting on authentication endpoints
6. **Session Timeout**: Add configurable session timeout with warning
