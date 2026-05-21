import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Menu, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";
import { AthleteFilter } from "@/components/ams/AthleteFilter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/hooks/ams/useFeatureFlag";
import { DisabledModuleNotice } from "@/components/ams/DisabledModuleNotice";
import { GameSessionCard } from "@/components/ams/GameSessionCard";
import { RsbTimelineChart } from "@/components/ams/RsbTimelineChart";
import { HsrPhaseCurveChart } from "@/components/ams/HsrPhaseCurveChart";
import { DemandComparisonChart } from "@/components/ams/DemandComparisonChart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SESSION_TYPES = [
  "match",
  "training",
  "ssg",
  "conditioning",
  "skills",
  "rehab",
  "other",
] as const;

type SessionType = (typeof SESSION_TYPES)[number];

interface GameSession {
  id: string;
  athlete_id: string;
  coach_id: string | null;
  session_date: string;
  session_type: SessionType;
  sport: string | null;
  position_or_group: string | null;
  duration_min: number;
  total_distance_m: number | null;
  hsr_distance_m: number | null;
  sprint_distance_m: number | null;
  sprint_count: number | null;
  acc_count: number | null;
  dec_count: number | null;
  hmld_m: number | null;
  max_speed_kmh: number | null;
  relative_distance_m_per_min: number | null;
  hsr_per_min: number | null;
  notes: string | null;
  imported_from: string | null;
  created_at: string;
}

const numOrNull = (v: string) => (v === "" || v == null ? null : Number(v));

const Kpi: React.FC<{ label: string; value: string | number; unit?: string }> = ({
  label,
  value,
  unit,
}) => (
  <Card className="rounded-none">
    <CardContent className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-lg font-semibold">
        {value}
        {unit ? <span className="text-xs text-muted-foreground ml-1">{unit}</span> : null}
      </div>
    </CardContent>
  </Card>
);

