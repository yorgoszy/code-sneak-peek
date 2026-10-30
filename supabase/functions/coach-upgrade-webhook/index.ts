import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { verifiedUpgradePayment } from '../_shared/coachUpgrade.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  const secret = Deno.env.get('STRIPE_COACH_UPGRADE_WEBHOOK_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const signature = req.headers.get('stripe-signature');
  if (!key || !secret || !url || !service) return new Response('Not configured', { status: 503 });
  if (!signature) return new Response('Signature required', { status: 400 });
  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return new Response('ok');
  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.metadata?.upgrade_order_id) return new Response('ok');
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: order, error } = await db.from('thaihub_upgrade_orders').select('*').eq('id', session.metadata.upgrade_order_id).eq('stripe_session_id', session.id).single();
  if (error || !order) return new Response('Order not ready', { status: 500 });
  if (!verifiedUpgradePayment(session, order)) return new Response('Payment not settled', { status: 400 });
  const { error: conversionError } = await db.rpc('complete_thaihub_upgrade', { p_order_id: order.id, p_session_id: session.id, p_amount: session.amount_total, p_currency: session.currency });
  return new Response(conversionError ? 'Activation pending' : 'ok', { status: conversionError ? 500 : 200 });
});