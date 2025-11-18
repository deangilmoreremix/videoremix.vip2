#!/usr/bin/env node

/**
 * Import CSV to Supabase
 *
 * This script imports the Personalizer CSV file into the import_user_records table
 * so that the SQL grant script can process it.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importCSVToSupabase(csvFilePath) {
  console.log('\n📥 Importing CSV to Supabase\n');
  console.log('='.repeat(70));

  try {
    // Read and parse CSV
    console.log(`\n📄 Reading CSV file: ${csvFilePath}`);
    const fileContent = readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`✅ Parsed ${records.length} records`);

    // Filter Personalizer products
    const personalizerRecords = records.filter(record => {
      const productName = record['PRODUCT NAME'] || record['product_name'] || '';
      return productName.toLowerCase().includes('personalizer');
    });
    console.log(`🎯 Found ${personalizerRecords.length} Personalizer purchases`);

    if (personalizerRecords.length === 0) {
      console.log('⚠️  No Personalizer records found. Exiting.');
      return;
    }

    // Create CSV import record
    console.log('\n📦 Creating import record...');
    const { data: csvImport, error: importError } = await supabase
      .from('csv_imports')
      .insert({
        import_name: 'Personalizer Purchases Import',
        filename: csvFilePath.split('/').pop(),
        import_source: 'manual',
        status: 'processing',
        total_rows: personalizerRecords.length,
        csv_headers: Object.keys(personalizerRecords[0]),
      })
      .select()
      .single();

    if (importError) {
      console.error('❌ Error creating import record:', importError);
      throw importError;
    }

    console.log(`✅ Created import record: ${csvImport.id}`);

    // Prepare user records for insertion
    console.log('\n⚙️  Preparing user records...');
    const userRecords = personalizerRecords.map((record, index) => ({
      csv_import_id: csvImport.id,
      customer_name: record['CUSTOMER NAME'] || record['customer_name'] || '',
      customer_email: (record['CUSTOMER EMAIL'] || record['customer_email'] || '').toLowerCase().trim(),
      campaign: record['CAMPAIGN'] || record['campaign'] || '',
      product_name: record['PRODUCT NAME'] || record['product_name'] || '',
      processing_status: 'pending',
      row_number: index + 1,
      raw_data: record,
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;

    console.log('\n📤 Inserting records in batches...');

    for (let i = 0; i < userRecords.length; i += batchSize) {
      const batch = userRecords.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('import_user_records')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${inserted} records so far)`);
      }
    }

    // Update import record with final status
    const finalStatus = failed === 0 ? 'completed' : 'failed';
    await supabase
      .from('csv_imports')
      .update({
        status: finalStatus,
        processed_rows: inserted,
        successful_rows: inserted,
        failed_rows: failed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', csvImport.id);

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 IMPORT SUMMARY\n');
    console.log(`Total Records:      ${personalizerRecords.length}`);
    console.log(`✅ Successfully Imported: ${inserted}`);
    console.log(`❌ Failed:           ${failed}`);
    console.log(`Import ID:          ${csvImport.id}`);

    // Show unique products imported
    const uniqueProducts = [...new Set(userRecords.map(r => r.product_name))];
    console.log('\n📦 Unique Products Imported:');
    uniqueProducts.forEach(product => {
      const count = userRecords.filter(r => r.product_name === product).length;
      console.log(`   • ${product} (${count} purchases)`);
    });

    // Show unique users
    const uniqueEmails = [...new Set(userRecords.map(r => r.customer_email))];
    console.log(`\n👥 Unique Customers: ${uniqueEmails.length}`);

    console.log('\n✨ Import completed!\n');
    console.log('Next steps:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the queries in grant-personalizer-access.sql');
    console.log('3. Verify access was granted correctly');
    console.log('');

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    throw error;
  }
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node import-csv-to-supabase.mjs <path-to-csv-file>');
  console.log('\nExample:');
  console.log('  node import-csv-to-supabase.mjs "./src/data/personalizer .csv"');
  process.exit(1);
}

const csvFilePath = args[0];

importCSVToSupabase(csvFilePath)
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
