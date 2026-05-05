import { createClient } from 'npm:@supabase/supabase-js@2';

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

import Stripe from 'npm:stripe@14.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};


  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's openai API key
  const userApiKey = await getUserApiKey(user_id, 'openai');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your openai API key in your profile.',
      provider: 'openai'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
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

    const {
      appId,
      appName,
      price,
      userId,
      userEmail,
      tier = 'single',
      allowGuestCheckout = false,
      purchaseType = 'single',
      isBundle = false
    } = await req.json();

    if (!appId || !appName || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For guest checkouts, userId might be null
    if (!allowGuestCheckout && !userId) {
      return new Response(
        JSON.stringify({ error: 'User authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle bundle purchases
    const isAllAppsBundle = appId === 'all-apps-bundle';
    const productDescription = isAllAppsBundle
      ? `Lifetime access to all ${appName.match(/\d+/)?.[0] || ''} AI agent apps`
      : `Lifetime access to ${appName}`;

    // Create or retrieve customer (only if we have user details)
    let customerId = null;
    if (userEmail && !isAllAppsBundle) {
      // For regular purchases, create customer for tracking
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId || 'guest',
          purchase_type: isAllAppsBundle ? 'bundle' : 'single',
          app_id: appId
        }
      });
      customerId = customer.id;
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: appName,
              description: productDescription,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment' as const,
      success_url: `${req.headers.get('origin')}/dashboard?purchase=success&app=${encodeURIComponent(appId)}`,
      cancel_url: `${req.headers.get('origin')}/tools?purchase=cancelled`,
      metadata: {
        appId,
        userId: userId || 'guest',
        appName,
        tier,
        purchaseType,
        isBundle: isBundle.toString(),
        allowGuestCheckout: allowGuestCheckout.toString(),
      },
      // Only set customer_email for non-bundle purchases to avoid conflicts
      ...(customerId && !isAllAppsBundle && { customer: customerId }),
      ...(userEmail && !customerId && { customer_email: userEmail }),
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
