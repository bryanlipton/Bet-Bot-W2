import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

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
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook failed' });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({
      is_pro: true,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      subscription_status: 'active'
    })
    .eq('id', userId);
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
