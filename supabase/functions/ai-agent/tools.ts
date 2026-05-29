// Tool registry for ai-agent edge function
// deno-lint-ignore-file no-explicit-any

export interface ToolContext {
  appUserId: string;
  authUserId: string;
  role: string;
  mode: "admin" | "coach" | "athlete" | "general";
  // service-role client (full DB access)
  admin: any;
  // user-scoped client (RLS enforced)
  user: any;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: any; // Gemini function declaration schema
  requiresConfirmation?: (args: any) => boolean;
  riskLevel?: (args: any) => "low" | "medium" | "high" | "critical";
  describe?: (args: any) => string;
  execute: (args: any, ctx: ToolContext) => Promise<any>;
  allowedModes: Array<"admin" | "coach" | "athlete" | "general">;
}

const SENSITIVE_TABLES = new Set([
  "app_users",
  "programs",
  "subscriptions",
  "coach_subscriptions",
  "payments",
  "gift_cards",
  "performance_bands",
]);

const SAFE_TABLE_RE = /^[a-z_][a-z0-9_]*$/;

function applyFilters(q: any, filters: Record<string, any> | undefined) {
  if (!filters) return q;
  for (const [k, v] of Object.entries(filters)) {
    if (k.endsWith("_after")) q = q.gte(k.slice(0, -6), v);
    else if (k.endsWith("_before")) q = q.lte(k.slice(0, -7), v);
    else if (k.endsWith("_like")) q = q.ilike(k.slice(0, -5), `%${v}%`);
    else if (Array.isArray(v)) q = q.in(k, v);
    else if (v === null) q = q.is(k, null);
    else q = q.eq(k, v);
  }
  return q;
}

