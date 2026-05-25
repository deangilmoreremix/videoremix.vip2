import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const createCustomer = async (email: string, name?: string, metadata?: Record<string, any>) => {
  return await stripe.customers.create({
    email,
    name,
    metadata: metadata || {}
  });
};

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, any>
) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata: metadata || {}
  });
};

export const createSubscription = async (
  customerId: string,
  priceId: string,
  metadata?: Record<string, any>
) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: metadata || {}
  });
};

export const listPrices = async (active: boolean = true, limit: number = 20) => {
  return await stripe.prices.list({
    active,
    limit
  });
};