#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔐 Testing Password Reset Email for Admin Users\n');

const testEmail = 'dean@smartcrm.vip';

async function testPasswordResetEmail() {
  try {
    console.log(`📧 Sending password reset email to: ${testEmail}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'https://videoremix.vip/reset-password',
    });

    if (error) {
      console.log('❌ Error sending password reset:', error.message);
      console.log('   Details:', error);
      
      // Common issues
      console.log('\n🔍 Common Issues:');
      console.log('   1. Email provider not configured in Supabase');
      console.log('   2. Send Email Hook not enabled');
      console.log('   3. SMTP settings incorrect');
      console.log('   4. Email rate limiting enabled');
      
      return;
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('   Please check the email inbox (and spam folder)');
    console.log(`   Expected recipient: ${testEmail}\n`);

    console.log('📬 What to check:');
    console.log('   1. Check inbox for email from Supabase/VideoRemix');
    console.log('   2. Check spam/junk folder');
    console.log('   3. Wait 1-2 minutes for delivery');
    console.log('   4. Check Supabase logs for errors\n');

    // Also check if we can see the edge function logs
    console.log('🔧 To view Edge Function logs:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions/send-email-hook/logs');
    console.log('   2. Look for recent invocations');
    console.log('   3. Check for any error messages\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testPasswordResetEmail();
