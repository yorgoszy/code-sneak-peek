import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { files } = await req.json();
    // files: [{ name: string, base64: string, contentType: string }]

    const results = [];

    for (const file of files) {
      const uint8Array = base64Decode(file.base64);

      const { data, error } = await supabase.storage
        .from("email-assets")
        .upload(file.name, uint8Array, {
          contentType: file.contentType || "image/png",
          upsert: true,
        });

      if (error) {
        results.push({ name: file.name, error: error.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("email-assets")
        .getPublicUrl(file.name);

      results.push({ name: file.name, publicUrl: urlData.publicUrl });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
