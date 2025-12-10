#!/usr/bin/env node

/**
 * Simple test script to verify questionnaire functionality
 */

import http from 'http';

const testEndpoints = [
    { path: '/', description: 'Home page' },
    { path: '/questionnaires/gate-0-kickoff', description: 'Gate 0 questionnaire' },
    { path: '/questionnaires/gate-1-ready-to-sell', description: 'Gate 1 questionnaire' },
    { path: '/questionnaires/gate-2-ready-to-order', description: 'Gate 2 questionnaire' },
    { path: '/questionnaires/gate-3-ready-to-deliver', description: 'Gate 3 questionnaire' },
    { path: '/questionnaires/pre-contract-pdm', description: 'Pre-contract questionnaire' },
    { path: '/documentation', description: 'Documentation page' },
    { path: '/reports', description: 'Reports page' }
];

async function testEndpoint(path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 4321,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            const status = res.statusCode;
            const success = status === 200;
            console.log(`${success ? '✅' : '❌'} ${description}: ${status}`);
            resolve({ path, description, status, success });
        });

        req.on('error', (err) => {
            console.log(`❌ ${description}: ERROR - ${err.message}`);
            resolve({ path, description, status: 'ERROR', success: false, error: err.message });
        });

        req.setTimeout(5000, () => {
            console.log(`❌ ${description}: TIMEOUT`);
            req.destroy();
            resolve({ path, description, status: 'TIMEOUT', success: false });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Kuiper Partner Onboarding Hub\n');
    
    const results = [];
    
    for (const endpoint of testEndpoints) {
        const result = await testEndpoint(endpoint.path, endpoint.description);
        results.push(result);
    }
    
    console.log('\n📊 Test Summary:');
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    if (successful === total) {
        console.log('\n🎉 All tests passed! The questionnaire system is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
    
    return successful === total;
}

// Run tests if this is the main module
runTests().then(success => {
    process.exit(success ? 0 : 1);
});

export { runTests, testEndpoint };