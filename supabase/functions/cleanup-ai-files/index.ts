import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting AI chat files cleanup...');

    // Get expired files
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('ai_chat_files')
      .select('id, file_path')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      throw new Error(`Error fetching expired files: ${fetchError.message}`);
    }

    console.log(`📁 Found ${expiredFiles?.length || 0} expired files`);

    if (expiredFiles && expiredFiles.length > 0) {
      // Delete files from storage
      const filePaths = expiredFiles.map(f => f.file_path);
      const { error: deleteStorageError } = await supabase.storage
        .from('ai-chat-files')
        .remove(filePaths);

      if (deleteStorageError) {
        console.error('❌ Error deleting files from storage:', deleteStorageError);
      } else {
        console.log('✅ Deleted files from storage');
      }

      // Delete records from database
      const fileIds = expiredFiles.map(f => f.id);
      const { error: deleteDbError } = await supabase
        .from('ai_chat_files')
        .delete()
        .in('id', fileIds);

      if (deleteDbError) {
        console.error('❌ Error deleting records from database:', deleteDbError);
      } else {
        console.log('✅ Deleted records from database');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      cleaned: expiredFiles?.length || 0,
      message: `Cleaned up ${expiredFiles?.length || 0} expired files`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Cleanup error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});