# Design Document - Auth0 Migration

## Overview

This design outlines the migration from Netlify Identity to Auth0 for the Partner Onboarding Hub. The migration will replace the current authentication system while maintaining backward compatibility with existing interfaces and functionality. Auth0 provides a more robust, reliable authentication solution with better development environment support and fewer initialization issues.

The migration will use the Auth0 SPA SDK for client-side authentication and maintain the existing AuthUser interface to minimize breaking changes. All authentication logic will be centralized in a new auth utility module, with updates to the layout, header, and middleware components.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HubLayout.astro                                       │ │
│  │  - Loads Auth0 SDK                                     │ │
│  │  - Initializes auth client                             │ │
│  │  - Handles callbacks                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  src/utils/auth0.ts                                    │ │
│  │  - Auth0Client wrapper                                 │ │
│  │  - Login/Logout functions                              │ │
│  │  - Session management                                  │ │
│  │  - User transformation                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Header.astro / Protected Pages                        │ │
│  │  - Display user info                                   │ │
│  │  - Trigger auth actions                                │ │
│  │  - Check authentication state                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Auth0 Service                             │
│  - User authentication                                       │
│  - Token management                                          │
│  - User metadata (roles)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Page Load**: HubLayout initializes Auth0 SDK and checks for existing session
2. **Login**: User clicks "Sign In" → Redirects to Auth0 → Returns with tokens → Stores session
3. **Protected Route**: Middleware checks session → Redirects to login if needed
4. **Logout**: User clicks "Sign Out" → Clears session → Redirects to Auth0 logout

## Components and Interfaces

### 1. Auth0 Configuration

Environment variables required:
- `PUBLIC_AUTH0_DOMAIN`: Auth0 tenant domain
- `PUBLIC_AUTH0_CLIENT_ID`: Auth0 application client ID
- `PUBLIC_AUTH0_CALLBACK_URL`: Callback URL after authentication
- `PUBLIC_AUTH0_AUDIENCE`: API audience (optional)

### 2. Auth0 Utility Module (`src/utils/auth0.ts`)

Core authentication module that wraps the Auth0 SDK:

```typescript
interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
  audience?: string;
}

interface Auth0User {
  sub: string;
  email: string;
  name?: string;
  [key: string]: any;
}

// Initialize Auth0 client
function createAuth0Client(config: Auth0Config): Promise<Auth0Client>

// Login with redirect
function login(returnTo?: string): Promise<void>

// Logout
function logout(): Promise<void>

// Get current user
function getUser(): Promise<AuthUser | null>

// Check if authenticated
function isAuthenticated(): Promise<boolean>

// Handle callback after login
function handleCallback(): Promise<void>

// Transform Auth0 user to AuthUser
function transformAuth0User(auth0User: Auth0User): AuthUser
```

### 3. Updated Middleware (`src/middleware/auth.ts`)

The existing AuthUser interface and utility functions will remain unchanged:
- `AuthUser` interface (no changes)
- `UserRole` type (no changes)
- `isAuthenticated()`, `hasRole()`, `hasAnyRole()`, `isAdmin()` (no changes)
- `PROTECTED_ROUTES`, `PUBLIC_ROUTES` (no changes)
- `canAccessRoute()` (no changes)

Only the session storage functions will be updated to work with Auth0 tokens:
- `storeUserSession()` - Store Auth0 user data
- `getUserSession()` - Retrieve Auth0 user data
- `clearUserSession()` - Clear Auth0 session

### 4. Updated Layout (`src/layouts/HubLayout.astro`)

Replace Netlify Identity widget script with Auth0 SDK:

```html
<!-- Remove -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>

<!-- Add -->
<script src="https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js"></script>
```

Update initialization script to use Auth0:
- Initialize Auth0 client on page load
- Handle OAuth callback
- Check authentication state
- Provide global auth functions

### 5. Updated Header (`src/components/Header.astro`)

Update the authentication UI logic:
- Replace `window.netlifyIdentity` calls with Auth0 functions
- Update event listeners to use Auth0 state changes
- Maintain existing UI structure and styling

### 6. RBAC Integration

No changes required to `src/utils/rbac.ts`. The RBAC module will continue to work with the AuthUser interface, which remains unchanged.

## Data Models

### AuthUser (Unchanged)

```typescript
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  app_metadata?: {
    role?: UserRole;
    roles?: UserRole[];
  };
  user_metadata?: {
    full_name?: string;
  };
}
```

### Auth0 User Metadata Structure

Auth0 users will store role information in `app_metadata`:

```json
{
  "user_id": "auth0|123456",
  "email": "user@example.com",
  "name": "John Doe",
  "app_metadata": {
    "role": "PAM"
  }
}
```

### Session Storage

Session data stored in localStorage:
- `kuiper_user`: Serialized AuthUser object
- `kuiper_user_role`: User role string
- `auth0_token`: Auth0 access token (managed by SDK)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role extraction consistency
*For any* Auth0 user object with role metadata, extracting the role should return a valid UserRole type
**Validates: Requirements 3.1**

