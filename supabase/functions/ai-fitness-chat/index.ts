
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    const { message, athleteId, athleteName } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use service role client for data queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller has access to the athleteId (is the athlete or is a coach/admin)
    if (athleteId) {
      const { data: callerUser } = await supabase
        .from('app_users')
        .select('id, role')
        .eq('auth_user_id', userId)
        .single();

      if (!callerUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Allow if caller IS the athlete, or is admin/coach/trainer
      const isPrivileged = ['admin', 'coach', 'trainer'].includes(callerUser.role);
      if (callerUser.id !== athleteId && !isPrivileged) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('🚀 OpenAI GPT request for authenticated user:', userId);

    const { data: knowledge, error: knowledgeError } = await supabase
      .from('ai_global_knowledge')
      .select('category, original_info, corrected_info')
      .order('created_at', { ascending: true });

    if (knowledgeError) {
      console.error('Error loading knowledge:', knowledgeError);
    }

    let knowledgeContext = '';
    if (knowledge && knowledge.length > 0) {
      const categoryLabels: Record<string, string> = {
        exercises: 'ΑΣΚΗΣΕΙΣ & ΤΕΧΝΙΚΗ',
        nutrition: 'ΔΙΑΤΡΟΦΗ',
        philosophy: 'ΦΙΛΟΣΟΦΙΑ & ΠΡΟΣΕΓΓΙΣΗ',
        other: 'ΛΟΙΠΑ'
      };

      const grouped = knowledge.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof knowledge>);

      for (const [category, items] of Object.entries(grouped)) {
        knowledgeContext += `\n### ${categoryLabels[category] || category.toUpperCase()}\n\n`;
        items.forEach(item => {
          knowledgeContext += `**${item.original_info}**\n${item.corrected_info}\n\n`;
        });
      }
    }

    const systemPrompt = `Είσαι ένας εξειδικευμένος AI βοηθός για fitness και διατροφή με το όνομα "RID AI Προπονητής". Βοηθάς προπονητές και αθλητές με:

1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών

ΣΗΜΑΝΤΙΚΟ: Καλείσαι μόνο για πολύπλοκες ερωτήσεις που το Gemini AI δεν μπόρεσε να απαντήσει ικανοποιητικά.

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις λεπτομερείς, πρακτικές και εφαρμόσιμες συμβουλές
- Τονίζεις τη σημασία της επαγγελματικής παρακολούθησης
- Είσαι φιλικός και υποστηρικτικός
- Παραπέμπεις σε ειδικούς όταν χρειάζεται (γιατρούς, διατροφολόγους)
- Δίνεις συγκεκριμένα παραδείγματα και αριθμούς όπου είναι δυνατό

${athleteName ? `Αυτή τη στιγμή βοηθάς με ερωτήσεις για τον αθλητή: ${athleteName}` : ''}

## Εξειδικευμένη Γνώση:

${knowledgeContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      throw new Error(`Lovable AI error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ Lovable AI (Gemini) response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 OpenAI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
