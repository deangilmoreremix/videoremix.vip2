#!/usr/bin/env node

import fs from 'fs';

const CSV_FILE = 'all_users_for_import.csv';

function fixInvalidEmails(filePath) {
    console.log(`🔧 Fixing invalid emails in: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const fixedLines = [];
    let removedLines = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (i === 0) {
            // Keep header
            fixedLines.push(line);
            continue;
        }

        // Parse CSV line
        const parts = parseCSVLine(line);
        if (parts.length >= 2) {
            const email = parts[1].replace(/"/g, '').trim();

            // Check if email is valid
            if (email.includes('@') && email.includes('.') && email !== 'md' && email.length > 3) {
                fixedLines.push(line);
            } else {
                console.log(`   Removed line ${i + 1}: invalid email "${email}"`);
                removedLines++;
            }
        } else {
            console.log(`   Removed line ${i + 1}: malformed line`);
            removedLines++;
        }
    }

    // Create backup
    const backupPath = filePath + '.finalbackup';
    fs.copyFileSync(filePath, backupPath);

    // Write fixed version
    fs.writeFileSync(filePath, fixedLines.join('\n') + '\n');

    console.log(`✅ Removed ${removedLines} invalid lines`);
    console.log(`✅ Created backup: ${backupPath}`);
    console.log(`✅ Final CSV has ${fixedLines.length - 1} valid data rows`);

    return removedLines;
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

// Run the fix
console.log('🔧 REMOVING INVALID EMAIL ENTRIES\n');

const removed = fixInvalidEmails(CSV_FILE);

console.log(`\n📋 RESULT:`);
console.log(`   Invalid lines removed: ${removed}`);
console.log(`   CSV is now clean and ready for use!`);