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

    // Έλεγχος αν υπάρχει ενεργή συνδρομή της ίδιας υπηρεσίας
    logStep("Checking for existing active subscription");
    const { data: existingSubscription, error: existingSubError } = await supabaseClient
      .from('user_subscriptions')
      .select('*, subscription_types!inner(*)')
      .eq('user_id', appUser.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .single();

    let savedSubscription;
    
    if (existingSubscription && existingSubscription.subscription_types.name === subscriptionType.name) {
      // Ανανέωση υπάρχουσας συνδρομής της ίδιας υπηρεσίας
      logStep("Found existing subscription of same service, extending instead of creating new", {
        existingId: existingSubscription.id,
        currentEndDate: existingSubscription.end_date,
        newService: subscriptionType.name
      });
      
      const currentEndDate = new Date(existingSubscription.end_date);
      let newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + 1); // Ξεκινάμε από την επόμενη ημέρα
      
      if (subscriptionType.subscription_mode === 'time_based') {
        newEndDate.setMonth(newEndDate.getMonth() + (subscriptionType.duration_months || 1));
        newEndDate.setDate(newEndDate.getDate() - 1);
      } else if (subscriptionType.subscription_mode === 'visit_based') {
        newEndDate.setMonth(newEndDate.getMonth() + (subscriptionType.visit_expiry_months || 12));
        newEndDate.setDate(newEndDate.getDate() - 1);
      }

      const { data: updatedSubscription, error: updateError } = await supabaseClient
        .from('user_subscriptions')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        logStep("Subscription update error", updateError);
        throw new Error(`Failed to extend subscription: ${updateError.message}`);
      }
      
      savedSubscription = updatedSubscription;
      logStep("Subscription extended successfully", { 
        id: savedSubscription.id,
        newEndDate: savedSubscription.end_date 
      });
    } else {
      // Δημιουργία νέας συνδρομής (διαφορετική υπηρεσία ή καμία ενεργή)
      logStep("Creating new subscription", { 
        hasExisting: !!existingSubscription,
        existingService: existingSubscription?.subscription_types?.name,
        newService: subscriptionType.name
      });
      
      const startDate = new Date();
      let endDate = new Date(startDate);
      
      if (subscriptionType.subscription_mode === 'time_based') {
        endDate.setMonth(endDate.getMonth() + (subscriptionType.duration_months || 1));
        endDate.setDate(endDate.getDate() - 1);
      } else if (subscriptionType.subscription_mode === 'visit_based') {
        endDate.setMonth(endDate.getMonth() + (subscriptionType.visit_expiry_months || 12));
        endDate.setDate(endDate.getDate() - 1);
      }

      const subscriptionData = {
        user_id: appUser.id,
        subscription_type_id: subscription_type_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_id: savedPayment.id,
        status: 'active',
        is_paid: true
      };

      const { data: newSubscription, error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        logStep("Subscription insert error", subscriptionError);
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }
      
      savedSubscription = newSubscription;
      logStep("New subscription created successfully", savedSubscription);
    }

    // Ενημέρωση user status
    await supabaseClient
      .from('app_users')
      .update({ subscription_status: 'active' })
      .eq('id', appUser.id);

    // Αν είναι visit-based, δημιουργούμε visit package
    logStep("Checking if visit package should be created", {
      subscription_mode: subscriptionType.subscription_mode,
      visit_count: subscriptionType.visit_count,
      shouldCreate: subscriptionType.subscription_mode === 'visit_based' && subscriptionType.visit_count
    });
    
    if (subscriptionType.subscription_mode === 'visit_based' && subscriptionType.visit_count) {
      logStep("Processing visit package for visit-based subscription");
      
      // Έλεγχος αν υπάρχει ενεργό visit package
      const { data: existingVisitPackage, error: existingPackageError } = await supabaseClient
        .from('visit_packages')
        .select('*')
        .eq('user_id', appUser.id)
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: false })
        .limit(1)
        .single();

      if (existingVisitPackage && !existingPackageError) {
        // Επέκταση υπάρχοντος visit package
        logStep("Found existing visit package, extending it", {
          existingId: existingVisitPackage.id,
          currentExpiry: existingVisitPackage.expiry_date,
          visitsToAdd: subscriptionType.visit_count
        });
        
        const currentExpiryDate = new Date(existingVisitPackage.expiry_date);
        const newExpiryDate = new Date(currentExpiryDate);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + (subscriptionType.visit_expiry_months || 12));

        const { data: updatedVisitPackage, error: updatePackageError } = await supabaseClient
          .from('visit_packages')
          .update({
            total_visits: existingVisitPackage.total_visits + subscriptionType.visit_count,
            remaining_visits: existingVisitPackage.remaining_visits + subscriptionType.visit_count,
            expiry_date: newExpiryDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVisitPackage.id)
          .select()
          .single();

        if (updatePackageError) {
          logStep("Visit package update error", updatePackageError);
          throw new Error(`Failed to extend visit package: ${updatePackageError.message}`);
        }
        logStep("Visit package extended successfully", updatedVisitPackage);
      } else {
        // Δημιουργία νέου visit package
        logStep("Creating new visit package");
        
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
          allowed_sections: subscriptionType.allowed_sections,
          status: 'active'
        };
        
        logStep("Visit package data to insert", visitPackageData);

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
    } else {
      logStep("Visit package NOT created because conditions not met");
    }

    // Αν είναι videocall subscription, δημιουργούμε videocall package
    if (subscriptionType.name && subscriptionType.name.toLowerCase().includes('videocall')) {
      logStep("Creating videocall package for videocall subscription");
      
      // Υπολογισμός αριθμού βιντεοκλήσεων (μπορεί να είναι 1 για single ή περισσότερες για πακέτα)
      const videocallCount = subscriptionType.visit_count || 1;
      
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (subscriptionType.duration_months || 1));

      const videocallPackageData = {
        user_id: appUser.id,
        total_videocalls: videocallCount,
        remaining_videocalls: videocallCount,
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        price: finalAmount,
        payment_id: savedPayment.id,
        status: 'active'
      };

      const { data: savedVideocallPackage, error: videocallPackageError } = await supabaseClient
        .from('videocall_packages')
        .insert(videocallPackageData)
        .select()
        .single();

      if (videocallPackageError) {
        logStep("Videocall package insert error", videocallPackageError);
        // Δεν σταματάμε τη διαδικασία αν το videocall package αποτύχει
        logStep("Warning: Failed to create videocall package", videocallPackageError);
      } else {
      logStep("Videocall package created successfully", savedVideocallPackage);
      }
    }

    // Check if this is a coach_shop_only subscription (like HYPERsync) and activate coach profile
    if (subscriptionType.coach_shop_only) {
      logStep("Processing coach subscription activation for coach_shop_only product");
      
      // Check if user is a coach
      if (appUser.role === 'coach') {
        const subscriptionEndDate = savedSubscription?.end_date 
          ? new Date(savedSubscription.end_date) 
          : new Date(new Date().setMonth(new Date().getMonth() + (subscriptionType.duration_months || 12)));
        
        // Update coach_profiles to set is_active = true
        const { error: coachProfileError } = await supabaseClient
          .from('coach_profiles')
          .update({
            is_active: true,
            subscription_end_date: subscriptionEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('coach_id', appUser.id);

        if (coachProfileError) {
          logStep("Coach profile activation error", coachProfileError);
          // Don't throw, just log - the payment was still successful
        } else {
          logStep("Coach profile activated successfully", { 
            coach_id: appUser.id,
            subscription_end_date: subscriptionEndDate.toISOString()
          });
        }
      }
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