import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT-SUCCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Χρήση service role key για πλήρη πρόσβαση
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Παρσάρισμα του request body
    const body = await req.json();
    const { session_id } = body;
    logStep("Request body parsed", { session_id });

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Αρχικοποίηση Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Λήψη session από Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved from Stripe", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    const { user_id, subscription_type_id, offer_id } = metadata || {};
    logStep("Session metadata", metadata);

    if (!user_id || !subscription_type_id) {
      throw new Error("Missing required metadata");
    }

    // Βρίσκουμε τον χρήστη στην app_users
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      throw new Error('App user not found');
    }
    logStep("App user found", { appUserId: appUser.id });

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

    // Υπολογισμός τελικής τιμής (σε ευρώ, όχι cents)
    const finalAmount = session.amount_total ? session.amount_total / 100 : subscriptionType.price;
    logStep("Final amount calculated", { finalAmount });

    // Δημιουργία payment record
    const paymentData = {
      user_id: appUser.id,
      subscription_type_id: subscription_type_id,
      amount: finalAmount,
      payment_date: new Date().toISOString(),
      status: 'completed',
      payment_method: 'stripe',
      transaction_id: session.id,
      ...(session.customer_details?.email && { last_four: 'XXXX' }) // Placeholder for card info
    };

    const { data: savedPayment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      logStep("Payment insert error", paymentError);
      throw new Error(`Failed to save payment: ${paymentError.message}`);
    }
    logStep("Payment saved successfully", savedPayment);

    // Δημιουργία απόδειξης
    const receiptNumber = `RCP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
    
    const receiptData = {
      receipt_number: receiptNumber,
      customer_name: session.customer_details?.name || appUser.name || 'N/A',
      customer_email: session.customer_details?.email || user.email,
      items: [{
        description: offer_id ? `Ειδική Προσφορά - ${subscriptionType.name}` : subscriptionType.name,
        quantity: 1,
        unit_price: finalAmount,
        total: finalAmount
      }],
      subtotal: finalAmount,
      vat: finalAmount * 0.24, // 24% ΦΠΑ
      total: finalAmount,
      issue_date: new Date().toISOString().split('T')[0],
      payment_id: savedPayment.id,
      user_id: appUser.id
    };

    const { data: savedReceipt, error: receiptError } = await supabaseClient
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();

    if (receiptError) {
      logStep("Receipt insert error", receiptError);
      throw new Error(`Failed to save receipt: ${receiptError.message}`);
    }
    logStep("Receipt saved successfully", savedReceipt);

    // Αν υπάρχει offer_id, ενημερώνουμε την κατάσταση της προσφοράς
    if (offer_id) {
      // Καταχωρούμε ότι η προσφορά έχει γίνει αποδεκτή (αν δεν υπάρχει ήδη)
      const { error: rejectionError } = await supabaseClient
        .from('offer_rejections')
        .delete()
        .eq('user_id', appUser.id)
        .eq('offer_id', offer_id);

      logStep("Offer acceptance processed", { offer_id, removed_rejection: !rejectionError });
    }

    // Δημιουργία συνδρομής αν είναι time-based
    if (subscriptionType.subscription_mode === 'time_based') {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (subscriptionType.duration_months || 1));
      endDate.setDate(endDate.getDate() - 1); // Τελευταία ημέρα του μήνα

      const subscriptionData = {
        user_id: appUser.id,
        subscription_type_id: subscription_type_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_id: savedPayment.id,
        status: 'active',
        is_paid: true
      };

      const { data: savedSubscription, error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        logStep("Subscription insert error", subscriptionError);
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }
      logStep("Subscription created successfully", savedSubscription);

      // Ενημέρωση user status
      await supabaseClient
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', appUser.id);
    }

    // Αν είναι visit-based, δημιουργούμε visit package
    if (subscriptionType.subscription_mode === 'visit_based' && subscriptionType.visit_count) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (subscriptionType.visit_expiry_months || 12));

      const visitPackageData = {
        user_id: appUser.id,
        total_visits: subscriptionType.visit_count,
        remaining_visits: subscriptionType.visit_count,
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        price: finalAmount,
        payment_id: savedPayment.id,
        status: 'active'
      };

      const { data: savedVisitPackage, error: visitPackageError } = await supabaseClient
        .from('visit_packages')
        .insert(visitPackageData)
        .select()
        .single();

      if (visitPackageError) {
        logStep("Visit package insert error", visitPackageError);
        throw new Error(`Failed to create visit package: ${visitPackageError.message}`);
      }
      logStep("Visit package created successfully", savedVisitPackage);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payment_id: savedPayment.id,
      receipt_id: savedReceipt.id,
      receipt_number: receiptNumber 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payment-success", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});