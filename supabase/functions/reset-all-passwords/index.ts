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

    const defaultPassword = 'Hyperkids2025@!';
    let successful = 0;
    let failed = 0;
    
    for (const user of users.users) {
      try {
        // Ενημέρωση κωδικού με συγκεκριμένο password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { 
            password: defaultPassword,
            email_confirm: true // Βεβαιώνουμε ότι το email είναι επιβεβαιωμένο
          }
        );

        if (updateError) {
          console.error(`❌ Failed to update password for ${user.email}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Updated password for ${user.email}`);
          successful++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${user.email}:`, err);
        failed++;
      }
    }

    console.log(`🔧 Password reset completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Επαναφορά κωδικών ολοκληρώθηκε! Νέος κωδικός για όλους: ${defaultPassword}`,
        total: users.users.length,
        successful,
        failed,
        password: defaultPassword
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