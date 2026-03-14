import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RingAssignmentRequest {
  competition_id: string;
  competition_name: string;
  rings: { ring_name: string; match_range_start: number; match_range_end: number }[];
}

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

    const { competition_id, competition_name, rings }: RingAssignmentRequest = await req.json();
    console.log("🔔 Ring assignment notification:", { competition_id, competition_name, rings });

    // Get all registered athletes and their clubs
    const { data: registrations, error: regError } = await supabaseClient
      .from('federation_competition_registrations')
      .select(`
        athlete_id,
        club_id,
        athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, email),
        club:app_users!federation_competition_registrations_club_id_fkey(name, email)
      `)
      .eq('competition_id', competition_id);

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) {
      return new Response(JSON.stringify({ message: "No registrations found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Collect unique emails
    const emailRecipients = new Map<string, { name: string; email: string }>();
    for (const reg of registrations) {
      const athlete = reg.athlete as any;
      const club = reg.club as any;
      if (athlete?.email) emailRecipients.set(athlete.email, { name: athlete.name, email: athlete.email });
      if (club?.email) emailRecipients.set(club.email, { name: club.name, email: club.email });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://hyperkids.lovable.app";
    const assetsUrl = "https://hyperkids.lovable.app";

    // Build ring assignment table
    const ringRows = rings
      .filter(r => r.match_range_start && r.match_range_end)
      .map(r => `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #eee; font-weight: bold;">${r.ring_name}</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #eee; text-align: center;">Αγώνες #${r.match_range_start} - #${r.match_range_end}</td>
        </tr>
      `).join('');

    const subject = `🥊 Πρόγραμμα Ρινγκ - ${competition_name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#000;padding:24px;text-align:center;">
            <img src="${assetsUrl}/email-icon-white.png" alt="Icon" style="width:40px;height:40px;" />
          </div>
          <div style="padding:32px 24px;">
            <h1 style="font-size:22px;margin:0 0 8px;color:#000;">Πρόγραμμα Ρινγκ</h1>
            <p style="font-size:14px;color:#666;margin:0 0 24px;">${competition_name}</p>
            
            <p style="font-size:14px;color:#333;margin:0 0 16px;">
              Οι αγώνες έχουν ανατεθεί στα παρακάτω ρινγκ:
            </p>

            <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border:1px solid #eee;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:10px 16px;text-align:left;border-bottom:2px solid #000;font-size:13px;">ΡΙΝΓΚ</th>
                  <th style="padding:10px 16px;text-align:center;border-bottom:2px solid #000;font-size:13px;">ΑΓΩΝΕΣ</th>
                </tr>
              </thead>
              <tbody>
                ${ringRows}
              </tbody>
            </table>

            <div style="text-align:center;margin:24px 0;">
              <a href="${siteUrl}/dashboard/federation-fight-card" 
                 style="display:inline-block;background:#000;color:#fff;padding:12px 32px;text-decoration:none;font-size:14px;font-weight:bold;">
                Δες το Fight Card →
              </a>
            </div>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;align-items:center;gap:8px;">
            <img src="${assetsUrl}/email-logo.png" alt="Logo" style="width:24px;height:24px;opacity:0.5;" />
            <span style="font-size:11px;color:#999;">Powered by HyperTeam</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const recipients = Array.from(emailRecipients.values());
    console.log(`📧 Sending ring assignment email to ${recipients.length} recipients`);

    const results = [];
    for (const recipient of recipients) {
      try {
        const res: any = await resend.emails.send({
          from: "HyperTeam <noreply@hyperkids.gr>",
          to: [recipient.email],
          subject,
          html,
        });
        if (res?.error) {
          console.error(`❌ Failed for ${recipient.email}:`, res.error);
          results.push({ email: recipient.email, success: false, error: res.error?.message });
        } else {
          console.log(`✅ Sent to ${recipient.email}`);
          results.push({ email: recipient.email, success: true });
        }
      } catch (err: any) {
        console.error(`❌ Exception for ${recipient.email}:`, err.message);
        results.push({ email: recipient.email, success: false, error: err.message });
      }
      await sleep(550);
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
