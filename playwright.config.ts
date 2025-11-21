import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for integration testing
 * Tests complete questionnaire submission flows, gate progression, and data persistence
 */
export default defineConfig({
    testDir: './tests/integration',
    fullyParallel: false, // Run tests sequentially to avoid data conflicts
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker to avoid race conditions with storage
    reporter: 'html',

    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
