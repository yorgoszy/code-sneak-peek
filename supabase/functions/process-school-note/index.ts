import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId, content, category } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate AI summary using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Είσαι ένας AI βοηθός που επεξεργάζεται σχολικές σημειώσεις. Δημιούργησε μια σύντομη περίληψη (2-3 προτάσεις) που να αναδεικνύει τα πιο σημαντικά σημεία.'
          },
          {
            role: 'user',
            content: `Κατηγορία: ${category}\n\nΠεριεχόμενο: ${content}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to process with AI');
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || 'Δεν ήταν δυνατή η δημιουργία περίληψης';

    // Update note with AI summary
    const { error: updateError } = await supabase
      .from('school_notes')
      .update({
        ai_summary: summary,
        ai_processed: true,
      })
      .eq('id', noteId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
