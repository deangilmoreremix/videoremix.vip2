import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importUsersToRecordsTable() {
  try {
    console.log('Starting import of all_users_for_import.csv to import_user_records...\n');

    // Read and parse CSV
    const csvContent = readFileSync('all_users_for_import.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      skip_records_with_error: true
    });

    console.log(`Found ${records.length} records in CSV\n`);

    // Create a CSV import record
    const { data: csvImport, error: importError } = await supabase
      .from('csv_imports')
      .insert({
        import_name: 'Combined User Import',
        filename: 'all_users_for_import.csv',
        status: 'processing',
        total_rows: records.length,
        csv_headers: ['Customer Name', 'Customer Email', 'Campaign', 'Product'],
        column_mappings: {
          'Customer Name': 'customer_name',
          'Customer Email': 'customer_email',
          'Campaign': 'campaign',
          'Product': 'product_name'
        }
      })
      .select('id')
      .single();

    if (importError) {
      console.error('Error creating CSV import record:', importError.message);
      return;
    }

    const csvImportId = csvImport.id;
    console.log(`Created CSV import record with ID: ${csvImportId}\n`);

    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const record of records) {
      try {
        processed++;

        // Progress indicator
        if (processed % 50 === 0) {
          console.log(`Processed ${processed} users...`);
        }

        const customerName = record['Customer Name']?.trim() || '';
        const customerEmail = record['Customer Email']?.trim().toLowerCase() || '';
        const campaign = record['Campaign']?.trim() || '';
        const productName = record['Product']?.trim() || '';

        // Skip invalid emails
        if (!customerEmail || customerEmail === '') {
          errors.push(`Row ${processed}: Invalid email`);
          failed++;
          continue;
        }

        // Insert into import_user_records
        const { error: insertError } = await supabase
          .from('import_user_records')
          .insert({
            csv_import_id: csvImportId,
            customer_name: customerName,
            customer_email: customerEmail,
            campaign: campaign,
            product_name: productName,
            row_number: processed,
            raw_data: record,
            processing_status: 'pending'
          });

        if (insertError) {
          console.error(`Error inserting row ${processed} (${customerEmail}):`, insertError.message);
          errors.push(`Row ${processed} (${customerEmail}): ${insertError.message}`);
          failed++;
        } else {
          successful++;
        }

      } catch (err) {
        console.error(`Unexpected error processing row ${processed}:`, err.message);
        errors.push(`Row ${processed}: ${err.message}`);
        failed++;
      }
    }

    // Update the CSV import record with results
    await supabase
      .from('csv_imports')
      .update({
        status: 'completed',
        processed_rows: processed,
        successful_rows: successful,
        failed_rows: failed,
        error_log: errors.slice(0, 100), // Limit error log size
        import_summary: {
          total: processed,
          successful,
          failed,
          errors_count: errors.length
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', csvImportId);

    console.log('\n=== Import Complete ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

importUsersToRecordsTable();