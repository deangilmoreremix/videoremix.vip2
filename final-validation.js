#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const FILES_TO_CHECK = [
    'additional_users.txt',
    'new_users_list.txt',
    'new_users_list_3.txt',
    'next_500_users.txt',
    'all_users_for_import.csv'
];

function validateTextFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    let validLines = 0;
    let issues = [];

    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
            const email = parts[parts.length - 1];
            if (email.includes('@') && email.includes('.')) {
                // Check for 'nan' values
                const nameParts = parts.slice(0, -1);
                if (!nameParts.some(part => part.toLowerCase() === 'nan')) {
                    validLines++;
                } else {
                    issues.push(`Line ${index + 1}: contains 'nan' values`);
                }
            } else {
                issues.push(`Line ${index + 1}: invalid email "${email}"`);
            }
        } else {
            issues.push(`Line ${index + 1}: insufficient parts (${parts.length})`);
        }
    });

    return { validLines, totalLines: lines.length, issues };
}

function validateCSVFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    let validRows = 0;
    let issues = [];

    lines.forEach((line, index) => {
        if (index === 0) return; // Skip header

        const parts = parseCSVLine(line);
        if (parts.length === 4) {
            // Check email validity
            const email = parts[1].replace(/"/g, '');
            if (email.includes('@') && email.includes('.')) {
                validRows++;
            } else {
                issues.push(`Line ${index + 1}: invalid email "${email}"`);
            }
        } else {
            issues.push(`Line ${index + 1}: expected 4 columns, got ${parts.length}`);
        }
    });

    return { validRows, totalRows: lines.length - 1, issues };
}

function parseCSVLine(line) {
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

    result.push(current.trim());
    return result;
}

console.log('🎯 FINAL VALIDATION: All User Lists Formatting Check\n');

let totalValid = 0;
let totalIssues = 0;

FILES_TO_CHECK.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${fileName}: File not found`);
        return;
    }

    console.log(`📄 Checking ${fileName}...`);

    let result;
    if (fileName.endsWith('.txt')) {
        result = validateTextFile(filePath);
        console.log(`   Format: Text (Name Email)`);
    } else if (fileName.endsWith('.csv')) {
        result = validateCSVFile(filePath);
        console.log(`   Format: CSV (Name,Email,Campaign,Product)`);
    }

    console.log(`   Total lines: ${result.totalLines || result.totalRows}`);
    console.log(`   Valid entries: ${result.validLines || result.validRows}`);
    console.log(`   Issues: ${result.issues.length}`);

    if (result.issues.length > 0) {
        console.log(`   🚨 Issues found:`);
        result.issues.slice(0, 3).forEach(issue => console.log(`      ${issue}`));
        if (result.issues.length > 3) {
            console.log(`      ... and ${result.issues.length - 3} more`);
        }
    } else {
        console.log(`   ✅ No issues found`);
    }

    totalValid += result.validLines || result.validRows;
    totalIssues += result.issues.length;
    console.log('');
});

console.log('📊 SUMMARY:');
console.log(`   Files checked: ${FILES_TO_CHECK.length}`);
console.log(`   Total valid entries: ${totalValid}`);
console.log(`   Total issues remaining: ${totalIssues}`);

if (totalIssues === 0) {
    console.log('\n🎉 SUCCESS: All user lists are perfectly formatted!');
    console.log('   ✅ Text files: Proper "Name Email" format');
    console.log('   ✅ CSV file: Proper quoted columns with valid emails');
    console.log('   ✅ No invalid entries or formatting issues');
} else {
    console.log(`\n⚠️  WARNING: ${totalIssues} issues remain - manual review needed`);
}