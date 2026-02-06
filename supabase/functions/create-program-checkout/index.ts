import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PROGRAM-CHECKOUT] ${step}${detailsStr}`);
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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

    // Get app_user id
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      throw new Error("App user not found");
    }
    logStep("App user found", { appUserId: appUser.id });

    const body = await req.json();
    const { program_id, training_dates } = body;
    logStep("Request body parsed", { program_id, training_dates });

    if (!program_id) {
      throw new Error("program_id is required");
    }

    if (!training_dates || !Array.isArray(training_dates) || training_dates.length === 0) {
      throw new Error("training_dates is required and must be a non-empty array");
    }

    // Get program details
    const { data: program, error: programError } = await supabaseClient
      .from('programs')
      .select('id, name, description, price, is_sellable, created_by')
      .eq('id', program_id)
      .eq('is_sellable', true)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found or not sellable: ${programError?.message}`);
    }

    if (!program.price || program.price <= 0) {
      throw new Error("Program has no valid price");
    }

    logStep("Program found", program);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const priceInCents = Math.round(program.price * 100);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: program.name,
              description: program.description || 'Πρόγραμμα προπόνησης'
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard/shop?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/shop?payment=cancelled`,
      metadata: {
        user_id: appUser.id,
        auth_user_id: user.id,
        program_id: program.id,
        training_dates: JSON.stringify(training_dates),
        payment_type: "program_purchase"
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-program-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
