import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Αποθήκευση μηνύματος χρήστη
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          user_id: userId,
          content: userMessage.content,
          message_type: "user",
          metadata: {}
        })
      });
    }

    // Φόρτωση ιστορικού συνομιλιών
    const historyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_conversations?user_id=eq.${userId}&order=created_at.asc&limit=50`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const conversationHistory = await historyResponse.json();

    // Μετατροπή ιστορικού σε μορφή για το AI
    const historyMessages = conversationHistory.map((msg: any) => ({
      role: msg.message_type === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // System prompt με πληροφορίες για τον χρήστη
    const systemPrompt = {
      role: "system",
      content: `Είσαι ο RID, ένας έμπειρος προπονητής fitness και wellness. 
      
Χρησιμοποιείς την προσωπική φιλοσοφία σου "RID System" που βασίζεται σε:
- Recovery (Αποκατάσταση): Ύπνος, διατροφή, ξεκούραση
- Intensity (Ένταση): Σωστή ένταση στην προπόνηση
- Duration (Διάρκεια): Σωστή διάρκεια προπόνησης

Οι απαντήσεις σου πρέπει να είναι:
- Προσωπικές και φιλικές
- Βασισμένες στο ιστορικό συνομιλιών με τον χρήστη
- Εμπνευσμένες από την εμπειρία και τις ανάγκες του
- Συγκεκριμένες και εφαρμόσιμες
- Σύντομες (2-3 παράγραφοι max)

Θυμάσαι όλες τις προηγούμενες συνομιλίες και χρησιμοποιείς αυτές τις πληροφορίες για να δίνεις καλύτερες συμβουλές.`
    };

    // Κλήση Lovable AI με όλο το ιστορικό
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemPrompt, ...historyMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Streaming response
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }

          // Αποθήκευση απάντησης AI
          await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              user_id: userId,
              content: fullResponse,
              message_type: "assistant",
              metadata: {}
            })
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("RID AI coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
