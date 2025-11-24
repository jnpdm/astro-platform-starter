# Test Failure Fix Plan

## Problem Summary

37 tests are failing across 3 main areas:
1. **Middleware tests (7 failures)** - Mock structure issues
2. **RBAC tests (25 failures)** - Role system mismatch
3. **Storage tests (5 failures)** - Error handling issues

## Root Cause Analysis

### Issue 1: Role System Mismatch (CRITICAL)
**Impact**: 25 test failures in RBAC

**Root Cause**: The implementation was simplified to only support `PAM` and `PDM` roles, but the tests still expect the full role system (`Admin`, `TPM`, `PSM`, `TAM`).

**Evidence**:
- `src/middleware/auth.ts` line 9: `export type UserRole = 'PAM' | 'PDM';`
- `src/utils/rbac.ts` checks for `user.role === 'PDM'` as admin
- Tests expect `'Admin'`, `'TPM'`, `'PSM'`, `'TAM'` roles
- Tests expect role-specific gate restrictions (PDM = Gates 0-1, TPM = Gate 2, etc.)

**Why This Is Hard to Diagnose**:
- The role simplification was done without updating tests
- PDM is being used as both a specific role AND as the admin role
- No clear documentation of which role system is correct
- Tests pass type checking because they use `AuthUser['role']` which accepts the old types

### Issue 2: Middleware Test Mock Structure
**Impact**: 7 test failures in middleware

**Root Cause**: The middleware code expects `context.request.headers` but test mocks don't provide a proper `request` object.

**Evidence**:
- `src/middleware/index.ts` line 47: `context.request.headers.get('cookie')`
- Test error: `Cannot read properties of undefined (reading 'headers')`
- Mock only provides `url`, `redirect`, `locals` but not `request`

### Issue 3: Storage Error Handling
**Impact**: 5 test failures in storage utilities

**Root Cause**: Storage functions are catching errors and returning fallback values instead of throwing `StorageError`.

**Evidence**:
- Tests expect `StorageError` to be thrown
- Functions return `null` or `[]` instead of throwing
- Development mode fallbacks prevent errors from propagating

## Fix Strategy

### Phase 1: Role System Decision (RESOLVED)
**Decision**: Use simplified system (PAM + PDM only)

**Evidence from AUTH0-ROLE-SETUP.md**:
- "The Partner Onboarding Hub uses a simplified two-role system"
- "PAM (Partner Account Manager): Can view and manage partners they own"
- "PDM (Partner Development Manager): Admin role with full access to all partners"
- No mention of Admin, TPM, PSM, or TAM roles
- PDM explicitly described as "Admin role"

**Implementation approach**:
- Keep current implementation (PAM + PDM only)
- Update all tests to match this simplified system
- Remove tests for non-existent roles (Admin, TPM, PSM, TAM)
- Both roles can access all gates (no gate restrictions)
- PDM has full access, PAM has owner-based access

### Phase 2: Fix Middleware Tests (Quick Win)
**Estimated time**: 15 minutes

**Changes needed**:
1. Update `createMockContext` in `src/middleware/index.test.ts`
2. Add proper `request` object with `headers` property
3. Mock `headers.get()` method

