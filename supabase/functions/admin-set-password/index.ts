import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const translate = (msg?: string) => {
  if (!msg) return "Αποτυχία ορισμού κωδικού";
  if (/weak|easy to guess|pwned|leaked/i.test(msg)) return "Ο κωδικός είναι πολύ εύκολος/γνωστός. Διάλεξε πιο δύσκολο (γράμματα, αριθμούς, σύμβολα).";
  if (/at least/i.test(msg)) return "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες";
  return msg;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("initial-login-link-v2", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Authentication service unavailable" }, 500);
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ error: "Invalid authentication" }, 401);

    const { data: caller } = await admin.from("app_users").select("id, role").eq("auth_user_id", user.id).maybeSingle();
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;

    const { appUserId, password } = await req.json();
    if (!appUserId || typeof password !== "string" || password.length < 8) {
      return json({ error: "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες" });
    }

    const { data: target } = await admin.from("app_users").select("id, email, name, auth_user_id, coach_id").eq("id", appUserId).maybeSingle();
    if (!target) return json({ error: "Ο χρήστης δεν βρέθηκε" }, 404);

    // Coaches may set the initial password only for their own athletes that have no login yet
    const isOwningCoach = !!caller?.id && target.coach_id === caller.id && !target.auth_user_id;
    if (!isAdmin && !isOwningCoach) return json({ error: "Forbidden" }, 403);

    let authUserId = target.auth_user_id as string | null;

    if (!authUserId) {
      if (!target.email) return json({ error: "Ο χρήστης δεν έχει email" }, 400);
      const email = target.email.trim().toLowerCase();
      console.log("initial-login-link-v3: creating Auth with protected profile link");
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: target.name },
        app_metadata: { app_user_id: target.id },
      });

      if (createErr || !created.user) {
        console.error("createUser failed:", createErr?.message);
        // An Auth account with this email may already exist (e.g. earlier attempt)
        if (/already|registered|exists/i.test(createErr?.message || "")) {
          let existing: any = null;
          for (let page = 1; page <= 20 && !existing; page++) {
            const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
            if (!list || list.users.length < 1000) break;
          }
          if (!existing) return json({ error: translate(createErr?.message) });
          const { data: owner } = await admin.from("app_users").select("id").eq("auth_user_id", existing.id).maybeSingle();
          if (owner && owner.id !== target.id) {
            return json({ error: "Υπάρχει ήδη άλλος λογαριασμός με αυτό το email" });
          }
          authUserId = existing.id;
          await admin.from("app_users").update({ auth_user_id: authUserId }).eq("id", target.id);
        } else {
          return json({ error: translate(createErr?.message) });
        }
      } else {
        authUserId = created.user.id;
        const { data: linked } = await admin.from("app_users")
          .select("auth_user_id").eq("id", appUserId).single();
        if (linked?.auth_user_id === authUserId) return json({ success: true, created: true });
        // Fallback: link directly and drop any duplicate profile created for this login
        await admin.from("app_users").delete().eq("auth_user_id", authUserId).neq("id", target.id);
        const { error: linkErr } = await admin.from("app_users").update({ auth_user_id: authUserId }).eq("id", target.id);
        if (linkErr) return json({ error: linkErr.message }, 500);
        return json({ success: true, created: true });
      }
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
    if (updErr) return json({ error: translate(updErr.message) });

    console.log(`🔑 Admin ${user.id} set password for app_user ${appUserId}`);
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
