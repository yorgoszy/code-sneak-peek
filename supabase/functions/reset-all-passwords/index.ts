import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = 'https://dicwdviufetibnafzipa.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  adminKey: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminKey }: ResetRequest = await req.json();
    
    // Simple admin verification
    if (adminKey !== 'HYPERKIDS_ADMIN_RESET_2025') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('🔧 Starting password reset for all users...');

    // Λήψη όλων των χρηστών
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`🔧 Found ${users.users.length} users to reset`);

    const results = [];
    
    for (const user of users.users) {
      try {
        // Απλή επαναφορά κωδικού - θα δημιουργήσει νέο temporary password
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: user.email || '',
          options: {
            redirectTo: `${supabaseUrl}/auth/callback?type=recovery`
          }
        });

        if (resetError) {
          console.error(`❌ Failed to reset password for ${user.email}:`, resetError);
          results.push({ email: user.email, status: 'failed', error: resetError.message });
        } else {
          console.log(`✅ Password reset initiated for ${user.email}`);
          results.push({ email: user.email, status: 'success' });
        }
      } catch (err) {
        console.error(`❌ Error processing ${user.email}:`, err);
        results.push({ email: user.email, status: 'error', error: String(err) });
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);