const GameDemandAnalyzerContent: React.FC = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const coachFilter = isAdmin() ? null : effectiveCoachId ?? null;

  const [selected, setSelected] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const athleteId = selected[0];

  // Form
  const [form, setForm] = useState({
    session_date: format(new Date(), "yyyy-MM-dd"),
    session_type: "match" as SessionType,
    sport: "",
    position_or_group: "",
    duration_min: "",
    total_distance_m: "",
    hsr_distance_m: "",
    sprint_distance_m: "",
    sprint_count: "",
    acc_count: "",
    dec_count: "",
    hmld_m: "",
    max_speed_kmh: "",
    notes: "",
  });

  const setField = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["game_sessions", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions" as any)
        .select("*")
        .eq("athlete_id", athleteId!)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as GameSession[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!athleteId) throw new Error("Select an athlete");
      if (!form.duration_min) throw new Error("Duration is required");
      const payload = {
        athlete_id: athleteId,
        coach_id: effectiveCoachId ?? null,
        session_date: form.session_date,
        session_type: form.session_type,
        sport: form.sport || null,
        position_or_group: form.position_or_group || null,
        duration_min: Number(form.duration_min),
        total_distance_m: numOrNull(form.total_distance_m),
        hsr_distance_m: numOrNull(form.hsr_distance_m),
        sprint_distance_m: numOrNull(form.sprint_distance_m),
        sprint_count: numOrNull(form.sprint_count),
        acc_count: numOrNull(form.acc_count),
        dec_count: numOrNull(form.dec_count),
        hmld_m: numOrNull(form.hmld_m),
        max_speed_kmh: numOrNull(form.max_speed_kmh),
        notes: form.notes || null,
      };
      const { error } = await supabase.from("game_sessions" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Session saved" });
      qc.invalidateQueries({ queryKey: ["game_sessions", athleteId] });
      setForm((f) => ({
        ...f,
        duration_min: "",
        total_distance_m: "",
        hsr_distance_m: "",
        sprint_distance_m: "",
        sprint_count: "",
        acc_count: "",
        dec_count: "",
        hmld_m: "",
        max_speed_kmh: "",
        notes: "",
      }));
    },
    onError: (e: any) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_sessions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Session deleted" });
      qc.invalidateQueries({ queryKey: ["game_sessions", athleteId] });
      setDeleteId(null);
    },
    onError: (e: any) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  // Analytics — worst-case (peak) scenarios across MATCHES
  const analytics = useMemo(() => {
    const matches = sessions.filter((s) => s.session_type === "match");
    if (!matches.length) return null;

    const peak = (key: keyof GameSession) => {
      let best: GameSession | null = null;
      for (const m of matches) {
        const v = m[key];
        if (typeof v !== "number" || v == null) continue;
        if (!best || (best[key] as number) < v) best = m;
      }
      return best;
    };

    const avg = (key: keyof GameSession) => {
      const vals = matches
        .map((m) => m[key])
        .filter((v): v is number => typeof v === "number" && v != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    return {
      count: matches.length,
      peakRelDist: peak("relative_distance_m_per_min"),
      peakHsrPerMin: peak("hsr_per_min"),
      peakSprintDist: peak("sprint_distance_m"),
      peakMaxSpeed: peak("max_speed_kmh"),
      avgRelDist: avg("relative_distance_m_per_min"),
      avgHsrPerMin: avg("hsr_per_min"),
      avgSprintDist: avg("sprint_distance_m"),
      avgAcc: avg("acc_count"),
      avgDec: avg("dec_count"),
    };
  }, [sessions]);

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Game Demand Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Evidence-based session demands and worst-case scenarios. Sources: Gabbett 2013,
          Spencer 2004, Gabbett &amp; Mulvey 2008.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <AthleteFilter
          coachId={coachFilter}
          value={selected}
          onChange={setSelected}
          mode="single"
          placeholder="Select athlete"
        />
      </div>

      {!athleteId ? (
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Select an athlete to enter or analyze game sessions
        </div>
      ) : (
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="rounded-none">
            <TabsTrigger value="entry" className="rounded-none">
              New session
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-none">
              Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="detail" className="rounded-none">
              Session detail
            </TabsTrigger>
            <TabsTrigger value="hsr_curve" className="rounded-none">
              HSR phase curve
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-none">
              Worst-case analysis
            </TabsTrigger>
          </TabsList>

          {/* ENTRY */}
          <TabsContent value="entry" className="mt-4">
            <Card className="rounded-none">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    className="rounded-none"
                    value={form.session_date}
                    onChange={(e) => setField("session_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.session_type}
                    onValueChange={(v) => setField("session_type", v as SessionType)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {SESSION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sport</Label>
                  <Input
                    className="rounded-none"
                    placeholder="e.g. football"
                    value={form.sport}
                    onChange={(e) => setField("sport", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Position / group</Label>
                  <Input
                    className="rounded-none"
                    placeholder="e.g. midfielder"
                    value={form.position_or_group}
                    onChange={(e) => setField("position_or_group", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Duration (min) *</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.duration_min}
                    onChange={(e) => setField("duration_min", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Total distance (m)</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.total_distance_m}
                    onChange={(e) => setField("total_distance_m", e.target.value)}
                  />
                </div>
                <div>
                  <Label>HSR distance (m)</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.hsr_distance_m}
                    onChange={(e) => setField("hsr_distance_m", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sprint distance (m)</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.sprint_distance_m}
                    onChange={(e) => setField("sprint_distance_m", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sprint count</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.sprint_count}
                    onChange={(e) => setField("sprint_count", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Accelerations</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.acc_count}
                    onChange={(e) => setField("acc_count", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Decelerations</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.dec_count}
                    onChange={(e) => setField("dec_count", e.target.value)}
                  />
                </div>
                <div>
                  <Label>HMLD (m)</Label>
                  <Input
                    type="number"
                    className="rounded-none"
                    value={form.hmld_m}
                    onChange={(e) => setField("hmld_m", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max speed (km/h)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="rounded-none"
                    value={form.max_speed_kmh}
                    onChange={(e) => setField("max_speed_kmh", e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-none"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIST */}
          <TabsContent value="list" className="mt-4 space-y-4">
            {sessions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sessions.map((s) => (
                  <GameSessionCard
                    key={s.id}
                    session={s as any}
                    onClick={() => setSelectedSessionId(s.id)}
                  />
                ))}
              </div>
            )}
            <Card className="rounded-none">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-sm text-muted-foreground">Loading…</div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No sessions yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Dur (min)</TableHead>
                        <TableHead className="text-right">Total (m)</TableHead>
                        <TableHead className="text-right">HSR (m)</TableHead>
                        <TableHead className="text-right">Sprint (m)</TableHead>
                        <TableHead className="text-right">m/min</TableHead>
                        <TableHead className="text-right">Max km/h</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.session_date}</TableCell>
                          <TableCell>{s.session_type}</TableCell>
                          <TableCell className="text-right">{s.duration_min}</TableCell>
                          <TableCell className="text-right">
                            {s.total_distance_m ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.hsr_distance_m ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.sprint_distance_m ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.relative_distance_m_per_min != null
                              ? Number(s.relative_distance_m_per_min).toFixed(1)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.max_speed_kmh ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none"
                              onClick={() => setDeleteId(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SESSION DETAIL */}
          <TabsContent value="detail" className="mt-4 space-y-4">
            {!selectedSessionId ? (
              <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                Select a session from the Sessions tab to view RSB timeline and demand comparison.
              </div>
            ) : (
              <>
                <RsbTimelineChart sessionId={selectedSessionId} />
                {(() => {
                  const sess = sessions.find((s) => s.id === selectedSessionId);
                  return sess ? <DemandComparisonChart session={sess as any} /> : null;
                })()}
              </>
            )}
          </TabsContent>

          {/* HSR PHASE CURVE */}
          <TabsContent value="hsr_curve" className="mt-4">
            {athleteId && <HsrPhaseCurveChart athleteId={athleteId} />}
          </TabsContent>

          {/* ANALYSIS */}
          <TabsContent value="analysis" className="mt-4">
            {!analytics ? (
              <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                No match data yet. Add sessions of type "match" to see worst-case scenarios.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Kpi
                    label="Peak m/min (match)"
                    value={
                      analytics.peakRelDist?.relative_distance_m_per_min
                        ? Number(
                            analytics.peakRelDist.relative_distance_m_per_min
                          ).toFixed(1)
                        : "—"
                    }
                    unit="m/min"
                  />
                  <Kpi
                    label="Peak HSR/min"
                    value={
                      analytics.peakHsrPerMin?.hsr_per_min
                        ? Number(analytics.peakHsrPerMin.hsr_per_min).toFixed(1)
                        : "—"
                    }
                    unit="m/min"
                  />
                  <Kpi
                    label="Peak sprint dist"
                    value={analytics.peakSprintDist?.sprint_distance_m ?? "—"}
                    unit="m"
                  />
                  <Kpi
                    label="Peak max speed"
                    value={analytics.peakMaxSpeed?.max_speed_kmh ?? "—"}
                    unit="km/h"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <Kpi
                    label="Avg m/min"
                    value={analytics.avgRelDist ? analytics.avgRelDist.toFixed(1) : "—"}
                    unit="m/min"
                  />
                  <Kpi
                    label="Avg HSR/min"
                    value={
                      analytics.avgHsrPerMin ? analytics.avgHsrPerMin.toFixed(1) : "—"
                    }
                    unit="m/min"
                  />
                  <Kpi
                    label="Avg sprint dist"
                    value={
                      analytics.avgSprintDist ? analytics.avgSprintDist.toFixed(0) : "—"
                    }
                    unit="m"
                  />
                  <Kpi
                    label="Avg accelerations"
                    value={analytics.avgAcc ? analytics.avgAcc.toFixed(1) : "—"}
                  />
                  <Kpi
                    label="Avg decelerations"
                    value={analytics.avgDec ? analytics.avgDec.toFixed(1) : "—"}
                  />
                </div>

                <Card className="rounded-none">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Worst-case scenarios computed across {analytics.count} match
                    session(s). Use peak values to inform conditioning prescription so
                    training meets or exceeds match demands (Gabbett 2013).
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

const GameDemandAnalyzerPage: React.FC = () => {
  const { isCoach, isAdmin } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const SidebarComponent = isCoach() && !isAdmin() ? CoachSidebar : Sidebar;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SidebarComponent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 bg-background border-b border-border p-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <FeatureFlagGate />
      </div>
    </div>
  );
};

const FeatureFlagGate: React.FC = () => {
  const { enabled, loading } = useFeatureFlag("ams_game_demand_analyzer");
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!enabled) {
    return <DisabledModuleNotice flag="ams_game_demand_analyzer" />;
  }
  return <GameDemandAnalyzerContent />;
};

export default GameDemandAnalyzerPage;
