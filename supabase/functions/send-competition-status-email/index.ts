import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    const resend = new Resend(resendApiKey);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { type, competitionId, competitionName, federationId } = body;

    if (type !== 'competition_activated') {
      return new Response(JSON.stringify({ error: 'Unknown type' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🏆 Competition activated: ${competitionName} (${competitionId})`);

    // Get competition details
    const { data: competition } = await supabaseClient
      .from('federation_competitions')
      .select('*, federation:app_users!federation_competitions_federation_id_fkey(name, email)')
      .eq('id', competitionId)
      .single();

    if (!competition) {
      return new Response(JSON.stringify({ error: 'Competition not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const federationName = (competition.federation as any)?.name || 'Ομοσπονδία';

    // Get all coaches that belong to this federation's clubs
    const { data: clubs } = await supabaseClient
      .from('federation_clubs')
      .select('club_id')
      .eq('federation_id', federationId);

    if (!clubs || clubs.length === 0) {
      console.log('No clubs found for federation');
      return new Response(JSON.stringify({ message: 'No clubs to notify' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clubIds = clubs.map(c => c.club_id);

    // Get coach emails
    const { data: coaches } = await supabaseClient
      .from('app_users')
      .select('id, name, email')
      .in('id', clubIds)
      .eq('role', 'coach');

    if (!coaches || coaches.length === 0) {
      console.log('No coaches found');
      return new Response(JSON.stringify({ message: 'No coaches to notify' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📧 Sending activation emails to ${coaches.length} coaches`);

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('el-GR');
      } catch {
        return dateStr;
      }
    };

    const results: Array<{ success: boolean; email: string; error?: string }> = [];

    for (const coach of coaches) {
      if (!coach.email) continue;

      const deadlineInfo = competition.registration_deadline
        ? `<p style="margin: 8px 0; font-size: 14px;">📅 <strong>Προθεσμία εμπρόθεσμων δηλώσεων:</strong> ${formatDate(competition.registration_deadline)}</p>`
        : '';
      const lateDeadlineInfo = competition.late_registration_deadline
        ? `<p style="margin: 8px 0; font-size: 14px;">⚠️ <strong>Προθεσμία εκπρόθεσμων δηλώσεων:</strong> ${formatDate(competition.late_registration_deadline)}</p>`
        : '';
      const locationInfo = competition.location
        ? `<p style="margin: 8px 0; font-size: 14px;">📍 <strong>Τοποθεσία:</strong> ${competition.location}</p>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 24px; text-align: center;">
              <img src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/email-assets/email-icon-white.png" alt="Icon" style="height: 40px; margin-bottom: 8px;" />
              <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Νέος Αγώνας - Άνοιξαν οι Δηλώσεις!</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; color: #333;">Αγαπητέ/ή ${coach.name},</p>
              
              <p style="font-size: 14px; color: #333; line-height: 1.6;">
                Σας ενημερώνουμε ότι ο αγώνας <strong>"${competition.name}"</strong> της <strong>${federationName}</strong> είναι πλέον ανοιχτός για δηλώσεις αθλητών.
              </p>

              <div style="background: #f9f9f9; border-left: 4px solid #000; padding: 16px; margin: 20px 0;">
                <p style="margin: 8px 0; font-size: 14px;">🏆 <strong>Αγώνας:</strong> ${competition.name}</p>
                <p style="margin: 8px 0; font-size: 14px;">📆 <strong>Ημερομηνία:</strong> ${formatDate(competition.competition_date)}${competition.end_date ? ` - ${formatDate(competition.end_date)}` : ''}</p>
                ${locationInfo}
                ${deadlineInfo}
                ${lateDeadlineInfo}
              </div>

              <p style="font-size: 14px; color: #333; line-height: 1.6;">
                Μπορείτε να δηλώσετε τους αθλητές σας μέσω της πλατφόρμας στη σελίδα <strong>Αγώνες</strong>.
              </p>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://www.hyperkids.gr/dashboard/coach-competitions" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: bold;">
                  Δήλωση Αθλητών
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; padding: 20px 24px; text-align: center; position: relative;">
              <img src="https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/email-assets/email-logo.png" alt="Logo" style="height: 30px; opacity: 0.5;" />
              <p style="font-size: 11px; color: #999; margin-top: 8px;">Αυτό το email στάλθηκε αυτόματα από την πλατφόρμα HyperKids</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const res: any = await resend.emails.send({
          from: "HyperKids <noreply@hyperkids.gr>",
          to: [coach.email],
          subject: `🏆 Νέος Αγώνας: ${competition.name} - Άνοιξαν οι δηλώσεις!`,
          html,
        });

        if (res?.error) {
          console.error(`❌ Email failed for ${coach.email}: ${res.error?.message}`);
          results.push({ success: false, email: coach.email, error: res.error?.message });
        } else {
          console.log(`✅ Email sent to ${coach.email}`);
          results.push({ success: true, email: coach.email });
        }
      } catch (error: any) {
        console.error(`❌ Email exception for ${coach.email}: ${error?.message}`);
        results.push({ success: false, email: coach.email, error: error?.message });
      }

      // Rate limiting delay
      await sleep(550);
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`📊 Results: ${sent} sent, ${failed} failed`);

    return new Response(JSON.stringify({ sent, failed, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
