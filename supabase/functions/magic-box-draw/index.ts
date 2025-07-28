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

    console.log('🎲 Processing magic box:', campaign_id);

    // Get magic box and verify it's active
    const { data: magicBox, error: magicBoxError } = await supabaseClient
      .from('magic_boxes')
      .select('*')
      .eq('id', campaign_id)
      .eq('is_active', true)
      .single();

    if (magicBoxError || !magicBox) {
      console.error('Magic box error:', magicBoxError);
      throw new Error('Magic box not found or inactive');
    }

    // Check if user already participated in this magic box using user_magic_box_wins
    const { data: existingWin, error: winError } = await supabaseClient
      .from('user_magic_box_wins')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('magic_box_id', campaign_id)
      .maybeSingle();

    if (winError) {
      console.error('Error checking existing wins:', winError);
      throw new Error('Error checking existing participations');
    }

    if (existingWin) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Έχεις ήδη συμμετάσχει σε αυτό το Magic Box!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`✅ User ${appUser.id} can participate in magic box ${campaign_id}`);

    // Get all available prizes for this magic box
    const { data: prizes, error: prizesError } = await supabaseClient
      .from('magic_box_subscription_prizes')
      .select('*')
      .eq('magic_box_id', campaign_id)
      .gt('quantity', 0);

    console.log(`🎁 Found ${prizes?.length || 0} available prizes for magic box ${campaign_id}`);
    
    if (prizesError) {
      console.error('Error fetching prizes:', prizesError);
      throw new Error('Error fetching prizes');
    }

    if (!prizes || prizes.length === 0) {
      console.log(`❌ No available prizes found for magic box ${campaign_id}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Δεν υπάρχουν διαθέσιμα δώρα στο Magic Box!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Use quantity as weight for random selection
    let totalWeight = 0;
    for (const prize of prizes) {
      totalWeight += prize.quantity;
    }
    
    const randomWeight = Math.floor(Math.random() * totalWeight);
    let currentWeight = 0;
    let wonPrize = null;
    
    for (const prize of prizes) {
      currentWeight += prize.quantity;
      if (randomWeight < currentWeight) {
        wonPrize = prize;
        break;
      }
    }
    
    // Fallback to first prize if selection fails
    if (!wonPrize) {
      wonPrize = prizes[0];
    }

    console.log(`🎲 Random selection: ${randomWeight}/${totalWeight}, Won Prize: subscription, ID: ${wonPrize.id}`);

    // Record the win FIRST in user_magic_box_wins
    const winData = {
      user_id: appUser.id,
      magic_box_id: campaign_id,
      prize_id: wonPrize.id,
      subscription_type_id: wonPrize.subscription_type_id,
      discount_percentage: wonPrize.discount_percentage,
      prize_type: 'subscription', // All magic box prizes are subscriptions
      won_at: new Date().toISOString(),
    };

    const { data: winRecord, error: winInsertError } = await supabaseClient
      .from('user_magic_box_wins')
      .insert(winData)
      .select('*')
      .single();

    if (winInsertError) {
      console.error('Error recording win:', winInsertError);
      throw new Error('Failed to record win');
    }

    console.log('✅ Win recorded:', winRecord.id);

    // Update quantity for the won prize
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

    // Get subscription type details
    const { data: subscriptionType } = await supabaseClient
      .from('subscription_types')
      .select('*')
      .eq('id', wonPrize.subscription_type_id)
      .single();

    if (!subscriptionType) {
      console.error('Subscription type not found:', wonPrize.subscription_type_id);
      throw new Error('Subscription type not found');
    }

    // Create subscription for the user (all magic box prizes are free subscriptions)
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
        is_paid: false // Magic box prizes are free
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
    } else {
      // Mark win as claimed
      await supabaseClient
        .from('user_magic_box_wins')
        .update({ 
          is_claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('id', winRecord.id);

      console.log('✅ Subscription created and win marked as claimed');
    }

    const result = {
      success: true,
      prize_type: 'subscription',
      discount_percentage: wonPrize.discount_percentage,
      message: `Συγχαρητήρια! Κέρδισες συνδρομή ${subscriptionType.name}!`,
      subscription_name: subscriptionType.name,
      subscription_description: subscriptionType.description
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