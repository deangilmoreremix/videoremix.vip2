import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Streamlit checkout function loaded');

interface PurchaseData {
  appId: string;
  appName: string;
  tier: 'basic' | 'pro' | 'enterprise';
  price: number;
  userId: string;
  userEmail: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    });

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      throw new Error('User not authenticated');
    }

    const body: PurchaseData = await req.json();
    const {
      appId,
      appName,
      tier,
      price,
      userId,
      userEmail,
      metadata = {}
    } = body;

    // Validate required fields
    if (!appId || !appName || !tier || !price || !userId || !userEmail) {
      throw new Error('Missing required purchase data');
    }

    // Verify user owns this request
    if (data.user.id !== userId) {
      throw new Error('User ID mismatch');
    }

    // Get or create customer
    let customer;
    const { data: existingCustomers, error: customerError } = await supabaseClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomers?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomers.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
          app_id: appId,
          purchase_type: 'streamlit_app'
        }
      });

      // Save customer ID to database
      await supabaseClient
        .from('customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          email: userEmail
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${appName} - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Access`,
              description: `One-time purchase for Streamlit app: ${appName}`,
              images: [], // Add app screenshot URLs here if available
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('SITE_URL') ?? 'http://localhost:3000'}/streamlit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL') ?? 'http://localhost:3000'}/streamlit/cancelled`,
      metadata: {
        user_id: userId,
        app_id: appId,
        app_name: appName,
        tier,
        purchase_type: 'streamlit_app',
        ...metadata
      },
      allow_promotion_codes: true,
    });

    // Log the purchase attempt
    await supabaseClient
      .from('purchase_logs')
      .insert({
        user_id: userId,
        app_id: appId,
        purchase_type: 'streamlit_app',
        tier,
        amount: price,
        stripe_session_id: session.id,
        status: 'pending'
      });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating Streamlit checkout session:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});