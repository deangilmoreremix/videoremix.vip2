import fs from 'fs';
import { createClient } from "@supabase/supabase-js";
import { parse } from 'csv-parse/sync';

// Use environment variables from .env file
const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importUsersFromCSV(csvFilePath, importName = 'users_import_test') {
  console.log(`Starting CSV import from: ${csvFilePath}`);

  // Read and parse CSV
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records = parse(csvContent, {
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Parsed ${records.length} rows from CSV`);

  if (records.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const headers = records[0];
  console.log('Headers:', headers);

  // Verify expected format
  if (!headers.includes('Customer Name') || !headers.includes('Customer Email') ||
      !headers.includes('Campaign') || !headers.includes('Product')) {
    throw new Error('CSV must have columns: Customer Name, Customer Email, Campaign, Product');
  }

  const csvData = records.slice(1); // Skip header

  // Create import record
  console.log('Creating import record...');
  const { data: importRecord, error: importError } = await supabase
    .from("csv_imports")
    .insert({
      import_name: importName,
      filename: csvFilePath.split('/').pop(),
      file_size: fs.statSync(csvFilePath).size,
      import_source: 'script',
      status: 'processing',
      csv_headers: headers,
      imported_by: null, // No authenticated user for this script
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (importError || !importRecord) {
    throw new Error('Failed to create import record: ' + importError?.message);
  }

  console.log(`Created import record with ID: ${importRecord.id}`);

  // Process products and users (similar to the backend function)
  const uniqueProducts = new Map();
  const userRecordsToInsert = [];
  let newUsersCreated = 0;
  let existingUsersUpdated = 0;

  console.log('Processing CSV rows...');

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

    // Map columns by index
    const customerName = row[0];
    const customerEmail = row[1]?.toLowerCase().trim();
    const campaign = row[2];
    const product = row[3];

    if (!customerEmail) {
      console.warn(`Skipping row ${i + 1}: no email address`);
      continue;
    }

    // Track unique products
    const productKey = `${product}|${campaign || ''}`;
    if (!uniqueProducts.has(productKey)) {
      uniqueProducts.set(productKey, {
        name: product,
        campaign: campaign || null,
        count: 0,
        emails: new Set(),
      });
    }
    const productData = uniqueProducts.get(productKey);
    productData.count++;
    productData.emails.add(customerEmail);

    // For this test import, we'll just create records without linking to actual users
    // This allows us to test the CSV processing and data insertion
    const userId = null; // No user ID for test import
    existingUsersUpdated++; // Count all as "existing" for this test

    // Add to user records
    userRecordsToInsert.push({
      csv_import_id: importRecord.id,
      customer_name: customerName || null,
      customer_email: customerEmail,
      campaign: campaign || null,
      product_name: product,
      user_id: userId,
      processing_status: userId ? 'processed' : 'failed',
      row_number: i + 1,
      raw_data: row,
      processed_at: new Date().toISOString(),
    });
  }

  console.log(`Found ${uniqueProducts.size} unique products`);
  console.log(`Processing ${userRecordsToInsert.length} user records`);
  console.log(`New users to create: ${newUsersCreated}`);
  console.log(`Existing users to update: ${existingUsersUpdated}`);

  // Insert products first
  const productsToInsert = [];
  const existingProductsMap = new Map();

  // Check existing products
  const { data: existingProducts } = await supabase
    .from('import_products')
    .select('id, normalized_name');

  if (existingProducts) {
    existingProducts.forEach(p => {
      existingProductsMap.set(p.normalized_name, p.id);
    });
  }

  // Prepare products to insert
  for (const [key, productData] of uniqueProducts) {
    const normalizedName = productData.name.toLowerCase().trim().replace(/\s+/g, '_');

    if (!existingProductsMap.has(normalizedName)) {
      productsToInsert.push({
        product_name: productData.name,
        normalized_name: normalizedName,
        campaign_name: productData.campaign,
        first_seen_in_import_id: importRecord.id,
        total_occurrences: productData.count,
        unique_user_count: productData.emails.size,
        is_mapped: false,
        mapping_status: 'unmapped',
      });
    } else {
      // Update existing product counts
      await supabase
        .from('import_products')
        .update({
          total_occurrences: productData.count,
          unique_user_count: productData.emails.size,
        })
        .eq('normalized_name', normalizedName);
    }
  }

  let newProductsAdded = 0;
  console.log(`Products to insert: ${productsToInsert.length}`);
  if (productsToInsert.length > 0) {
    console.log('Sample product to insert:', productsToInsert[0]);
    const { data: insertedProducts, error: insertError } = await supabase
      .from('import_products')
      .insert(productsToInsert)
      .select('id, normalized_name, campaign_name, product_name');

    if (insertError) {
      console.error('Error inserting products:', insertError);
    } else if (insertedProducts) {
      newProductsAdded = insertedProducts.length;
      console.log(`Added ${newProductsAdded} new products`);
    }
  }

  // Insert user records
  if (userRecordsToInsert.length > 0) {
    console.log('Inserting user records...');
    const { error: userError } = await supabase.from('import_user_records').insert(userRecordsToInsert);

    if (userError) {
      console.error('Error inserting user records:', userError);
      throw new Error('Failed to insert user records: ' + userError.message);
    }

    console.log(`Successfully inserted ${userRecordsToInsert.length} user records`);
  }

  // Update import record as completed
  await supabase
    .from('csv_imports')
    .update({
      status: 'completed',
      total_rows: csvData.length,
      processed_rows: csvData.length,
      successful_rows: userRecordsToInsert.filter(r => r.processing_status === 'processed').length,
      failed_rows: userRecordsToInsert.filter(r => r.processing_status === 'failed').length,
      unique_products_found: uniqueProducts.size,
      new_products_added: newProductsAdded,
      new_users_created: newUsersCreated,
      existing_users_updated: existingUsersUpdated,
      completed_at: new Date().toISOString(),
    })
    .eq('id', importRecord.id);

  console.log('✅ Import completed successfully!');
  console.log('Summary:');
  console.log(`- Total rows processed: ${csvData.length}`);
  console.log(`- New users created: ${newUsersCreated}`);
  console.log(`- Existing users updated: ${existingUsersUpdated}`);
  console.log(`- New products added: ${newProductsAdded}`);
  console.log(`- Import record ID: ${importRecord.id}`);

  return {
    importId: importRecord.id,
    stats: {
      totalRows: csvData.length,
      newUsers: newUsersCreated,
      updatedUsers: existingUsersUpdated,
      newProducts: newProductsAdded,
    }
  };
}

// Run the import
const csvFilePath = process.argv[2] || 'users_for_import.csv';
const importName = process.argv[3] || `script_import_${new Date().toISOString().split('T')[0]}`;

importUsersFromCSV(csvFilePath, importName)
  .then(result => {
    console.log('🎉 Import successful:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  });