import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const competition_id: string | undefined = body.competition_id || body.record?.competition_id;
    const ring_number = body.ring_number ?? body.record?.ring_number;
    const youtube_live_url: string | undefined = body.youtube_live_url || body.record?.youtube_live_url;
    const event: string = body.event || (youtube_live_url ? "youtube_added" : "ring_update");

    if (!competition_id) {
      return new Response(JSON.stringify({ error: "competition_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch competition info
    const compRes = await fetch(
      `${SUPABASE_URL}/rest/v1/federation_competitions?id=eq.${competition_id}&select=id,name,competition_date,location`,
      { headers: sbHeaders }
    );
    const comps = await compRes.json();
    const comp = Array.isArray(comps) && comps[0];
    if (!comp) {
      return new Response(JSON.stringify({ error: "competition not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch leads who want YouTube notifications and haven't been notified yet
    const leadsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_competition_leads?competition_id=eq.${competition_id}&notify_youtube=eq.true&notified_youtube_at=is.null&email=not.is.null&select=id,name,email`,
      { headers: sbHeaders }
    );
    const leads = await leadsRes.json();
    if (!Array.isArray(leads) || leads.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "no leads to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const errors: string[] = [];
    const subject = `📺 Live link διαθέσιμο — ${comp.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#fff; padding:24px;">
        <h2 style="color:#000; margin:0 0 12px;">Το live ξεκινάει!</h2>
        <p style="color:#333; line-height:1.5;">Γεια σου,</p>
        <p style="color:#333; line-height:1.5;">Μόλις ανακοινώθηκε το live link για τη διοργάνωση <strong>${comp.name}</strong> (${comp.competition_date}, ${comp.location || ""}).</p>
        ${youtube_live_url ? `<p style="margin: 24px 0;"><a href="${youtube_live_url}" style="background:#000; color:#fff; padding:12px 20px; text-decoration:none; display:inline-block;">▶ Παρακολούθηση Ring ${ring_number || ""}</a></p>` : ""}
        <p style="color:#666; font-size:13px; margin-top:32px;">Hyper AI · HYPERKIDS / RID ATHLETICS</p>
      </div>
    `;

    if (RESEND_API_KEY) {
      for (const lead of leads) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "HYPERKIDS <noreply@hyperkids.gr>",
              to: [lead.email],
              subject,
              html,
            }),
          });
          if (r.ok) {
            sent++;
            // mark notified
            await fetch(`${SUPABASE_URL}/rest/v1/ai_competition_leads?id=eq.${lead.id}`, {
              method: "PATCH",
              headers: sbHeaders,
              body: JSON.stringify({ notified_youtube_at: new Date().toISOString() }),
            });
          } else {
            errors.push(`${lead.email}: ${await r.text()}`);
          }
        } catch (e) {
          errors.push(`${lead.email}: ${String(e)}`);
        }
      }
    } else {
      errors.push("RESEND_API_KEY missing — emails not sent");
    }

    return new Response(JSON.stringify({ ok: true, sent, total: leads.length, event, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-ring-leads error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
