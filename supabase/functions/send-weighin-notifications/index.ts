import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WeighInNotificationRequest {
  type: 'weigh_in_started' | 'weigh_in_ended' | 'weigh_in_schedule_announced';
  competition_id: string;
  competition_name: string;
  schedule_date?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithResend = async (
  resend: Resend,
  payload: { from: string; to: string[]; subject: string; html: string },
  recipientEmail: string,
  notificationLabel: string,
) => {
  try {
    const res: any = await resend.emails.send(payload);

    if (res?.error) {
      const errorMessage = res.error?.message || JSON.stringify(res.error);
      console.error(`❌ ${notificationLabel} failed for ${recipientEmail}: ${errorMessage}`);
      return { success: false, email: recipientEmail, error: errorMessage };
    }

    const messageId = res?.data?.id || null;
    console.log(`✅ ${notificationLabel} sent to ${recipientEmail}${messageId ? ` (id: ${messageId})` : ''}`);
    return { success: true, email: recipientEmail, messageId };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown send error';
    console.error(`❌ ${notificationLabel} exception for ${recipientEmail}: ${errorMessage}`);
    return { success: false, email: recipientEmail, error: errorMessage };
  }
};

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

    const { type, competition_id, competition_name, schedule_date, schedule_start_time, schedule_end_time }: WeighInNotificationRequest = await req.json();
    console.log("🔔 Weigh-in notification:", { type, competition_id, competition_name });

    // Get all registered athletes and their clubs for this competition
    const { data: registrations, error: regError } = await supabaseClient
      .from('federation_competition_registrations')
      .select(`
        athlete_id,
        club_id,
        weigh_in_status,
        weigh_in_weight,
        athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, email),
        club:app_users!federation_competition_registrations_club_id_fkey(name, email),
        category:federation_competition_categories(name)
      `)
      .eq('competition_id', competition_id);

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) {
      return new Response(JSON.stringify({ message: "No registrations found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Collect unique emails (athletes + clubs)
    const emailRecipients = new Map<string, { name: string; email: string }>();
    
    for (const reg of registrations) {
      const athlete = reg.athlete as any;
      const club = reg.club as any;
      
      if (athlete?.email) {
        emailRecipients.set(athlete.email, { name: athlete.name, email: athlete.email });
      }
      if (club?.email) {
        emailRecipients.set(club.email, { name: club.name, email: club.email });
      }
    }

    // Also include federation organizer email
    const { data: competition } = await supabaseClient
      .from('federation_competitions')
      .select('federation_id, federation:app_users!federation_competitions_federation_id_fkey(name, email)')
      .eq('id', competition_id)
      .single();
    
    if (competition) {
      const fed = competition.federation as any;
      if (fed?.email) {
        emailRecipients.set(fed.email, { name: fed.name, email: fed.email });
      }
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://www.hyperkids.gr";
    const assetsUrl = "https://hyperkids.lovable.app";

    if (type === 'weigh_in_started') {
      // Send "weigh-in started" email
      const recipients = Array.from(emailRecipients.values());
      const results = [] as any[];

      for (const recipient of recipients) {
        const sendResult = await sendEmailWithResend(
          resend,
          {
            from: "HYPERKIDS <noreply@hyperkids.gr>",
            to: [recipient.email],
            subject: `⚖️ Έναρξη Ζύγισης: ${competition_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
                <div style="background: #000; padding: 20px 30px;">
                  <img src="${assetsUrl}/images/email-icon-white.png" alt="HYPERKIDS" style="height: 32px; width: auto;" />
                </div>
                <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #000; margin: 0 0 5px 0; font-size: 22px;">⚖️ Έναρξη Ζύγισης</h2>
                  <p style="color: #000; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                    Γεια σας <strong>${recipient.name}</strong>!
                  </p>
                  <p style="color: #333; font-size: 15px; line-height: 1.6;">
                    Η ζύγιση για τον αγώνα <strong>"${competition_name}"</strong> ξεκίνησε!
                  </p>
                  <p style="color: #333; font-size: 14px;">
                    Παρακαλούμε προσέλθετε στο χώρο ζύγισης με τα απαραίτητα δικαιολογητικά.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${siteUrl}/dashboard/weigh-in" 
                       style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      Δείτε τη Ζύγιση
                    </a>
                  </div>
                </div>
                <div style="padding: 15px 30px; border-top: 1px solid #e0e0e0;">
                  <img src="${assetsUrl}/images/email-logo.png" alt="HYPERKIDS" style="height: 12px; width: auto; opacity: 0.4;" />
                </div>
              </div>
            `,
          },
          recipient.email,
          'Start email'
        );
        results.push(sendResult);
        await sleep(550);
      }

      return new Response(JSON.stringify({ message: "Weigh-in start notifications sent", results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (type === 'weigh_in_ended') {
      // Build results summary
      const passed = registrations.filter(r => r.weigh_in_status === 'passed');
      const failed = registrations.filter(r => r.weigh_in_status === 'failed');
      const pending = registrations.filter(r => !r.weigh_in_status || r.weigh_in_status === 'pending');

      const resultsHtml = `
        <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #000;">
          <h3 style="margin: 0 0 10px 0; color: #000;">📊 Αποτελέσματα Ζύγισης</h3>
          <p style="margin: 5px 0; color: #333;">✅ Επιτυχημένες: <strong>${passed.length}</strong></p>
          <p style="margin: 5px 0; color: #333;">❌ Αποτυχημένες: <strong>${failed.length}</strong></p>
          <p style="margin: 5px 0; color: #333;">⏳ Εκκρεμούν: <strong>${pending.length}</strong></p>
          <p style="margin: 5px 0; color: #333;">📋 Σύνολο: <strong>${registrations.length}</strong></p>
        </div>
      `;

      const recipients = Array.from(emailRecipients.values());
      const results = [] as any[];

      for (const recipient of recipients) {
        const sendResult = await sendEmailWithResend(
          resend,
          {
            from: "HYPERKIDS <noreply@hyperkids.gr>",
            to: [recipient.email],
            subject: `⚖️ Λήξη Ζύγισης: ${competition_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
                <div style="background: #000; padding: 20px 30px;">
                  <img src="${assetsUrl}/images/email-icon-white.png" alt="HYPERKIDS" style="height: 32px; width: auto;" />
                </div>
                <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #000; margin: 0 0 5px 0; font-size: 22px;">⚖️ Λήξη Ζύγισης</h2>
                  <p style="color: #000; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                    Γεια σας <strong>${recipient.name}</strong>!
                  </p>
                  <p style="color: #333; font-size: 15px; line-height: 1.6;">
                    Η ζύγιση για τον αγώνα <strong>"${competition_name}"</strong> ολοκληρώθηκε!
                  </p>
                  ${resultsHtml}
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${siteUrl}/dashboard/weigh-in" 
                       style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      Δείτε τα Αποτελέσματα
                    </a>
                  </div>
                </div>
                <div style="padding: 15px 30px; border-top: 1px solid #e0e0e0;">
                  <img src="${assetsUrl}/images/email-logo.png" alt="HYPERKIDS" style="height: 12px; width: auto; opacity: 0.4;" />
                </div>
              </div>
            `,
          },
          recipient.email,
          'End email'
        );
        results.push(sendResult);
        await sleep(550);
      }

      return new Response(JSON.stringify({ message: "Weigh-in end notifications sent", results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (type === 'weigh_in_schedule_announced') {
      // Format date and time for display
      const formattedDate = schedule_date 
        ? new Date(schedule_date + 'T00:00:00').toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'Δεν έχει οριστεί';
      const timeRange = (schedule_start_time && schedule_end_time) 
        ? `${schedule_start_time} - ${schedule_end_time}` 
        : 'Δεν έχει οριστεί';

      const recipients = Array.from(emailRecipients.values());
      const results = [] as any[];

      for (const recipient of recipients) {
        const sendResult = await sendEmailWithResend(
          resend,
          {
            from: "HYPERKIDS <noreply@hyperkids.gr>",
            to: [recipient.email],
            subject: `📅 Πρόγραμμα Ζύγισης: ${competition_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
                <div style="background: #000; padding: 20px 30px;">
                  <img src="${assetsUrl}/images/email-icon-white.png" alt="HYPERKIDS" style="height: 32px; width: auto;" />
                </div>
                <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #000; margin: 0 0 5px 0; font-size: 22px;">📅 Πρόγραμμα Ζύγισης</h2>
                  <p style="color: #000; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                    Γεια σας <strong>${recipient.name}</strong>!
                  </p>
                  <p style="color: #333; font-size: 15px; line-height: 1.6;">
                    Ανακοινώθηκε το πρόγραμμα ζύγισης για τον αγώνα <strong>"${competition_name}"</strong>.
                  </p>
                  <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #000;">
                    <p style="margin: 5px 0; color: #000; font-size: 15px;">📅 <strong>Ημερομηνία:</strong> ${formattedDate}</p>
                    <p style="margin: 5px 0; color: #000; font-size: 15px;">🕐 <strong>Ώρες:</strong> ${timeRange}</p>
                  </div>
                  <p style="color: #333; font-size: 14px;">
                    Παρακαλούμε προσέλθετε στο χώρο ζύγισης εντός του προγράμματος με τα απαραίτητα δικαιολογητικά.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${siteUrl}/dashboard/weigh-in" 
                       style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      Δείτε τη Ζύγιση
                    </a>
                  </div>
                </div>
                <div style="padding: 15px 30px; border-top: 1px solid #e0e0e0;">
                  <img src="${assetsUrl}/images/email-logo.png" alt="HYPERKIDS" style="height: 12px; width: auto; opacity: 0.4;" />
                </div>
              </div>
            `,
          },
          recipient.email,
          'Schedule email'
        );
        results.push(sendResult);
        await sleep(550);
      }

      return new Response(JSON.stringify({ message: "Weigh-in schedule notifications sent", results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("💥 Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
