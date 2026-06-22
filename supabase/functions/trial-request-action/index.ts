import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const renderPage = (title: string, body: string, color = "#000") => `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:40px;text-align:center">
  <div style="max-width:500px;margin:0 auto;background:#fff;border:2px solid ${color};padding:40px">
    <h1 style="color:${color};margin:0 0 20px">${title}</h1>
    <p style="color:#333;font-size:16px">${body}</p>
  </div>
</body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    let response = url.searchParams.get("response") || "";

    if (!id || !token || !["approve", "reject"].includes(action || "")) {
      return new Response(renderPage("Σφάλμα", "Μη έγκυρος σύνδεσμος.", "#c00"), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tr, error } = await supabase
      .from("trial_requests")
      .select("*")
      .eq("id", id)
      .eq("action_token", token)
      .maybeSingle();

    if (error || !tr) {
      return new Response(renderPage("Σφάλμα", "Το αίτημα δεν βρέθηκε ή ο σύνδεσμος δεν είναι έγκυρος.", "#c00"), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (tr.status !== "pending") {
      return new Response(
        renderPage(
          "Έχει ήδη απαντηθεί",
          `Το αίτημα έχει ήδη ${tr.status === "approved" ? "εγκριθεί" : "απορριφθεί"}.`,
          "#999"
        ),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    if (!response) {
      response =
        action === "approve"
          ? "Το αίτημά σου εγκρίθηκε! Σε περιμένουμε την προγραμματισμένη ώρα."
          : "Δυστυχώς δεν είναι δυνατόν αυτή την ώρα. Παρακαλώ επικοινώνησε μαζί μας για άλλο ραντεβού.";
    }

    const { error: updErr } = await supabase
      .from("trial_requests")
      .update({
        status: newStatus,
        admin_response: response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updErr) throw updErr;

    // Email user
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const dateStr = tr.preferred_date ? new Date(tr.preferred_date).toLocaleDateString("el-GR") : "";
      const timeStr = tr.preferred_time ? String(tr.preferred_time).slice(0, 5) : "";
      const subject =
        newStatus === "approved"
          ? "Το δοκιμαστικό σου επιβεβαιώθηκε — HYPERKIDS"
          : "Σχετικά με το αίτημά σου — HYPERKIDS";
      const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #000;padding:30px">
    <h2 style="margin:0 0 20px">${newStatus === "approved" ? "Εγκρίθηκε ✓" : "Ενημέρωση αιτήματος"}</h2>
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
    } catch (e) {
      console.error("user email failed", e);
    }

    return new Response(
      renderPage(
        newStatus === "approved" ? "Εγκρίθηκε ✓" : "Απορρίφθηκε",
        `Το αίτημα του ${tr.name} έχει ενημερωθεί και ο χρήστης ειδοποιήθηκε.`,
        newStatus === "approved" ? "#000" : "#666"
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("trial-request-action error", e);
    return new Response(renderPage("Σφάλμα", String(e), "#c00"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
