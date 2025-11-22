#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking Supabase Email Configuration...\n');

async function checkEmailConfig() {
  try {
    console.log('📊 Project Information:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Project ID: ${supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1]}\n`);

    // Check if send-email-hook function exists
    console.log('🔧 Checking Edge Functions:');
    console.log('   Expected function: send-email-hook');
    console.log(`   Function URL: ${supabaseUrl}/functions/v1/send-email-hook\n`);

    // Try to invoke the function with a test payload
    console.log('🧪 Testing send-email-hook function...');
    const testPayload = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      },
      email_data: {
        token: 'test-token',
        token_hash: 'test-hash',
        redirect_to: 'https://videoremix.vip',
        email_action_type: 'signup',
        site_url: 'https://videoremix.vip'
      }
    };

    const { data, error } = await supabase.functions.invoke('send-email-hook', {
      body: testPayload
    });

    if (error) {
      console.log('   ⚠️  Function error:', error.message);
      console.log('   This might be expected if the function requires auth or specific headers\n');
    } else {
      console.log('   ✅ Function responded:', data);
    }

    // Check admin users
    console.log('\n👥 Checking Admin Users:');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('   ❌ Error fetching users:', usersError.message);
    } else {
      const adminEmails = ['dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip'];
      console.log(`   Total users: ${users.users.length}`);
      
      adminEmails.forEach(email => {
        const user = users.users.find(u => u.email === email);
        if (user) {
          console.log(`   ✅ ${email}:`);
          console.log(`      - ID: ${user.id}`);
          console.log(`      - Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
          console.log(`      - Created: ${new Date(user.created_at).toLocaleString()}`);
          console.log(`      - Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
        } else {
          console.log(`   ❌ ${email}: Not found`);
        }
      });
    }

    // Recommendations
    console.log('\n📋 Email Configuration Checklist:');
    console.log('   □ Enable Email Auth Hook in Supabase Dashboard:');
    console.log('     1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/auth/hooks');
    console.log('     2. Enable "Send Email" hook');
    console.log(`     3. Set URL: ${supabaseUrl}/functions/v1/send-email-hook`);
    console.log('     4. Click Save\n');

    console.log('   □ Configure SMTP Settings (if not using Supabase default):');
    console.log('     1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/settings/auth');
    console.log('     2. Scroll to "SMTP Settings"');
    console.log('     3. Configure your email provider (SendGrid, Mailgun, etc.)\n');

    console.log('   □ Verify Email Templates:');
    console.log('     1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/auth/templates');
    console.log('     2. Check all email templates are configured\n');

    console.log('   □ Test Email Delivery:');
    console.log('     1. Try password reset for a test user');
    console.log('     2. Check spam folder');
    console.log('     3. Verify email arrives within 1-2 minutes\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

checkEmailConfig();
