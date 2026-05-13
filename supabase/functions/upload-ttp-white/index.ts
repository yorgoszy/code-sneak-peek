import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { base64 } = await req.json();
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase.storage.from("branding").upload(
      "trust-the-process-white.png",
      bytes,
      { contentType: "image/png", upsert: true }
    );
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
