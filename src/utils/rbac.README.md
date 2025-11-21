# Role-Based Access Control (RBAC)

This module implements role-based access control for the Kuiper Partner Onboarding Hub, ensuring that users only see and can interact with partners and gates relevant to their role.

## Overview

The RBAC system controls access based on two factors:
1. **Partner Ownership**: Users can only access partners they are assigned to (as PAM, PDM, TPM, PSM, or TAM)
2. **Gate Visibility**: Users can only view partners in gates relevant to their role

## User Roles

### Admin
- **Access**: Full access to all partners and all gates
- **Gates**: Pre-Contract, Gate 0, Gate 1, Gate 2, Gate 3, Post-Launch
- **Permissions**: Can view, edit, and submit questionnaires for any partner

### PAM (Partner Account Manager)
- **Access**: All partners they own across all gates
- **Gates**: Pre-Contract, Gate 0, Gate 1, Gate 2, Gate 3, Post-Launch
- **Permissions**: Full access to their assigned partners

### PDM (Partner Development Manager)
- **Access**: Partners they are assigned to in early stages
- **Gates**: Pre-Contract, Gate 0, Gate 1 (Ready to Sell)
- **Permissions**: Can view and edit partners in Pre-Contract through Gate 1

### TPM (Technical Program Manager)
- **Access**: Partners they are assigned to in integration phase
- **Gates**: Gate 2 (Ready to Order)
- **Permissions**: Can view and edit partners in Gate 2

### PSM (Partner Success Manager)
- **Access**: Partners they are assigned to in launch and post-launch phases
- **Gates**: Gate 3 (Ready to Deliver), Post-Launch
- **Permissions**: Can view and edit partners in Gate 3 and Post-Launch

### TAM (Technical Account Manager)
- **Access**: Partners they are assigned to in launch and post-launch phases
- **Gates**: Gate 3 (Ready to Deliver), Post-Launch
- **Permissions**: Can view and edit partners in Gate 3 and Post-Launch

## Key Functions

### `canAccessPartner(user, partner)`
Checks if a user can access a specific partner.

**Rules**:
- Admin can access all partners
- Users can access partners they are assigned to (in any role field)
- Email comparison is case-insensitive

**Example**:
```typescript
import { canAccessPartner } from '@/utils/rbac';

const user = getUserSession();
const partner = await getPartner(partnerId);

if (!canAccessPartner(user, partner)) {
    return new Response('Access denied', { status: 403 });
}
```

### `filterPartnersByRole(partners, user)`
Filters a list of partners based on user role and gate visibility.

**Returns**: Array of partners the user can access, filtered by:
1. Partner ownership (user must be assigned)
2. Gate visibility (gate must be relevant to role)

**Example**:
```typescript
import { filterPartnersByRole } from '@/utils/rbac';

const allPartners = await listPartners();
const visiblePartners = filterPartnersByRole(allPartners, currentUser);
```

### `groupPartnersByGate(partners, user)`
Groups partners by their current gate, filtered by role.

**Returns**: Object with gate IDs as keys and arrays of partners as values

**Example**:
```typescript
import { groupPartnersByGate } from '@/utils/rbac';

const grouped = groupPartnersByGate(allPartners, currentUser);
// { 'pre-contract': [...], 'gate-0': [...], ... }
```

### `canEditPartner(user, partner)`
Checks if a user can edit a partner record.

**Rules**:
- Admin can edit all partners
- Users can edit partners they are assigned to

### `canSubmitQuestionnaire(user, partner, gateId)`
Checks if a user can submit a questionnaire for a partner at a specific gate.

**Rules**:
- Admin can submit anything
- User must have access to the partner
- User must be able to view the gate

### `getRelevantGatesForRole(role)`
Returns array of gate IDs relevant to a specific role.

### `canViewGate(role, gateId)`
Checks if a role can view a specific gate.

### `getAssignedPartners(partners, userEmail)`
Returns all partners assigned to a specific user email.

### `isPrimaryOwner(user, partner)`
Checks if user is the primary owner (PAM) of a partner.

### `getRoleDashboardMessage(role)`
Returns a descriptive message for the dashboard based on role.

## Integration Points

### Dashboard (`src/pages/index.astro`)
```typescript
import { filterPartnersByRole, groupPartnersByGate, getRoleDashboardMessage } from '@/utils/rbac';

const currentUser = getUserSession();
const allPartners = await listPartners();
const partners = filterPartnersByRole(allPartners, currentUser);
const partnersByGate = groupPartnersByGate(allPartners, currentUser);
const message = getRoleDashboardMessage(currentUser.role);
```

### API Routes (`src/pages/api/partners.ts`)
```typescript
import { filterPartnersByRole } from '@/utils/rbac';

const currentUser = getUserSession();
const allPartners = await listPartners();
const partners = filterPartnersByRole(allPartners, currentUser);
```

### Individual Partner Access (`src/pages/api/partner/[id].ts`)
```typescript
import { canAccessPartner, canEditPartner } from '@/utils/rbac';

const currentUser = getUserSession();
const partner = await getPartner(id);

if (!canAccessPartner(currentUser, partner)) {
    return new Response('Access denied', { status: 403 });
}

if (!canEditPartner(currentUser, partner)) {
    return new Response('Cannot edit', { status: 403 });
}
```

### Partner Detail Page (`src/pages/partner/[id].astro`)
```typescript
import { canAccessPartner, canEditPartner } from '@/utils/rbac';

const currentUser = getUserSession();
const partner = await getPartner(id);

if (!canAccessPartner(currentUser, partner)) {
    return Astro.redirect('/?error=access-denied');
}

const canEdit = canEditPartner(currentUser, partner);
```

## Testing

Comprehensive unit tests are available in `src/utils/rbac.test.ts`:

```bash
npm test -- src/utils/rbac.test.ts
```

Tests cover:
- Partner access control for all roles
- Partner filtering by role and gate
- Gate visibility rules
- Edit permissions
- Questionnaire submission permissions
- Edge cases (null users, case-insensitive emails, etc.)

## Security Considerations

1. **Server-Side Enforcement**: All access control checks must be performed server-side
2. **API Protection**: All API routes must validate user permissions
3. **Client-Side Filtering**: Dashboard filtering is for UX only; API must enforce access
4. **Admin Override**: Admin role bypasses all restrictions for support purposes
5. **Case-Insensitive Emails**: Email comparisons are case-insensitive to prevent bypass

## Future Enhancements

- [ ] Add audit logging for access control decisions
- [ ] Implement time-based access (e.g., temporary access grants)
- [ ] Add partner-level permissions (e.g., read-only access)
- [ ] Support for multiple roles per user
- [ ] Team-based access control (e.g., all PDMs can see each other's partners)
