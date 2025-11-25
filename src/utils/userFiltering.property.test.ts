/**
 * Property-based tests for user filtering by role
 * Feature: hub-improvements, Property 1: PAM dropdown population
 * Validates: Requirements 1.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserRole } from '../types';

/**
 * User info interface matching the API response
 */
interface UserInfo {
    email: string;
    name: string;
    role: UserRole;
}

/**
 * Filter users by role
 * This is the core logic that will be used in the dropdown population
 */
export function filterUsersByRole(users: UserInfo[], role: UserRole): UserInfo[] {
    return users.filter(user => user.role === role);
}

/**
 * Generator for valid user roles
 */
const userRoleArbitrary = fc.constantFrom<UserRole>('PAM', 'PDM', 'TAM', 'PSM');

/**
 * Generator for user info objects
 */
const userInfoArbitrary = fc.record({
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    role: userRoleArbitrary
});

describe('User Filtering Properties', () => {
    /**
     * Property 1: PAM dropdown population
     * For any set of users with mixed roles, the PAM owner dropdown should contain 
     * exactly those users with the PAM role and no others.
     * 
     * **Feature: hub-improvements, Property 1: PAM dropdown population**
     * **Validates: Requirements 1.2**
     */
    it('should filter users to only include those with the specified role', () => {
        fc.assert(
            fc.property(
                fc.array(userInfoArbitrary, { minLength: 0, maxLength: 50 }),
                userRoleArbitrary,
                (users, targetRole) => {
                    const filtered = filterUsersByRole(users, targetRole);

                    // All filtered users should have the target role
                    filtered.forEach(user => {
                        expect(user.role).toBe(targetRole);
                    });

                    // No users with the target role should be excluded
                    const usersWithTargetRole = users.filter(u => u.role === targetRole);
                    expect(filtered.length).toBe(usersWithTargetRole.length);

                    // Filtered list should contain exactly the users with target role
                    usersWithTargetRole.forEach(expectedUser => {
                        expect(filtered).toContainEqual(expectedUser);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Filtering should not modify original array
     */
    it('should not modify the original user array', () => {
        fc.assert(
            fc.property(
                fc.array(userInfoArbitrary, { minLength: 1, maxLength: 20 }),
                userRoleArbitrary,
                (users, targetRole) => {
                    const originalLength = users.length;
                    const originalUsers = [...users];

                    filterUsersByRole(users, targetRole);

                    // Original array should be unchanged
                    expect(users.length).toBe(originalLength);
                    expect(users).toEqual(originalUsers);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Empty input should return empty output
     */
    it('should return empty array when given empty input', () => {
        fc.assert(
            fc.property(
                userRoleArbitrary,
                (targetRole) => {
                    const filtered = filterUsersByRole([], targetRole);
                    expect(filtered).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Filtering for PAM role specifically
     */
    it('should correctly filter PAM users from mixed role set', () => {
        fc.assert(
            fc.property(
                fc.array(userInfoArbitrary, { minLength: 5, maxLength: 30 }),
                (users) => {
                    const pamUsers = filterUsersByRole(users, 'PAM');

                    // All returned users should be PAM
                    pamUsers.forEach(user => {
                        expect(user.role).toBe('PAM');
                    });

                    // Count should match PAM users in original array
                    const expectedPamCount = users.filter(u => u.role === 'PAM').length;
                    expect(pamUsers.length).toBe(expectedPamCount);

                    // No non-PAM users should be included
                    const nonPamUsers = users.filter(u => u.role !== 'PAM');
                    nonPamUsers.forEach(nonPamUser => {
                        expect(pamUsers).not.toContainEqual(nonPamUser);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Filtering should work for all role types
     */
    it('should correctly filter users for each role type', () => {
        const roles: UserRole[] = ['PAM', 'PDM', 'TAM', 'PSM'];

        fc.assert(
            fc.property(
                fc.array(userInfoArbitrary, { minLength: 10, maxLength: 40 }),
                (users) => {
                    roles.forEach(role => {
                        const filtered = filterUsersByRole(users, role);

                        // All filtered users should have the specified role
                        filtered.forEach(user => {
                            expect(user.role).toBe(role);
                        });

                        // Count should match users with that role
                        const expectedCount = users.filter(u => u.role === role).length;
                        expect(filtered.length).toBe(expectedCount);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
