import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "yorgoszy@gmail.com";
const BASE_URL = "https://dicwdviufetibnafzipa.supabase.co/functions/v1/trial-request-action";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trialRequestId } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tr, error } = await supabase
      .from("trial_requests")
      .select("*, booking_sections(name)")
      .eq("id", trialRequestId)
      .single();

    if (error || !tr) throw new Error(error?.message || "Not found");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const approveUrl = `${BASE_URL}?id=${tr.id}&token=${tr.action_token}&action=approve`;
    const rejectUrl = `${BASE_URL}?id=${tr.id}&token=${tr.action_token}&action=reject`;

    const sectionName = (tr as any).booking_sections?.name || "—";
    const dateStr = tr.preferred_date ? new Date(tr.preferred_date).toLocaleDateString("el-GR") : "—";
    const timeStr = tr.preferred_time ? String(tr.preferred_time).slice(0, 5) : "—";

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #000;padding:30px">
    <h2 style="margin:0 0 20px">Νέο αίτημα δοκιμαστικού</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Όνομα:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${tr.name}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Email:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${tr.email}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Τηλέφωνο:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${tr.phone || "—"}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Τμήμα:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${sectionName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Ημερομηνία:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${dateStr}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Ώρα:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${timeStr}</td></tr>
      ${tr.message ? `<tr><td style="padding:8px;border-bottom:1px solid #eee" valign="top"><b>Μήνυμα:</b></td><td style="padding:8px;border-bottom:1px solid #eee">${tr.message}</td></tr>` : ""}
    </table>
    <div style="margin-top:30px;text-align:center">
      <a href="${approveUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;margin:0 8px;font-weight:bold">✓ ΑΠΟΔΟΧΗ</a>
      <a href="${rejectUrl}" style="display:inline-block;background:#fff;color:#000;padding:14px 28px;text-decoration:none;margin:0 8px;font-weight:bold;border:2px solid #000">✗ ΑΠΟΡΡΙΨΗ</a>
    </div>
    <p style="font-size:12px;color:#666;margin-top:30px;text-align:center">HYPERKIDS · Trial Request System</p>
  </div>
</body></html>`;

    await resend.emails.send({
      from: "HYPERKIDS <noreply@hyperkids.gr>",
      to: [ADMIN_EMAIL],
      subject: `Νέο αίτημα δοκιμαστικού — ${tr.name}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trial-request-notify error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
