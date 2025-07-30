import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to add consolation visit
const addConsolationVisit = async (supabaseClient: any, userId: string) => {
  // Check for existing active visit packages first
  const { data: existingPackages, error: fetchError } = await supabaseClient
    .from('visit_packages')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('remaining_visits', 0)
    .order('expiry_date', { ascending: false, nullsFirst: true });

  if (fetchError) {
    console.error('❌ Error fetching existing visit packages for consolation:', fetchError);
  }

  if (existingPackages && existingPackages.length > 0) {
    // Add to existing package
    const targetPackage = existingPackages[0];
    const { error: updateError } = await supabaseClient
      .from('visit_packages')
      .update({
        total_visits: targetPackage.total_visits + 1,
        remaining_visits: targetPackage.remaining_visits + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetPackage.id);

    if (!updateError) {
      console.log(`✅ Added consolation visit to existing package. New total: ${targetPackage.remaining_visits + 1}`);
    } else {
      console.error('❌ Error updating visit package for consolation:', updateError);
    }
  } else {
    // Create new visit package
    const { error: packageError } = await supabaseClient
      .from('visit_packages')
      .insert({
        user_id: userId,
        total_visits: 1,
        remaining_visits: 1,
        status: 'active'
      });

    if (!packageError) {
      console.log('✅ Created new consolation visit package');
    } else {
      console.error('❌ Error creating consolation visit package:', packageError);
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Magic box open request received');

    // Initialize Supabase client without auth check first
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get Authorization header for user identification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No Authorization header provided');
      return new Response(
        JSON.stringify({ success: false, message: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JWT token to get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, message: 'Μη εξουσιοδοτημένη πρόσβαση' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get app user
    const { data: appUser, error: appUserError } = await supabaseClient
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('❌ App user not found:', appUserError);
      return new Response(
        JSON.stringify({ success: false, message: 'Χρήστης δεν βρέθηκε' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ App user found:', appUser.id);

    // Parse request body
    const { magic_box_id } = await req.json();
    if (!magic_box_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Απαιτείται ID μαγικού κουτιού' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎲 Processing magic box:', magic_box_id);

    // Get user's magic box
    const { data: magicBox, error: boxError } = await supabaseClient
      .from('user_magic_boxes')
      .select('*, magic_box_campaigns!inner(*)')
      .eq('id', magic_box_id)
      .eq('user_id', appUser.id)
      .single();

    if (boxError || !magicBox) {
      console.error('❌ Magic box not found:', boxError);
      return new Response(
        JSON.stringify({ success: false, message: 'Μαγικό κουτί δεν βρέθηκε' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if box is already opened
    if (magicBox.is_opened) {
      console.log('❌ Magic box already opened');
      return new Response(
        JSON.stringify({ success: false, message: 'Έχεις ήδη ανοίξει αυτό το μαγικό κουτί!' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if campaign is active
    const campaign = magicBox.magic_box_campaigns;
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;

    if (!campaign.is_active || now < startDate || (endDate && now > endDate)) {
      console.log('❌ Campaign is not active');
      return new Response(
        JSON.stringify({ success: false, message: 'Η εκστρατεία δεν είναι ενεργή' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get available prizes for this campaign
    const { data: prizes, error: prizesError } = await supabaseClient
      .from('campaign_prizes')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('is_active', true)
      .or('remaining_quantity.is.null,remaining_quantity.gt.0');

    if (prizesError || !prizes || prizes.length === 0) {
      console.error('❌ No available prizes:', prizesError);
      return new Response(
        JSON.stringify({ success: false, message: 'Δεν υπάρχουν διαθέσιμα δώρα' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎁 Available prizes:', prizes.length);

    // Weighted random selection
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let randomValue = Math.random() * totalWeight;
    let selectedPrize = null;

    for (const prize of prizes) {
      randomValue -= prize.weight;
      if (randomValue <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    if (!selectedPrize) {
      selectedPrize = prizes[prizes.length - 1]; // Fallback
    }

    console.log('🎉 Selected prize:', selectedPrize.name, 'Type:', selectedPrize.prize_type);

    // Generate discount code if needed
    let discountCode = null;
    if (selectedPrize.prize_type === 'discount_coupon') {
      const { data: codeData, error: codeError } = await supabaseClient
        .rpc('generate_coupon_code');
      
      if (!codeError && codeData) {
        discountCode = codeData;
      }
    }

    // Update magic box as opened
    const { error: updateBoxError } = await supabaseClient
      .from('user_magic_boxes')
      .update({
        is_opened: true,
        opened_at: new Date().toISOString(),
        won_prize_id: selectedPrize.id
      })
      .eq('id', magic_box_id);

    if (updateBoxError) {
      console.error('❌ Failed to update magic box:', updateBoxError);
      return new Response(
        JSON.stringify({ success: false, message: 'Σφάλμα ενημέρωσης κουτιού' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update prize quantity if not unlimited
    if (selectedPrize.remaining_quantity !== null) {
      const { error: updatePrizeError } = await supabaseClient
        .from('campaign_prizes')
        .update({
          remaining_quantity: selectedPrize.remaining_quantity - 1
        })
        .eq('id', selectedPrize.id);

      if (updatePrizeError) {
        console.error('❌ Failed to update prize quantity:', updatePrizeError);
      }
    }

    // Create participation record
    const participationData = {
      user_id: appUser.id,
      campaign_id: campaign.id,
      magic_box_id: magic_box_id,
      prize_id: selectedPrize.id,
      result_type: selectedPrize.prize_type,
      discount_percentage: selectedPrize.discount_percentage || 0,
      subscription_type_id: selectedPrize.subscription_type_id,
      discount_code: discountCode,
      is_claimed: false
    };

    const { data: participation, error: participationError } = await supabaseClient
      .from('user_campaign_participations')
      .insert(participationData)
      .select()
      .single();

    if (participationError) {
      console.error('❌ Failed to create participation:', participationError);
      return new Response(
        JSON.stringify({ success: false, message: 'Σφάλμα καταγραφής συμμετοχής' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle specific prize types
    let responseMessage = `Συγχαρητήρια! Κέρδισες: ${selectedPrize.name}`;
    let additionalData = {};

    switch (selectedPrize.prize_type) {
      case 'subscription':
        if (selectedPrize.subscription_type_id) {
          // Create user subscription
          const { data: subscription, error: subError } = await supabaseClient
            .from('user_subscriptions')
            .insert({
              user_id: appUser.id,
              subscription_type_id: selectedPrize.subscription_type_id,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
              status: 'active'
            })
            .select()
            .single();

          if (!subError) {
            additionalData = {
              subscription_id: subscription.id,
              subscription_type_id: selectedPrize.subscription_type_id
            };
          }
        }
        break;

      case 'visit_package':
        if (selectedPrize.visit_count > 0) {
          // Check for existing active visit packages
          const { data: existingPackages, error: fetchError } = await supabaseClient
            .from('visit_packages')
            .select('*')
            .eq('user_id', appUser.id)
            .eq('status', 'active')
            .gt('remaining_visits', 0)
            .order('expiry_date', { ascending: false, nullsFirst: true });

          if (fetchError) {
            console.error('❌ Error fetching existing visit packages:', fetchError);
          }

          if (existingPackages && existingPackages.length > 0) {
            // Merge with existing package - add visits to the one with latest expiry date
            const targetPackage = existingPackages[0];
            const newTotalVisits = targetPackage.total_visits + selectedPrize.visit_count;
            const newRemainingVisits = targetPackage.remaining_visits + selectedPrize.visit_count;
            
            const { error: updateError } = await supabaseClient
              .from('visit_packages')
              .update({
                total_visits: newTotalVisits,
                remaining_visits: newRemainingVisits,
                updated_at: new Date().toISOString()
              })
              .eq('id', targetPackage.id);

            if (!updateError) {
              additionalData = { 
                visit_count: selectedPrize.visit_count,
                merged_with_existing: true,
                total_visits_now: newRemainingVisits
              };
              console.log(`✅ Added ${selectedPrize.visit_count} visits to existing package. New total: ${newRemainingVisits}`);
            } else {
              console.error('❌ Error updating visit package:', updateError);
            }
          } else {
            // Create new visit package
            const { error: packageError } = await supabaseClient
              .from('visit_packages')
              .insert({
                user_id: appUser.id,
                total_visits: selectedPrize.visit_count,
                remaining_visits: selectedPrize.visit_count,
                status: 'active'
              });

            if (!packageError) {
              additionalData = { 
                visit_count: selectedPrize.visit_count,
                new_package: true
              };
              console.log(`✅ Created new visit package with ${selectedPrize.visit_count} visits`);
            } else {
              console.error('❌ Error creating visit package:', packageError);
            }
          }
        }
        break;

      case 'videocall_package':
        if (selectedPrize.videocall_count > 0) {
          // Check for existing active videocall packages
          const { data: existingPackages, error: fetchError } = await supabaseClient
            .from('videocall_packages')
            .select('*')
            .eq('user_id', appUser.id)
            .eq('status', 'active')
            .gt('remaining_videocalls', 0)
            .order('expiry_date', { ascending: false, nullsFirst: true });

          if (fetchError) {
            console.error('❌ Error fetching existing videocall packages:', fetchError);
          }

          if (existingPackages && existingPackages.length > 0) {
            // Merge with existing package
            const targetPackage = existingPackages[0];
            const newTotalVideocalls = targetPackage.total_videocalls + selectedPrize.videocall_count;
            const newRemainingVideocalls = targetPackage.remaining_videocalls + selectedPrize.videocall_count;
            
            const { error: updateError } = await supabaseClient
              .from('videocall_packages')
              .update({
                total_videocalls: newTotalVideocalls,
                remaining_videocalls: newRemainingVideocalls,
                updated_at: new Date().toISOString()
              })
              .eq('id', targetPackage.id);

            if (!updateError) {
              additionalData = { 
                videocall_count: selectedPrize.videocall_count,
                merged_with_existing: true,
                total_videocalls_now: newRemainingVideocalls
              };
              console.log(`✅ Added ${selectedPrize.videocall_count} videocalls to existing package. New total: ${newRemainingVideocalls}`);
            } else {
              console.error('❌ Error updating videocall package:', updateError);
            }
          } else {
            // Create new videocall package
            const { error: packageError } = await supabaseClient
              .from('videocall_packages')
              .insert({
                user_id: appUser.id,
                total_videocalls: selectedPrize.videocall_count,
                remaining_videocalls: selectedPrize.videocall_count,
                status: 'active'
              });

            if (!packageError) {
              additionalData = { 
                videocall_count: selectedPrize.videocall_count,
                new_package: true
              };
              console.log(`✅ Created new videocall package with ${selectedPrize.videocall_count} videocalls`);
            } else {
              console.error('❌ Error creating videocall package:', packageError);
            }
          }
        }
        break;

      case 'discount_coupon':
        if (discountCode) {
          // Create discount coupon
          const { error: couponError } = await supabaseClient
            .from('discount_coupons')
            .insert({
              code: discountCode,
              discount_percentage: selectedPrize.discount_percentage,
              user_id: appUser.id,
              is_used: false,
              expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
            });

          if (!couponError) {
            additionalData = { 
              discount_code: discountCode,
              discount_percentage: selectedPrize.discount_percentage 
            };
          }
        }
        break;

      case 'try_again':
        responseMessage = 'Δοκίμασε ξανά! Η τύχη θα σου χαμογελάσει!';
        // Δώσε μια επίσκεψη ως παρηγοριά - merge with existing if possible
        await addConsolationVisit(supabaseClient, appUser.id);
        responseMessage = 'Δοκίμασε ξανά! Πήρες μια δωρεάν επίσκεψη ως παρηγοριά!';
        additionalData = { consolation_visit: true };
        break;

      case 'nothing':
        responseMessage = 'Δεν κέρδισες αυτή τη φορά, αλλά μην απογοητεύεσαι!';
        // Δώσε μια επίσκεψη ως παρηγοριά - merge with existing if possible
        await addConsolationVisit(supabaseClient, appUser.id);
        responseMessage = 'Δεν κέρδισες αυτή τη φορά, αλλά πήρες μια δωρεάν επίσκεψη!';
        additionalData = { consolation_visit: true };
        break;
    }

    const response = {
      success: true,
      message: responseMessage,
      prize_type: selectedPrize.prize_type,
      prize_name: selectedPrize.name,
      prize_description: selectedPrize.description,
      participation: participation,
      ...additionalData
    };

    console.log('🎉 Magic box opened successfully:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});