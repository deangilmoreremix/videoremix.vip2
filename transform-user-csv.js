import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transform user CSV from format:
 * first_name,last_name,email,total_spend,total_orders,last_purchase,segment,products_purchased
 *
 * To expected import format:
 * Customer Name,Customer Email,Campaign,Product
 *
 * Each user with multiple products gets multiple rows
 */

function transformUserCSV(inputPath, outputPath) {
  console.log(`Transforming CSV: ${inputPath} -> ${outputPath}`);

  const content = fs.readFileSync(inputPath, 'utf-8');

  // Parse CSV with relaxed column count to handle malformed data
  const records = parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  // Fix records that were split incorrectly due to commas in dollar amounts
  const fixedRecords = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (record.length === 8) {
      // Already correct
      fixedRecords.push(record);
    } else if (record.length > 8) {
      // Merge back dollar amounts that were split
      // Pattern: [name, name, email, '$3', '053.00', number, date, segment, products...]
      const fixedRecord = [
        record[0], // first_name
        record[1], // last_name
        record[2], // email
        record[3] + ',' + record[4], // total_spend (merge '$3' + '053.00')
        record[5], // total_orders
        record[6], // last_purchase
        record[7], // segment
        record.slice(8).join(','), // products_purchased (join remaining columns)
      ];

      fixedRecords.push(fixedRecord);
    } else {
      // Pad with empty strings if too short
      const padded = [...record];
      while (padded.length < 8) {
        padded.push('');
      }
      fixedRecords.push(padded);
    }
  }

  // Debug the first fixed record
  if (fixedRecords.length > 1) {
    console.log(`Row 2 fixed:`, fixedRecords[1]);
  }

  if (records.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const headers = records[0];
  console.log('Input headers:', headers);

  // Expected headers
  const expectedHeaders = ['first_name', 'last_name', 'email', 'total_spend', 'total_orders', 'last_purchase', 'segment', 'products_purchased'];

  // Check if headers match (allowing for slight variations)
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const headerMatch = expectedHeaders.every(expected =>
    normalizedHeaders.some(normalized => normalized.includes(expected.replace('_', '')))
  );

  if (!headerMatch) {
    console.warn('Headers may not match expected format. Expected:', expectedHeaders);
    console.warn('Found:', headers);
  }

  const outputLines = ['Customer Name,Customer Email,Campaign,Product'];

  // Process data rows
  for (let i = 1; i < fixedRecords.length; i++) {
    const record = fixedRecords[i];



    if (record.length < 8) {
      console.warn(`Skipping row ${i + 1}: insufficient columns (${record.length})`);
      continue;
    }

    const [firstName, lastName, email, totalSpend, totalOrders, lastPurchase, segment, productsPurchased] = record;

    // Skip if no email
    if (!email || email.trim() === '') {
      console.warn(`Skipping row ${i + 1}: no email address`);
      continue;
    }

    // Combine first and last name
    const customerName = `${firstName} ${lastName}`.trim();

    // Use segment as campaign
    const campaign = segment || 'Unknown';

    // Split products_purchased by " | " separator
    let products = [];
    if (productsPurchased && productsPurchased !== 'nan') {
      products = productsPurchased.split(' | ').map(p => p.trim()).filter(p => p);
    }

    // If no products, create one row with empty product
    if (products.length === 0) {
      outputLines.push(`"${customerName}","${email}","${campaign}",""`);
    } else {
      // Create one row per product
      products.forEach(product => {
        // Clean up product name (remove extra quotes, trim)
        const cleanProduct = product.replace(/^["']|["']$/g, '').trim();
        outputLines.push(`"${customerName}","${email}","${campaign}","${cleanProduct}"`);
      });
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`Transformed ${records.length - 1} input rows into ${outputLines.length - 1} output rows`);
  console.log(`Output saved to: ${outputPath}`);
}



// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Usage: node transform-user-csv.js <input.csv> <output.csv>');
    console.log('Example: node transform-user-csv.js users_to_import_clean.csv transformed_users.csv');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    transformUserCSV(inputPath, outputPath);
    console.log('✅ Transformation completed successfully!');
  } catch (error) {
    console.error('❌ Transformation failed:', error.message);
    process.exit(1);
  }
}

export { transformUserCSV };