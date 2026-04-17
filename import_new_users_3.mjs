import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createUser(name, email, password) {
  try {
    // Check if user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      console.log(`User ${email} already exists, skipping`);
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${email} already exists in auth, skipping`);
        return;
      }
      console.error(`Auth error for ${email}:`, authError);
      return;
    }

    // Create profile
    const tenantId = 'f2f2f2f2-2f2f-2f2f-2f2f-2f2f2f2f2f2f'; // Assuming same tenant

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        tenant_id: tenantId,
        role: 'user'
      });

    if (profileError) {
      console.error(`Profile error for ${email}:`, profileError);
    } else {
      console.log(`Created user: ${name} (${email})`);
    }
  } catch (error) {
    console.error(`Unexpected error for ${email}:`, error);
  }
}

async function importUsersFromFile(filePath, password) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const users = [];
  for (const line of lines) {
    const parts = line.trim().split(' ');
    if (parts.length < 2) continue;
    const email = parts[parts.length - 1];
    const name = parts.slice(0, -1).join(' ');
    users.push({ name, email });
  }

  console.log(`Parsed ${users.length} users`);

  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);

    await Promise.all(
      batch.map(user => createUser(user.name, user.email, password))
    );

    // Wait a bit between batches
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('Import completed');
}

importUsersFromFile('new_users_list_3.txt', 'VideoRemixVip2026');