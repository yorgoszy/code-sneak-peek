import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Deletes a coach's athlete: verifies the caller is admin or the owning coach,
// runs the transactional cleanup RPC with service privileges, then removes the login.
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

    const { appUserId } = await req.json();
    if (!appUserId) return json({ error: "appUserId is required" }, 400);

    const { data: caller } = await admin.from("app_users").select("id").eq("auth_user_id", user.id).maybeSingle();
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const { data: target } = await admin.from("app_users").select("id, auth_user_id, coach_id").eq("id", appUserId).maybeSingle();
    if (!target) return json({ error: "Ο χρήστης δεν βρέθηκε" }, 404);

    const isOwningCoach = !!caller?.id && target.coach_id === caller.id;
    if (!roleRow && !isOwningCoach) return json({ error: "Δεν έχετε δικαίωμα διαγραφής" }, 403);
    if (target.auth_user_id && target.auth_user_id === user.id) return json({ error: "Δεν μπορείτε να διαγράψετε τον εαυτό σας" }, 400);

    const { error: rpcError } = await admin.rpc("admin_delete_athlete", { athlete_id: target.id });
    if (rpcError) {
      console.error("cleanup failed:", rpcError.message);
      return json({ error: rpcError.message }, 500);
    }

    if (target.auth_user_id) {
      await admin.from("user_roles").update({ assigned_by: null }).eq("assigned_by", target.auth_user_id);
      await admin.from("user_roles").delete().eq("user_id", target.auth_user_id);
      const { error: delErr } = await admin.auth.admin.deleteUser(target.auth_user_id);
      if (delErr && !/not found/i.test(delErr.message)) {
        console.error("auth delete failed:", delErr.message);
        return json({ error: `Ο αθλητής διαγράφηκε αλλά όχι ο λογαριασμός σύνδεσης: ${delErr.message}` }, 500);
      }
    }
    console.log(`🗑️ ${user.id} deleted athlete ${target.id}`);
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
