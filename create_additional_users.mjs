import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUsersFromList() {
  console.log('👥 Starting User Creation Process...\n');

  // Read the additional users text file
  const content = readFileSync('./additional_users.txt', 'utf-8');
  const lines = content.trim().split('\n');

  console.log(`📁 Found ${lines.length} user entries to process\n`);

  const stats = {
    total: lines.length,
    usersCreated: 0,
    usersExisting: 0,
    profilesCreated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lineNum = i + 1;

    try {
      // Parse the line - assuming format: "First Last email" or "First Middle Last email"
      const parts = line.split(/\s+/);
      if (parts.length < 2) {
        console.log(`⏭️  Line ${lineNum}: Skipped - Invalid format: ${line}`);
        stats.skipped++;
        continue;
      }

      // Find the email (last part that contains @)
      let email = '';
      let nameParts = [];

      for (let j = parts.length - 1; j >= 0; j--) {
        if (parts[j].includes('@')) {
          email = parts[j];
          nameParts = parts.slice(0, j);
          break;
        }
      }

      if (!email || nameParts.length === 0) {
        console.log(`⏭️  Line ${lineNum}: Skipped - No email found: ${line}`);
        stats.skipped++;
        continue;
      }

      email = email.toLowerCase().trim();

      // Parse name parts
      let firstName = '';
      let lastName = '';

      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        firstName = nameParts[0];
      }

      // Skip if names look invalid
      if (firstName.toLowerCase() === 'nan' || lastName.toLowerCase() === 'nan') {
        console.log(`⏭️  Line ${lineNum}: Skipped - Invalid name: ${firstName} ${lastName}`);
        stats.skipped++;
        continue;
      }

      console.log(`\n🔄 Processing Line ${lineNum}: ${firstName} ${lastName} <${email}>`);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      let userId;

      if (existingUser) {
        userId = existingUser.id;
        stats.usersExisting++;
        console.log(`   ✅ User already exists: ${email}`);
      } else {
        // Create new user with specified password
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'VideoRemixVip2026',
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            created_via: 'additional_users_import',
          },
        });

        if (createError || !newUser.user) {
          console.error(`   ❌ Failed to create user: ${createError?.message}`);
          stats.failed++;
          stats.errors.push(`Line ${lineNum}: ${createError?.message}`);
          continue;
        }

        userId = newUser.user.id;
        stats.usersCreated++;
        console.log(`   ✨ Created new user: ${email}`);

        // Create user role
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: 'user',
          tenant_id: '00000000-0000-0000-0000-000000000001',
        });
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            full_name: `${firstName} ${lastName}`.trim(),
            tenant_id: '00000000-0000-0000-0000-000000000001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error(`   ❌ Failed to create profile: ${profileError.message}`);
        } else {
          stats.profilesCreated++;
          console.log(`   📝 Created profile for: ${email}`);
        }
      } else {
        console.log(`   ℹ️  Profile already exists`);
      }

    } catch (error) {
      console.error(`   ❌ Error processing line ${lineNum}:`, error.message);
      stats.failed++;
      stats.errors.push(`Line ${lineNum}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('👥 USER CREATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Entries:        ${stats.total}`);
  console.log(`New Users Created:    ${stats.usersCreated}`);
  console.log(`Existing Users Found: ${stats.usersExisting}`);
  console.log(`Profiles Created:     ${stats.profilesCreated}`);
  console.log(`Skipped:              ${stats.skipped}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log('='.repeat(60));
  console.log(`Total Entries:        ${stats.total}`);
  console.log(`New Users Created:    ${stats.usersCreated}`);
  console.log(`Existing Users Found: ${stats.usersExisting}`);
  console.log(`Profiles Created:     ${stats.profilesCreated}`);
  console.log(`Skipped:              ${stats.skipped}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✅ User creation process completed!\n');
}

// Run the script
createUsersFromList().catch(console.error);