import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createRemainingUsers() {
  console.log('🚀 Creating the remaining 941 missing users...\n');

  // Parse CSV to get all users
  const content = readFileSync(path.join(__dirname, 'all_users_for_import.csv'), 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const csvUsers = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    if (parts.length >= 3) {
      const name = parts[0].replace(/"/g, '').trim();
      const email = parts[1].replace(/"/g, '').toLowerCase().trim();
      const campaign = parts[2].replace(/"/g, '').trim();
      const product = parts[3]?.replace(/"/g, '').trim();

      if (email && email.includes('@')) {
        if (!csvUsers.has(email)) {
          csvUsers.set(email, {
            name: name || 'Unknown',
            email: email,
            campaign: campaign,
            products: new Set()
          });
        }
        if (product) {
          csvUsers.get(email).products.add(product);
        }
      }
    }
  }

  console.log(`Found ${csvUsers.size} unique users in CSV`);

  // Get existing auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
  const existingEmails = new Set(authUsers.users.map(u => u.email.toLowerCase().trim()));

  console.log(`Found ${existingEmails.size} existing auth users`);

  // Find users to create
  const usersToCreate = [];
  for (const [email, userData] of csvUsers) {
    if (!existingEmails.has(email)) {
      usersToCreate.push(userData);
    }
  }

  console.log(`Need to create ${usersToCreate.length} new users`);

  if (usersToCreate.length === 0) {
    console.log('✅ All users already exist!');
    return;
  }

  // Create users in batches
  const BATCH_SIZE = 10;
  let created = 0;
  let failed = 0;

  for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
    const batch = usersToCreate.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} users`);

    for (const userData of batch) {
      try {
        const password = 'VideoRemix2026';

        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.name,
            imported_via_csv: true,
            import_date: new Date().toISOString(),
            campaign: userData.campaign
          }
        });

        if (error) {
          console.error(`❌ Failed to create ${userData.email}:`, error.message);
          failed++;
        } else {
          console.log(`✅ Created: ${userData.email}`);
          created++;

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: newUser.user.id,
              user_id: newUser.user.id,
              email: userData.email,
              full_name: userData.name,
              tenant_id: '00000000-0000-0000-0000-000000000001',
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error(`⚠️  Profile creation failed for ${userData.email}:`, profileError.message);
          }
        }
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
        failed++;
      }
    }

    // Progress update
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, usersToCreate.length)}/${usersToCreate.length} processed`);

    // Rate limiting between batches
    if (i + BATCH_SIZE < usersToCreate.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ User creation complete: ${created} created, ${failed} failed`);
  console.log(`Expected total auth users: ${existingEmails.size + created}`);
}

createRemainingUsers().catch(console.error);