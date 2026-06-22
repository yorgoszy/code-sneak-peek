import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { id, status, response } = await req.json();
    if (!id || !status) throw new Error("Missing params");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: tr, error } = await supabase
      .from("trial_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !tr) throw new Error(error?.message || "Not found");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const dateStr = tr.preferred_date ? new Date(tr.preferred_date).toLocaleDateString("el-GR") : "";
    const timeStr = tr.preferred_time ? String(tr.preferred_time).slice(0, 5) : "";
    const subject =
      status === "approved"
        ? "Το δοκιμαστικό σου επιβεβαιώθηκε — HYPERKIDS"
        : "Σχετικά με το αίτημά σου — HYPERKIDS";
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #000;padding:30px">
    <h2 style="margin:0 0 20px">${status === "approved" ? "Εγκρίθηκε ✓" : "Ενημέρωση αιτήματος"}</h2>
    <p>Γεια σου ${tr.name},</p>
    <p>${response}</p>
    ${dateStr ? `<p><b>Ημερομηνία:</b> ${dateStr} ${timeStr}</p>` : ""}
    <p style="margin-top:30px;color:#666;font-size:12px">HYPERKIDS</p>
  </div>
</body></html>`;
    await resend.emails.send({
      from: "HYPERKIDS <noreply@hyperkids.gr>",
      to: [tr.email],
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trial-request-user-email error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
