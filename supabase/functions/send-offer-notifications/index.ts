import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  offerId: string;
  offerName: string;
  visibility: string;
  targetUsers?: string[];
  targetGroups?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔔 Send offer notifications function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(resendApiKey);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { offerId, offerName, visibility, targetUsers, targetGroups }: NotificationRequest = await req.json();
    console.log("📧 Processing offer notification:", { offerId, offerName, visibility });

    let usersToNotify: string[] = [];

    // Determine which users to notify based on visibility
    if (visibility === 'all') {
      // Get all active users
      const { data: allUsers, error } = await supabaseClient
        .from('app_users')
        .select('id')
        .eq('user_status', 'active');
      
      if (error) throw error;
      usersToNotify = allUsers?.map(user => user.id) || [];
      console.log("📧 Notifying all users:", usersToNotify.length);

    } else if (visibility === 'individual' || visibility === 'selected') {
      // Use specified target users
      usersToNotify = targetUsers || [];
      console.log("📧 Notifying selected users:", usersToNotify.length);

    } else if (visibility === 'groups' && targetGroups?.length) {
      // Get users from target groups
      const { data: groupUsers, error } = await supabaseClient
        .from('group_members')
        .select('user_id')
        .in('group_id', targetGroups);
      
      if (error) throw error;
      usersToNotify = groupUsers?.map(member => member.user_id) || [];
      console.log("📧 Notifying group users:", usersToNotify.length);
    }

    if (usersToNotify.length === 0) {
      console.log("⚠️ No users to notify");
      return new Response(JSON.stringify({ message: "No users to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user details for email sending
    const { data: users, error: usersError } = await supabaseClient
      .from('app_users')
      .select('id, name, email')
      .in('id', usersToNotify)
      .not('email', 'is', null);

    if (usersError) throw usersError;

    console.log("📧 Sending emails to:", users?.length, "users");

    // Send email to each user
    const emailPromises = users?.map(async (user) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "HyperGym <noreply@hypergym.gr>",
          to: [user.email],
          subject: `🎁 Νέα Ειδική Προσφορά: ${offerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #00ffba, #00d4aa); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #000; margin: 0; font-size: 28px;">🎁 Ειδική Προσφορά</h1>
              </div>
              
              <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Γεια σας ${user.name}!</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Έχουμε μια ειδική προσφορά μόνο για εσάς! Δείτε τη νέα προσφορά <strong>"${offerName}"</strong> που είναι τώρα διαθέσιμη.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00ffba;">
                  <h3 style="color: #333; margin: 0 0 10px 0;">✨ ${offerName}</h3>
                  <p style="color: #666; margin: 0;">Μην χάσετε αυτή την εξαιρετική ευκαιρία!</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get("SITE_URL") || "https://hypergym.gr"}/offers" 
                     style="display: inline-block; background: #00ffba; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Δείτε την Προσφορά
                  </a>
                </div>
                
                <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                  Αυτό το email στάλθηκε από το HyperGym. Αν δεν θέλετε να λαμβάνετε τέτοια emails, επικοινωνήστε μαζί μας.
                </p>
              </div>
            </div>
          `,
        });

        console.log(`✅ Email sent to ${user.email}:`, emailResponse.id);
        return { success: true, userId: user.id, email: user.email };
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
        return { success: false, userId: user.id, email: user.email, error: error.message };
      }
    }) || [];

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 Email results: ${successful} sent, ${failed} failed`);

    return new Response(JSON.stringify({
      message: "Email notifications sent",
      results: {
        total: results.length,
        successful,
        failed,
        details: results
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("💥 Error in send-offer-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);