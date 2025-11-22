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

    // Φόρτωση στοιχείων χρήστη
    const userDataResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}&select=*`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const userData = await userDataResponse.json();
    const userProfile = userData[0] || {};

    // Φόρτωση ενεργών προγραμμάτων
    const programsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${userId}&status=eq.active&select=programs!fk_program_assignments_program_id(name,description,program_weeks(program_days(program_blocks(program_exercises(sets,reps,kg,exercises(id,name,description))))))&limit=3`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const programsData = await programsResponse.json();

    // Φόρτωση ιστορικού δύναμης
    const strengthResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/strength_test_attempts?user_id=eq.${userId}&select=id,attempt_date,exercise_id,weight_kg,velocity_ms,estimated_1rm,exercises(name)&order=attempt_date.desc&limit=20`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const strengthHistory = await strengthResponse.json();

    // Φόρτωση ιστορικού αντοχής
    const enduranceResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/endurance_test_data?select=id,created_at,vo2_max,mas_kmh,sprint_watt,push_ups,pull_ups,crunches,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const enduranceHistory = await enduranceResponse.json();

    // Φόρτωση ιστορικού άλματος
    const jumpResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/jump_test_data?select=id,created_at,counter_movement_jump,non_counter_movement_jump,broad_jump,triple_jump_left,triple_jump_right,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const jumpHistory = await jumpResponse.json();

    // Φόρτωση ανθρωπομετρικού ιστορικού
    const anthropometricResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=id,created_at,height,weight,body_fat_percentage,muscle_mass_percentage,waist_circumference,chest_circumference,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const anthropometricHistory = await anthropometricResponse.json();

    // Δημιουργία context για ασκήσεις
    let exerciseContext = '';
    if (Array.isArray(programsData) && programsData.length > 0) {
      const exercises = new Set<string>();
      programsData.forEach((assignment: any) => {
        assignment.programs?.program_weeks?.forEach((week: any) => {
          week.program_days?.forEach((day: any) => {
            day.program_blocks?.forEach((block: any) => {
              block.program_exercises?.forEach((pe: any) => {
                if (pe.exercises?.name) {
                  exercises.add(`- ${pe.exercises.name}${pe.exercises.description ? `: ${pe.exercises.description}` : ''}`);
                }
              });
            });
          });
        });
      });
      if (exercises.size > 0) {
        exerciseContext = `\n\nΟι ασκήσεις που έχεις στα προγράμματά σου:\n${Array.from(exercises).join('\n')}`;
      }
    }

    // Context για προγράμματα
    let programContext = '';
    if (Array.isArray(programsData) && programsData.length > 0) {
      const programsList = programsData.map((assignment: any) => {
        const program = assignment.programs;
        return `- ${program?.name || 'Πρόγραμμα'}${program?.description ? `: ${program.description}` : ''}`;
      }).join('\n');
      programContext = `\n\nΤα ενεργά προγράμματά σου:\n${programsList}`;
    }

    // Context για δύναμη
    let strengthContext = '';
    if (Array.isArray(strengthHistory) && strengthHistory.length > 0) {
      const strengthList = strengthHistory.map((test: any) => {
        return `- ${test.exercises?.name || 'Άσκηση'}: ${test.weight_kg}kg, Ταχύτητα: ${test.velocity_ms}m/s, 1RM: ${test.estimated_1rm}kg (${new Date(test.attempt_date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      strengthContext = `\n\nΙστορικό Δύναμης:\n${strengthList}`;
    }

    // Context για αντοχή
    let enduranceContext = '';
    if (Array.isArray(enduranceHistory) && enduranceHistory.length > 0) {
      const enduranceList = enduranceHistory.map((test: any) => {
        const parts = [];
        if (test.vo2_max) parts.push(`VO2max: ${test.vo2_max}`);
        if (test.mas_kmh) parts.push(`MAS: ${test.mas_kmh} km/h`);
        if (test.sprint_watt) parts.push(`Sprint: ${test.sprint_watt}W`);
        if (test.push_ups) parts.push(`Push-ups: ${test.push_ups}`);
        if (test.pull_ups) parts.push(`Pull-ups: ${test.pull_ups}`);
        const date = test.endurance_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      enduranceContext = `\n\nΙστορικό Αντοχής:\n${enduranceList}`;
    }

    // Context για άλματα
    let jumpContext = '';
    if (Array.isArray(jumpHistory) && jumpHistory.length > 0) {
      const jumpList = jumpHistory.map((test: any) => {
        const parts = [];
        if (test.counter_movement_jump) parts.push(`CMJ: ${test.counter_movement_jump}cm`);
        if (test.broad_jump) parts.push(`Broad: ${test.broad_jump}cm`);
        if (test.triple_jump_left) parts.push(`Triple L: ${test.triple_jump_left}cm`);
        if (test.triple_jump_right) parts.push(`Triple R: ${test.triple_jump_right}cm`);
        const date = test.jump_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      jumpContext = `\n\nΙστορικό Άλματος:\n${jumpList}`;
    }

    // Context για ανθρωπομετρικά
    let anthropometricContext = '';
    if (Array.isArray(anthropometricHistory) && anthropometricHistory.length > 0) {
      const anthropometricList = anthropometricHistory.map((test: any) => {
        const parts = [];
        if (test.weight) parts.push(`Βάρος: ${test.weight}kg`);
        if (test.body_fat_percentage) parts.push(`Λίπος: ${test.body_fat_percentage}%`);
        if (test.muscle_mass_percentage) parts.push(`Μυϊκή Μάζα: ${test.muscle_mass_percentage}%`);
        const date = test.anthropometric_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      anthropometricContext = `\n\nΑνθρωπομετρικό Ιστορικό:\n${anthropometricList}`;
    }

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
      content: `Είσαι ο RID AI Προπονητής, ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις πρόσβαση στα προγράμματα, τις ασκήσεις, και το πλήρες ιστορικό προόδου του χρήστη.
      
Χρησιμοποιείς την προσωπική φιλοσοφία "RID System" που βασίζεται σε:
- Recovery (Αποκατάσταση): Ύπνος, διατροφή, ξεκούραση
- Intensity (Ένταση): Σωστή ένταση στην προπόνηση
- Duration (Διάρκεια): Σωστή διάρκεια προπόνησης

Βοηθάς με:
1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ και ανάλυση προόδου
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών
6. Συμβουλές για τις συγκεκριμένες ασκήσεις που έχει ο χρήστης
7. Ανάλυση της εξέλιξης και σύγκριση αποτελεσμάτων

${userProfile.name ? `\n\nΜιλάς με: ${userProfile.name}` : ''}${userProfile.birth_date ? `\nΗλικία: ${new Date().getFullYear() - new Date(userProfile.birth_date).getFullYear()} ετών` : ''}${exerciseContext}${programContext}${strengthContext}${enduranceContext}${jumpContext}${anthropometricContext}

ΣΗΜΑΝΤΙΚΟ: Έχεις πρόσβαση στο ΠΛΗΡΕΣ ιστορικό του χρήστη. Μπορείς να:
- Αναλύσεις την πρόοδό του στη δύναμη (1RM, ταχύτητα)
- Δεις την εξέλιξη της αντοχής του (VO2max, MAS, sprint)
- Παρακολουθήσεις τα άλματά του (CMJ, broad jump, triple jumps)
- Εντοπίσεις αλλαγές στο σωματικό του σύνθεμα (βάρος, λίπος, μυϊκή μάζα)
- Συγκρίνεις αποτελέσματα μεταξύ διαφορετικών περιόδων
- Εντοπίσεις τάσεις και patterns στην πρόοδό του

Οι απαντήσεις σου πρέπει να είναι:
- Προσωπικές και βασισμένες στα ΠΡΑΓΜΑΤΙΚΑ δεδομένα του χρήστη
- Φιλικές και εμπνευσμένες από την εμπειρία και τις ανάγκες του
- Συγκεκριμένες και εφαρμόσιμες
- Σύντομες (2-3 παράγραφοι max)
- Βασισμένες στο ιστορικό συνομιλιών

Όταν αναφέρεις ασκήσεις, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Όταν συζητάς για πρόοδο:
- Αναφέρου συγκεκριμένα νούμερα από το ιστορικό
- Σύγκρινε παλιότερα με πρόσφατα αποτελέσματα
- Εντόπισε βελτιώσεις ή περιοχές που χρειάζονται προσοχή
- Δώσε συγκεκριμένες συμβουλές βασισμένες στα δεδομένα

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
