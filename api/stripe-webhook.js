import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Verify webhook signature if webhook secret is configured
    if (webhookSecret && sig) {
      try {
        // Vercel provides req.body as raw string when needed
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
      }
    } else {
      // For development/testing without signature verification
      console.warn('⚠️  Webhook signature verification skipped - no STRIPE_WEBHOOK_SECRET configured');
      event = req.body;
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook failed' });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  
  console.log('Checkout completed for user:', userId);
  
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_pro: true,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      subscription_status: 'active'
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('✅ User upgraded to Pro:', userId);
  }
}

async function handleSubscriptionUpdated(subscription) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (data) {
    await supabase
      .from('profiles')
      .update({
        is_pro: subscription.status === 'active',
        subscription_status: subscription.status
      })
      .eq('id', data.id);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (data) {
    await supabase
      .from('profiles')
      .update({
        is_pro: false,
        subscription_status: 'cancelled'
      })
      .eq('id', data.id);
  }
}
