import { Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed!', session.id);

      // Extract metadata
      const { appId, userId, appName, tier, purchaseType, isBundle } = session.metadata || {};
      const amount = session.amount_total / 100; // Convert from cents

      try {
        // Record the purchase
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: userId === 'guest' ? null : userId,
            email: session.customer_details?.email || '',
            platform: 'stripe',
            platform_transaction_id: session.payment_intent as string,
            platform_customer_id: session.customer as string,
            product_id: appId,
            product_name: appName,
            amount: amount,
            currency: session.currency,
            status: 'completed',
            purchase_date: new Date().toISOString(),
            is_subscription: false,
            metadata: {
              tier,
              purchaseType,
              isBundle: isBundle === 'true',
              sessionId: session.id
            }
          })
          .select()
          .single();

        if (purchaseError) {
          console.error('Error recording purchase:', purchaseError);
        } else {
          console.log('Purchase recorded:', purchase.id);

          // Grant access based on purchase type
          if (isBundle === 'true' || appId === 'all-apps-bundle') {
            // Grant access to all LLM agent apps
            const { CONVERTED_LLM_AGENT_APPS } = await import('../utils/appBundling');

            const accessRecords = CONVERTED_LLM_AGENT_APPS.map(appSlug => ({
              user_id: userId === 'guest' ? null : userId,
              app_slug: appSlug,
              purchase_id: purchase.id,
              access_type: 'lifetime' as const,
              granted_at: new Date().toISOString(),
              is_active: true
            }));

            const { error: accessError } = await supabase
              .from('user_app_access')
              .insert(accessRecords);

            if (accessError) {
              console.error('Error granting bundle access:', accessError);
            } else {
              console.log(`Granted bundle access to ${CONVERTED_LLM_AGENT_APPS.length} apps`);
            }
          } else {
            // Grant access to single app
            const { error: accessError } = await supabase
              .from('user_app_access')
              .insert({
                user_id: userId === 'guest' ? null : userId,
                app_slug: appId,
                purchase_id: purchase.id,
                access_type: 'lifetime',
                granted_at: new Date().toISOString(),
                is_active: true
              });

            if (accessError) {
              console.error('Error granting single app access:', accessError);
            } else {
              console.log(`Granted access to ${appId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing checkout completion:', error);
      }

      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);

      // Update your database here
      await supabase
        .from('payments')
        .insert({
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'completed'
        });

      break;

    case 'customer.created':
      const customer = event.data.object;
      console.log('Customer was created!', customer.id);

      await supabase
        .from('customers')
        .insert({
          stripe_customer_id: customer.id,
          email: customer.email,
          name: customer.name
        });

      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Invoice payment succeeded!', invoice.id);

      // Handle subscription payments
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}