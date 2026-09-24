import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_APP_ID = 'videoremixvip';

serve(async (req: Request) => {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      schema: 'credits',
    });
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { product_id, user_id } = await req.json();

    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'Missing product_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Look up credit product within this app
    const { data: product, error: productError } = await supabase
      .from('credit_products')
      .select('*')
      .eq('id', product_id)
      .eq('app_id', DEFAULT_APP_ID)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Credit product not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price_usd,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/credits?success=true`,
      cancel_url: `${origin}/credits?cancelled=true`,
      metadata: {
        product_id: product.id,
        product_type: 'credits',
        app_id: DEFAULT_APP_ID,
        credits_amount: String(product.credits_amount),
        ...(user_id ? { userId: user_id } : {}),
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating credit checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
