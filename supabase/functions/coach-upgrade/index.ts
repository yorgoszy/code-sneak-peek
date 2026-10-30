import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'npm:zod@3';
import { canAccessUpgrade, proratedUpgradeCents, upgradeQuote, verifiedUpgradePayment } from '../_shared/coachUpgrade.ts';

const schema = z.object({ action: z.enum(['quote', 'checkout', 'verify']), user_id: z.string().uuid().optional(), session_id: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(255).optional() });
const allowedOrigins = new Set(['https://hyperkids.lovable.app', 'https://thaihub.gr', 'https://www.thaihub.gr', 'https://hyperkids.gr', 'https://www.hyperkids.gr', 'http://localhost:8080', 'https://id-preview--caecd137-de8c-4f15-9ad7-4eeb588073c6.lovable.app']);

Deno.serve(async (req) => {
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return reply({ error: 'Απαιτείται σύνδεση.' }, 401);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!url || !anon || !service || !key) return reply({ error: 'Η σύνδεση πληρωμών δεν είναι διαθέσιμη.' }, 503);
    const client = createClient(url, anon, { auth: { persistSession: false } });
    const { data: identity, error: authError } = await client.auth.getUser(auth.slice(7));
    if (authError || !identity.user) return reply({ error: 'Απαιτείται σύνδεση.' }, 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: 'Μη έγκυρο αίτημα.' }, 400);
    const db = createClient(url, service, { auth: { persistSession: false } });
    const { data: actor, error: actorError } = await db.from('app_users').select('id, role').eq('auth_user_id', identity.user.id).single();
    if (actorError || !actor) return reply({ error: 'Ο λογαριασμός δεν βρέθηκε.' }, 403);
    const targetId = parsed.data.user_id ?? actor.id;
    const { data: adminRole, error: roleError } = await db.from('user_roles').select('id').eq('user_id', identity.user.id).eq('role', 'admin').maybeSingle();
    if (!canAccessUpgrade(actor.id, targetId, !roleError && Boolean(adminRole))) return reply({ error: 'Δεν επιτρέπεται η αναβάθμιση άλλου λογαριασμού.' }, 403);
    const { data: owner, error: ownerError } = await db.from('app_users').select('id, role').eq('id', targetId).single();
    if (ownerError || !owner) return reply({ error: 'Ο λογαριασμός Club δεν βρέθηκε.' }, 404);
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

    const settle = async (order: any, session: Stripe.Checkout.Session) => {
      if (!verifiedUpgradePayment(session, order)) return false;
      const { error } = await db.rpc('complete_thaihub_upgrade', { p_order_id: order.id, p_session_id: session.id, p_amount: session.amount_total, p_currency: session.currency });
      if (error) throw new Error('Η πληρωμή καταγράφηκε αλλά η αναβάθμιση χρειάζεται έλεγχο. Μην πληρώσεις ξανά.');
      return true;
    };

    if (parsed.data.action === 'verify') {
      if (!parsed.data.session_id) return reply({ error: 'Λείπει η πληρωμή.' }, 400);
      const { data: order, error } = await db.from('thaihub_upgrade_orders').select('*').eq('user_id', owner.id).eq('stripe_session_id', parsed.data.session_id).single();
      if (error || !order) return reply({ error: 'Η πληρωμή δεν ανήκει στον λογαριασμό σου.' }, 403);
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      return reply({ upgraded: await settle(order, session) });
    }
    if (owner.role !== 'club') return reply({ error: 'Η αναβάθμιση γίνεται από τον ίδιο τον λογαριασμό Club.' }, 403);
    const origin = req.headers.get('origin') ?? 'https://hyperkids.lovable.app';
    if (!allowedOrigins.has(origin)) return reply({ error: 'Μη επιτρεπόμενη σελίδα πληρωμής.' }, 403);
    // This is the existing HYPERsync type explicitly confirmed as the Club entitlement.
    const { data: subs, error: subError } = await db.from('user_subscriptions').select('id,start_date,end_date,is_paused').eq('user_id', owner.id).eq('subscription_type_id', '9c46ca26-9837-4eb8-8ced-11e25ecf8388').eq('status', 'active').gte('end_date', new Date().toISOString().slice(0, 10));
    if (subError || subs?.length !== 1 || subs[0].is_paused) return reply({ error: 'Δεν βρέθηκε μία ενεργή συνδρομή Club για αναβάθμιση.' }, 409);
    const sub = subs[0];
    let { data: order } = await db.from('thaihub_upgrade_orders').select('*').eq('subscription_id', sub.id).in('status', ['pending','paid']).maybeSingle();
    if (parsed.data.action === 'quote') {
      const details = upgradeQuote(sub.start_date, sub.end_date);
      let amount = details.amountCents;
      if (order?.stripe_session_id) {
        const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        if (existing.status === 'open') amount = order.amount_cents;
        else if (existing.status === 'complete') return reply({ error: 'Υπάρχει πληρωμή υπό επιβεβαίωση. Μην πληρώσεις ξανά.' }, 409);
      } else if (order) amount = order.amount_cents;
      return reply({ amount_cents: amount, currency: 'eur', remaining_days: details.remainingDays, months: details.months, end_date: sub.end_date, coach_yearly_cents: details.coachYearlyCents });
    }
    if (order?.stripe_session_id) {
      const old = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (await settle(order, old)) return reply({ upgraded: true });
      if (old.status === 'open') return reply({ url: old.url });
      if (old.status !== 'expired') return reply({ error: 'Η πληρωμή είναι υπό έλεγχο. Μην πληρώσεις ξανά.' }, 409);
      const { error } = await db.from('thaihub_upgrade_orders').update({ status: 'expired' }).eq('id', order.id).eq('status','pending');
      if (error) throw new Error('Δεν ήταν δυνατή η ενημέρωση της πληρωμής.');
      order = null;
    }
    if (!order) {
      const { data: created, error } = await db.from('thaihub_upgrade_orders').insert({ user_id: owner.id, subscription_id: sub.id, amount_cents: proratedUpgradeCents(sub.start_date, sub.end_date), source_start: sub.start_date, source_end: sub.end_date }).select('*').single();
      if (error) return reply({ error: 'Υπάρχει ήδη αίτημα πληρωμής. Δοκίμασε ξανά.' }, 409);
      order = created;
    }
    const session = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: identity.user.email, client_reference_id: order.id, line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: order.amount_cents, product_data: { name: 'ThaiHub — Upgrade to Coach' } } }], metadata: { upgrade_order_id: order.id, app_user_id: owner.id }, success_url: `${origin}/dashboard/coach-overview?coachId=${owner.id}&upgrade_session={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/dashboard/coach-overview?coachId=${owner.id}`, expires_at: Math.floor(new Date(order.created_at).getTime()/1000) + 3600 }, { idempotencyKey: `thaihub-upgrade-${order.id}` });
    const { error: saveError } = await db.from('thaihub_upgrade_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saveError) throw new Error('Δεν ήταν δυνατή η αποθήκευση της πληρωμής.');
    return reply({ url: session.url });
  } catch (error) {
    // Never log credentials, session URLs or personal information.
    const message = error instanceof Error && !('type' in error) ? error.message : 'Το Stripe δεν ολοκλήρωσε το αίτημα πληρωμής.';
    return reply({ error: message }, 400);
  }
});