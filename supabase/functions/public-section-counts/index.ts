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

    // Get closed days for current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekStartStr = startOfWeek.toISOString().split('T')[0];
    const weekEndStr = endOfWeek.toISOString().split('T')[0];

    const { data: closedDays, error: closedError } = await supabase
      .from('closed_days')
      .select('closed_date, reason')
      .gte('closed_date', weekStartStr)
      .lte('closed_date', weekEndStr);

    if (closedError) {
      console.log('Closed days fetch error (table may not exist):', closedError.message);
    }

    // Per-section, per-date, per-time unique attendee counts from real bookings
    // (same logic as the admin Overview: only confirmed/completed gym bookings
    // at the exact booked hour count)
    const { data: bookings, error: bookingsError } = await supabase
      .from('booking_sessions')
      .select('section_id, user_id, booking_date, booking_time')
      .not('user_id', 'is', null)
      .gte('booking_date', weekStartStr)
      .lte('booking_date', weekEndStr)
      .in('booking_type', ['gym_visit', 'gym'])
      .in('status', ['confirmed', 'completed']);

    if (bookingsError) {
      console.log('Bookings fetch error:', bookingsError.message);
    }

    const slotSets: { [sectionId: string]: { [date: string]: { [time: string]: Set<string> } } } = {};
    (bookings || []).forEach(b => {
      if (!b.section_id || !b.user_id || !b.booking_date) return;
      const time = (b.booking_time || '').length > 5
        ? (b.booking_time as string).substring(0, 5)
        : (b.booking_time || '');
      if (!time) return;
      if (!slotSets[b.section_id]) slotSets[b.section_id] = {};
      if (!slotSets[b.section_id][b.booking_date]) slotSets[b.section_id][b.booking_date] = {};
      if (!slotSets[b.section_id][b.booking_date][time]) slotSets[b.section_id][b.booking_date][time] = new Set();
      slotSets[b.section_id][b.booking_date][time].add(b.user_id);
    });

    const buildCounts = (sectionId: string) => {
      const counts: { [date: string]: { [time: string]: number } } = {};
      const dates = slotSets[sectionId] || {};
      Object.keys(dates).sort().forEach(date => {
        counts[date] = {};
        Object.keys(dates[date]).sort().forEach(time => {
          counts[date][time] = dates[date][time].size;
        });
      });
      return counts;
    };

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
        active_users: 0,
        hourly_counts: buildCounts(section.id)
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
