/**
 * API route for partner operations
 * GET: List all partners (filtered by role)
 * POST: Create a new partner
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { listPartners, savePartner, StorageError } from '../../utils/storage';
import { filterPartnersByRole } from '../../utils/rbac';
import { getUserSession } from '../../middleware/auth';
import type { PartnerRecord } from '../../types/partner';
import {
    parseFieldSelection,
    selectPartnerFieldsBulk,
    createPartnerSummaries,
    paginate,
    type PartnerField
} from '../../utils/apiOptimization';

/**
 * GET /api/partners
 * List all partner records filtered by user role
 * 
 * Query parameters:
 * - fields: Comma-separated list of fields to include (e.g., ?fields=id,partnerName,tier)
 * - summary: If 'true', returns minimal fields for list views
 * - page: Page number for pagination (default: 1)
 * - pageSize: Number of items per page (default: 20, max: 100)
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        console.log('[API] GET /api/partners - Listing partners');

        const url = new URL(request.url);
        const useSummary = url.searchParams.get('summary') === 'true';
        const fields = parseFieldSelection(url.search) as PartnerField[] | undefined;
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

        // Get current user
        const currentUser = getUserSession();
        console.log('[API] Current user:', currentUser ? { email: currentUser.email, role: currentUser.role } : 'null');

        // Fetch all partners
        const allPartners = await listPartners();
        console.log('[API] Total partners in storage:', allPartners.length);

        // Filter by role
        const partners = filterPartnersByRole(allPartners, currentUser);
        console.log('[API] Filtered partners for user:', partners.length);

        // Apply field selection or summary
        let optimizedPartners;
        if (useSummary) {
            optimizedPartners = createPartnerSummaries(partners);
        } else if (fields) {
            optimizedPartners = selectPartnerFieldsBulk(partners, fields);
        } else {
            optimizedPartners = partners;
        }

        // Apply pagination if requested
        if (url.searchParams.has('page')) {
            const paginated = paginate(optimizedPartners, { page, pageSize });
            return new Response(
                JSON.stringify({
                    success: true,
                    ...paginated,
                    totalCount: allPartners.length
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: optimizedPartners,
                count: optimizedPartners.length,
                totalCount: allPartners.length
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60' // Cache for 1 minute
                }
            }
        );
    } catch (error) {
        console.error('Error listing partners:', error);

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
                error: 'Failed to list partners'
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
 * POST /api/partners
 * Create a new partner record
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('[API] POST /api/partners - Starting partner creation');

        // Check authentication
        const cookieHeader = request.headers.get('cookie');
        const currentUser = getUserSession(cookieHeader || undefined);
        console.log('[API] Current user:', currentUser ? { email: currentUser.email, role: currentUser.role } : 'null');

        const body = await request.json();
        console.log('[API] Request body:', body);

        // Validate required fields
        const validationError = validatePartnerData(body);
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

        // Generate ID if not provided
        const partnerId = body.id || generatePartnerId();

        // Create partner record with defaults
        const partner: PartnerRecord = {
            id: partnerId,
            partnerName: body.partnerName,
            pamOwner: body.pamOwner,
            pdmOwner: body.pdmOwner,
            tpmOwner: body.tpmOwner,
            psmOwner: body.psmOwner,
            tamOwner: body.tamOwner,
            contractSignedDate: body.contractSignedDate ? new Date(body.contractSignedDate) : undefined,
            contractType: body.contractType || 'Other',
            tier: body.tier || 'tier-2',
            ccv: body.ccv || 0,
            lrp: body.lrp || 0,
            targetLaunchDate: body.targetLaunchDate ? new Date(body.targetLaunchDate) : undefined,
            actualLaunchDate: body.actualLaunchDate ? new Date(body.actualLaunchDate) : undefined,
            onboardingStartDate: body.onboardingStartDate ? new Date(body.onboardingStartDate) : undefined,
            currentGate: body.currentGate || 'pre-contract',
            gates: body.gates || {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await savePartner(partner);

        return new Response(
            JSON.stringify({
                success: true,
                data: partner
            }),
            {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error creating partner:', error);

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
                error: 'Failed to create partner'
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
 * Validate partner data
 */
function validatePartnerData(data: any): string | null {
    if (!data.partnerName || typeof data.partnerName !== 'string') {
        return 'partnerName is required and must be a string';
    }

    if (!data.pamOwner || typeof data.pamOwner !== 'string') {
        return 'pamOwner is required and must be a string';
    }

    if (data.contractType && !['PPA', 'Distribution', 'Sales-Agent', 'Other'].includes(data.contractType)) {
        return 'contractType must be one of: PPA, Distribution, Sales-Agent, Other';
    }

    if (data.tier && !['tier-0', 'tier-1', 'tier-2'].includes(data.tier)) {
        return 'tier must be one of: tier-0, tier-1, tier-2';
    }

    if (data.currentGate && !['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'].includes(data.currentGate)) {
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
 * Generate a unique partner ID
 */
function generatePartnerId(): string {
    return `partner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
