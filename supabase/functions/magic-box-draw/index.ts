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

    const { magic_box_id } = await req.json();

    if (!magic_box_id) {
      throw new Error('Magic box ID is required');
    }

    // Get magic box and verify it's active
    const { data: magicBox, error: magicBoxError } = await supabaseClient
      .from('magic_boxes')
      .select('*')
      .eq('id', magic_box_id)
      .eq('is_active', true)
      .single();

    if (magicBoxError || !magicBox) {
      throw new Error('Magic box not found or inactive');
    }

    // Check if user already played this magic box
    const { data: existingWin, error: existingWinError } = await supabaseClient
      .from('user_magic_box_wins')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('magic_box_id', magic_box_id)
      .maybeSingle();

    if (existingWinError) {
      throw new Error('Error checking existing wins');
    }

    if (existingWin) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Έχεις ήδη παίξει σε αυτό το μαγικό κουτί!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get all available prizes for this magic box
    const { data: prizes, error: prizesError } = await supabaseClient
      .from('magic_box_subscription_prizes')
      .select(`
        *,
        subscription_types (
          id,
          name,
          description
        )
      `)
      .eq('magic_box_id', magic_box_id);

    if (prizesError || !prizes || prizes.length === 0) {
      throw new Error('No prizes available in this magic box');
    }

    // Check how many of each prize have been won already
    const availablePrizes = [];
    
    for (const prize of prizes) {
      const { data: wonCount, error: wonCountError } = await supabaseClient
        .from('user_magic_box_wins')
        .select('id')
        .eq('prize_id', prize.id);

      if (wonCountError) {
        console.error('Error counting won prizes:', wonCountError);
        continue;
      }

      const remainingQuantity = prize.quantity - (wonCount?.length || 0);
      
      if (remainingQuantity > 0) {
        // Add the prize multiple times based on remaining quantity to weight the lottery
        for (let i = 0; i < remainingQuantity; i++) {
          availablePrizes.push(prize);
        }
      }
    }

    if (availablePrizes.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Δεν υπάρχουν διαθέσιμα δώρα στο μαγικό κουτί!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Draw a random prize
    const randomIndex = Math.floor(Math.random() * availablePrizes.length);
    const wonPrize = availablePrizes[randomIndex];

    let winRecord: any = {
      user_id: appUser.id,
      magic_box_id: magic_box_id,
      prize_id: wonPrize.id,
      prize_type: 'subscription', // Τώρα όλα τα prizes είναι subscription τύπου
      subscription_type_id: wonPrize.subscription_type_id,
      discount_percentage: wonPrize.discount_percentage,
    };

    // Record the win
    const { data: win, error: winError } = await supabaseClient
      .from('user_magic_box_wins')
      .insert(winRecord)
      .select('*')
      .single();

    if (winError) {
      throw new Error('Failed to record win');
    }

    // Automatically apply the subscription to the user
    const { data: subscriptionType } = await supabaseClient
      .from('subscription_types')
      .select('*')
      .eq('id', wonPrize.subscription_type_id)
      .single();

    if (subscriptionType) {
      // Calculate dates for the subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + subscriptionType.duration_months);

      // Create the subscription for the user
      const { error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: appUser.id,
          subscription_type_id: wonPrize.subscription_type_id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          is_paid: false // Since it's a free prize
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        // Don't throw error here, the win is still recorded
      }

      // Mark win as claimed
      await supabaseClient
        .from('user_magic_box_wins')
        .update({ 
          is_claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('id', win.id);
    }

    // Prepare response
    let result: any = {
      success: true,
      message: 'Συγχαρητήρια! Κέρδισες μια συνδρομή!',
      prize_type: 'subscription',
      discount_percentage: wonPrize.discount_percentage,
      subscription_name: wonPrize.subscription_types.name,
      subscription_description: wonPrize.subscription_types.description
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