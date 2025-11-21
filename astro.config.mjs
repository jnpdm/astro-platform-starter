import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    // Exclude test files from pages
    srcDir: './src',
    publicDir: './public',
    vite: {
        plugins: [tailwindcss()],
        ssr: {
            // Exclude test dependencies from SSR
            noExternal: [],
            external: ['vitest', '@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event']
        },
        build: {
            // Enable code splitting
            rollupOptions: {
                output: {
                    manualChunks: {
                        // Separate React and React DOM into their own chunk
                        'react-vendor': ['react', 'react-dom'],
                        // Separate questionnaire components
                        'questionnaire-components': [
                            './src/components/questionnaires/QuestionnaireForm.tsx',
                            './src/components/questionnaires/SectionStatus.tsx',
                            './src/components/questionnaires/SignatureCapture.tsx'
                        ],
                        // Separate documentation components
                        'documentation': [
                            './src/components/documentation/DocumentationHub.tsx'
                        ]
                    }
                }
            },
            // Optimize chunk size
            chunkSizeWarningLimit: 600
        }
    },
    integrations: [react()],
    adapter: netlify({
        devFeatures: {
            environmentVariables: true
        }
    }),
    // Enable build optimizations
    build: {
        inlineStylesheets: 'auto'
    }
});
