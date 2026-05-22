import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: any) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

interface Req {
  gift_card_id?: string;
  create?: {
    card_type?: "amount" | "subscription";
    amount?: number;
    subscription_type_id?: string;
    sender_name?: string;
    sender_email?: string;
    recipient_name?: string;
    recipient_email: string;
    message?: string;
    expiry_months?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: Req = await req.json();

    let gc: any;
    if (body.gift_card_id) {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*, subscription_types(name)")
        .eq("id", body.gift_card_id)
        .single();
      if (error || !data) throw new Error("Gift card not found");
      gc = data;
    } else if (body.create) {
      const c = body.create;
      if (!c.recipient_email) throw new Error("recipient_email required");
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_gift_card_code");
      if (codeErr) throw codeErr;

      let amount = c.amount ?? null;
      if (c.subscription_type_id && amount == null) {
        const { data: st } = await supabase
          .from("subscription_types").select("price").eq("id", c.subscription_type_id).single();
        amount = st?.price ?? null;
      }
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (c.expiry_months || 3));

      const ins = {
        code: codeData,
        card_type: c.card_type || (c.subscription_type_id ? "subscription" : "amount"),
        amount,
        subscription_type_id: c.subscription_type_id || null,
        sender_name: c.sender_name || null,
        sender_email: c.sender_email || null,
        recipient_name: c.recipient_name || null,
        recipient_email: c.recipient_email,
        message: c.message || null,
        status: "active",
        purchase_method: "manual",
        expires_at: expiresAt.toISOString(),
      };
      const { data: inserted, error: insErr } = await supabase
        .from("gift_cards")
        .insert(ins)
        .select("*, subscription_types(name)")
        .single();
      if (insErr) throw insErr;
      gc = inserted;
    } else {
      throw new Error("Provide gift_card_id or create");
    }

    if (!gc.recipient_email) throw new Error("Recipient email missing");

    const subName = (gc as any).subscription_types?.name || null;
    const expiry = gc.expires_at ? new Date(gc.expires_at).toLocaleDateString("el-GR") : "";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
      `https://hyperkids.lovable.app/redeem?code=${gc.code}`
    )}`;

    const html = `<!DOCTYPE html>
<html lang="el"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Δωροκάρτα HYPERKIDS</title>
<style>
  body{margin:0;padding:0;}
  table{border-collapse:collapse;}
  img{border:0;display:block;max-width:100%;height:auto;}
  .gc-wrap{width:540px;max-width:100%;}
  .gc-card{height:269px;}
  @media only screen and (max-width:600px){
    .gc-wrap{width:100% !important;}
    .gc-outer{padding:12px 6px !important;}
    .gc-pad{padding:16px 16px 4px 16px !important;}
    .gc-pad-x{padding:0 10px 16px 10px !important;}
    .gc-card{height:auto !important;}
    .gc-card-tl{padding:14px 14px 6px 14px !important;}
    .gc-card-code{padding:10px 10px !important;}
    .gc-card-bl{padding:6px 14px 14px 14px !important;font-size:10px !important;}
    .gc-card-br{padding:6px 14px 14px 14px !important;}
    .gc-amount{font-size:20px !important;}
    .gc-code{font-size:14px !important;letter-spacing:3px !important;}
    .gc-brand{font-size:14px !important;letter-spacing:1px !important;}
    .gc-qr{width:64px !important;height:64px !important;}
    .gc-footer{font-size:10px !important;padding:14px 12px !important;line-height:1.5 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="gc-outer" style="background:#f5f5f5;padding:20px 8px;">
    <tr><td align="center">
      <table class="gc-wrap" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #000;">
        <tr><td class="gc-pad" style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 14px 0;font-size:14px;color:#333;">Γεια σου ${esc(gc.recipient_name || "")},</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#333;line-height:1.5;">
            Έχεις λάβει μια δωροκάρτα HYPERKIDS${gc.sender_name ? ` από <b>${esc(gc.sender_name)}</b>` : ""}.
          </p>
          ${gc.message ? `<p style="margin:0 0 18px 0;font-size:14px;color:#111;font-style:italic;border-left:3px solid #000;padding:8px 12px;background:#fafafa;">${esc(gc.message)}</p>` : ""}
        </td></tr>
        <tr><td class="gc-pad-x" style="padding:0 28px 28px 28px;">
          <table width="100%" height="269" cellpadding="0" cellspacing="0" border="0" class="gc-card" style="height:269px;background:#0a0a0a;background-image:linear-gradient(135deg,#0a0a0a 0%,#1f1f1f 40%,#050505 100%);border:1px solid #000;">
            <tr>
              <td class="gc-card-tl" style="padding:24px 24px 12px 24px;" valign="top" width="50%">
                <span class="gc-brand" style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">HYPERKIDS</span>
              </td>
              <td class="gc-card-tr" style="padding:24px 24px 12px 24px;text-align:right;" valign="top" width="50%">
                <span class="gc-amount" style="color:#ffffff;font-size:26px;font-weight:bold;">€${gc.amount || 0}</span>
              </td>
            </tr>
            <tr><td colspan="2" align="center" class="gc-card-code" style="padding:18px 24px;">
              <span class="gc-code" style="color:#ffffff;font-family:'Courier New',monospace;letter-spacing:6px;font-size:18px;">${esc(gc.code)}</span>
            </td></tr>
            <tr>
              <td class="gc-card-bl" style="padding:12px 24px 24px 24px;color:#d4d1c9;font-size:11px;line-height:1.6;" valign="bottom" width="65%">
                <div style="color:#ffffff;font-weight:bold;letter-spacing:2px;font-size:12px;margin-bottom:6px;">GIFT CARD</div>
                ${gc.sender_name ? `<div>Από: ${esc(gc.sender_name)}</div>` : ""}
                ${subName ? `<div>Συνδρομή · ${esc(subName)}</div>` : ""}
                ${expiry ? `<div>Ισχύει έως: ${esc(expiry)}</div>` : ""}
              </td>
              <td class="gc-card-br" style="padding:12px 24px 24px 24px;text-align:right;" valign="bottom" width="35%">
                <img src="${qrUrl}" alt="QR" class="gc-qr" width="90" height="90" style="background:#fff;padding:6px;display:inline-block;">
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="gc-pad-x" style="padding:0 28px 28px 28px;font-size:13px;color:#333;line-height:1.6;">
          <p style="margin:0 0 8px 0;"><b>Κωδικός:</b> <span style="font-family:'Courier New',monospace;">${esc(gc.code)}</span></p>
          <p style="margin:0 0 8px 0;"><b>Αξία:</b> €${gc.amount || 0}${subName ? ` · ${esc(subName)}` : ""}</p>
          ${expiry ? `<p style="margin:0 0 14px 0;"><b>Ισχύει έως:</b> ${esc(expiry)}</p>` : ""}
          <p style="margin:14px 0 0 0;font-size:12px;color:#666;">Για εξαργύρωση επικοινώνησε με το HYPERKIDS ή σκάναρε τον QR.</p>
        </td></tr>
        <tr><td class="gc-footer" style="padding:18px 28px;background:#000;color:#fff;font-size:11px;text-align:center;">
          HYPERKIDS · Αν. Γεωργίου 46, Θεσσαλονίκη · +30 2310 529104 · info@hyperkids.gr
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: "HYPERKIDS <noreply@hyperkids.gr>",
      to: [gc.recipient_email],
      subject: `Έχεις λάβει μια δωροκάρτα HYPERKIDS · €${gc.amount || 0}`,
      html,
    });

    console.log("Email sent:", JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, gift_card: gc, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-gift-card-email error:", e?.message, e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
