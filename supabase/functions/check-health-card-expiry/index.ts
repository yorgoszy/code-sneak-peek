import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date 30 days from now
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    console.log("🔍 Checking health cards expiring between", todayStr, "and", thirtyDaysStr);

    // Find health cards that expire within 30 days and haven't been notified
    const { data: expiringCards, error: cardsError } = await supabase
      .from('health_cards')
      .select(`
        *,
        app_users!inner(id, name, email)
      `)
      .lte('end_date', thirtyDaysStr)
      .gte('end_date', todayStr)
      .eq('notification_sent', false);

    if (cardsError) {
      console.error("❌ Error fetching expiring cards:", cardsError);
      throw cardsError;
    }

    console.log(`📊 Found ${expiringCards?.length || 0} expiring health cards`);

    if (!expiringCards || expiringCards.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No expiring health cards to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if Resend is configured
    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY not configured - skipping email notifications");
      console.log("Would have notified:", expiringCards.map(c => c.app_users?.email));
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "RESEND_API_KEY not configured - notifications skipped",
          would_notify: expiringCards.length
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    let notifiedCount = 0;
    const errors: string[] = [];

    for (const card of expiringCards) {
      const user = card.app_users;
      if (!user?.email) {
        console.log(`⚠️ No email for user ${card.user_id}`);
        continue;
      }

      const endDate = new Date(card.end_date);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = endDate.toLocaleDateString('el-GR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });

      console.log(`📧 Sending notification to ${user.email} - expires in ${daysLeft} days`);

      try {
        const emailResponse = await resend.emails.send({
          from: "HYPERKIDS <noreply@hyperkids.gr>",
          to: [user.email],
          subject: `⚠️ Η κάρτα υγείας σου λήγει σε ${daysLeft} ημέρες`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00ffba 0%, #00d4a4 100%); padding: 30px; text-align: center; }
                .header h1 { color: #000; margin: 0; font-size: 24px; }
                .content { padding: 30px; background: #f9f9f9; }
                .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .info-label { color: #666; }
                .info-value { font-weight: bold; }
                .cta-button { display: inline-block; background: #00ffba; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Ανανέωση Κάρτας Υγείας</h1>
                </div>
                <div class="content">
                  <p>Γεια σου <strong>${user.name}</strong>,</p>
                  
                  <div class="warning-box">
                    <strong>Η κάρτα υγείας σου λήγει ${daysLeft === 0 ? 'σήμερα' : `σε ${daysLeft} ημέρες`}!</strong>
                  </div>
                  
                  <p>Η κάρτα υγείας σου λήγει στις <strong>${formattedDate}</strong>.</p>
                  
                  <p>Για να συνεχίσεις να συμμετέχεις στις προπονήσεις, παρακαλούμε να ανανεώσεις την κάρτα υγείας σου.</p>
                  
                  <p><strong>Τι πρέπει να κάνεις:</strong></p>
                  <ol>
                    <li>Επισκέψου έναν γιατρό για νέα ιατρική βεβαίωση</li>
                    <li>Ανέβασε τη νέα βεβαίωση στο προφίλ σου</li>
                  </ol>
                  
                  <a href="https://www.hyperkids.gr/dashboard" class="cta-button">
                    Ανέβασε τη νέα κάρτα υγείας
                  </a>
                  
                  <p>Αν έχεις ήδη ανανεώσει την κάρτα σου, αγνόησε αυτό το μήνυμα.</p>
                </div>
                <div class="footer">
                  <p>Με αθλητικούς χαιρετισμούς,<br>Η ομάδα HYPERKIDS</p>
                  <p>© ${new Date().getFullYear()} HYPERKIDS. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log("✅ Email sent successfully:", emailResponse);

        // Mark as notified
        const { error: updateError } = await supabase
          .from('health_cards')
          .update({ notification_sent: true })
          .eq('id', card.id);

        if (updateError) {
          console.error("⚠️ Error updating notification_sent:", updateError);
          errors.push(`Failed to update notification status for ${user.email}`);
        } else {
          notifiedCount++;
        }
      } catch (emailError) {
        console.error(`❌ Error sending email to ${user.email}:`, emailError);
        errors.push(`Failed to send email to ${user.email}: ${emailError}`);
      }
    }

    console.log(`📊 Summary: ${notifiedCount} notifications sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: notifiedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("❌ Error in check-health-card-expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
