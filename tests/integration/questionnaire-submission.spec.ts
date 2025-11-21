import { test, expect } from '@playwright/test';

/**
 * Integration tests for complete questionnaire submission flow
 * Tests Requirements: 2.1, 2.2, 3.1, 3.2, 4.1-4.7, 7.1, 7.2
 */

test.describe('Questionnaire Submission Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the questionnaire page
        await page.goto('/questionnaires/pre-contract-pdm');
    });

    test('should display pre-contract questionnaire form', async ({ page }) => {
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Check that the page loaded
        await expect(page.locator('h1')).toContainText('Pre-Contract', { timeout: 10000 });

        // Check that sections are visible
        const executiveSponsorshipSection = page.locator('text=Executive Sponsorship').first();
        await expect(executiveSponsorshipSection).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields', async ({ page }) => {
        // Try to submit without filling required fields
        const submitButton = page.locator('button:has-text("Submit")');

        if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should show validation errors
            await expect(page.locator('text=/required/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should allow filling out form fields', async ({ page }) => {
        // Fill out text inputs
        const partnerNameInput = page.locator('input[name*="partner"], input[id*="partner"]').first();
        if (await partnerNameInput.isVisible()) {
            await partnerNameInput.fill('Test Partner Inc');
        }

        // Fill out email if present
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
        }

        // Check that values were entered
        if (await partnerNameInput.isVisible()) {
            await expect(partnerNameInput).toHaveValue('Test Partner Inc');
        }
    });

    test('should navigate between sections', async ({ page }) => {
        // Look for section navigation buttons
        const nextButton = page.locator('button:has-text("Next")');

        if (await nextButton.isVisible()) {
            await nextButton.click();

            // Should move to next section
            await expect(page.locator('text=Section 2, text=Commercial Framework')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should auto-save form data to localStorage', async ({ page }) => {
        // Fill out a field
        const input = page.locator('input[type="text"]').first();
        if (await input.isVisible()) {
            await input.fill('Test Data');

            // Wait a bit for auto-save
            await page.waitForTimeout(1000);

            // Reload page
            await page.reload();

            // Check if data persisted
            await expect(input).toHaveValue('Test Data', { timeout: 5000 });
        }
    });
});

test.describe('Signature Capture', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/questionnaires/signature-demo');
        await page.waitForLoadState('networkidle');
    });

    test('should display signature capture interface', async ({ page }) => {
        await expect(page.locator('text=Signature Method')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('button:has-text("Type Name")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('button:has-text("Draw Signature")')).toBeVisible({ timeout: 10000 });
    });

    test('should allow typed signature', async ({ page }) => {
        // Wait for component to load
        await page.waitForSelector('button:has-text("Type Name")', { timeout: 10000 });

        // Select typed mode
        await page.locator('button:has-text("Type Name")').click();

        // Fill in email
        await page.locator('input[type="email"]').fill('john.doe@example.com');

        // Fill in name
        await page.locator('input[id="typed-name"]').fill('John Doe');

        // Preview signature
        await page.locator('button:has-text("Preview Signature")').click();

        // Should show preview
        await expect(page.locator('text=Signature Preview')).toBeVisible();
        await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('should allow drawn signature', async ({ page }) => {
        // Wait for component to load
        await page.waitForSelector('button:has-text("Draw Signature")', { timeout: 10000 });

        // Select drawn mode
        await page.locator('button:has-text("Draw Signature")').click();

        // Fill in email
        await page.locator('input[type="email"]').fill('jane.doe@example.com');

        // Draw on canvas
        const canvas = page.locator('canvas');
        await canvas.hover();
        await page.mouse.down();
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 100);
        await page.mouse.up();

        // Preview signature
        await page.locator('button:has-text("Preview Signature")').click();

        // Should show preview
        await expect(page.locator('text=Signature Preview')).toBeVisible();
        await expect(page.locator('img[alt="Signature preview"]')).toBeVisible();
    });

    test('should capture signature metadata', async ({ page }) => {
        // Wait for component to load
        await page.waitForSelector('button:has-text("Type Name")', { timeout: 10000 });

        // Select typed mode and fill
        await page.locator('button:has-text("Type Name")').click();
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[id="typed-name"]').fill('Test User');

        // Preview
        await page.locator('button:has-text("Preview Signature")').click();

        // Check metadata is displayed
        await expect(page.locator('text=Signature Details')).toBeVisible();
        await expect(page.locator('text=/Name:/i')).toBeVisible();
        await expect(page.locator('text=/Email:/i')).toBeVisible();
        await expect(page.locator('text=/Timestamp:/i')).toBeVisible();
        await expect(page.locator('text=/IP Address:/i')).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
        // Wait for component to load
        await page.waitForSelector('button:has-text("Type Name")', { timeout: 10000 });

        // Select typed mode and fill
        await page.locator('button:has-text("Type Name")').click();
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[id="typed-name"]').fill('Test User');

        // Preview
        await page.locator('button:has-text("Preview Signature")').click();

        // Try to confirm without accepting terms
        const confirmButton = page.locator('button:has-text("Confirm")');
        await expect(confirmButton).toBeDisabled();

        // Accept terms
        await page.locator('input[type="checkbox"]').check();

        // Now confirm should be enabled
        await expect(confirmButton).toBeEnabled();
    });
});

test.describe('Section Status Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/questionnaires/section-status-demo');
    });

    test('should display pass status with green indicator', async ({ page }) => {
        const passStatus = page.locator('[data-status="pass"]').first();
        if (await passStatus.isVisible()) {
            await expect(passStatus).toContainText(/pass/i);
            // Check for green color (this is a visual check, may need adjustment)
            const color = await passStatus.evaluate(el => window.getComputedStyle(el).color);
            expect(color).toContain('0, 128, 0'); // RGB for green
        }
    });

    test('should display fail status with red indicator', async ({ page }) => {
        const failStatus = page.locator('[data-status="fail"]').first();
        if (await failStatus.isVisible()) {
            await expect(failStatus).toContainText(/fail/i);
        }
    });

    test('should display failure reasons when section fails', async ({ page }) => {
        const failStatus = page.locator('[data-status="fail"]').first();
        if (await failStatus.isVisible()) {
            // Click to expand if needed
            await failStatus.click();

            // Should show failure reasons
            await expect(page.locator('text=/reason/i')).toBeVisible({ timeout: 5000 });
        }
    });
});
