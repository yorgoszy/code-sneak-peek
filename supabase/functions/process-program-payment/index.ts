import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { addDays, nextDay, format, parseISO } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PROGRAM-PAYMENT] ${step}${detailsStr}`);
};

// Map day names to day of week (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

function generateTrainingDates(trainingDays: string[], programWeeks: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  let currentDate = today;
  
  // Sort days by their position in the week
  const sortedDays = trainingDays
    .map(day => ({ name: day.toLowerCase(), number: dayNameToNumber[day.toLowerCase()] }))
    .filter(d => d.number !== undefined)
    .sort((a, b) => a.number - b.number);

  if (sortedDays.length === 0) return dates;

  // Generate dates for each week
  for (let week = 0; week < programWeeks; week++) {
    for (const day of sortedDays) {
      // Find the next occurrence of this day
      let targetDate: Date;
      if (week === 0) {
        // For the first week, find the next occurrence from today
        const todayDayOfWeek = today.getDay();
        if (day.number >= todayDayOfWeek) {
          // This day is later this week
          targetDate = addDays(today, day.number - todayDayOfWeek);
        } else {
          // This day is next week
          targetDate = addDays(today, 7 - todayDayOfWeek + day.number);
        }
      } else {
        // For subsequent weeks, add 7 days from first week's occurrence
        const firstWeekDates = dates.filter((_, i) => i < sortedDays.length);
        const baseDate = parseISO(firstWeekDates[sortedDays.indexOf(day)]);
        targetDate = addDays(baseDate, week * 7);
      }
      
      dates.push(format(targetDate, 'yyyy-MM-dd'));
    }
  }

  return dates;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { session_id } = body;
    logStep("Request body parsed", { session_id });

    if (!session_id) {
      throw new Error("session_id is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { status: session.payment_status, metadata: session.metadata });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    if (!metadata || metadata.payment_type !== 'program_purchase') {
      throw new Error("Invalid payment type");
    }

    const userId = metadata.user_id;
    const programId = metadata.program_id;
    const trainingDays = JSON.parse(metadata.training_days || '[]');

    logStep("Processing program purchase", { userId, programId, trainingDays });

    // Check if already processed
    const { data: existingPurchase } = await supabaseAdmin
      .from('program_purchases')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingPurchase) {
      logStep("Purchase already processed", { purchaseId: existingPurchase.id });
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get program details
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('*, program_weeks(*, program_days(*, program_blocks(*, program_exercises(*))))')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found: ${programError?.message}`);
    }

    logStep("Program details fetched", { name: program.name, weeks: program.program_weeks?.length });

    // Calculate program duration in weeks
    const programWeeks = program.program_weeks?.length || 4;

    // Generate training dates based on selected days
    const trainingDatesList = generateTrainingDates(trainingDays, programWeeks);
    logStep("Generated training dates", { count: trainingDatesList.length, dates: trainingDatesList.slice(0, 5) });

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('program_purchases')
      .insert({
        user_id: userId,
        program_id: programId,
        coach_id: program.created_by,
        amount_paid: program.price,
        stripe_session_id: session_id,
        training_days: trainingDays,
        status: 'completed',
        purchased_at: new Date().toISOString()
      })
      .select()
      .single();

    if (purchaseError) {
      throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
    }

    logStep("Purchase record created", { purchaseId: purchase.id });

    // Create program assignment
    const startDate = trainingDatesList[0] || format(new Date(), 'yyyy-MM-dd');
    const endDate = trainingDatesList[trainingDatesList.length - 1] || format(addDays(new Date(), 30), 'yyyy-MM-dd');

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('program_assignments')
      .insert({
        user_id: userId,
        program_id: programId,
        coach_id: program.created_by,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        training_dates: trainingDatesList,
        notes: `Αγορά μέσω Shop - Ημέρες: ${trainingDays.join(', ')}`
      })
      .select()
      .single();

    if (assignmentError) {
      throw new Error(`Failed to create assignment: ${assignmentError.message}`);
    }

    logStep("Program assignment created", { assignmentId: assignment.id });

    return new Response(JSON.stringify({ 
      success: true, 
      purchaseId: purchase.id,
      assignmentId: assignment.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-program-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
