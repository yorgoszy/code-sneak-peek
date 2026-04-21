// One-shot bulk import for e-kouros sports/federations/clubs.
// SECURITY: requires the caller to provide an admin secret token. Delete after use.
// v2 - trigger redeploy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
};

interface Payload {
  adminToken: string;
  sports?: { name: string; name_normalized: string }[];
  federations?: { name: string; name_normalized: string }[];
  clubs?: {
    gga_code: string;
    name: string;
    name_normalized: string;
    sports_text: string | null;
    registration_date: string | null;
  }[];
  clubSports?: { gga_code: string; sport_name: string }[];
  clubFederations?: { gga_code: string; federation_name: string }[];
  truncate?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ADMIN_TOKEN = Deno.env.get("EKOUROS_IMPORT_TOKEN");
    if (!ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "EKOUROS_IMPORT_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;
    if (body.adminToken !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const result: Record<string, unknown> = {};

    if (body.truncate) {
      // Wipe in FK-safe order
      await sb.from("ekouros_club_sports").delete().neq("club_id", "00000000-0000-0000-0000-000000000000");
      await sb.from("ekouros_club_federations").delete().neq("club_id", "00000000-0000-0000-0000-000000000000");
      await sb.from("ekouros_clubs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("ekouros_sports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("ekouros_federations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      result.truncated = true;
    }

    if (body.sports?.length) {
      const { error, count } = await sb
        .from("ekouros_sports")
        .upsert(body.sports, { onConflict: "name", count: "exact" });
      if (error) throw new Error("sports: " + error.message);
      result.sports = count ?? body.sports.length;
    }

    if (body.federations?.length) {
      const { error, count } = await sb
        .from("ekouros_federations")
        .upsert(body.federations, { onConflict: "name", count: "exact" });
      if (error) throw new Error("federations: " + error.message);
      result.federations = count ?? body.federations.length;
    }

    if (body.clubs?.length) {
      const { error, count } = await sb
        .from("ekouros_clubs")
        .upsert(body.clubs, { onConflict: "gga_code", count: "exact" });
      if (error) throw new Error("clubs: " + error.message);
      result.clubs = count ?? body.clubs.length;
    }

    if (body.clubSports?.length) {
      // Resolve IDs
      const codes = [...new Set(body.clubSports.map((x) => x.gga_code))];
      const sportNames = [...new Set(body.clubSports.map((x) => x.sport_name))];
      const [{ data: clubs }, { data: sports }] = await Promise.all([
        sb.from("ekouros_clubs").select("id,gga_code").in("gga_code", codes),
        sb.from("ekouros_sports").select("id,name").in("name", sportNames),
      ]);
      const clubMap = new Map((clubs ?? []).map((c) => [c.gga_code, c.id]));
      const sportMap = new Map((sports ?? []).map((s) => [s.name, s.id]));
      const rows = body.clubSports
        .map((x) => ({
          club_id: clubMap.get(x.gga_code),
          sport_id: sportMap.get(x.sport_name),
        }))
        .filter((r) => r.club_id && r.sport_id);
      const { error, count } = await sb
        .from("ekouros_club_sports")
        .upsert(rows, { onConflict: "club_id,sport_id", count: "exact", ignoreDuplicates: true });
      if (error) throw new Error("club_sports: " + error.message);
      result.club_sports = count ?? rows.length;
    }

    if (body.clubFederations?.length) {
      const codes = [...new Set(body.clubFederations.map((x) => x.gga_code))];
      const fedNames = [...new Set(body.clubFederations.map((x) => x.federation_name))];
      const [{ data: clubs }, { data: feds }] = await Promise.all([
        sb.from("ekouros_clubs").select("id,gga_code").in("gga_code", codes),
        sb.from("ekouros_federations").select("id,name").in("name", fedNames),
      ]);
      const clubMap = new Map((clubs ?? []).map((c) => [c.gga_code, c.id]));
      const fedMap = new Map((feds ?? []).map((f) => [f.name, f.id]));
      const rows = body.clubFederations
        .map((x) => ({
          club_id: clubMap.get(x.gga_code),
          federation_id: fedMap.get(x.federation_name),
        }))
        .filter((r) => r.club_id && r.federation_id);
      const { error, count } = await sb
        .from("ekouros_club_federations")
        .upsert(rows, { onConflict: "club_id,federation_id", count: "exact", ignoreDuplicates: true });
      if (error) throw new Error("club_federations: " + error.message);
      result.club_federations = count ?? rows.length;
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("ekouros-import error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
