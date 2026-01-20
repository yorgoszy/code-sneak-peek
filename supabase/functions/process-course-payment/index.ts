import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COURSE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    logStep("Processing course payment", { session_id });

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved from Stripe", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status !== 'paid') {
      // Payment is not completed yet (e.g. user still in checkout). Return 200 so the client can poll safely.
      return new Response(JSON.stringify({
        success: false,
        pending: true,
        payment_status: session.payment_status,
        message: "Payment not completed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const metadata = session.metadata;
    const { user_id, course_id, amount } = metadata || {};
    logStep("Session metadata", metadata);

    if (!user_id || !course_id) {
      throw new Error("Missing required metadata (user_id or course_id)");
    }

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get app_users id from auth user id
    const { data: appUser, error: appUserError } = await supabaseService
      .from('app_users')
      .select('id, name, email')
      .eq('auth_user_id', user_id)
      .single();

    if (appUserError || !appUser) {
      logStep("App user not found", { error: appUserError });
      throw new Error('App user not found');
    }
    logStep("App user found", { appUserId: appUser.id, name: appUser.name });

    // Check if already purchased (prevent duplicates)
    const { data: existingPurchase } = await supabaseService
      .from('coach_course_purchases')
      .select('id')
      .eq('coach_id', appUser.id)
      .eq('course_id', course_id)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      logStep("Course already purchased", { existingPurchaseId: existingPurchase.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Course already purchased",
        alreadyOwned: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate amount (from cents to euros)
    const finalAmount = session.amount_total ? session.amount_total / 100 : parseFloat(amount || "0");

    // Create purchase record
    const { data: purchaseRecord, error: purchaseError } = await supabaseService
      .from('coach_course_purchases')
      .insert({
        coach_id: appUser.id,
        course_id: course_id,
        amount_paid: finalAmount,
        status: 'completed',
        purchase_date: new Date().toISOString()
      })
      .select()
      .single();

    if (purchaseError) {
      logStep("Error creating purchase record", { error: purchaseError });
      throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
    }

    logStep("Purchase record created", { purchaseId: purchaseRecord.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Course purchase completed",
      purchaseId: purchaseRecord.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error processing course payment", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
