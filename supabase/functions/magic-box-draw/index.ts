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

    // Get all available prizes for this campaign
    const { data: prizes, error: prizesError } = await supabaseClient
      .from('campaign_prizes')
      .select(`
        *,
        subscription_types (
          id,
          name,
          description,
          duration_months
        )
      `)
      .eq('campaign_id', campaign_id)
      .gt('remaining_quantity', 0);

    if (prizesError || !prizes || prizes.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Δεν υπάρχουν διαθέσιμα δώρα στην εκστρατεία!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Implement weighted random selection
    let totalWeight = 0;
    const weightedPrizes = [];
    
    for (const prize of prizes) {
      // Add prize multiple times based on its weight
      for (let i = 0; i < prize.weight; i++) {
        weightedPrizes.push(prize);
        totalWeight++;
      }
    }

    // Generate cryptographically secure random number
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomIndex = randomArray[0] % totalWeight;
    const wonPrize = weightedPrizes[randomIndex];

    console.log(`🎲 Random selection: ${randomIndex}/${totalWeight}, Prize: ${wonPrize.prize_type}`);

    // Generate unique discount code if needed
    let discountCode = null;
    if (wonPrize.prize_type === 'discount_coupon') {
      const { data: couponCodeData } = await supabaseClient.rpc('generate_coupon_code');
      discountCode = couponCodeData;
    }

    // Record the participation
    const participationData = {
      user_id: appUser.id,
      campaign_id: campaign_id,
      prize_id: wonPrize.id,
      result_type: wonPrize.prize_type,
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
      .from('campaign_prizes')
      .update({ 
        remaining_quantity: wonPrize.remaining_quantity - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', wonPrize.id);

    if (updatePrizeError) {
      console.error('Error updating prize quantity:', updatePrizeError);
    }

    // Handle different prize types
    if (wonPrize.prize_type === 'subscription' && wonPrize.subscription_type_id) {
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
    } else if (wonPrize.prize_type === 'discount_coupon' && discountCode) {
      // Create discount coupon
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months expiry

      const { error: couponError } = await supabaseClient
        .from('user_discount_coupons')
        .insert({
          user_id: appUser.id,
          participation_id: participation.id,
          code: discountCode,
          discount_percentage: wonPrize.discount_percentage,
          expires_at: expiryDate.toISOString()
        });

      if (couponError) {
        console.error('Error creating coupon:', couponError);
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

    // Prepare response based on prize type
    let result = {
      success: true,
      prize_type: wonPrize.prize_type,
      discount_percentage: wonPrize.discount_percentage
    };

    switch (wonPrize.prize_type) {
      case 'subscription':
        result.message = `Συγχαρητήρια! Κέρδισες συνδρομή ${wonPrize.subscription_types?.name}!`;
        result.subscription_name = wonPrize.subscription_types?.name;
        result.subscription_description = wonPrize.subscription_types?.description;
        break;
      case 'discount_coupon':
        result.message = `Συγχαρητήρια! Κέρδισες κουπόνι έκπτωσης ${wonPrize.discount_percentage}%!`;
        result.discount_code = discountCode;
        break;
      case 'try_again':
        result.message = 'Δοκίμασε ξανά! Η τύχη θα σου χαμογελάσει σύντομα!';
        break;
      case 'nothing':
        result.message = 'Δυστυχώς δεν κέρδισες κάτι αυτή τη φορά. Καλή τύχη την επόμενη!';
        break;
      default:
        result.message = 'Συγχαρητήρια! Κέρδισες κάτι ειδικό!';
    }

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