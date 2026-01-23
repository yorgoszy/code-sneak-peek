import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoachWelcomeRequest {
  email: string;
  name: string;
}

serve(async (req) => {
  console.log(`🎉 send-coach-welcome function started - Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, name }: CoachWelcomeRequest = await req.json();

    if (!email || !name) {
      console.log("❌ Email and name are required");
      return new Response(JSON.stringify({ error: "Email and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📧 Sending coach welcome email to:", email, "Name:", name);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #000000; border-radius: 0; }
    .header { background: linear-gradient(135deg, #00ffba 0%, #00d4a0 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #000000; margin: 0; font-size: 28px; font-weight: bold; }
    .header p { color: #000000; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8; }
    .content { padding: 40px 30px; color: #ffffff; }
    .welcome-text { font-size: 18px; line-height: 1.6; margin-bottom: 30px; }
    .feature-box { background-color: #1a1a1a; border-left: 4px solid #00ffba; padding: 20px; margin: 20px 0; }
    .feature-box h3 { color: #00ffba; margin: 0 0 10px 0; font-size: 16px; }
    .feature-box p { color: #aca097; margin: 0; font-size: 14px; line-height: 1.5; }
    .features-grid { margin: 30px 0; }
    .cta-button { display: inline-block; background-color: #00ffba; color: #000000; padding: 15px 40px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .cta-button:hover { background-color: #00d4a0; }
    .footer { background-color: #1a1a1a; padding: 30px; text-align: center; color: #aca097; font-size: 12px; }
    .footer a { color: #00ffba; text-decoration: none; }
    .gold-text { color: #cb8954; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Καλώς ήρθες στο HYPERKIDS!</h1>
      <p>Η πλατφόρμα για επαγγελματίες προπονητές</p>
    </div>
    
    <div class="content">
      <p class="welcome-text">
        Γεια σου <strong>${name}</strong>! 👋<br><br>
        Η εγγραφή σου ολοκληρώθηκε με επιτυχία. Είμαστε ενθουσιασμένοι που σε έχουμε στην κοινότητα των προπονητών του HYPERKIDS!
      </p>

      <div class="features-grid">
        <div class="feature-box">
          <h3>📊 Διαχείριση Αθλητών</h3>
          <p>Πρόσθεσε και διαχειρίσου τους αθλητές σου με εύκολο τρόπο. Παρακολούθησε την πρόοδό τους και κράτα σημειώσεις.</p>
        </div>

        <div class="feature-box">
          <h3>📋 Εξατομικευμένα Προγράμματα</h3>
          <p>Δημιούργησε προσαρμοσμένα προγράμματα προπόνησης για κάθε αθλητή σου με την τράπεζα ασκήσεων.</p>
        </div>

        <div class="feature-box">
          <h3>📈 Tests & Αξιολογήσεις</h3>
          <p>Καταγραφή αποτελεσμάτων τεστ (δύναμη, αντοχή, κινητικότητα, σωματομετρικά) με ιστορικό και γραφήματα.</p>
        </div>

        <div class="feature-box">
          <h3>💰 Οικονομική Διαχείριση</h3>
          <p>Συνδρομές, πληρωμές και αποδείξεις - όλα σε ένα μέρος για να έχεις πλήρη εικόνα.</p>
        </div>

        <div class="feature-box">
          <h3>📚 Κέντρο Γνώσης</h3>
          <p>Πρόσβαση σε επαγγελματικά courses για συνεχή εκπαίδευση και ανάπτυξη.</p>
        </div>
      </div>

      <p style="color: #aca097; font-size: 14px; line-height: 1.6;">
        <span class="gold-text">💡 Επόμενο βήμα:</span> Επιβεβαίωσε το email σου πατώντας τον σύνδεσμο που θα λάβεις και στη συνέχεια συνδέσου στην πλατφόρμα για να ξεκινήσεις!
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://www.hyperkids.gr/auth" class="cta-button">Σύνδεση στην Πλατφόρμα</a>
      </div>

      <p style="color: #aca097; font-size: 14px; margin-top: 30px;">
        Αν έχεις οποιαδήποτε ερώτηση ή χρειάζεσαι βοήθεια, είμαστε εδώ για σένα!
      </p>
    </div>
    
    <div class="footer">
      <p>© 2024 HYPERKIDS - Όλα τα δικαιώματα διατηρούνται</p>
      <p><a href="https://www.hyperkids.gr">www.hyperkids.gr</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "HYPERKIDS <noreply@hyperkids.gr>",
      to: [email],
      subject: "🎉 Καλώς ήρθες στο HYPERKIDS Coach Platform!",
      html: emailHtml,
    });

    console.log("✅ Coach welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error sending coach welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
