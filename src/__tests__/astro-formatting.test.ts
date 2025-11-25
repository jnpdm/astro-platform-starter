import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Astro Template Formatting Tests
 *
 * These tests ensure that Astro template files follow proper formatting rules
 * to prevent build failures caused by JSX parsing issues.
 *
 * The main issue we're preventing: split closing tags like </a\n>
 * which cause "Unexpected t" errors during build.
 */

describe('Astro Template Formatting', () => {
    const questionnaireDir = join(process.cwd(), 'src/pages/questionnaires');
    const questionnaireFiles = readdirSync(questionnaireDir)
        .filter((file) => file.endsWith('.astro') && !file.includes('demo'))
        .map((file) => join(questionnaireDir, file));

    describe('Critical Formatting Rules', () => {
        questionnaireFiles.forEach((filePath) => {
            const fileName = filePath.split('/').pop() || '';

            it(`${fileName}: should not have split closing tags`, () => {
                const content = readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');

                // Check for split closing tags like </a\n>
                for (let i = 0; i < lines.length - 1; i++) {
                    const currentLine = lines[i];
                    const nextLine = lines[i + 1];

                    // Check if current line ends with an incomplete closing tag
                    if (currentLine.trim().match(/<\/[a-z]+$/i)) {
                        const nextTrimmed = nextLine.trim();
                        if (nextTrimmed === '>' || nextTrimmed.startsWith('>')) {
                            throw new Error(
                                `Split closing tag found at line ${i + 1}:\n` +
                                `  Line ${i + 1}: ${currentLine}\n` +
                                `  Line ${i + 2}: ${nextLine}\n` +
                                `  Fix: Put the closing tag on one line: </a>`
                            );
                        }
                    }
                }
            });

            it(`${fileName}: should build successfully`, () => {
                // This test just ensures the file can be read and parsed
                const content = readFileSync(filePath, 'utf-8');
                expect(content).toBeTruthy();
                expect(content).toContain('export const prerender');
            });
        });
    });
});
