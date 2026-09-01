import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { createTrialBooking } from "../_shared/trialBooking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://hyperkids.lovable.app";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// The Supabase functions gateway serves responses as text/plain, so HTML pages
// show up as raw source in the browser. Redirect to an app page instead.
const redirectPage = (state: string, message: string, name = "", extra: Record<string, string> = {}) => {
  const url = new URL(`${APP_URL}/trial-response`);
  url.searchParams.set("state", state);
  if (name) url.searchParams.set("name", name);
  if (message) url.searchParams.set("message", message);
  Object.entries(extra).forEach(([k, v]) => v && url.searchParams.set(k, v));
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url.toString() } });
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const isPost = req.method === "POST";

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    let token = url.searchParams.get("token");
    let action = url.searchParams.get("action");
    let response = url.searchParams.get("response") || "";

    if (isPost) {
      const body = await req.json().catch(() => ({}));
      id = body.id ?? id;
      token = body.token ?? token;
      action = body.action ?? action;
      response = body.response ?? response;
    }

    const validAction = ["approve", "reject", "fetch"].includes(action || "");
    if (!id || !token || !validAction) {
      return isPost
        ? json({ error: "invalid_link" }, 400)
        : redirectPage("info", "Μη έγκυρος σύνδεσμος.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tr, error } = await supabase
      .from("trial_requests")
      .select("*, booking_sections(name)")
      .eq("id", id)
      .eq("action_token", token)
      .maybeSingle();

    if (error || !tr) {
      const msg = "Το αίτημα δεν βρέθηκε ή ο σύνδεσμος δεν είναι έγκυρος.";
      return isPost ? json({ error: msg }, 404) : redirectPage("info", msg);
    }

    const details = {
      name: tr.name,
      email: tr.email,
      phone: tr.phone,
      section: (tr as any).booking_sections?.name || null,
      preferred_date: tr.preferred_date,
      preferred_time: tr.preferred_time ? String(tr.preferred_time).slice(0, 5) : null,
      message: tr.message,
      status: tr.status,
    };

    // Read-only lookup used by the confirmation screen.
    if (action === "fetch") return json({ request: details });

    // GET links (from the admin email) never execute directly — the admin must
    // confirm on the app page first, so the booking is created only after approval.
    if (!isPost) {
      return redirectPage("confirm", "", tr.name || "", {
        id,
        token,
        action: action!,
      });
    }

    if (tr.status !== "pending") {
      return json({
        state: tr.status === "approved" ? "approved" : "rejected",
        request: details,
        message: `Το αίτημα έχει ήδη ${tr.status === "approved" ? "εγκριθεί" : "απορριφθεί"}.`,
      });
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

    // Create the actual booking ONLY after the approval is confirmed
    if (newStatus === "approved") {
      try {
        await createTrialBooking(supabase, tr);
      } catch (e) {
        console.error("trial booking creation failed", e);
      }
    }

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

    return json({
      state: newStatus,
      request: { ...details, status: newStatus },
      message:
        newStatus === "approved"
          ? "Το αίτημα εγκρίθηκε, ο χρήστης ειδοποιήθηκε και η κράτηση καταχωρήθηκε."
          : "Το αίτημα απορρίφθηκε και ο χρήστης ειδοποιήθηκε.",
    });
  } catch (e) {
    console.error("trial-request-action error", e);
    return isPost ? json({ error: String(e) }, 500) : redirectPage("info", `Σφάλμα: ${String(e)}`);
  }
});
