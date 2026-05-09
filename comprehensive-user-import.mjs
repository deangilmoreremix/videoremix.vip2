#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Batch processing configuration
const BATCH_SIZE = 10;
const BATCH_DELAY = 100; // 100ms between batches

// CSV Parser with proper quote handling
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());

    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }

  return records;
}

// Parse name into first/last
function parseName(fullName) {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  const last = parts.pop();
  const first = parts.join(' ');
  return { first, last };
}

// Generate secure random password
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + 'Aa1!';
}

// Get default tenant ID
async function getDefaultTenantId() {
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (tenantError) {
    console.error('❌ Error fetching tenant ID:', tenantError.message);
    return null;
  }

  return tenantData.id;
}

// Main import function
async function importAllUsers() {
  console.log('🚀 Starting comprehensive user import from all CSV files...\n');

  const csvFiles = [
    {
      path: 'src/data/VR User List - PKS.csv',
      emailField: 'Customer Email',
      nameField: 'Customer Name',
      hasProducts: true,
      productField: 'Product'
    },
    {
      path: 'users_to_import_clean.csv',
      emailField: 'email',
      nameField: null, // Split into first_name, last_name
      firstNameField: 'first_name',
      lastNameField: 'last_name',
      hasProducts: true,
      productField: 'products_purchased'
    },
    {
      path: 'src/data/top_500_customers.csv',
      emailField: 'email',
      nameField: null, // Split into firstName, lastName
      firstNameField: 'firstName',
      lastNameField: 'lastName',
      hasProducts: false
    },
    {
      path: 'src/data/user_contacts_clean.csv',
      emailField: 'email',
      nameField: null, // Split into firstName, lastName
      firstNameField: 'firstName',
      lastNameField: 'lastName',
      hasProducts: false
    }
  ];

  const tenantId = await getDefaultTenantId();
  if (!tenantId) {
    console.error('❌ Cannot proceed without tenant ID');
    process.exit(1);
  }

  let totalRecords = 0;
  let totalUsersCreated = 0;
  let totalUsersExisting = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const allErrors = [];
  const processedEmails = new Set();

  for (const csvConfig of csvFiles) {
    console.log(`\n📂 Processing: ${csvConfig.path}`);

    try {
      const content = readFileSync(join(__dirname, csvConfig.path), 'utf-8');
      const records = parseCSV(content);

      console.log(`   Found ${records.length} records`);

      for (let batchStart = 0; batchStart < records.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, records.length);
        console.log(`   Processing batch ${Math.floor(batchStart/BATCH_SIZE) + 1}: records ${batchStart + 1}-${batchEnd}`);

        for (let i = batchStart; i < batchEnd; i++) {
          const record = records[i];
          const rowNum = i + 2;

        // Extract email
        let email = '';
        if (csvConfig.emailField) {
          email = record[csvConfig.emailField]?.toLowerCase().trim();
        }

        if (!email || !email.includes('@')) {
          totalSkipped++;
          continue;
        }

        // Skip if already processed
        if (processedEmails.has(email)) {
          continue;
        }

        processedEmails.add(email);
        totalRecords++;

        try {
          // Check if user exists in auth
          const { data: existingUsers } = await supabase.auth.admin.listUsers({
            filters: { email: email }
          });

          let user = existingUsers?.users?.[0];

          // Extract name
          let firstName = '', lastName = '', fullName = '';

          if (csvConfig.nameField) {
            fullName = record[csvConfig.nameField]?.trim() || '';
            const parsed = parseName(fullName);
            firstName = parsed.first;
            lastName = parsed.last;
          } else if (csvConfig.firstNameField && csvConfig.lastNameField) {
            firstName = record[csvConfig.firstNameField]?.trim() || '';
            lastName = record[csvConfig.lastNameField]?.trim() || '';
            fullName = `${firstName} ${lastName}`.trim();
          }

          if (user) {
            // User exists in auth, ensure profile exists
            totalUsersExisting++;

            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (!existingProfile) {
              // Create missing profile
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  user_id: user.id,
                  full_name: fullName,
                  email: email,
                  tenant_id: tenantId
                });

              if (profileError) {
                throw new Error(`Failed to create profile: ${profileError.message}`);
              }

              console.log(`✅ Created missing profile for existing user: ${email}`);
            }

            // Ensure user role exists
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (!existingRole) {
              await supabase
                .from('user_roles')
                .insert({
                  user_id: user.id,
                  role: 'user'
                });
            }

          } else {
            // Create new user
            const password = generateRandomPassword();

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                full_name: fullName
              }
            });

            if (createError) {
              throw new Error(`Failed to create auth user: ${createError.message}`);
            }

            user = newUser.user;
            totalUsersCreated++;

            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                user_id: user.id,
                full_name: fullName,
                email: email,
                tenant_id: tenantId
              });

            if (profileError) {
              throw new Error(`Failed to create profile: ${profileError.message}`);
            }

            // Create user role
            await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: 'user',
                tenant_id: tenantId
              });
          }

          // Process products if available
          if (csvConfig.hasProducts && record[csvConfig.productField]) {
            // Product processing logic would go here
            // This is simplified - you'd need product mapping logic
          }

          if ((totalUsersCreated + totalUsersExisting) % 50 === 0) {
            console.log(`   ✅ Processed ${totalUsersCreated + totalUsersExisting} users...`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`❌ Row ${rowNum} (${email}): ${error.message}`);
          totalFailed++;
          allErrors.push({ file: csvConfig.path, row: rowNum, email, error: error.message });
        }
        }

        // Delay between batches
        if (batchEnd < records.length) {
          console.log(`   Waiting ${BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${csvConfig.path}: ${error.message}`);
    }
  }

  // Print final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE USER IMPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total unique emails processed: ${processedEmails.size}`);
  console.log(`✅ New users created: ${totalUsersCreated}`);
  console.log(`✓  Existing users found: ${totalUsersExisting}`);
  console.log(`⏭️  Skipped (invalid): ${totalSkipped}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`🎯 Total users in system: ${totalUsersCreated + totalUsersExisting}`);
  console.log('='.repeat(80));

  if (allErrors.length > 0 && allErrors.length <= 20) {
    console.log('\n❌ Errors:');
    allErrors.forEach(err => {
      console.log(`   ${err.file}:${err.row} (${err.email}): ${err.error}`);
    });
  } else if (allErrors.length > 20) {
    console.log(`\n❌ ${allErrors.length} errors occurred (showing first 20):`);
    allErrors.slice(0, 20).forEach(err => {
      console.log(`   ${err.file}:${err.row} (${err.email}): ${err.error}`);
    });
  }

  console.log('\n✅ Import complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run purchase import scripts for product access');
  console.log('   2. Send password reset emails to new users');
  console.log('   3. Verify user login functionality');
  console.log('   4. Check app access grants');
}

importAllUsers().catch(console.error);