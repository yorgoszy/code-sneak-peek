import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sections with user counts (no PII exposed)
    const { data: sections, error: sectionsError } = await supabase
      .from('booking_sections')
      .select('id, name, max_capacity, available_hours')
      .eq('is_active', true)
      .order('name');

    if (sectionsError) throw sectionsError;

    // Get user counts per section
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('section_id')
      .not('section_id', 'is', null)
      .eq('subscription_status', 'active');

    if (usersError) throw usersError;

    // Count users per section
    const sectionCounts: { [sectionId: string]: number } = {};
    (users || []).forEach(user => {
      if (user.section_id) {
        sectionCounts[user.section_id] = (sectionCounts[user.section_id] || 0) + 1;
      }
    });

    // Get closed days for current week
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data: closedDays, error: closedError } = await supabase
      .from('closed_days')
      .select('closed_date, reason')
      .gte('closed_date', startOfWeek.toISOString().split('T')[0])
      .lte('closed_date', endOfWeek.toISOString().split('T')[0]);

    if (closedError) {
      console.log('Closed days fetch error (table may not exist):', closedError.message);
    }

    // Filter out videocall sections and combine data
    const publicSections = (sections || [])
      .filter(section => 
        !section.name.toLowerCase().includes('videocall') && 
        !section.name.toLowerCase().includes('online') &&
        !section.name.toLowerCase().includes('βιντεοκλήσεις') &&
        !section.name.toLowerCase().includes('βιντεοκληση')
      )
      .map(section => ({
        id: section.id,
        name: section.name,
        max_capacity: section.max_capacity,
        available_hours: section.available_hours,
        active_users: sectionCounts[section.id] || 0
      }));

    return new Response(JSON.stringify({
      sections: publicSections,
      closedDays: closedDays || []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching section counts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
