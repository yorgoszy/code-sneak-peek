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

    // 1) Fast path: exact match (case-insensitive)
    let { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, email, auth_user_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    // 2) Fallback: tolerate accidental spaces in DB (" user@email.com ")
    // We search with a broad pattern and then pick the exact trimmed match in code.
    if (!appUser) {
      console.log("🔎 Fallback lookup (trim-tolerant) for:", normalizedEmail);
      const { data: candidates, error: candidatesError } = await supabase
        .from('app_users')
        .select('id, email, auth_user_id')
        .ilike('email', `%${normalizedEmail}%`)
        .limit(10);

      if (!candidatesError && candidates?.length) {
        appUser = candidates.find(u => (u.email ?? '').trim().toLowerCase() === normalizedEmail) ?? null;
      }

      if (!appUser) {
        appUserError = candidatesError ?? ({ message: 'User not found after fallback' } as any);
      }
    }

    if (!appUser) {
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
      console.log("🔄 No auth_user_id in app_users, checking if auth user exists...");
      
      // First, check if user already exists in auth.users by email
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && existingUsers?.users) {
        const existingAuthUser = existingUsers.users.find(
          u => u.email?.toLowerCase() === normalizedEmail
        );
        
        if (existingAuthUser) {
          console.log("✅ Found existing auth user, linking to app_user...");
          authUserId = existingAuthUser.id;
          
          // Update app_user with auth_user_id
          await supabase
            .from('app_users')
            .update({ auth_user_id: authUserId })
            .eq('id', appUser.id);
          console.log("✅ Linked app_user with existing auth_user_id");
        }
      }
      
      // If still no auth user, create one
      // IMPORTANT: We generate a random password so Supabase does NOT trigger
      // the default "confirm signup" / welcome email flow.
      if (!authUserId) {
        console.log("🔄 Creating new auth user for existing app_user...");
        const randomPassword = crypto.randomUUID() + crypto.randomUUID();
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            app_user_id: appUser.id,
            created_via: 'password_reset_flow'
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
          console.log("✅ Updated app_user with new auth_user_id");
        }
      }
    } else {
      console.log("✅ User already has auth account:", authUserId);
      
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

    // Generate password reset link using Supabase
    // NOTE: We must use a redirect URL that is allow-listed in Supabase Auth > URL Configuration.
    // We accept the redirectTo sent from the frontend ONLY if it matches our allowlist.

    const DEFAULT_REDIRECT = 'https://www.hyperkids.gr/reset-password';

    const isAllowedRedirect = (value: string) => {
      try {
        const url = new URL(value);

        // We allow the reset password route (with or without /auth prefix for backwards compatibility)
        if (url.pathname !== '/reset-password' && url.pathname !== '/auth/reset-password') return false;

        const host = url.hostname.toLowerCase();

        // Production domains
        if (host === 'www.hyperkids.gr' || host === 'hyperkids.gr') return true;

        // Lovable preview domains
        if (host.endsWith('.lovableproject.com') || host.endsWith('.lovable.app')) return true;

        return false;
      } catch {
        return false;
      }
    };

    const safeRedirect = redirectTo && isAllowedRedirect(redirectTo)
      ? redirectTo
      : DEFAULT_REDIRECT;

    console.log("📧 Original redirectTo from request:", redirectTo);
    console.log("🔗 Safe redirect URL:", safeRedirect);

    console.log("✅ User found, generating reset link...");

    let linkData: any = null;
    let genError: any = null;

    const tryGenerate = async (target: string) => {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: target,
        options: {
          redirectTo: safeRedirect,
          // 24 ώρες διάρκεια (86400 δευτερόλεπτα)
          expiresIn: 86400
        }
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

    // Ensure the action link uses the same safe redirect.
    // (Some environments may cause Supabase to fall back to Site URL.)
    const actionLinkUrl = new URL(linkData.properties.action_link);
    actionLinkUrl.searchParams.set('redirect_to', safeRedirect);
    const finalActionLink = actionLinkUrl.toString();

    console.log("🔗 Reset link generated successfully");
    console.log("🔗 Action link (final):", finalActionLink);
    console.log("🔗 Redirect URL:", safeRedirect);

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
          .header { background: #000000; color: white; padding: 30px; text-align: center; }
          .logo { margin-bottom: 10px; }
          .logo img { height: 40px; }
          .content { padding: 30px; }
          .button { background: #000000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 0; display: inline-block; margin: 20px 0; font-weight: bold; }
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
            
            <a href="${finalActionLink}" class="button">Επαναφορά Κωδικού</a>
            
            <div class="warning">
              <strong>⚠️ Σημαντικό:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Αυτό το link θα λήξει σε 24 ώρες</li>
                <li>Μπορεί να χρησιμοποιηθεί μόνο μία φορά</li>
                <li>Αν δεν ζητήσατε αυτή την επαναφορά, αγνοήστε αυτό το email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Αν το κουμπί δεν λειτουργεί, αντιγράψτε και επικολλήστε αυτό το link στον browser σας:<br>
              <a href="${finalActionLink}" style="word-break: break-all; color: #007cba;">${finalActionLink}</a>
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