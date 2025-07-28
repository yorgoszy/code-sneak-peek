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
    console.log('🎯 Magic box draw request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id);

    // Get user's app_user record
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('App user error:', appUserError);
      throw new Error('User profile not found');
    }

    console.log('✅ App user found:', appUser.id);

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      throw new Error('Campaign ID is required');
    }

    console.log('🎲 Processing campaign:', campaign_id);

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

    // Get all available prizes for this campaign from campaign_prizes
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

    // Use weight from campaign_prizes for proper weighted random selection
    let totalWeight = 0;
    
    for (const prize of prizes) {
      totalWeight += (prize.weight || 1);
    }
    
    // Generate weighted random selection
    const randomWeight = Math.floor(Math.random() * totalWeight);
    let currentWeight = 0;
    let wonPrize = null;
    
    for (const prize of prizes) {
      currentWeight += (prize.weight || 1);
      if (randomWeight < currentWeight) {
        wonPrize = prize;
        break;
      }
    }
    
    // Fallback to first prize if selection fails
    if (!wonPrize) {
      wonPrize = prizes[0];
    }

    console.log(`🎲 Random selection: ${randomWeight}/${totalWeight}, Won Prize: ${wonPrize.prize_type}, ID: ${wonPrize.id}`);

    // Generate discount code if needed
    let discountCode = null;
    if (wonPrize.prize_type === 'discount_coupon') {
      // Generate a unique discount code
      discountCode = `MAGIC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // Determine result type based on prize type
    let resultType = wonPrize.prize_type;
    if (wonPrize.prize_type === 'discount_coupon') {
      resultType = 'discount';
    }

    // Record the participation
    const participationData = {
      user_id: appUser.id,
      campaign_id: campaign_id,
      prize_id: wonPrize.id,
      result_type: resultType,
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
    } else if (wonPrize.prize_type === 'discount_coupon') {
      // Create discount coupon
      const { error: couponError } = await supabaseClient
        .from('discount_coupons')
        .insert({
          code: discountCode,
          discount_percentage: wonPrize.discount_percentage,
          user_id: appUser.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          is_active: true,
          max_uses: 1,
          current_uses: 0
        });

      if (couponError) {
        console.error('Error creating discount coupon:', couponError);
      }
    }

    // Prepare response based on prize type
    let result = {
      success: true,
      prize_type: wonPrize.prize_type,
      discount_percentage: wonPrize.discount_percentage
    };

    if (wonPrize.prize_type === 'subscription') {
      result.message = `Συγχαρητήρια! Κέρδισες συνδρομή ${wonPrize.subscription_types?.name}!`;
      result.subscription_name = wonPrize.subscription_types?.name;
      result.subscription_description = wonPrize.subscription_types?.description;
    } else if (wonPrize.prize_type === 'discount_coupon') {
      result.message = `Συγχαρητήρια! Κέρδισες κουπόνι έκπτωσης ${wonPrize.discount_percentage}%!`;
      result.discount_code = discountCode;
    } else if (wonPrize.prize_type === 'try_again') {
      result.message = 'Δοκίμασε ξανά!';
    } else if (wonPrize.prize_type === 'nothing') {
      result.message = 'Δυστυχώς, δεν κέρδισες τίποτα αυτή τη φορά.';
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