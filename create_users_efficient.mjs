import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
  console.log('👥 Starting Efficient User Creation Process...\n');

  // Read the additional users text file
  const content = readFileSync('./additional_users.txt', 'utf-8');
  const lines = content.trim().split('\n');

  console.log(`📁 Found ${lines.length} user entries to process\n`);

  const stats = {
    total: lines.length,
    usersCreated: 0,
    usersSkipped: 0,
    profilesCreated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Process users in batches to avoid timeouts
  const batchSize = 50;
  const batches = [];

  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize));
  }

  console.log(`📦 Split into ${batches.length} batches of max ${batchSize} users each\n`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} users)`);

    for (let lineIndex = 0; lineIndex < batch.length; lineIndex++) {
      const line = batch[lineIndex].trim();
      if (!line) continue;

      const globalLineNum = batchIndex * batchSize + lineIndex + 1;

      try {
        // Parse the line - assuming format: "First Last email" or "First Middle Last email"
        const parts = line.split(/\s+/);
        if (parts.length < 2) {
          console.log(`⏭️  Line ${globalLineNum}: Skipped - Invalid format: ${line}`);
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
          console.log(`⏭️  Line ${globalLineNum}: Skipped - No email found: ${line}`);
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
          console.log(`⏭️  Line ${globalLineNum}: Skipped - Invalid name: ${firstName} ${lastName}`);
          stats.skipped++;
          continue;
        }

        // Try to create the user directly (let Supabase handle duplicates)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'VideoRemixVip2026',
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            created_via: 'bulk_users_import',
          },
        });

        let userId;

        if (createError) {
          if (createError.message?.includes('already been registered')) {
            // User already exists - find their ID
            const { data: existingUsers } = await supabase.auth.admin.listUsers({
              filter: `email.eq.${email}`,
              page: 1,
              perPage: 1,
            });
            userId = existingUsers?.users?.[0]?.id;
            stats.usersSkipped++;
            console.log(`   ✅ User already exists: ${email}`);
          } else {
            console.error(`   ❌ Failed to create user ${email}: ${createError.message}`);
            stats.failed++;
            stats.errors.push(`Line ${globalLineNum}: ${createError.message}`);
            continue;
          }
        } else {
          userId = newUser.user.id;
          stats.usersCreated++;
          console.log(`   ✨ Created new user: ${email}`);
        }

        if (userId) {
          // Create user role (upsert in case it already exists)
          await supabase.from('user_roles').upsert({
            user_id: userId,
            role: 'user',
            tenant_id: '00000000-0000-0000-0000-000000000001',
          });

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
              console.error(`   ❌ Failed to create profile for ${email}: ${profileError.message}`);
            } else {
              stats.profilesCreated++;
              console.log(`   📝 Created profile for: ${email}`);
            }
          } else {
            console.log(`   ℹ️  Profile already exists for: ${email}`);
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing line ${globalLineNum}:`, error.message);
        stats.failed++;
        stats.errors.push(`Line ${globalLineNum}: ${error.message}`);
      }
    }

    // Small delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      console.log(`⏳ Waiting 2 seconds before next batch...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('👥 EFFICIENT USER CREATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Entries:        ${stats.total}`);
  console.log(`New Users Created:    ${stats.usersCreated}`);
  console.log(`Users Skipped:        ${stats.usersSkipped}`);
  console.log(`Profiles Created:     ${stats.profilesCreated}`);
  console.log(`Skipped (Invalid):    ${stats.skipped}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
    }
  }

  console.log('\n✅ Efficient user creation process completed!\n');
}

// Run the script
createUsersFromList().catch(console.error);