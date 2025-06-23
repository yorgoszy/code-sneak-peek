
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { message, athleteId, athleteName } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🚀 OpenAI GPT request for message:', message);

    // Δημιουργία system prompt για fitness και διατροφή
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

${athleteName ? `Αυτή τη στιγμή βοηθάς με ερωτήσεις για τον αθλητή: ${athleteName}` : ''}`;

    // Δημιουργία των μηνυμάτων για το OpenAI API
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ OpenAI GPT response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 OpenAI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
