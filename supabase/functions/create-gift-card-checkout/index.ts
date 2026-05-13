import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftItem {
  subscription_type_id: string;
  subscription_type_name?: string;
  amount: number;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Optional auth — guests allowed
    let buyerUserId: string | null = null;
    let buyerEmailFromAuth: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          buyerUserId = userData.user.id;
          buyerEmailFromAuth = userData.user.email ?? null;
        }
      } catch (_) {
        // ignore — treat as guest
      }
    }

    const body = await req.json();
    const {
      items: itemsRaw,
      recipient_email,
      buyer_email,
      sender_name,
      recipient_name,
      subscription_type_id,
      subscription_type_name,
      amount,
    } = body || {};

    let items: GiftItem[] = Array.isArray(itemsRaw) ? itemsRaw : [];
    if (items.length === 0 && subscription_type_id && amount) {
      items = [{ subscription_type_id, subscription_type_name, amount, quantity: 1 }];
    }
    if (items.length === 0) throw new Error("No items provided");

    // Validate amounts server-side against subscription_types
    const ids = items.map((i) => i.subscription_type_id);
    const { data: types, error: typesErr } = await supabaseClient
      .from("subscription_types")
      .select("id, name, price, is_gift_card, is_active")
      .in("id", ids);
    if (typesErr) throw typesErr;

    const typeMap = new Map((types || []).map((t: any) => [t.id, t]));

    const lineItems = items.map((item) => {
      const t: any = typeMap.get(item.subscription_type_id);
      if (!t || !t.is_active || !t.is_gift_card) {
        throw new Error(`Invalid subscription type: ${item.subscription_type_id}`);
      }
      const qty = Math.max(1, Math.min(50, Number(item.quantity) || 1));
      const price = Number(t.price);
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Gift Card - ${t.name}`,
            description: `Δωροκάρτα HyperKids: ${t.name}`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: qty,
      };
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customerEmail = (buyer_email || buyerEmailFromAuth || "").trim() || undefined;

    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    }

    const origin = req.headers.get("origin") || "https://hyperkids.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/gift-card-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#gift-cards`,
      metadata: {
        type: "gift_card",
        buyer_user_id: buyerUserId || "",
        buyer_email: customerEmail || "",
        recipient_email: recipient_email || "",
        sender_name: sender_name || "",
        recipient_name: recipient_name || "",
      },
    });

    console.log("[GIFT-CARD-CHECKOUT] Session created:", session.id, "guest:", !buyerUserId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[GIFT-CARD-CHECKOUT] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
