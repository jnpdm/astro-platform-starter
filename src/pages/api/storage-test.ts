/**
 * Storage test endpoint to verify Netlify Blobs is working
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const GET: APIRoute = async () => {
    try {
        console.log('[Storage Test] Starting storage test...');
        console.log('[Storage Test] Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            NETLIFY: process.env.NETLIFY,
            CONTEXT: process.env.CONTEXT,
            NETLIFY_BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT
        });

        // Try to get the store
        const store = getStore('test-store');
        console.log('[Storage Test] Got store successfully');

        // Try to write a test value
        const testKey = 'test-' + Date.now();
        const testValue = { message: 'Hello from storage test', timestamp: new Date().toISOString() };

        console.log('[Storage Test] Writing test value...');
        await store.setJSON(testKey, testValue);
        console.log('[Storage Test] Write successful');

        // Try to read it back
        console.log('[Storage Test] Reading test value...');
        const retrieved = await store.get(testKey, { type: 'json' });
        console.log('[Storage Test] Read successful:', retrieved);

        // Try to list
        console.log('[Storage Test] Listing blobs...');
        const { blobs } = await store.list();
        console.log('[Storage Test] Found blobs:', blobs.length);

        // Clean up
        console.log('[Storage Test] Deleting test value...');
        await store.delete(testKey);
        console.log('[Storage Test] Delete successful');

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Storage test passed',
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    NETLIFY: process.env.NETLIFY,
                    CONTEXT: process.env.CONTEXT,
                    NETLIFY_BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT
                },
                test: {
                    write: 'success',
                    read: 'success',
                    list: `found ${blobs.length} blobs`,
                    delete: 'success'
                }
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('[Storage Test] Error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    NETLIFY: process.env.NETLIFY,
                    CONTEXT: process.env.CONTEXT,
                    NETLIFY_BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT
                }
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
