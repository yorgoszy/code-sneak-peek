import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Create magic boxes request received');

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Απαιτείται ID καμπάνιας' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎲 Creating magic boxes for campaign:', campaign_id);

    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('app_users')
      .select('id');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ success: false, message: 'Σφάλμα φόρτωσης χρηστών' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Found users:', users?.length);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Δεν υπάρχουν χρήστες για δημιουργία magic boxes', created: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create magic boxes for all users
    const magicBoxes = users.map(user => ({
      user_id: user.id,
      campaign_id: campaign_id,
      is_opened: false
    }));

    const { data: createdBoxes, error: createError } = await supabaseClient
      .from('user_magic_boxes')
      .insert(magicBoxes)
      .select();

    if (createError) {
      console.error('❌ Error creating magic boxes:', createError);
      return new Response(
        JSON.stringify({ success: false, message: 'Σφάλμα δημιουργίας magic boxes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎉 Magic boxes created successfully:', createdBoxes?.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Δημιουργήθηκαν ${createdBoxes?.length} magic boxes επιτυχώς`,
        created: createdBoxes?.length
      }),
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