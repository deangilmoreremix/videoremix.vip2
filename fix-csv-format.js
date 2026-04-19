#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CSV_FILE = 'all_users_for_import.csv';

function fixCSVFile(filePath) {
    console.log(`🔧 Fixing CSV file: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const fixedLines = [];
    let issuesFixed = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma but be careful with quoted fields
        const parts = parseCSVLine(line);

        if (i === 0) {
            // Header line
            if (parts.length !== 4) {
                console.log(`⚠️  Header has ${parts.length} columns instead of 4`);
            }
            fixedLines.push(line);
            continue;
        }

        // Data lines should have exactly 4 columns
        if (parts.length === 4) {
            fixedLines.push(line);
        } else if (parts.length === 5) {
            // Try to merge the last two columns (likely a comma in the product name)
            const fixedLine = `"${parts[0]}","${parts[1]}","${parts[2]}","${parts[3]}, ${parts[4]}"`;
            fixedLines.push(fixedLine);
            issuesFixed++;
            console.log(`   Fixed line ${i + 1}: merged columns 4-5`);
        } else if (parts.length > 5) {
            // Too many columns, truncate to 4
            const fixedParts = parts.slice(0, 4);
            const fixedLine = fixedParts.map(p => `"${p}"`).join(',');
            fixedLines.push(fixedLine);
            issuesFixed++;
            console.log(`   Fixed line ${i + 1}: truncated from ${parts.length} to 4 columns`);
        } else {
            // Too few columns, skip this line
            console.log(`   Skipped line ${i + 1}: only ${parts.length} columns`);
            issuesFixed++;
        }
    }

    // Create backup
    const backupPath = filePath + '.csvbackup';
    fs.copyFileSync(filePath, backupPath);

    // Write fixed version
    fs.writeFileSync(filePath, fixedLines.join('\n') + '\n');

    console.log(`✅ Fixed ${issuesFixed} issues`);
    console.log(`✅ Created backup: ${backupPath}`);
    console.log(`✅ Updated CSV with ${fixedLines.length - 1} data rows`);

    return issuesFixed;
}

function parseCSVLine(line) {
    // Simple CSV parser that handles quoted fields
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    result.push(current.trim());

    return result;
}

function validateFixedCSV(filePath) {
    console.log(`\n🔍 Re-validating CSV: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let validRows = 0;
    let issues = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = parseCSVLine(line);
        if (parts.length === 4) {
            validRows++;
        } else {
            issues++;
            console.log(`   Still invalid line ${i + 1}: ${parts.length} columns`);
        }
    }

    console.log(`   Valid rows: ${validRows}`);
    console.log(`   Remaining issues: ${issues}`);

    return { validRows, issues };
}

// Run the fixes
console.log('🔧 FIXING CSV FORMATTING ISSUES\n');

const issuesFixed = fixCSVFile(CSV_FILE);
const validation = validateFixedCSV(CSV_FILE);

console.log(`\n📋 FINAL RESULT:`);
console.log(`   Issues fixed: ${issuesFixed}`);
console.log(`   Valid rows: ${validation.validRows}`);
console.log(`   Remaining issues: ${validation.issues}`);

if (validation.issues === 0) {
    console.log(`\n✅ CSV file is now perfectly formatted!`);
} else {
    console.log(`\n⚠️  Some issues remain - manual review may be needed`);
}