#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Generate secure random password
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + 'Aa1!';
}

async function repairDatabaseInconsistencies() {
  console.log('🔧 Starting database repair...\n');

  const tenantId = await getDefaultTenantId();
  if (!tenantId) {
    console.error('❌ Cannot proceed without tenant ID');
    process.exit(1);
  }

  // 1. Get all auth users
  console.log('1️⃣ Fetching all auth users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message);
    return;
  }

  const authUsersMap = new Map();
  authUsers.users.forEach(user => {
    authUsersMap.set(user.id, user);
  });

  // 2. Get all profiles
  console.log('\n2️⃣ Fetching all profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, email, name');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    return;
  }

  const profilesMap = new Map();
  profiles.forEach(profile => {
    profilesMap.set(profile.user_id, profile);
  });

  // 3. Get all user roles
  console.log('\n3️⃣ Fetching all user roles...');
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.error('❌ Error fetching user roles:', rolesError.message);
    return;
  }

  const rolesMap = new Map();
  userRoles.forEach(role => {
    rolesMap.set(role.user_id, role);
  });

  let fixedProfiles = 0;
  let fixedRoles = 0;
  let fixedAuthUsers = 0;

  // 4. Fix auth users without profiles
  console.log('\n4️⃣ Creating missing profiles for auth users...');
  for (const [userId, user] of authUsersMap) {
    if (!profilesMap.has(userId)) {
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            user_id: userId,
            name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            email: user.email,
            tenant_id: tenantId,
            role: 'user'
          });

        if (insertError) {
          console.error(`❌ Failed to create profile for ${user.email}: ${insertError.message}`);
        } else {
          fixedProfiles++;
          console.log(`✅ Created profile for auth user: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating profile for ${user.email}: ${error.message}`);
      }
    }

    // Ensure role exists
    if (!rolesMap.has(userId)) {
      try {
        await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'user'
          });
        fixedRoles++;
      } catch (error) {
        console.error(`❌ Error creating role for ${user.email}: ${error.message}`);
      }
    }
  }

  // 5. Fix profiles without auth users
  console.log('\n5️⃣ Creating missing auth users for profiles...');
  for (const [profileUserId, profile] of profilesMap) {
    if (!authUsersMap.has(profileUserId)) {
      try {
        const password = generateRandomPassword();

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: profile.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: profile.name,
            created_via: 'database_repair'
          }
        });

        if (createError) {
          console.error(`❌ Failed to create auth user for profile ${profile.email}: ${createError.message}`);
        } else {
          fixedAuthUsers++;
          console.log(`✅ Created auth user for profile: ${profile.email}`);

          // Ensure role exists for new user
          if (!rolesMap.has(newUser.user.id)) {
            await supabase
              .from('user_roles')
              .insert({
                user_id: newUser.user.id,
                role: 'user'
              });
          }
        }
      } catch (error) {
        console.error(`❌ Error creating auth user for ${profile.email}: ${error.message}`);
      }
    }
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE REPAIR SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Profiles created for auth users: ${fixedProfiles}`);
  console.log(`✅ Auth users created for profiles: ${fixedAuthUsers}`);
  console.log(`✅ User roles assigned: ${fixedRoles}`);
  console.log(`🎯 Total fixes applied: ${fixedProfiles + fixedAuthUsers + fixedRoles}`);

  if (fixedProfiles + fixedAuthUsers + fixedRoles === 0) {
    console.log('\n✅ Database was already consistent!');
  } else {
    console.log('\n🔄 Database inconsistencies have been repaired.');
    console.log('   You can now run the comprehensive user import.');
  }

  console.log('\n' + '='.repeat(60));
}

repairDatabaseInconsistencies().catch(console.error);