**Example fix**:
```typescript
const createMockContext = (pathname: string, search: string = '') => {
    const url = new URL(`http://localhost${pathname}${search}`);
    return {
        url,
        request: {
            headers: {
                get: vi.fn((name: string) => {
                    if (name === 'cookie') return null;
                    return null;
                })
            }
        },
        redirect: vi.fn((path: string) => ({ type: 'redirect', path })),
        locals: {} as any,
    };
};
```

### Phase 3: Fix RBAC Tests (Simplified System)
**Estimated time**: 30 minutes

**Changes to `src/utils/rbac.test.ts`**:

1. **Update `canAccessPartner` tests**:
   - Change `'Admin'` to `'PDM'` (1 test)
   - Remove `'TPM'` test (1 test to delete)
   - Keep PAM and PDM owner tests

2. **Update `filterPartnersByRole` tests**:
   - Change `'Admin'` to `'PDM'` (1 test)
   - Remove `'PDM'`, `'TPM'`, `'PSM'`, `'TAM'` filtering tests (4 tests to delete)
   - Keep PAM test (shows all their partners)
   - Update PDM test to show all partners (not filtered by gate)

3. **Update `getRelevantGatesForRole` tests**:
   - Remove `'Admin'` test (1 test to delete)
   - Update `'PDM'` test to return all gates (not just 0-1)
   - Remove `'TPM'`, `'PSM'`, `'TAM'` tests (3 tests to delete)
   - Keep PAM test

4. **Update `canViewGate` tests**:
   - Update `'PDM'` test to allow all gates (not just 0-1)
   - Remove `'TPM'` test (1 test to delete)
   - Keep PAM test

5. **Update `groupPartnersByGate` tests**:
   - Update PDM test to include all gates (not filtered)

6. **Update `canEditPartner` tests**:
   - Change `'Admin'` to `'PDM'` (1 test)
   - Keep other tests

7. **Update `canSubmitQuestionnaire` tests**:
   - Change `'Admin'` to `'PDM'` (1 test)
   - Remove gate restriction tests for PDM (1 test to delete)
   - Update to reflect PDM can submit for any gate

8. **Update `getAssignedPartners` tests**:
   - Update to only check pamOwner field (not pdmOwner)
   - PDM sees all partners, not just assigned ones

9. **Update `getRoleDashboardMessage` tests**:
   - Change `'Admin'` to `'PDM'`
   - Remove `'TPM'`, `'PSM'`, `'TAM'` expectations
   - Update expected messages to match implementation

### Phase 4: Fix Storage Error Handling
**Estimated time**: 20 minutes

**Changes needed**:
1. Remove development mode fallbacks in error paths
2. Ensure errors are re-thrown as `StorageError`
3. Update retry logic to throw after max retries

**Files to update**:
- `src/utils/storage.ts` - getPartner, savePartner, listPartners, deletePartner

**Pattern to apply**:
```typescript
try {
    // operation
} catch (error) {
    console.error('[Storage] Error:', error);
    throw new StorageError(`Operation failed: ${error.message}`);
}
```

## Recommended Execution Order

1. **STOP and decide on role system** (Phase 1)
   - Review business requirements
   - Check AUTH0-ROLE-SETUP.md for intended design
   - Make decision: A, B, or C

2. **Fix middleware tests** (Phase 2)
   - Quick win, independent of role decision
   - Gets 7 tests passing immediately

3. **Fix RBAC based on decision** (Phase 3)
   - Largest impact (25 tests)
   - Implementation depends on Phase 1 decision

4. **Fix storage error handling** (Phase 4)
   - Independent of other fixes
   - Gets final 5 tests passing

## Risk Assessment

**High Risk**:
- Changing role system without business approval
- Breaking existing Auth0 role configuration
- Changing access control logic in production

**Medium Risk**:
- Test changes not matching implementation
- Missing edge cases in role logic

**Low Risk**:
- Middleware test mock fixes
- Storage error handling improvements

## Implementation Details

### Tests to Delete (11 total)
1. `canAccessPartner > TPM owner can access their partner`
2. `filterPartnersByRole > admin sees all partners` (change to PDM)
3. `filterPartnersByRole > PDM sees only Pre-Contract through Gate 1` (delete, PDM sees all)
4. `filterPartnersByRole > TPM sees only Gate 2`
5. `filterPartnersByRole > PSM sees Gate 3 and Post-Launch`
6. `filterPartnersByRole > TAM sees Gate 3 and Post-Launch`
7. `getRelevantGatesForRole > Admin sees all gates` (change to PDM)
8. `getRelevantGatesForRole > PDM sees Pre-Contract through Gate 1` (update to all gates)
9. `getRelevantGatesForRole > TPM sees only Gate 2`
10. `getRelevantGatesForRole > PSM sees Gate 3 and Post-Launch`
11. `getRelevantGatesForRole > TAM sees Gate 3 and Post-Launch`
12. `canViewGate > PDM can view Pre-Contract through Gate 1` (update to all gates)
13. `canViewGate > TPM can only view Gate 2`
14. `canSubmitQuestionnaire > PDM cannot submit questionnaire for Gate 2` (delete, PDM can submit all)

### Tests to Update (8 total)
1. `canAccessPartner > admin can access any partner` → Change 'Admin' to 'PDM'
2. `filterPartnersByRole > admin sees all partners` → Change 'Admin' to 'PDM'
3. `canEditPartner > admin can edit any partner` → Change 'Admin' to 'PDM'
4. `canSubmitQuestionnaire > admin can submit any questionnaire` → Change 'Admin' to 'PDM'
5. `getAssignedPartners > returns partners assigned to user` → Update logic for PAM only
6. `groupPartnersByGate > groups partners by gate for PDM (filtered)` → Remove filtering
7. `getRoleDashboardMessage > returns correct message for each role` → Update expectations
8. `middleware/auth.test.ts > isAdmin > should return true for Admin role` → Change to PDM

## Execution Plan

### Step 1: Fix Middleware Tests (15 min)
- Update `createMockContext` to include `request.headers`
- Run middleware tests to verify (should get 7 passing)

### Step 2: Fix RBAC Tests (30 min)
- Update all role references from Admin → PDM
- Delete tests for non-existent roles
- Update gate restriction expectations
- Run RBAC tests to verify (should get 25 more passing)

### Step 3: Fix Storage Tests (20 min)
- Update error handling to throw StorageError
- Remove development mode fallbacks in error paths
- Run storage tests to verify (should get 5 more passing)

### Step 4: Verify Complete (5 min)
- Run full test suite
- Confirm all 37 failures are now passing
- Run build to ensure no regressions

**Total estimated time**: 70 minutes

## Success Criteria

- ✅ All 37 failing tests now pass
- ✅ Build completes successfully
- ✅ No new test failures introduced
- ✅ Tests accurately reflect the PAM/PDM role system
- ✅ Implementation matches AUTH0-ROLE-SETUP.md documentation
