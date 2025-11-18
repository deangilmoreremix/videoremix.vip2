import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const STRIPE_API_URL = 'https://api.stripe.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userRole || userRole.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'start';

    if (action === 'start') {
      return await startSync(supabase, user.id);
    } else if (action === 'status') {
      const jobId = url.searchParams.get('job_id');
      return await getSyncStatus(supabase, jobId);
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function startSync(supabase: any, adminUserId: string) {
  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .insert({
      job_type: 'stripe_customers',
      status: 'running',
      started_by: adminUserId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError) {
    return new Response(JSON.stringify({ error: 'Failed to create sync job' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  syncStripeCustomers(supabase, job.id).catch(console.error);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Sync started',
      job_id: job.id,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function syncStripeCustomers(supabase: any, jobId: string) {
  let hasMore = true;
  let startingAfter: string | undefined;
  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const errors: any[] = [];

  try {
    while (hasMore) {
      const params = new URLSearchParams({
        limit: '100',
        expand: ['data.subscriptions', 'data.invoice_settings'],
      });

      if (startingAfter) {
        params.append('starting_after', startingAfter);
      }

      const response = await fetch(`${STRIPE_API_URL}/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const data = await response.json();
      const customers = data.data;
      hasMore = data.has_more;

      if (customers.length > 0) {
        startingAfter = customers[customers.length - 1].id;
      }

      for (const customer of customers) {
        try {
          await processStripeCustomer(supabase, customer);
          totalSuccessful++;
        } catch (error) {
          totalFailed++;
          errors.push({
            customer_id: customer.id,
            email: customer.email,
            error: error.message,
          });
          console.error(`Failed to process customer ${customer.id}:`, error);
        }
        totalProcessed++;

        if (totalProcessed % 10 === 0) {
          await supabase
            .from('sync_jobs')
            .update({
              processed_records: totalProcessed,
              successful_records: totalSuccessful,
              failed_records: totalFailed,
              error_log: errors,
            })
            .eq('id', jobId);
        }
      }
    }

    await supabase
      .from('sync_jobs')
      .update({
        status: 'completed',
        total_records: totalProcessed,
        processed_records: totalProcessed,
        successful_records: totalSuccessful,
        failed_records: totalFailed,
        error_log: errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

  } catch (error) {
    console.error('Sync job failed:', error);
    await supabase
      .from('sync_jobs')
      .update({
        status: 'failed',
        total_records: totalProcessed,
        processed_records: totalProcessed,
        successful_records: totalSuccessful,
        failed_records: totalFailed,
        error_log: [...errors, { error: error.message }],
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

async function processStripeCustomer(supabase: any, customer: any) {
  if (!customer.email) {
    console.log(`Skipping customer ${customer.id} - no email`);
    return;
  }

  const email = customer.email.toLowerCase().trim();
  let userId: string | null = null;

  const { data: existingProfile } = await supabase
    .from('admin_profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.user_id;
  } else {
    const tempPassword = generateSecurePassword();
    const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        created_via: 'stripe_sync',
        stripe_customer_id: customer.id,
      },
    });

    if (signUpError || !newUser.user) {
      console.error('Failed to create user:', signUpError);
      throw new Error(`Failed to create user: ${signUpError?.message}`);
    }

    userId = newUser.user.id;
  }

  const charges = await fetchStripeCharges(customer.id);

  for (const charge of charges) {
    if (charge.status !== 'succeeded' || charge.refunded) continue;

    const existingPurchase = await supabase
      .from('purchases')
      .select('id')
      .eq('platform_transaction_id', charge.id)
      .maybeSingle();

    if (existingPurchase.data) continue;

    const productName = charge.description ||
                       charge.metadata?.product_name ||
                       'Stripe Purchase';

    await supabase.from('purchases').insert({
      user_id: userId,
      email: email,
      platform: 'stripe',
      platform_transaction_id: charge.id,
      platform_customer_id: customer.id,
      stripe_customer_id: customer.id,
      stripe_payment_intent_id: charge.payment_intent,
      product_name: productName,
      product_sku: charge.metadata?.sku,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: 'completed',
      is_subscription: false,
      purchase_date: new Date(charge.created * 1000).toISOString(),
      synced_from_stripe: true,
      processed: false,
      webhook_data: { charge },
    });
  }

  if (customer.subscriptions?.data) {
    for (const subscription of customer.subscriptions.data) {
      const existingSub = await supabase
        .from('subscription_status')
        .select('id')
        .eq('platform_subscription_id', subscription.id)
        .maybeSingle();

      if (existingSub.data) continue;

      const productName = subscription.items?.data?.[0]?.price?.product?.name ||
                         subscription.metadata?.product_name ||
                         'Subscription';

      const purchaseRecord = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          email: email,
          platform: 'stripe',
          platform_transaction_id: subscription.latest_invoice || subscription.id,
          platform_customer_id: customer.id,
          stripe_customer_id: customer.id,
          subscription_id: subscription.id,
          product_name: productName,
          amount: (subscription.items?.data?.[0]?.price?.unit_amount || 0) / 100,
          currency: (subscription.currency || 'usd').toUpperCase(),
          status: subscription.status === 'active' ? 'completed' : 'pending',
          is_subscription: true,
          purchase_date: new Date(subscription.created * 1000).toISOString(),
          synced_from_stripe: true,
          processed: false,
          webhook_data: { subscription },
        })
        .select()
        .single();

      if (purchaseRecord.data) {
        await supabase.from('subscription_status').insert({
          user_id: userId,
          purchase_id: purchaseRecord.data.id,
          platform: 'stripe',
          platform_subscription_id: subscription.id,
          status: subscription.status === 'active' ? 'active' : subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        });
      }
    }
  }
}

async function fetchStripeCharges(customerId: string) {
  const response = await fetch(
    `${STRIPE_API_URL}/charges?customer=${customerId}&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch charges: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function getSyncStatus(supabase: any, jobId: string | null) {
  if (!jobId) {
    const { data: jobs } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('job_type', 'stripe_customers')
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({ success: true, jobs }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: job } = await supabase
    .from('sync_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  return new Response(JSON.stringify({ success: true, job }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}
