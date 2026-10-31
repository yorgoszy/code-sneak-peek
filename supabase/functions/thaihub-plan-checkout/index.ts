import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'npm:zod@3';
import { planPriceCents, verifiedPlanPayment } from '../_shared/thaihubPlan.ts';

const schema = z.object({ action: z.enum(['checkout', 'verify']), plan: z.enum(['club', 'coach', 'federation']).optional(), session_id: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(255).optional() });
const allowedOrigins = new Set(['https://hyperkids.lovable.app', 'https://thaihub.gr', 'https://www.thaihub.gr', 'https://hyperkids.gr', 'https://www.hyperkids.gr', 'http://localhost:8080']);
const planNames = { club: 'Club', coach: 'Coach', federation: 'Federation' } as const;

Deno.serve(async (req) => {
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return reply({ error: 'Απαιτείται σύνδεση.' }, 401);
  try {
    const url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!url || !anon || !service || !key) return reply({ error: 'Η σύνδεση πληρωμών δεν είναι διαθέσιμη.' }, 503);
    const { data: identity, error: authError } = await createClient(url, anon, { auth: { persistSession: false } }).auth.getUser(auth.slice(7));
    if (authError || !identity.user) return reply({ error: 'Απαιτείται σύνδεση.' }, 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: 'Μη έγκυρο αίτημα.' }, 400);
    const db = createClient(url, service, { auth: { persistSession: false } });
    const { data: owner } = await db.from('app_users').select('id, role').eq('auth_user_id', identity.user.id).maybeSingle();
    if (!owner) return reply({ error: 'Ο λογαριασμός δεν βρέθηκε.' }, 403);
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

    const settle = async (order: any, session: Stripe.Checkout.Session) => {
      if (!verifiedPlanPayment(session, order)) return false;
      const { error } = await db.rpc('complete_thaihub_plan_purchase', { p_order_id: order.id, p_session_id: session.id, p_amount: session.amount_total, p_currency: session.currency });
      if (error) throw new Error('Η πληρωμή καταγράφηκε αλλά η ενεργοποίηση χρειάζεται έλεγχο. Μην πληρώσεις ξανά.');
      return true;
    };

    if (parsed.data.action === 'verify') {
      if (!parsed.data.session_id) return reply({ error: 'Λείπει η πληρωμή.' }, 400);
      const { data: order } = await db.from('thaihub_plan_orders').select('*').eq('user_id', owner.id).eq('stripe_session_id', parsed.data.session_id).maybeSingle();
      if (!order) return reply({ error: 'Η πληρωμή δεν ανήκει στον λογαριασμό σου.' }, 403);
      return reply({ activated: await settle(order, await stripe.checkout.sessions.retrieve(order.stripe_session_id)), plan: order.plan });
    }

    const plan = parsed.data.plan;
    if (!plan) return reply({ error: 'Επίλεξε πακέτο.' }, 400);
    if (owner.role !== 'general') return reply({ error: 'Ο λογαριασμός σου έχει ήδη πακέτο. Συνδέσου στον πίνακα ελέγχου.' }, 409);
    const origin = req.headers.get('origin') ?? '';
    const preview = /^https:\/\/[a-z0-9.-]*caecd137-de8c-4f15-9ad7-4eeb588073c6[a-z0-9.-]*\.(lovable\.app|lovableproject\.com|lovable\.dev)$/.test(origin);
    const base = allowedOrigins.has(origin) || preview ? origin : 'https://www.thaihub.gr';

    const { data: open } = await db.from('thaihub_plan_orders').select('*').eq('user_id', owner.id).eq('status', 'pending').maybeSingle();
    if (open?.stripe_session_id) {
      const old = await stripe.checkout.sessions.retrieve(open.stripe_session_id);
      if (await settle(open, old)) return reply({ activated: true, plan: open.plan });
      if (old.status === 'open' && open.plan === plan) return reply({ url: old.url });
      if (old.status === 'open') await stripe.checkout.sessions.expire(old.id);
      else if (old.status !== 'expired') return reply({ error: 'Η πληρωμή είναι υπό έλεγχο. Μην πληρώσεις ξανά.' }, 409);
    }
    if (open) await db.from('thaihub_plan_orders').update({ status: 'expired' }).eq('id', open.id).eq('status', 'pending');

    const { data: priceType } = await db.from('subscription_types').select('price').eq('assigned_role', plan).eq('is_active', true).is('coach_id', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const dbCents = Math.round(Number(priceType?.price) * 100);
    const amountCents = Number.isFinite(dbCents) && dbCents > 0 ? dbCents : planPriceCents[plan];
    const { data: order, error } = await db.from('thaihub_plan_orders').insert({ user_id: owner.id, plan, amount_cents: amountCents }).select('*').single();
    if (error || !order) return reply({ error: 'Υπάρχει ήδη αίτημα πληρωμής. Δοκίμασε ξανά.' }, 409);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: identity.user.email, client_reference_id: order.id,
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: order.amount_cents, product_data: { name: `ThaiHub ${planNames[plan]} — 1 έτος` } } }],
      metadata: { plan_order_id: order.id, app_user_id: owner.id, plan },
      success_url: `${base}/thaihub?plan_session={CHECKOUT_SESSION_ID}`, cancel_url: `${base}/thaihub#purchase`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }, { idempotencyKey: `thaihub-plan-${order.id}` });
    const { error: saveError } = await db.from('thaihub_plan_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saveError) throw new Error('Δεν ήταν δυνατή η αποθήκευση της πληρωμής.');
    return reply({ url: session.url });
  } catch (error) {
    const message = error instanceof Error && !('type' in error) ? error.message : 'Το Stripe δεν ολοκλήρωσε το αίτημα πληρωμής.';
    return reply({ error: message }, 400);
  }
});
