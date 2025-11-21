/**
 * Test helper functions for integration tests
 */

import { Page } from '@playwright/test';

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
}

/**
 * Fill a form field by label text
 */
export async function fillFieldByLabel(page: Page, labelText: string, value: string) {
    const label = page.locator(`label:has-text("${labelText}")`);
    const input = await label.locator('input, textarea, select').first();
    await input.fill(value);
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
    try {
        const element = page.locator(selector);
        return await element.isVisible({ timeout: 5000 });
    } catch {
        return false;
    }
}

/**
 * Create test partner data
 */
export function createTestPartner(id: string) {
    return {
        id,
        partnerName: `Test Partner ${id}`,
        pamOwner: 'Test PAM',
        tier: 'tier-1' as const,
        ccv: 5000000,
        lrp: 10000000,
        currentGate: 'pre-contract' as const,
        gates: {
            'pre-contract': {
                gateId: 'pre-contract' as const,
                status: 'not-started' as const,
                questionnaires: {},
                approvals: []
            }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Create test submission data
 */
export function createTestSubmission(id: string, partnerId: string) {
    return {
        id,
        partnerId,
        questionnaireId: 'pre-contract-pdm',
        version: '1.0.0',
        sections: [
            {
                sectionId: 'executive-sponsorship',
                fields: {
                    'sponsor-name': 'Test Sponsor',
                    'sponsor-title': 'CEO'
                },
                status: {
                    result: 'pass' as const,
                    evaluatedAt: new Date().toISOString()
                }
            }
        ],
        sectionStatuses: {
            'executive-sponsorship': {
                result: 'pass' as const,
                evaluatedAt: new Date().toISOString()
            }
        },
        overallStatus: 'pass' as const,
        signature: {
            type: 'typed' as const,
            data: 'Test User',
            signerName: 'Test User',
            signerEmail: 'test@example.com',
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1',
            userAgent: 'Test Agent'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedBy: 'test@example.com',
        submittedByRole: 'PAM' as const,
        ipAddress: '127.0.0.1'
    };
}

/**
 * Navigate to questionnaire and wait for load
 */
export async function navigateToQuestionnaire(page: Page, questionnaireId: string) {
    await page.goto(`/questionnaires/${questionnaireId}`);
    await waitForPageLoad(page);
}

/**
 * Fill signature form
 */
export async function fillSignature(page: Page, name: string, email: string) {
    // Select typed mode
    const typedButton = page.locator('button:has-text("Type Name")');
    if (await typedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await typedButton.click();
    }

    // Fill email
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
        await emailInput.fill(email);
    }

    // Fill name
    const nameInput = page.locator('input[id="typed-name"]');
    if (await nameInput.isVisible()) {
        await nameInput.fill(name);
    }
}

/**
 * Submit signature
 */
export async function submitSignature(page: Page) {
    // Preview
    const previewButton = page.locator('button:has-text("Preview Signature")');
    if (await previewButton.isVisible()) {
        await previewButton.click();
        await page.waitForTimeout(1000);
    }

    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
    }

    // Confirm
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
        await confirmButton.click();
    }
}
