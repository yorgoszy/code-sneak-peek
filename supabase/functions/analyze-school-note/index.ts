import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteContent, category } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryLabels: Record<string, string> = {
      'math': 'Μαθηματικά',
      'science': 'Φυσική/Χημεία',
      'language': 'Γλώσσα',
      'history': 'Ιστορία',
      'arts': 'Καλές Τέχνες',
      'sports': 'Φυσική Αγωγή',
      'other': 'Άλλο'
    };

    const categoryLabel = categoryLabels[category] || category;

    const systemPrompt = `Είσαι ειδικός παιδαγωγός και προπονητής φυσικής αγωγής. 
Αναλύεις σημειώσεις γονέων για τα παιδιά τους από το σχολείο και προτείνεις στοχευμένες ασκήσεις φυσικής αγωγής.

Για κάθε σημείωση, πρέπει να:
1. Δημιουργήσεις μια σύντομη περίληψη (2-3 γραμμές)
2. Προτείνεις 3-4 συγκεκριμένες ασκήσεις φυσικής αγωγής που θα βοηθήσουν στην ανάπτυξη των δεξιοτήτων που αναφέρονται

Οι ασκήσεις πρέπει να είναι:
- Κατάλληλες για παιδιά σχολικής ηλικίας
- Εύκολα εφαρμόσιμες
- Διασκεδαστικές και ελκυστικές
- Σχετικές με τις δεξιότητες που χρειάζονται ανάπτυξη

Απάντησε σε μορφή JSON με την εξής δομή:
{
  "summary": "Η περίληψη της σημείωσης",
  "exercises": [
    {
      "name": "Όνομα άσκησης",
      "description": "Περιγραφή της άσκησης",
      "duration": "Διάρκεια σε λεπτά",
      "skill": "Η δεξιότητα που αναπτύσσει"
    }
  ]
}`;

    const userPrompt = `Μάθημα: ${categoryLabel}

Σημείωση γονέα:
${noteContent}

Παρακαλώ ανάλυσε τη σημείωση και πρότεινε κατάλληλες ασκήσεις φυσικής αγωγής.`;

    console.log('Calling Lovable AI with prompt:', userPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_note",
              description: "Analyze school note and suggest exercises",
              parameters: {
                type: "object",
                properties: {
                  summary: { 
                    type: "string",
                    description: "A brief summary of the note in 2-3 lines"
                  },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        duration: { type: "string" },
                        skill: { type: "string" }
                      },
                      required: ["name", "description", "duration", "skill"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["summary", "exercises"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_note" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Το όριο χρήσης AI έχει ξεπεραστεί. Παρακαλώ δοκιμάστε αργότερα." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Απαιτείται πληρωμή για χρήση AI. Παρακαλώ προσθέστε credits." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-school-note function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
