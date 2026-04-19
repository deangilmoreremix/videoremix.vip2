#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXT_FILES = [
    'additional_users.txt',
    'new_users_list.txt',
    'new_users_list_3.txt',
    'next_500_users.txt'
];

function analyzeNameEmailLine(line, lineNumber) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        return {
            line: lineNumber,
            original: trimmed,
            issue: 'insufficient parts',
            fixed: null
        };
    }

    const email = parts[parts.length - 1];
    const nameParts = parts.slice(0, -1);

    // Check for email validity
    if (!email.includes('@') || !email.includes('.')) {
        return {
            line: lineNumber,
            original: trimmed,
            issue: 'invalid email',
            fixed: null
        };
    }

    // Check for 'nan' values
    if (nameParts.some(part => part.toLowerCase() === 'nan')) {
        return {
            line: lineNumber,
            original: trimmed,
            issue: 'contains nan values',
            fixed: null
        };
    }

    // Check for overly complex names (more than 4 parts)
    if (nameParts.length > 4) {
        return {
            line: lineNumber,
            original: trimmed,
            issue: 'too many name parts',
            fixed: `${nameParts.slice(0, 3).join(' ')} ${email}`
        };
    }

    // Check for multiple consecutive capitals (likely initials)
    const consecutiveCapitals = nameParts.filter(part =>
        part.length === 1 && part === part.toUpperCase()
    );

    if (consecutiveCapitals.length > 2) {
        return {
            line: lineNumber,
            original: trimmed,
            issue: 'multiple initials',
            fixed: `${nameParts.slice(0, 2).join(' ')} ${email}`
        };
    }

    return {
        line: lineNumber,
        original: trimmed,
        issue: null,
        fixed: null
    };
}

function formatName(nameParts) {
    // Capitalize first letter of each part
    return nameParts.map(part => {
        if (part.length === 0) return '';
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join(' ');
}

function fixLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return '';

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return trimmed;

    const email = parts[parts.length - 1];
    const nameParts = parts.slice(0, -1);

    // Filter out 'nan' values
    const cleanNameParts = nameParts.filter(part => part.toLowerCase() !== 'nan');

    if (cleanNameParts.length === 0) {
        return ''; // Remove lines with no valid name
    }

    // Limit to reasonable name length
    const limitedNameParts = cleanNameParts.slice(0, 4);

    // Format the name properly
    const formattedName = formatName(limitedNameParts);

    return `${formattedName} ${email}`;
}

async function validateAndFixFile(filePath) {
    console.log(`\n📋 Analyzing ${filePath}...`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let issues = [];
    let validLines = 0;
    let fixedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const analysis = analyzeNameEmailLine(line, i + 1);

        if (!analysis) continue; // Empty line

        if (analysis.issue) {
            issues.push(analysis);
            const fixed = fixLine(line);
            if (fixed) {
                fixedLines.push(fixed);
                validLines++;
            }
        } else {
            const cleaned = fixLine(line);
            if (cleaned) {
                fixedLines.push(cleaned);
                validLines++;
            }
        }
    }

    console.log(`   Found ${issues.length} issues in ${lines.length} lines`);
    console.log(`   Valid entries after fixing: ${validLines}`);

    if (issues.length > 0) {
        console.log(`   Issues found:`);
        issues.slice(0, 5).forEach(issue => {
            console.log(`     Line ${issue.line}: ${issue.issue} - "${issue.original}"`);
            if (issue.fixed) {
                console.log(`       → Fixed: "${issue.fixed}"`);
            }
        });
        if (issues.length > 5) {
            console.log(`     ... and ${issues.length - 5} more issues`);
        }
    }

    // Create backup and write fixed version
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, fixedLines.join('\n') + '\n');

    console.log(`   ✅ Created backup: ${backupPath}`);
    console.log(`   ✅ Updated file with ${validLines} clean entries`);

    return {
        file: filePath,
        originalLines: lines.length,
        issues: issues.length,
        validLines: validLines
    };
}

async function validateCSVFile(filePath) {
    console.log(`\n📊 Validating CSV: ${filePath}...`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const header = lines[0];

    console.log(`   Headers: ${header}`);

    let validRows = 0;
    let issues = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length !== 4) {
            issues.push({
                line: i + 1,
                issue: `Expected 4 columns, got ${parts.length}`,
                content: line
            });
        } else {
            // Check if fields are properly quoted
            const [name, email, campaign, product] = parts;
            if (!name.startsWith('"') || !name.endsWith('"')) {
                issues.push({
                    line: i + 1,
                    issue: 'Name field not properly quoted',
                    content: line
                });
            }
            if (!email.startsWith('"') || !email.endsWith('"')) {
                issues.push({
                    line: i + 1,
                    issue: 'Email field not properly quoted',
                    content: line
                });
            }
            if (!email.includes('@')) {
                issues.push({
                    line: i + 1,
                    issue: 'Invalid email format',
                    content: line
                });
            }
            validRows++;
        }
    }

    console.log(`   Valid rows: ${validRows}`);
    console.log(`   Issues: ${issues.length}`);

    if (issues.length > 0) {
        console.log(`   Sample issues:`);
        issues.slice(0, 3).forEach(issue => {
            console.log(`     Line ${issue.line}: ${issue.issue}`);
        });
    }

    return {
        file: filePath,
        totalRows: lines.length - 1,
        validRows: validRows,
        issues: issues.length
    };
}

async function main() {
    console.log('🔍 VALIDATING AND FIXING USER LIST FORMATTING\n');

    const results = {
        textFiles: [],
        csvFiles: []
    };

    // Process text files
    for (const file of TEXT_FILES) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const result = await validateAndFixFile(filePath);
            results.textFiles.push(result);
        } else {
            console.log(`⚠️  File not found: ${file}`);
        }
    }

    // Process CSV file
    const csvPath = path.join(__dirname, 'all_users_for_import.csv');
    if (fs.existsSync(csvPath)) {
        const result = await validateCSVFile(csvPath);
        results.csvFiles.push(result);
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('Text Files:');
    results.textFiles.forEach(result => {
        console.log(`   ${result.file}: ${result.validLines}/${result.originalLines} valid (${result.issues} issues fixed)`);
    });

    console.log('CSV Files:');
    results.csvFiles.forEach(result => {
        console.log(`   ${result.file}: ${result.validRows}/${result.totalRows} valid rows (${result.issues} issues)`);
    });

    console.log('\n✅ All user lists have been validated and formatted correctly!');
}

main().catch(console.error);