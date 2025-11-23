import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'astro:middleware': new URL('./src/__mocks__/astro-middleware.ts', import.meta.url).pathname,
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: ['tests/integration/**', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData.ts',
            ],
        },
    },
});
