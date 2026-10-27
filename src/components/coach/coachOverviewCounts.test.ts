/// <reference types="node" />
import { describe, it as test } from "node:test";
import { strictEqual } from "node:assert";
import { loadCoachOverviewCounts } from "./coachOverviewCounts";

const coachId = "coach-one";
const today = "2026-10-27";
function fixture() {
  const rows: Record<string, Record<string, unknown>[]> = {
    app_users: [{ id: "u1", coach_id: coachId }, { id: "u2", coach_id: coachId }, { id: "other", coach_id: "coach-two" }],
    coach_subscriptions: [
      { id: "s1", coach_id: coachId, status: "active", is_paused: false, start_date: today, end_date: today },
      { id: "s2", coach_id: coachId, status: "expired", is_paused: false, start_date: today, end_date: today },
      { id: "s3", coach_id: coachId, status: "active", is_paused: true, start_date: today, end_date: today },
      { id: "s4", coach_id: coachId, status: "active", is_paused: false, start_date: "2026-10-01", end_date: "2026-10-26" },
      { id: "s5", coach_id: coachId, status: "active", is_paused: false, start_date: "2026-10-28", end_date: "2026-11-28" },
      { id: "s6", coach_id: "coach-two", status: "active", is_paused: false, start_date: today, end_date: today },
    ],
    program_assignments: [{ id: "p1", coach_id: coachId, status: "active" }, { id: "p2", coach_id: coachId, status: "completed" }, { id: "p3", coach_id: "coach-two", status: "active" }],
    coach_strength_test_sessions: Array.from({ length: 1001 }, (_, i) => ({ id: String(i), user_id: "u1", coach_id: coachId })).concat([{ id: "1001", user_id: "u2", coach_id: coachId }]),
    coach_jump_test_sessions: [{ id: "j1", user_id: "u1", coach_id: coachId }, { id: "j2", user_id: "other", coach_id: coachId }],
  };
  const client = {
    from(table: string) {
      let data = [...(rows[table] ?? [])];
      const query = {
        select: (..._args: unknown[]) => query,
        eq(key: string, value: unknown) { data = data.filter(row => row[key] === value); return query; },
        lte(key: string, value: string) { data = data.filter(row => String(row[key]) <= value); return query; },
        gte(key: string, value: string) { data = data.filter(row => String(row[key]) >= value); return query; },
        order: (..._args: unknown[]) => query,
        range(start: number, end: number) { data = data.slice(start, end + 1); return query; },
        then(resolve: (value: unknown) => unknown) { return Promise.resolve({ data, count: data.length, error: null }).then(resolve); },
      };
      return query;
    },
  };
  return client as unknown as Parameters<typeof loadCoachOverviewCounts>[2];
}

describe("coach overview counts", () => {
  test("counts only the coach's registered athletes", async () => {
    strictEqual((await loadCoachOverviewCounts(coachId, today, fixture())).athletes, 2);
  });
  test("counts currently active, unpaused subscriptions including today's expiry", async () => {
    strictEqual((await loadCoachOverviewCounts(coachId, today, fixture())).subscriptions, 1);
  });
  test("counts active assignments, not completed or another coach's assignments", async () => {
    strictEqual((await loadCoachOverviewCounts(coachId, today, fixture())).programs, 1);
  });
  test("counts unique registered users across test types and beyond 1000 sessions", async () => {
    strictEqual((await loadCoachOverviewCounts(coachId, today, fixture())).testedAthletes, 2);
  });
});