import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Extract and validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Resolve authenticated caller
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { appId } = await req.json();

    // Reject client-supplied appId if empty
    if (!appId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: appId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Load app and price data from trusted backend catalog
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id, name, is_active, price, stripe_product_id, stripe_price_id')
      .eq('slug', appId)
      .eq('is_active', true)
      .maybeSingle();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: 'App not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use backend data exclusively
    const backendAppName = app.name;
    const backendPrice = app.price;
    const stripeProductId = app.stripe_product_id;
    const stripePriceId = app.stripe_price_id;

    if (!backendPrice || backendPrice <= 0) {
      return new Response(
        JSON.stringify({ error: 'App pricing not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Checkout Session
    let session;
    
    if (stripePriceId) {
      // Use existing Stripe Price ID if available
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/dashboard?purchase=success`,
        cancel_url: `${req.headers.get('origin')}/tools?purchase=cancelled`,
        customer_email: user.email,
        metadata: {
          appId,
          userId: user.id,
          appName: backendAppName,
        },
      });
    } else {
      // Fallback: Create price data inline (for apps without pre-created Stripe products)
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: backendAppName,
                description: `Lifetime access to ${backendAppName}`,
              },
              unit_amount: Math.round(backendPrice * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/dashboard?purchase=success`,
        cancel_url: `${req.headers.get('origin')}/tools?purchase=cancelled`,
        customer_email: user.email,
        metadata: {
          appId,
          userId: user.id,
          appName: backendAppName,
        },
      });
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