### Property 2: Session persistence
*For any* authenticated user, storing their session and then retrieving it should return an equivalent AuthUser object
**Validates: Requirements 4.1, 4.2**

### Property 3: Protected route redirection
*For any* protected route, when accessed without authentication, the system should redirect to login with the original URL as a return parameter
**Validates: Requirements 5.1**

### Property 4: Authentication round-trip
*For any* protected route request, after successful authentication, the user should be redirected back to the originally requested route
**Validates: Requirements 5.2**

### Property 5: Middleware execution order
*For any* protected route, the authentication middleware should execute before the page rendering logic
**Validates: Requirements 5.5**

### Property 6: Environment-specific configuration
*For any* environment (development or production), the Auth0 configuration should match the environment-specific credentials
**Validates: Requirements 6.4**

### Property 7: Callback URL handling
*For any* valid callback URL (localhost or production domain), the Auth0 callback handler should successfully process the authentication response
**Validates: Requirements 6.5**

### Property 8: Role support completeness
*For any* valid UserRole (Admin, PAM, PDM, TPM, PSM, TAM), the system should correctly handle role-based access control
**Validates: Requirements 7.3**

### Property 9: Route protection consistency
*For any* route in PROTECTED_ROUTES, the middleware should enforce authentication requirements consistently
**Validates: Requirements 7.5**

### Property 10: Error message generation
*For any* Auth0 error response, the system should generate a user-friendly error message
**Validates: Requirements 8.1**

### Property 11: Error logging context
*For any* error that occurs during authentication, the logged error should include relevant context (user ID, timestamp, error type)
**Validates: Requirements 8.5**

## Error Handling

### Authentication Errors

1. **Missing Configuration**
   - Detect missing Auth0 environment variables on initialization
   - Display clear setup instructions to developers
   - Provide fallback mock authentication in development mode
   - Log detailed error messages with missing variable names

2. **Network Errors**
   - Catch network failures during Auth0 API calls
   - Display user-friendly "connection failed" messages
   - Provide retry button for transient failures
   - Log network errors with request details

3. **Token Validation Errors**
   - Detect expired or invalid tokens
   - Clear corrupted session data automatically
   - Redirect to login with appropriate error message
   - Log token validation failures for debugging

4. **Callback Errors**
   - Handle Auth0 callback errors (user cancellation, invalid state)
   - Display appropriate error messages based on error type
   - Redirect to home page with error notification
   - Log callback errors with full error details

### Session Management Errors

1. **Storage Errors**
   - Catch localStorage quota exceeded errors
   - Handle localStorage access denied (private browsing)
   - Fall back to in-memory session storage
   - Warn users about session persistence limitations

2. **Corrupted Session Data**
   - Detect malformed JSON in session storage
   - Clear corrupted data automatically
   - Prompt for re-authentication
   - Log corruption details for investigation

3. **Session Expiration**
   - Detect expired sessions on protected routes
   - Redirect to login with return URL
   - Display "session expired" message
   - Clear expired session data

### Role Management Errors

1. **Missing Role Data**
   - Detect users without assigned roles
   - Assign default "PAM" role automatically
   - Log users with missing roles for admin review
   - Display role assignment in UI

2. **Invalid Role Data**
   - Validate role values against UserRole type
   - Reject invalid roles and use default
   - Log invalid role assignments
   - Notify admins of role data issues

### Error Recovery Strategies

1. **Automatic Recovery**
   - Clear corrupted session data
   - Retry failed network requests (with exponential backoff)
   - Fall back to default roles when missing
   - Reinitialize Auth0 client on configuration errors

2. **User-Initiated Recovery**
   - Provide "Try Again" buttons for transient errors
   - Offer "Clear Session" option for persistent issues
   - Display "Contact Support" for unrecoverable errors
   - Allow manual logout and re-login

3. **Developer Tools**
   - Console logging for all errors with context
   - Error boundary components to catch React errors
   - Development mode warnings for configuration issues
   - Mock authentication for testing without Auth0

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Auth0 Utility Functions**
   - Test `transformAuth0User()` with various user objects
   - Test `getUserRole()` with missing/invalid role data
   - Test session storage functions with edge cases (null, undefined, corrupted data)
   - Test configuration validation with missing environment variables

2. **Middleware Functions**
   - Test `isProtectedRoute()` with various path patterns
   - Test `canAccessRoute()` with different user roles
   - Test `getLoginRedirectUrl()` with special characters in paths
   - Test session retrieval with expired tokens

3. **Error Handling**
   - Test error message generation for specific Auth0 errors
   - Test fallback behavior when Auth0 is unavailable
   - Test session cleanup on logout
   - Test mock authentication in development mode

4. **Integration Points**
   - Test Auth0 callback handling with mock responses
   - Test UI updates after authentication state changes
   - Test route protection with middleware
   - Test role-based access control integration

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property-based testing library):

