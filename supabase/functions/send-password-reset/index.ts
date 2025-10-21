import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

serve(async (req) => {
  console.log(`🔥 send-password-reset function started - Method: ${req.method}`);
  
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
    const requestBody = await req.json();
    console.log("📨 Request body:", requestBody);
    
    const { email, redirectTo }: PasswordResetRequest = requestBody;

    if (!email) {
      console.log("❌ Email is required");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Processing password reset for email:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("🔧 Supabase URL:", supabaseUrl ? "Set" : "Missing");
    console.log("🔧 Service Key:", supabaseServiceKey ? "Set" : "Missing");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in app_users table first (case-insensitive)
    console.log("👤 Checking if user exists in app_users (case-insensitive)...");
    const normalizedEmail = email.trim().toLowerCase();
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, email, auth_user_id')
      .ilike('email', normalizedEmail)
      .single();
    
    if (appUserError) {
      console.log("⚠️ User not found in app_users:", email);
      // Return success for security reasons even if user doesn't exist
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User found in app_users:", appUser.email);

    // Check if user has auth_user_id (already has auth account)
    let authUserId = appUser.auth_user_id;
    
    if (!authUserId) {
      console.log("🔄 Creating auth user for existing app_user...");
      // Create auth user for this app_user
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          app_user_id: appUser.id
        }
      });
      
      if (createError) {
        console.log("❌ Error creating auth user:", createError);
        // Return success for security reasons
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      authUserId = authUser.user?.id;
      
      // Update app_user with auth_user_id
      if (authUserId) {
        await supabase
          .from('app_users')
          .update({ auth_user_id: authUserId })
          .eq('id', appUser.id);
        console.log("✅ Updated app_user with auth_user_id");
      }
    } else {
      console.log("✅ User already has auth account");
      
      // Sync email in auth.users with app_users if they differ
      console.log("🔄 Syncing email in auth.users with app_users...");
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        { email: normalizedEmail }
      );
      
      if (updateError) {
        console.log("⚠️ Could not sync email:", updateError);
      } else {
        console.log("✅ Email synced successfully");
      }
    }

    console.log("✅ User found, generating reset link...");

    // Generate password reset link using Supabase with fallbacks
    const redirect = redirectTo || `${new URL(req.url).origin}/auth/reset-password`;
    let linkData: any = null;
    let genError: any = null;

    const tryGenerate = async (target: string) => {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: target,
        options: { redirectTo: redirect }
      });
      return { data, error };
    };

    // Primary attempt with normalized email
    let result = await tryGenerate(normalizedEmail);
    linkData = result.data;
    genError = result.error;

    if (genError) {
      console.log("❌ Error generating link (primary):", genError);
      if ((genError as any).code === 'user_not_found' || (genError as any).status === 404) {
        if (authUserId) {
          console.log("🔎 Fetching auth user by id for fallback...");
          const { data: authUserInfo, error: fetchErr } = await supabase.auth.admin.getUserById(authUserId);
          if (!fetchErr && authUserInfo?.user?.email) {
            console.log("🔁 Retrying generateLink with auth user's email:", authUserInfo.user.email);
            const retry = await tryGenerate(authUserInfo.user.email);
            linkData = retry.data;
            genError = retry.error as any;
          }
        }
      }
    }

    if (genError) {
      console.log("⚠️ Falling back to safe success without email. Reason:", genError);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!linkData?.properties?.action_link) {
      console.log("⚠️ No action link generated (unexpected). Returning safe success.");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔗 Reset link generated successfully");

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("📧 Resend API Key:", resendApiKey ? "Set" : "Missing");
    
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const resend = new Resend(resendApiKey);

    // Send custom email with Resend
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Επαναφορά Κωδικού - HYPERKIDS</title>
        <style>
          body { font-family: 'Robert Pro', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: #00ffba; color: black; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; }
          .button { background: #00ffba; color: black; padding: 15px 30px; text-decoration: none; border-radius: 0; display: inline-block; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HYPERKIDS</div>
            <p>Επαναφορά Κωδικού Πρόσβασης</p>
          </div>
          
          <div class="content">
            <h2>🔐 Αίτηση Επαναφοράς Κωδικού</h2>
            <p>Λάβαμε αίτημα για επαναφορά του κωδικού σας στο λογαριασμό HYPERKIDS.</p>
            
            <p>Κάντε κλικ στο παρακάτω κουμπί για να επαναφέρετε τον κωδικό σας:</p>
            
            <a href="${linkData.properties.action_link}" class="button">Επαναφορά Κωδικού</a>
            
            <div class="warning">
              <strong>⚠️ Σημαντικό:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Αυτό το link θα λήξει σε 1 ώρα</li>
                <li>Μπορεί να χρησιμοποιηθεί μόνο μία φορά</li>
                <li>Αν δεν ζητήσατε αυτή την επαναφορά, αγνοήστε αυτό το email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Αν το κουμπί δεν λειτουργεί, αντιγράψτε και επικολλήστε αυτό το link στον browser σας:<br>
              <a href="${linkData.properties.action_link}" style="word-break: break-all; color: #007cba;">${linkData.properties.action_link}</a>
            </p>
          </div>

          <div class="footer">
            <p>HYPERKIDS - Fitness & Coaching Platform</p>
            <p>Αυτό το email στάλθηκε αυτόματα. Παρακαλώ μην απαντήσετε.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📤 Sending email via Resend...");

    const emailResponse = await resend.emails.send({
      from: "HYPERKIDS <noreply@hyperkids.gr>",
      to: [email],
      subject: "Επαναφορά Κωδικού Πρόσβασης - HYPERKIDS",
      html: emailHTML,
    });

    console.log("📧 Resend response:", emailResponse);

    if (emailResponse.error) {
      console.log("❌ Resend error:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("✅ Password reset email sent successfully to:", email);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Password reset email sent successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("💥 Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});