export const TOOLS: ToolDef[] = [
  // ---------- ADMIN ----------
  {
    name: "query_table",
    description: "Διαβάζει εγγραφές από οποιοδήποτε public table. Επιστρέφει JSON.",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string", description: "Όνομα του public table." },
        filters: { type: "object", description: "Φίλτρα. Suffix _after/_before/_like ή ίσο." },
        limit: { type: "integer", description: "Max rows (default 50, hard cap 500)." },
        order_by: { type: "string", description: "Στήλη για ταξινόμηση, prefix '-' για desc." },
      },
      required: ["table"],
    },
    allowedModes: ["admin"],
    async execute(args, ctx) {
      const table: string = args.table;
      if (!SAFE_TABLE_RE.test(table)) throw new Error("Invalid table name");
      const limit = Math.min(args.limit ?? 50, 500);
      let q: any = ctx.admin.from(table).select("*").limit(limit);
      q = applyFilters(q, args.filters);
      if (args.order_by) {
        const desc = args.order_by.startsWith("-");
        const col = desc ? args.order_by.slice(1) : args.order_by;
        q = q.order(col, { ascending: !desc });
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { rows: data, count: data?.length ?? 0 };
    },
  },
  {
    name: "aggregate_query",
    description: "Group aggregations. Υλοποιείται με fetch + JS aggregation (μέχρι 5000 rows).",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string" },
        group_by: { type: "array", items: { type: "string" } },
        metrics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              column: { type: "string" },
              op: { type: "string", enum: ["count", "sum", "avg", "min", "max"] },
            },
            required: ["op"],
          },
        },
        filters: { type: "object" },
      },
      required: ["table", "group_by", "metrics"],
    },
    allowedModes: ["admin"],
    async execute(args, ctx) {
      const table: string = args.table;
      if (!SAFE_TABLE_RE.test(table)) throw new Error("Invalid table name");
      let q: any = ctx.admin.from(table).select("*").limit(5000);
      q = applyFilters(q, args.filters);
      const { data, error } = await q;
      if (error) return { error: error.message };
      const groups = new Map<string, any[]>();
      for (const row of data || []) {
        const key = (args.group_by as string[]).map((g) => String(row[g] ?? "∅")).join("|");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      const results: any[] = [];
      for (const [key, rows] of groups) {
        const obj: any = {};
        (args.group_by as string[]).forEach((g, i) => (obj[g] = key.split("|")[i]));
        for (const m of args.metrics as any[]) {
          const col = m.column;
          if (m.op === "count") obj[`count`] = rows.length;
          else {
            const vals = rows.map((r) => Number(r[col])).filter((n) => !isNaN(n));
            if (m.op === "sum") obj[`sum_${col}`] = vals.reduce((a, b) => a + b, 0);
            if (m.op === "avg") obj[`avg_${col}`] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            if (m.op === "min") obj[`min_${col}`] = Math.min(...vals);
            if (m.op === "max") obj[`max_${col}`] = Math.max(...vals);
          }
        }
        results.push(obj);
      }
      return { groups: results };
    },
  },
  {
    name: "search_users",
    description: "Αναζήτηση χρηστών (app_users) με όνομα ή email.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "integer" },
      },
      required: ["query"],
    },
    allowedModes: ["admin"],
    async execute(args, ctx) {
      const q = args.query as string;
      const limit = Math.min(args.limit ?? 20, 100);
      const { data, error } = await ctx.admin
        .from("app_users")
        .select("id, first_name, last_name, email, role, created_at")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(limit);
      if (error) return { error: error.message };
      return { users: data };
    },
  },
  {
    name: "delete_rows",
    description: "Διαγραφή εγγραφών. ΑΠΑΙΤΕΙ CONFIRMATION.",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string" },
        ids: { type: "array", items: { type: "string" } },
        reason: { type: "string", description: "Σύντομος λόγος διαγραφής (για το audit log)." },
      },
      required: ["table", "ids", "reason"],
    },
    allowedModes: ["admin"],
    requiresConfirmation: () => true,
    riskLevel: () => "high",
    describe: (a) => `Διαγραφή ${a.ids?.length ?? 0} εγγραφών από \`${a.table}\`. Λόγος: ${a.reason}`,
    async execute(args, ctx) {
      const table: string = args.table;
      if (!SAFE_TABLE_RE.test(table)) throw new Error("Invalid table name");
      const { error, count } = await ctx.admin.from(table).delete({ count: "exact" }).in("id", args.ids);
      if (error) return { error: error.message };
      return { deleted: count };
    },
  },
  {
    name: "update_row",
    description: "Ενημέρωση μίας εγγραφής. Sensitive tables απαιτούν confirmation.",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string" },
        id: { type: "string" },
        data: { type: "object" },
        reason: { type: "string" },
      },
      required: ["table", "id", "data", "reason"],
    },
    allowedModes: ["admin"],
    requiresConfirmation: (a) => SENSITIVE_TABLES.has(a.table),
    riskLevel: (a) => (SENSITIVE_TABLES.has(a.table) ? "medium" : "low"),
    describe: (a) =>
      `Ενημέρωση εγγραφής ${a.id} στο \`${a.table}\` με πεδία: ${Object.keys(a.data || {}).join(", ")}. Λόγος: ${a.reason}`,
    async execute(args, ctx) {
      const table: string = args.table;
      if (!SAFE_TABLE_RE.test(table)) throw new Error("Invalid table name");
      const { data, error } = await ctx.admin
        .from(table)
        .update(args.data)
        .eq("id", args.id)
        .select("*")
        .maybeSingle();
      if (error) return { error: error.message };
      return { updated: data };
    },
  },

  // ---------- COACH ----------
  {
    name: "list_my_athletes",
    description: "Λίστα αθλητών του coach (μέσω coach_users).",
    parameters: { type: "object", properties: {} },
    allowedModes: ["coach", "admin"],
    async execute(_args, ctx) {
      // user-scoped client → RLS scopes to coach automatically
      const { data, error } = await ctx.user
        .from("coach_users")
        .select("user_id, app_users:user_id ( id, first_name, last_name, email )")
        .limit(500);
      if (error) return { error: error.message };
      return { athletes: data };
    },
  },
  {
    name: "get_athlete_summary",
    description: "Σύνοψη αθλητή: στοιχεία, ενεργά προγράμματα, πρόσφατα tests.",
    parameters: {
      type: "object",
      properties: { athlete_id: { type: "string" } },
      required: ["athlete_id"],
    },
    allowedModes: ["coach", "admin", "athlete"],
    async execute(args, ctx) {
      const id = args.athlete_id;
      const [profile, assignments, tests] = await Promise.all([
        ctx.user.from("app_users").select("id, first_name, last_name, email, role, dob, gender").eq("id", id).maybeSingle(),
        ctx.user.from("program_assignments").select("id, program_id, start_date, status").eq("user_id", id).limit(10),
        ctx.user.from("test_sessions").select("id, test_id, created_at, score").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        profile: profile.data,
        active_programs: assignments.data,
        recent_tests: tests.data,
      };
    },
  },
  {
    name: "get_athlete_recent_workouts",
    description: "Πρόσφατες ολοκληρωμένες προπονήσεις αθλητή.",
    parameters: {
      type: "object",
      properties: {
        athlete_id: { type: "string" },
        days: { type: "integer" },
      },
      required: ["athlete_id"],
    },
    allowedModes: ["coach", "admin", "athlete"],
    async execute(args, ctx) {
      const days = args.days ?? 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await ctx.user
        .from("workout_completions")
        .select("id, assignment_id, scheduled_date, status, completed_at")
        .eq("user_id", args.athlete_id)
        .gte("scheduled_date", since.slice(0, 10))
        .order("scheduled_date", { ascending: false })
        .limit(100);
      if (error) return { error: error.message };
      return { workouts: data };
    },
  },

  // ---------- ATHLETE ----------
  {
    name: "get_my_summary",
    description: "Συνοπτικά στοιχεία του τρέχοντος χρήστη.",
    parameters: { type: "object", properties: {} },
    allowedModes: ["athlete", "coach", "admin"],
    async execute(_args, ctx) {
      const { data, error } = await ctx.user
        .from("app_users")
        .select("id, first_name, last_name, email, role, dob, gender")
        .eq("id", ctx.appUserId)
        .maybeSingle();
      if (error) return { error: error.message };
      return { profile: data };
    },
  },
  {
    name: "get_my_recent_workouts",
    description: "Πρόσφατες προπονήσεις του τρέχοντος χρήστη.",
    parameters: {
      type: "object",
      properties: { days: { type: "integer" } },
    },
    allowedModes: ["athlete", "coach", "admin"],
    async execute(args, ctx) {
      const days = args.days ?? 30;
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await ctx.user
        .from("workout_completions")
        .select("id, scheduled_date, status, completed_at")
        .eq("user_id", ctx.appUserId)
        .gte("scheduled_date", since)
        .order("scheduled_date", { ascending: false })
        .limit(100);
      if (error) return { error: error.message };
      return { workouts: data };
    },
  },
  {
    name: "get_my_program",
    description: "Τρέχον ενεργό πρόγραμμα του χρήστη.",
    parameters: { type: "object", properties: {} },
    allowedModes: ["athlete", "coach", "admin"],
    async execute(_args, ctx) {
      const { data, error } = await ctx.user
        .from("program_assignments")
        .select("id, program_id, start_date, status, training_dates, programs(name, description)")
        .eq("user_id", ctx.appUserId)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(5);
      if (error) return { error: error.message };
      return { assignments: data };
    },
  },
];

export function toolsForMode(mode: ToolContext["mode"]) {
  return TOOLS.filter((t) => t.allowedModes.includes(mode));
}

export function findTool(name: string) {
  return TOOLS.find((t) => t.name === name);
}
