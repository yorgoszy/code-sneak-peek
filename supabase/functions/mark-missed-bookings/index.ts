import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
if (Deno.env.get('REQUEST_METHOD') === 'OPTIONS') {
  serve(() => new Response(null, { headers: corsHeaders }));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting to mark missed bookings...');

    // Call the database function to mark past bookings as missed
    const { data, error } = await supabaseClient.rpc('mark_past_bookings_as_missed');

    if (error) {
      console.error('❌ Error marking missed bookings:', error);
      throw error;
    }

    const updatedCount = data || 0;
    console.log(`✅ Successfully marked ${updatedCount} bookings as missed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marked ${updatedCount} bookings as missed`,
        updatedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in mark-missed-bookings function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});