**Configuration:**
- Each property test will run a minimum of 100 iterations
- Tests will use fast-check's built-in generators and custom generators for domain types
- Each test will be tagged with a comment referencing the design document property

**Test Tagging Format:**
```typescript
// Feature: auth0-migration, Property 1: Role extraction consistency
```

**Property Tests:**

1. **Property 1: Role extraction consistency**
   - Generate random Auth0 user objects with various metadata structures
   - Verify `getUserRole()` always returns a valid UserRole
   - Test with missing metadata, null values, empty arrays

2. **Property 2: Session persistence**
   - Generate random AuthUser objects
   - Store in localStorage, retrieve, and verify equality
   - Test round-trip: `storeUserSession(user)` → `getUserSession()` → should equal original user

3. **Property 3: Protected route redirection**
   - Generate random protected route paths
   - Verify unauthenticated access always redirects to login
   - Verify redirect URL includes return parameter

4. **Property 4: Authentication round-trip**
   - Generate random protected route requests
   - Simulate authentication flow
   - Verify final destination matches original request

5. **Property 5: Middleware execution order**
   - Generate random protected routes
   - Verify middleware executes before page logic
   - Test with various authentication states

6. **Property 6: Environment-specific configuration**
   - Generate random environment configurations
   - Verify correct Auth0 config is selected
   - Test with development and production environments

7. **Property 7: Callback URL handling**
   - Generate random valid callback URLs (localhost and production)
   - Verify callback handler processes all valid URLs
   - Test with various port numbers and protocols

8. **Property 8: Role support completeness**
   - Generate random UserRole values
   - Verify RBAC functions handle all roles correctly
   - Test with all six role types

9. **Property 9: Route protection consistency**
   - Generate random routes from PROTECTED_ROUTES
   - Verify consistent authentication enforcement
   - Test with various user authentication states

10. **Property 10: Error message generation**
    - Generate random Auth0 error responses
    - Verify all errors produce user-friendly messages
    - Test with various error codes and types

11. **Property 11: Error logging context**
    - Generate random authentication errors
    - Verify all logged errors include context
    - Test with various error scenarios

### Integration Testing

Integration tests will verify end-to-end authentication flows:

1. **Login Flow**
   - Test complete login flow from button click to authenticated state
   - Verify session storage after successful login
   - Verify UI updates after authentication

2. **Logout Flow**
   - Test complete logout flow from button click to logged out state
   - Verify session cleanup
   - Verify redirect to home page

3. **Protected Route Access**
   - Test accessing protected routes without authentication
   - Test accessing protected routes with authentication
   - Test role-based route access

4. **Session Persistence**
   - Test page refresh with active session
   - Test session restoration after browser restart
   - Test session expiration handling

### Manual Testing Checklist

1. **Development Environment**
   - [ ] Auth0 login works on localhost
   - [ ] Mock authentication works when Auth0 not configured
   - [ ] Console warnings appear for mock auth
   - [ ] Development credentials are used

2. **Production Environment**
   - [ ] Auth0 login works on production domain
   - [ ] Production credentials are used
   - [ ] Callback URLs work correctly
   - [ ] Session persists across page refreshes

3. **Role Management**
   - [ ] Roles are correctly extracted from Auth0
   - [ ] Default role is assigned when missing
   - [ ] Role-based access control works
   - [ ] Role updates reflect after re-login

4. **Error Scenarios**
   - [ ] Network errors display friendly messages
   - [ ] Missing configuration shows setup instructions
   - [ ] Corrupted session data is handled gracefully
   - [ ] Token validation errors trigger re-authentication

## Migration Plan

### Phase 1: Preparation
1. Set up Auth0 tenant and application
2. Configure Auth0 application settings (callback URLs, allowed origins)
3. Set up user roles in Auth0 (using app_metadata)
4. Add Auth0 environment variables to development and production

### Phase 2: Implementation
1. Install Auth0 SPA SDK
2. Create Auth0 utility module (`src/utils/auth0.ts`)
3. Update middleware to use Auth0 session management
4. Update HubLayout to initialize Auth0
5. Update Header component to use Auth0 functions
6. Add error handling and fallback logic

### Phase 3: Testing
1. Write unit tests for Auth0 utilities
2. Write property-based tests for core properties
3. Run integration tests for authentication flows
4. Test in development environment
5. Test in staging environment

### Phase 4: Deployment
1. Deploy to staging with Auth0 enabled
2. Verify all functionality works
3. Migrate existing users (if needed)
4. Deploy to production
5. Monitor for errors and issues

### Phase 5: Cleanup
1. Remove Netlify Identity widget script
2. Remove Netlify Identity event listeners
3. Update documentation
4. Archive old authentication code

### Rollback Plan

If issues arise during migration:
1. Revert to previous deployment
2. Disable Auth0 integration
3. Re-enable Netlify Identity
4. Investigate and fix issues
5. Retry migration

The migration is designed to be reversible by maintaining the same AuthUser interface and session storage structure.
