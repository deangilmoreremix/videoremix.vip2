#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🚀 Starting subscription tracking setup...\n');

  // Check if tables exist
  const { error: checkError } = await supabase.from('subscription_status').select('id').limit(1);
  if (checkError) {
    console.error('❌ Error: subscription_status table does not exist!');
    console.error('   Please apply migrations first.');
    process.exit(1);
  }

  // Get all subscription purchases
  console.log('📖 Fetching subscription purchases...');
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('purchases')
    .select('*')
    .eq('is_subscription', true)
    .eq('status', 'completed')
    .not('user_id', 'is', null)
    .not('subscription_id', 'is', null);

  if (subscriptionsError) {
    console.error('❌ Error fetching subscriptions:', subscriptionsError.message);
    process.exit(1);
  }

  console.log(`   Found ${subscriptions.length} subscription payments\n`);

  // Group by user + subscription_id
  const subscriptionGroups = {};

  subscriptions.forEach(sub => {
    const key = `${sub.user_id}:${sub.subscription_id}`;

    if (!subscriptionGroups[key]) {
      subscriptionGroups[key] = {
        user_id: sub.user_id,
        subscription_id: sub.subscription_id,
        platform: sub.platform,
        payments: []
      };
    }

    subscriptionGroups[key].payments.push(sub);
  });

  console.log(`   Found ${Object.keys(subscriptionGroups).length} unique subscriptions\n`);

  console.log('🔐 Setting up subscription tracking...\n');

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const key in subscriptionGroups) {
    const { user_id, subscription_id, platform, payments } = subscriptionGroups[key];

    // Sort payments by date (most recent first)
    const sortedPayments = payments.sort((a, b) =>
      new Date(b.purchase_date) - new Date(a.purchase_date)
    );

    const lastPayment = sortedPayments[0];
    const lastPaymentDate = new Date(lastPayment.purchase_date);

    // Calculate period end (30 days from last payment)
    const periodEnd = new Date(lastPaymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Determine status
    const isExpired = periodEnd < new Date();
    const status = isExpired ? 'expired' : 'active';

    // Create subscription status record
    const subscriptionRecord = {
      user_id,
      purchase_id: lastPayment.id,
      platform,
      platform_subscription_id: subscription_id,
      status,
      current_period_start: lastPaymentDate.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false
    };

    // Try insert
    const { error } = await supabase
      .from('subscription_status')
      .insert(subscriptionRecord);

    if (error) {
      if (error.code === '23505') {
        // Duplicate - update instead
        const { error: updateError } = await supabase
          .from('subscription_status')
          .update({
            purchase_id: lastPayment.id,
            status,
            current_period_start: subscriptionRecord.current_period_start,
            current_period_end: subscriptionRecord.current_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('platform_subscription_id', subscription_id);

        if (updateError) {
          console.log(`   ❌ Error updating subscription: ${updateError.message}`);
          errors++;
        } else {
          updated++;
        }
      } else {
        console.log(`   ❌ Error creating subscription: ${error.message}`);
        errors++;
      }
    } else {
      created++;
    }

    if ((created + updated) % 5 === 0) {
      console.log(`   ✅ Processed ${created + updated} subscriptions...`);
    }
  }

  console.log('\n📊 Subscription Setup Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Show breakdown by status
  const { data: breakdown } = await supabase
    .from('subscription_status')
    .select('status');

  if (breakdown) {
    const active = breakdown.filter(s => s.status === 'active').length;
    const expired = breakdown.filter(s => s.status === 'expired').length;
    const cancelled = breakdown.filter(s => s.status === 'cancelled').length;

    console.log('\n📈 Subscription Status Breakdown:');
    console.log(`   Active: ${active}`);
    console.log(`   Expired: ${expired}`);
    console.log(`   Cancelled: ${cancelled}`);
  }

  console.log('\n✨ Subscription tracking setup complete!\n');

  // Check for expired subscriptions
  console.log('🔍 Checking for expired subscriptions...');

  const { data: expiredSubs } = await supabase
    .from('subscription_status')
    .select('user_id, current_period_end, status')
    .eq('status', 'expired');

  if (expiredSubs && expiredSubs.length > 0) {
    console.log(`   Found ${expiredSubs.length} expired subscriptions`);
    console.log('   These users will need to renew to regain access.\n');

    // Show sample
    const sample = expiredSubs.slice(0, 5);
    console.log('   Sample expired subscriptions:');
    for (const sub of sample) {
      const daysExpired = Math.floor((new Date() - new Date(sub.current_period_end)) / (1000 * 60 * 60 * 24));
      console.log(`     - User: ${sub.user_id.substring(0, 8)}... (expired ${daysExpired} days ago)`);
    }
  } else {
    console.log('   ✅ All subscriptions are active!');
  }

  console.log('\n✅ Setup complete! The system is now tracking subscription access.\n');
  console.log('💡 Tip: Webhooks will automatically update subscriptions when new payments arrive.\n');
}

main().catch(console.error);
