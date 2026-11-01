import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const translate = (msg?: string) => {
  if (!msg) return "Αποτυχία ορισμού κωδικού";
  if (/weak|easy to guess|pwned|leaked/i.test(msg)) return "Ο κωδικός είναι πολύ εύκολος/γνωστός. Διάλεξε πιο δύσκολο (γράμματα, αριθμούς, σύμβολα).";
  if (/at least/i.test(msg)) return "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες";
  return msg;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ error: "Invalid authentication" }, 401);

    const { data: caller } = await admin.from("app_users").select("role").eq("auth_user_id", user.id).maybeSingle();
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (caller?.role !== "admin" && !roleRow) return json({ error: "Forbidden - Admin access required" }, 403);

    const { appUserId, password } = await req.json();
    if (!appUserId || typeof password !== "string" || password.length < 8) {
      return json({ error: "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες" });
    }

    const { data: target } = await admin.from("app_users").select("id, email, name, auth_user_id").eq("id", appUserId).maybeSingle();
    if (!target) return json({ error: "Ο χρήστης δεν βρέθηκε" }, 404);

    let authUserId = target.auth_user_id as string | null;

    if (!authUserId) {
      if (!target.email) return json({ error: "Ο χρήστης δεν έχει email" }, 400);
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: target.email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name: target.name },
      });
      if (createErr || !created.user) return json({ error: translate(createErr?.message) });
      authUserId = created.user.id;
      await admin.from("app_users").update({ auth_user_id: authUserId }).eq("id", appUserId);
      return json({ success: true, created: true });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
    if (updErr) return json({ error: translate(updErr.message) });

    console.log(`🔑 Admin ${user.id} set password for app_user ${appUserId}`);
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
