/**
 * API route for individual partner operations
 * GET: Retrieve a specific partner (with access control)
 * PUT: Update a specific partner (with access control)
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getPartner, savePartner, StorageError } from '../../../utils/storage';
import { canAccessPartner, canEditPartner } from '../../../utils/rbac';
import { getUserSession } from '../../../middleware/auth';
import type { PartnerRecord } from '../../../types/partner';

/**
 * GET /api/partner/[id]
 * Retrieve a specific partner record (with access control)
 */
export const GET: APIRoute = async ({ params }) => {
    try {
        const { id } = params;

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        const partner = await getPartner(id);

        if (!partner) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check access control
        const currentUser = getUserSession();
        if (!canAccessPartner(currentUser, partner)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Access denied: You do not have permission to view this partner'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: partner
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error retrieving partner:', error);

        if (error instanceof StorageError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to retrieve partner'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};

/**
 * PUT /api/partner/[id]
 * Update a specific partner record (with access control)
 */
export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check if partner exists
        const existingPartner = await getPartner(id);

        if (!existingPartner) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check edit permission
        const currentUser = getUserSession();
        if (!canEditPartner(currentUser, existingPartner)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Access denied: You do not have permission to edit this partner'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        const body = await request.json();

        // Validate update data
        const validationError = validatePartnerUpdate(body);
        if (validationError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: validationError
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Merge updates with existing partner
        const updatedPartner: PartnerRecord = {
            ...existingPartner,
            ...body,
            id: existingPartner.id, // Ensure ID cannot be changed
            createdAt: existingPartner.createdAt, // Preserve creation date
            updatedAt: new Date(), // Will be set by savePartner
            // Convert date strings to Date objects
            contractSignedDate: body.contractSignedDate ? new Date(body.contractSignedDate) : existingPartner.contractSignedDate,
            targetLaunchDate: body.targetLaunchDate ? new Date(body.targetLaunchDate) : existingPartner.targetLaunchDate,
            actualLaunchDate: body.actualLaunchDate ? new Date(body.actualLaunchDate) : existingPartner.actualLaunchDate,
            onboardingStartDate: body.onboardingStartDate ? new Date(body.onboardingStartDate) : existingPartner.onboardingStartDate
        };

        await savePartner(updatedPartner);

        return new Response(
            JSON.stringify({
                success: true,
                data: updatedPartner
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error updating partner:', error);

        if (error instanceof StorageError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        if (error instanceof SyntaxError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to update partner'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};

/**
 * Validate partner update data
 */
function validatePartnerUpdate(data: any): string | null {
    if (data.partnerName !== undefined && typeof data.partnerName !== 'string') {
        return 'partnerName must be a string';
    }

    if (data.pamOwner !== undefined && typeof data.pamOwner !== 'string') {
        return 'pamOwner must be a string';
    }

    if (data.pdmOwner !== undefined && data.pdmOwner !== null && typeof data.pdmOwner !== 'string') {
        return 'pdmOwner must be a string or null';
    }

    if (data.tpmOwner !== undefined && data.tpmOwner !== null && typeof data.tpmOwner !== 'string') {
        return 'tpmOwner must be a string or null';
    }

    if (data.psmOwner !== undefined && data.psmOwner !== null && typeof data.psmOwner !== 'string') {
        return 'psmOwner must be a string or null';
    }

    if (data.tamOwner !== undefined && data.tamOwner !== null && typeof data.tamOwner !== 'string') {
        return 'tamOwner must be a string or null';
    }

    if (data.contractType !== undefined && !['PPA', 'Distribution', 'Sales-Agent', 'Other'].includes(data.contractType)) {
        return 'contractType must be one of: PPA, Distribution, Sales-Agent, Other';
    }

    if (data.tier !== undefined && !['tier-0', 'tier-1', 'tier-2'].includes(data.tier)) {
        return 'tier must be one of: tier-0, tier-1, tier-2';
    }

    if (data.currentGate !== undefined && !['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'].includes(data.currentGate)) {
        return 'currentGate must be one of: pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch';
    }

    if (data.ccv !== undefined && (typeof data.ccv !== 'number' || data.ccv < 0)) {
        return 'ccv must be a non-negative number';
    }

    if (data.lrp !== undefined && (typeof data.lrp !== 'number' || data.lrp < 0)) {
        return 'lrp must be a non-negative number';
    }

    return null;
}

/**
 * DELETE /api/partner/[id]
 * Delete a specific partner record (PDM only)
 */
export const DELETE: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;

        if (!id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner ID is required'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Get current user
        const cookieHeader = request.headers.get('cookie');
        const currentUser = getUserSession(cookieHeader || undefined);

        if (!currentUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Authentication required'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Only PDM (admin) can delete partners
        if (currentUser.role !== 'PDM') {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Only administrators can delete partners'
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Check if partner exists
        const partner = await getPartner(id);

        if (!partner) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Partner not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Delete the partner
        const { deletePartner } = await import('../../../utils/storage');
        await deletePartner(id);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Partner deleted successfully'
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error deleting partner:', error);

        if (error instanceof StorageError) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to delete partner'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
