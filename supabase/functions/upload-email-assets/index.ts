import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Download images from lovable app and upload to storage
    const assets = [
      { url: "https://hyperkids.lovable.app/images/email-icon-white.png", name: "icon-white.png" },
      { url: "https://hyperkids.lovable.app/images/email-logo.png", name: "logo-black.png" },
    ];

    const results = [];

    for (const asset of assets) {
      const response = await fetch(asset.url);
      if (!response.ok) {
        results.push({ name: asset.name, error: `Failed to fetch: ${response.status}` });
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { data, error } = await supabase.storage
        .from("email-assets")
        .upload(asset.name, uint8Array, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        results.push({ name: asset.name, error: error.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("email-assets")
        .getPublicUrl(asset.name);

      results.push({ name: asset.name, publicUrl: urlData.publicUrl });
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
