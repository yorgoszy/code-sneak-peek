import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Χρήση anon key για authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Παρσάρισμα του request body
    const body = await req.json();
    const { subscription_type_id, discounted_price, offer_id } = body;
    logStep("Request body parsed", { subscription_type_id, discounted_price, offer_id });

    if (!subscription_type_id) {
      throw new Error("subscription_type_id is required");
    }

    // Αρχικοποίηση Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Έλεγχος αν υπάρχει ήδη Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Λήψη στοιχείων subscription type
    const { data: subscriptionType, error: subTypeError } = await supabaseClient
      .from('subscription_types')
      .select('*')
      .eq('id', subscription_type_id)
      .single();

    if (subTypeError || !subscriptionType) {
      throw new Error(`Subscription type not found: ${subTypeError?.message}`);
    }
    logStep("Subscription type found", subscriptionType);

    // Χρήση της τιμής προσφοράς αν υπάρχει, αλλιώς της κανονικής τιμής
    const finalPrice = discounted_price || subscriptionType.price;
    const priceInCents = Math.round(finalPrice * 100);
    logStep("Price calculated", { finalPrice, priceInCents });

    // Δημιουργία checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: subscriptionType.name,
              description: offer_id ? `Ειδική Προσφορά - ${subscriptionType.description || ''}` : subscriptionType.description
            },
            unit_amount: priceInCents,
            ...(subscriptionType.subscription_mode === 'time_based' && {
              recurring: { interval: "month", interval_count: subscriptionType.duration_months || 1 }
            })
          },
          quantity: 1,
        },
      ],
      mode: subscriptionType.subscription_mode === 'time_based' ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/offers`,
      metadata: {
        user_id: user.id,
        subscription_type_id,
        ...(offer_id && { offer_id })
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});