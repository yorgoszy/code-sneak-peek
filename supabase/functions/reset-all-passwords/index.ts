import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseServiceKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    // Verify caller authentication via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verify caller's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if caller is admin
    const { data: callerProfile } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`🔧 Admin ${user.id} starting password reset for all users...`);

    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`🔧 Found ${users.users.length} users to reset`);

    const results = [];
    
    for (const u of users.users) {
      try {
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: u.email || '',
          options: {
            redirectTo: `${supabaseUrl}/auth/callback?type=recovery`
          }
        });

        if (resetError) {
          console.error(`❌ Failed to reset password for ${u.email}:`, resetError);
          results.push({ email: u.email, status: 'failed', error: resetError.message });
        } else {
          console.log(`✅ Password reset initiated for ${u.email}`);
          results.push({ email: u.email, status: 'success' });
        }
      } catch (err) {
        console.error(`❌ Error processing ${u.email}:`, err);
        results.push({ email: u.email, status: 'error', error: String(err) });
      }
    }

    console.log('🔧 Password reset process completed');

    return new Response(
      JSON.stringify({ 
        message: 'Password reset process completed',
        results,
        total: users.users.length,
        successful: results.filter(r => r.status === 'success').length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("❌ Error in reset-all-passwords function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
