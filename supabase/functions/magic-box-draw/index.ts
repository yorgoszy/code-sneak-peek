import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's app_user record
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      throw new Error('User profile not found');
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      throw new Error('Campaign ID is required');
    }

    // Get campaign and verify it's active
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('magic_box_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('is_active', true)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or inactive');
    }

    // Check if campaign is within date range
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (now < startDate || (endDate && now > endDate)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Η εκστρατεία δεν είναι ενεργή αυτή τη στιγμή!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check if user already participated in this campaign
    const { data: existingParticipation, error: participationError } = await supabaseClient
      .from('user_campaign_participations')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('campaign_id', campaign_id)
      .maybeSingle();

    if (participationError) {
      console.error('Error checking existing participations:', participationError);
      throw new Error('Error checking existing participations');
    }

    if (existingParticipation) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Έχεις ήδη συμμετάσχει σε αυτή την εκστρατεία!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`✅ User ${appUser.id} can participate in campaign ${campaign_id}`);

    // Get all available prizes for this campaign from magic_box_subscription_prizes
    const { data: prizes, error: prizesError } = await supabaseClient
      .from('magic_box_subscription_prizes')
      .select(`
        *,
        subscription_types (
          id,
          name,
          description,
          duration_months
        )
      `)
      .eq('magic_box_id', campaign_id)
      .gt('quantity', 0);

    console.log(`🎁 Found ${prizes?.length || 0} available prizes for campaign ${campaign_id}`);
    
    if (prizesError) {
      console.error('Error fetching prizes:', prizesError);
      throw new Error('Error fetching prizes');
    }

    if (!prizes || prizes.length === 0) {
      console.log(`❌ No available prizes found for campaign ${campaign_id}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Δεν υπάρχουν διαθέσιμα δώρα στην εκστρατεία!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Simple random selection since magic_box_subscription_prizes doesn't have weight
    // Use quantity as weight - prizes with more quantity are more likely to be won
    let totalWeight = 0;
    const weightedPrizes = [];
    
    for (const prize of prizes) {
      // Add prize multiple times based on its quantity (as weight)
      for (let i = 0; i < Math.min(prize.quantity, 100); i++) { // Cap at 100 to avoid huge arrays
        weightedPrizes.push(prize);
        totalWeight++;
      }
    }

    // Generate cryptographically secure random number
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomIndex = randomArray[0] % totalWeight;
    const wonPrize = weightedPrizes[randomIndex];

    console.log(`🎲 Random selection: ${randomIndex}/${totalWeight}, Prize: subscription`);

    // No discount code needed for subscription prizes - they're direct subscriptions
    let discountCode = null;

    // Record the participation
    const participationData = {
      user_id: appUser.id,
      campaign_id: campaign_id,
      prize_id: wonPrize.id,
      result_type: 'subscription', // All magic box prizes are subscriptions
      subscription_type_id: wonPrize.subscription_type_id,
      discount_percentage: wonPrize.discount_percentage,
      discount_code: discountCode,
    };

    const { data: participation, error: participationInsertError } = await supabaseClient
      .from('user_campaign_participations')
      .insert(participationData)
      .select('*')
      .single();

    if (participationInsertError) {
      console.error('Error recording participation:', participationInsertError);
      throw new Error('Failed to record participation');
    }

    // Update remaining quantity for the won prize
    const { error: updatePrizeError } = await supabaseClient
      .from('magic_box_subscription_prizes')
      .update({ 
        quantity: wonPrize.quantity - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', wonPrize.id);

    if (updatePrizeError) {
      console.error('Error updating prize quantity:', updatePrizeError);
    }

    // Handle subscription creation (all magic box prizes are subscriptions)
    if (wonPrize.subscription_type_id) {
      // Automatically create subscription for the user
      const { data: subscriptionType } = await supabaseClient
        .from('subscription_types')
        .select('*')
        .eq('id', wonPrize.subscription_type_id)
        .single();

      if (subscriptionType) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + subscriptionType.duration_months);

        const { error: subscriptionError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: appUser.id,
            subscription_type_id: wonPrize.subscription_type_id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'active',
            is_paid: false
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        } else {
          // Mark participation as claimed
          await supabaseClient
            .from('user_campaign_participations')
            .update({ 
              is_claimed: true, 
              claimed_at: new Date().toISOString() 
            })
            .eq('id', participation.id);
        }
      }
    }

    // Prepare response (all magic box prizes are subscriptions)
    let result = {
      success: true,
      prize_type: 'subscription',
      discount_percentage: wonPrize.discount_percentage,
      message: `Συγχαρητήρια! Κέρδισες συνδρομή ${wonPrize.subscription_types?.name}!`,
      subscription_name: wonPrize.subscription_types?.name,
      subscription_description: wonPrize.subscription_types?.description
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in magic-box-draw:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});