import type { supabase } from "@/integrations/supabase/client";

export interface CoachOverviewCounts {
  athletes: number;
  subscriptions: number;
  programs: number;
  testedAthletes: number;
}

const testTables = [
  "coach_strength_test_sessions",
  "coach_anthropometric_test_sessions",
  "coach_endurance_test_sessions",
  "coach_jump_test_sessions",
  "coach_functional_test_sessions",
] as const;

export async function loadCoachOverviewCounts(
  coachId: string,
  today: string,
  client: typeof supabase,
): Promise<CoachOverviewCounts> {
  // Page identifiers so counts are not limited by PostgREST's default 1,000 rows.
  const loadAthletes = async () => {
    const ids = new Set<string>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.from("app_users").select("id")
        .eq("coach_id", coachId).order("id").range(offset, offset + 999);
      if (error) throw error;
      for (const row of data ?? []) ids.add(row.id);
      if ((data?.length ?? 0) < 1000) return ids;
    }
  };

  const loadTestUsers = async (table: typeof testTables[number]) => {
    const ids = new Set<string>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.from(table).select("id, user_id")
        .eq("coach_id", coachId).order("id").range(offset, offset + 999);
      if (error) throw error;
      for (const row of data ?? []) if (row.user_id) ids.add(row.user_id);
      if ((data?.length ?? 0) < 1000) return ids;
    }
  };

  const [athletes, subscriptions, programs, testUsers] = await Promise.all([
    loadAthletes(),
    client.from("coach_subscriptions").select("id", { count: "exact", head: true })
      .eq("coach_id", coachId).eq("status", "active").eq("is_paused", false)
      .lte("start_date", today).gte("end_date", today),
    client.from("program_assignments").select("id", { count: "exact", head: true })
      .eq("coach_id", coachId).eq("status", "active"),
    Promise.all(testTables.map(loadTestUsers)),
  ]);
  if (subscriptions.error) throw subscriptions.error;
  if (programs.error) throw programs.error;
  const tested = new Set(testUsers.flatMap(ids => [...ids]).filter(id => athletes.has(id)));
  return {
    athletes: athletes.size,
    subscriptions: subscriptions.count ?? 0,
    programs: programs.count ?? 0,
    testedAthletes: tested.size,
  };
}