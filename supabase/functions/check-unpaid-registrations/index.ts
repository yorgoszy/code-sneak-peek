import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    const resend = new Resend(resendApiKey);

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date();
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const in1DayStr = in1Day.toISOString().split('T')[0];
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    console.log("🔔 Checking unpaid registration deadlines:", { todayStr, in1DayStr, in3DaysStr });

    // Find competitions with deadline in 1 or 3 days
    const { data: competitions, error: compError } = await supabaseService
      .from("federation_competitions")
      .select("id, name, registration_deadline, competition_date")
      .in("registration_deadline", [in1DayStr, in3DaysStr])
      .in("status", ["upcoming", "active"]);

    if (compError) throw compError;

    if (!competitions || competitions.length === 0) {
      console.log("✅ No competitions with upcoming deadlines found");
      return new Response(JSON.stringify({ message: "No upcoming deadlines", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Found ${competitions.length} competitions with upcoming deadlines`);

    let totalSent = 0;

    for (const comp of competitions) {
      const daysUntilDeadline = comp.registration_deadline === in1DayStr ? 1 : 3;

      // Find unpaid registrations grouped by club_id (coach)
      const { data: unpaidRegs, error: regError } = await supabaseService
        .from("federation_competition_registrations")
        .select("id, club_id, athlete_id")
        .eq("competition_id", comp.id)
        .eq("is_paid", false);

      if (regError) {
        console.error(`Error fetching registrations for ${comp.id}:`, regError);
        continue;
      }

      if (!unpaidRegs || unpaidRegs.length === 0) continue;

      // Group by coach (club_id)
      const coachGroups = new Map<string, number>();
      for (const reg of unpaidRegs) {
        coachGroups.set(reg.club_id, (coachGroups.get(reg.club_id) || 0) + 1);
      }

      // Send email to each coach
      for (const [coachId, unpaidCount] of coachGroups) {
        // Get coach email
        const { data: coach, error: coachError } = await supabaseService
          .from("app_users")
          .select("email, name")
          .eq("id", coachId)
          .single();

        if (coachError || !coach?.email) {
          console.error(`Could not find coach ${coachId}:`, coachError);
          continue;
        }

        const deadlineLabel = daysUntilDeadline === 1 ? "αύριο" : "σε 3 ημέρες";

        try {
          await resend.emails.send({
            from: "HyperKids <notify@hyperkids.gr>",
            to: [coach.email],
            subject: `⚠️ Απλήρωτες δηλώσεις - ${comp.name} (λήξη ${deadlineLabel})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px;">
                <div style="border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 24px;">
                  <h1 style="margin: 0; font-size: 20px; color: #000000;">HyperKids</h1>
                </div>
                
                <h2 style="color: #000000; font-size: 18px; margin-bottom: 16px;">
                  Υπενθύμηση Απλήρωτων Δηλώσεων
                </h2>
                
                <p style="color: #333333; font-size: 14px; line-height: 1.6;">
                  Αγαπητέ/ή <strong>${coach.name}</strong>,
                </p>
                
                <p style="color: #333333; font-size: 14px; line-height: 1.6;">
                  Η προθεσμία δηλώσεων για τον αγώνα <strong>${comp.name}</strong> λήγει <strong>${deadlineLabel}</strong> 
                  (${comp.registration_deadline}).
                </p>
                
                <div style="background: #fff3cd; border-left: 4px solid #cb8954; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0; color: #333333; font-size: 14px;">
                    Έχετε <strong>${unpaidCount} απλήρωτ${unpaidCount === 1 ? 'η' : 'ες'} δήλωσ${unpaidCount === 1 ? 'η' : 'εις'}</strong> 
                    αποθηκευμέν${unpaidCount === 1 ? 'η' : 'ες'} στο πρόχειρο.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #333333; font-size: 14px;">
                    Χωρίς πληρωμή, οι δηλώσεις <strong>δεν αποστέλλονται</strong> στην ομοσπονδία.
                  </p>
                </div>
                
                <a href="https://www.hyperkids.gr/dashboard/coach-competitions" 
                   style="display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; margin-top: 16px;">
                  Ολοκλήρωση Πληρωμής
                </a>
                
                <p style="color: #999999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eeeeee; padding-top: 16px;">
                  Αυτό είναι αυτοματοποιημένο μήνυμα από την πλατφόρμα HyperKids.
                </p>
              </div>
            `,
          });

          console.log(`✅ Email sent to ${coach.email} for ${comp.name} (${unpaidCount} unpaid)`);
          totalSent++;
        } catch (emailErr) {
          console.error(`Failed to send email to ${coach.email}:`, emailErr);
        }
      }
    }

    console.log(`📧 Total emails sent: ${totalSent}`);

    return new Response(JSON.stringify({ message: "Done", sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
