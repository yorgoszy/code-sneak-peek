import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("Auth admin request sends the protected existing profile ID", async () => {
  const profileId = "671bbc8d-616f-491b-b7a9-d328de36067c";
  let sentMetadata: unknown;
  const client = createClient("https://example.supabase.co", "test-only-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        sentMetadata = body.app_metadata;
        return new Response(JSON.stringify({ id: "test-auth-id" }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  await client.auth.admin.createUser({
    email: "regression@example.invalid",
    password: "Test-only-password-123",
    email_confirm: true,
    app_metadata: { app_user_id: profileId },
  });
  assertEquals(sentMetadata, { app_user_id: profileId });
});