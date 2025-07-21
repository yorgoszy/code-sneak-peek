
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, userName, platformData, files } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🚀 Smart AI Chat request for user:', userId, 'message:', message);
    console.log('📊 Platform data received:', platformData ? 'Yes' : 'No');
    console.log('📁 Files received:', files ? files.length : 0);

    // Process uploaded files
    let filesContext = '';
    if (files && files.length > 0) {
      console.log('📁 Processing uploaded files...');
      
      for (const filePath of files) {
        try {
          // Download file from storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('ai-chat-files')
            .download(filePath);

          if (downloadError) {
            console.error('Error downloading file:', filePath, downloadError);
            continue;
          }

          // Get file metadata
          const { data: metadata } = await supabase
            .from('ai_chat_files')
            .select('file_name, file_type')
            .eq('file_path', filePath)
            .single();

          const fileName = metadata?.file_name || 'Unknown file';
          const fileType = metadata?.file_type || '';

          // Process based on file type
          let fileContent = '';
          
          if (fileType.startsWith('text/')) {
            // Text files
            fileContent = await fileData.text();
            filesContext += `\n\n📄 Αρχείο: ${fileName}\nΠεριεχόμενο:\n${fileContent}`;
          } else if (fileType.startsWith('image/')) {
            // Image files - convert to base64 for AI analysis
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            filesContext += `\n\n🖼️ Εικόνα: ${fileName}\n[Εικόνα διαθέσιμη για ανάλυση - base64 encoded]`;
            
            // For vision-capable models, we can include the base64 data
            // This is a placeholder - would need to be implemented based on the AI model's vision capabilities
          } else if (fileType === 'application/pdf') {
            // PDF files - would need a PDF parser
            filesContext += `\n\n📋 PDF: ${fileName}\n[PDF αρχείο - χρειάζεται επεξεργασία]`;
          } else {
            filesContext += `\n\n📎 Αρχείο: ${fileName}\n[Τύπος: ${fileType}]`;
          }
          
        } catch (error) {
          console.error('Error processing file:', filePath, error);
          filesContext += `\n\n❌ Σφάλμα στην επεξεργασία αρχείου: ${filePath}`;
        }
      }
    }

    // Create enhanced context with platform data
    let enhancedContext = filesContext;
    
    if (platformData) {
      // Process programs data
      if (platformData.programs && platformData.programs.length > 0) {
        const programsList = platformData.programs.map(assignment => {
          const program = assignment.programs;
          let exercisesList = '';
          
          if (program?.program_weeks) {
            const exercises = new Set();
            program.program_weeks.forEach(week => {
              week.program_days?.forEach(day => {
                day.program_blocks?.forEach(block => {
                  block.program_exercises?.forEach(pe => {
                    if (pe.exercises?.name) {
                      exercises.add(`- Άσκηση: ${pe.exercises.name} (${pe.sets} sets x ${pe.reps} reps${pe.kg ? `, ${pe.kg}kg` : ''})`);
                    }
                  });
                });
              });
            });
            exercisesList = Array.from(exercises).join('\n');
          }
          
          return `📋 Πρόγραμμα: ${program.name}${program.description ? ` - ${program.description}` : ''}\nΑσκήσεις:\n${exercisesList}`;
        }).join('\n\n');
        
        enhancedContext += `\n\n🏋️ ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ ΤΟΥ ΧΡΗΣΤΗ:\n${programsList}`;
      }

      // Process test data
      if (platformData.tests && platformData.tests.length > 0) {
        const testsList = platformData.tests.map(testSession => {
          let testDetails = `📅 Ημερομηνία: ${testSession.test_date}`;
          
          if (testSession.anthropometric_test_data && testSession.anthropometric_test_data.length > 0) {
            const anthro = testSession.anthropometric_test_data[0];
            testDetails += `\n📏 Σωματομετρικά: Ύψος ${anthro.height}cm, Βάρος ${anthro.weight}kg`;
            if (anthro.body_fat_percentage) testDetails += `, Λίπος ${anthro.body_fat_percentage}%`;
          }
          
          if (testSession.strength_test_data && testSession.strength_test_data.length > 0) {
            const strengthTests = testSession.strength_test_data.map(st => 
              `${st.exercises?.name}: ${st.weight_kg}kg${st.velocity_ms ? ` (${st.velocity_ms}m/s)` : ''}`
            ).join(', ');
            testDetails += `\n💪 Δύναμη: ${strengthTests}`;
          }
          
          if (testSession.endurance_test_data && testSession.endurance_test_data.length > 0) {
            const endurance = testSession.endurance_test_data[0];
            testDetails += `\n🏃 Αντοχή:`;
            if (endurance.vo2_max) testDetails += ` VO2 Max ${endurance.vo2_max}`;
            if (endurance.push_ups) testDetails += `, Push-ups ${endurance.push_ups}`;
          }
          
          return testDetails;
        }).join('\n\n');
        
        enhancedContext += `\n\n📊 ΠΡΌΣΦΑΤΑ ΑΠΟΤΕΛΕΣΜΑΤΑ ΤΕΣΤ:\n${testsList}`;
      }
    }

    // Enhanced system prompt with real user data
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις ΠΛΗΡΗ πρόσβαση στα πραγματικά δεδομένα του χρήστη από την πλατφόρμα.

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

Βοηθάς με:
1. Διατροφικές συμβουλές βασισμένες στα τεστ του χρήστη
2. Ασκησιολογικές συμβουλές για τις συγκεκριμένες ασκήσεις του
3. Ανάλυση αποτελεσμάτων τεστ και προόδου
4. Προσαρμογή προγραμμάτων προπόνησης
5. Εξατομικευμένες συμβουλές βάσει των δεδομένων του

${enhancedContext}

ΣΗΜΑΝΤΙΚΟ: Όταν αναφέρεις ασκήσεις από τα προγράμματα του χρήστη, γράφε τις ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Παράδειγμα: "Άσκηση: Squat" ή "Άσκηση: Push Up"

Όταν συζητάς:
- Αναφέρου συγκεκριμένα στοιχεία από τα δεδομένα του χρήστη
- Δώσε εξατομικευμένες συμβουλές βάσει των τεστ του
- Πρότεινε βελτιώσεις στα προγράμματά του
- Ανάλυσε την πρόοδό του με βάση τα ιστορικά δεδομένα

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις συγκεκριμένες, εξατομικευμένες συμβουλές
- Αναφέρεις τα πραγματικά δεδομένα του χρήστη
- Είσαι φιλικός και υποστηρικτικός`;

    // Try Gemini first
    let aiResponse;
    
    if (geminiApiKey) {
      console.log('🤖 Trying Gemini AI with enhanced context...');
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nΕρώτηση: ${message}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
            }
          }),
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates[0].content.parts[0].text;
          console.log('✅ Gemini response with platform data generated successfully');
        } else {
          throw new Error('Gemini API error');
        }
      } catch (geminiError) {
        console.log('⚠️ Gemini failed, trying OpenAI...', geminiError);
      }
    }

    // Fallback to OpenAI if Gemini fails or is not available
    if (!aiResponse && openAIApiKey) {
      console.log('🤖 Using OpenAI with enhanced context as fallback...');
      
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json();
        aiResponse = openAIData.choices[0].message.content;
        console.log('✅ OpenAI response with platform data generated successfully');
      } else {
        throw new Error('OpenAI API error');
      }
    }

    if (!aiResponse) {
      throw new Error('No AI service available');
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Smart AI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
