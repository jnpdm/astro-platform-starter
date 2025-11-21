#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * Analyzes the built bundle to identify large chunks and optimization opportunities.
 * Run after building the project: npm run build && node scripts/analyze-bundle.js
 * 
 * Requirements: 8.1, 8.2
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const clientDir = join(distDir, '_astro');

// Size thresholds (in KB)
const THRESHOLDS = {
    warning: 200,
    error: 500
};

async function getFileSize(filePath) {
    const stats = await stat(filePath);
    return stats.size;
}

async function analyzeDirectory(dir, baseDir = dir) {
    const files = [];
    
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory()) {
                const subFiles = await analyzeDirectory(fullPath, baseDir);
                files.push(...subFiles);
            } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.css'))) {
                const size = await getFileSize(fullPath);
                const relativePath = relative(baseDir, fullPath);
                
                files.push({
                    path: relativePath,
                    size,
                    sizeKB: (size / 1024).toFixed(2),
                    type: entry.name.endsWith('.js') ? 'JavaScript' : 'CSS'
                });
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error reading directory ${dir}:`, error.message);
        }
    }
    
    return files;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getStatusIcon(sizeKB) {
    if (sizeKB > THRESHOLDS.error) return '🔴';
    if (sizeKB > THRESHOLDS.warning) return '🟡';
    return '🟢';
}

async function main() {
    console.log('🔍 Analyzing bundle size...\n');
    
    try {
        // Check if dist directory exists
        try {
            await stat(distDir);
        } catch {
            console.error('❌ dist directory not found. Please run "npm run build" first.');
            process.exit(1);
        }
        
        // Analyze client-side bundles
        const files = await analyzeDirectory(clientDir, distDir);
        
        if (files.length === 0) {
            console.log('⚠️  No bundle files found in dist/_astro directory.');
            return;
        }
        
        // Sort by size (largest first)
        files.sort((a, b) => b.size - a.size);
        
        // Calculate totals
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const jsFiles = files.filter(f => f.type === 'JavaScript');
        const cssFiles = files.filter(f => f.type === 'CSS');
        const totalJS = jsFiles.reduce((sum, file) => sum + file.size, 0);
        const totalCSS = cssFiles.reduce((sum, file) => sum + file.size, 0);
        
        // Print summary
        console.log('📊 Bundle Summary');
        console.log('═'.repeat(80));
        console.log(`Total Size:      ${formatSize(totalSize)}`);
        console.log(`JavaScript:      ${formatSize(totalJS)} (${jsFiles.length} files)`);
        console.log(`CSS:             ${formatSize(totalCSS)} (${cssFiles.length} files)`);
        console.log('');
        
        // Print largest files
        console.log('📦 Largest Files');
        console.log('═'.repeat(80));
        console.log('Status | Size    | Type       | File');
        console.log('─'.repeat(80));
        
        const topFiles = files.slice(0, 15);
        for (const file of topFiles) {
            const status = getStatusIcon(parseFloat(file.sizeKB));
            const size = file.sizeKB.padStart(7);
            const type = file.type.padEnd(10);
            console.log(`${status}     | ${size} KB | ${type} | ${file.path}`);
        }
        
        if (files.length > 15) {
            console.log(`... and ${files.length - 15} more files`);
        }
        
        console.log('');
        
        // Check for issues
        const largeFiles = files.filter(f => parseFloat(f.sizeKB) > THRESHOLDS.error);
        const warningFiles = files.filter(f => {
            const kb = parseFloat(f.sizeKB);
            return kb > THRESHOLDS.warning && kb <= THRESHOLDS.error;
        });
        
        if (largeFiles.length > 0) {
            console.log('🔴 Large Files (> 500 KB)');
            console.log('─'.repeat(80));
            for (const file of largeFiles) {
                console.log(`  ${file.path}: ${file.sizeKB} KB`);
            }
            console.log('');
        }
        
        if (warningFiles.length > 0) {
            console.log('🟡 Warning: Files > 200 KB');
            console.log('─'.repeat(80));
            for (const file of warningFiles) {
                console.log(`  ${file.path}: ${file.sizeKB} KB`);
            }
            console.log('');
        }
        
        // Recommendations
        console.log('💡 Recommendations');
        console.log('═'.repeat(80));
        
        if (largeFiles.length > 0) {
            console.log('• Consider code splitting for large JavaScript files');
            console.log('• Use dynamic imports for components that are not immediately needed');
        }
        
        if (totalJS > 500 * 1024) {
            console.log('• Total JavaScript size is large. Consider:');
            console.log('  - Lazy loading non-critical components');
            console.log('  - Tree shaking unused dependencies');
            console.log('  - Using lighter alternatives for heavy libraries');
        }
        
        if (files.some(f => f.path.includes('vendor') && parseFloat(f.sizeKB) > 300)) {
            console.log('• Large vendor bundle detected. Consider:');
            console.log('  - Splitting vendor code into smaller chunks');
            console.log('  - Using CDN for common libraries');
        }
        
        console.log('');
        console.log('✅ Analysis complete!');
        
        // Exit with error code if there are critical issues
        if (largeFiles.length > 0) {
            console.log('\n⚠️  Warning: Large files detected. Consider optimization.');
        }
        
    } catch (error) {
        console.error('❌ Error analyzing bundle:', error.message);
        process.exit(1);
    }
}

main();
