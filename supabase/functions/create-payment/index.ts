import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = "eur", productName, subscriptionTypeId, isCoachShop } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    console.log("📦 Create payment request:", { amount, productName, subscriptionTypeId, isCoachShop });

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Determine success/cancel URLs based on shop type
    const successPath = isCoachShop ? '/dashboard/coach-shop' : '/dashboard/shop';
    const cancelPath = isCoachShop ? '/dashboard/coach-shop' : '/dashboard/shop';

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: { name: productName || "Αγορά από το Γυμναστήριο" },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}${successPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}${cancelPath}?payment=cancelled`,
      metadata: {
        user_id: user.id,
        amount: amount.toString(),
        product_name: productName || "Αγορά Πακέτου",
        subscription_type_id: subscriptionTypeId || "",
        is_coach_shop: isCoachShop ? "true" : "false"
      }
    });

    // Create payment and receipt records using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get app_users id
    const { data: appUser } = await supabaseService
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUser) {
      // Create payment record
      await supabaseService.from("payments").insert({
        user_id: appUser.id,
        amount: amount,
        transaction_id: session.id,
        status: "pending",
        payment_method: "stripe",
        created_at: new Date().toISOString()
      });

      // Create receipt record
      await supabaseService.from("receipts").insert({
        user_id: appUser.id,
        amount: amount,
        payment_method: "stripe",
        issued_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});