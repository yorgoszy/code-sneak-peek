import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu } from "lucide-react";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useFeatureFlag } from "@/hooks/ams/useFeatureFlag";
import { useAcwrData } from "@/hooks/ams/useAcwrData";
import { AthleteFilter } from "@/components/ams/AthleteFilter";
import { DateRangePicker, DateRange } from "@/components/ams/DateRangePicker";
import { MetricSelector } from "@/components/ams/MetricSelector";
import { AcwrChart } from "@/components/ams/AcwrChart";
import { PlayerTrendChart } from "@/components/ams/PlayerTrendChart";
import { BandIndicator } from "@/components/ams/BandIndicator";
import { supabase } from "@/integrations/supabase/client";

const METRIC_OPTIONS = [
  { key: "volume_kg", label: "Volume", unit: "kg" },
  { key: "duration_min", label: "Duration", unit: "min" },
];

const KpiCard: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Card className="rounded-none">
    <CardContent className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-lg font-semibold flex items-center gap-2">{children}</div>
    </CardContent>
  </Card>
);

const LoadMonitoringContent: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange>({ from: subDays(new Date(), 28), to: new Date() });
  const [metric, setMetric] = useState<"volume_kg" | "duration_min">("volume_kg");
  const userId = selected[0];

  const { data: acwrData } = useAcwrData({ userId: userId ?? "", endDate: range.to, metric });

  const kpis = useMemo(() => {
    if (!acwrData?.length) return null;
    const last = acwrData[acwrData.length - 1];
    const last7 = acwrData.slice(-7);
    const last28 = acwrData.slice(-28);
    const avg = (rows: typeof acwrData) =>
      rows.length ? rows.reduce((s, r) => s + (r.daily_load ?? 0), 0) / rows.length : 0;
    const peak = acwrData.reduce<{ date: string; v: number } | null>((best, r) => {
      if (r.acwr == null) return best;
      if (!best || r.acwr > best.v) return { date: r.load_date, v: r.acwr };
      return best;
    }, null);
    return {
      currentAcwr: last.acwr,
      avg7: avg(last7),
      avg28: avg(last28),
      daysSincePeak: peak ? differenceInDays(new Date(), parseISO(peak.date)) : null,
      peakValue: peak?.v ?? null,
    };
  }, [acwrData]);

  const trendFetcher = React.useCallback(async () => {
    if (!userId) return [];
    const from = format(subDays(new Date(), 59), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("vw_daily_training_load" as any)
      .select("load_date, daily_volume_kg, daily_duration_min")
      .eq("user_id", userId)
      .gte("load_date", from)
      .order("load_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      date: r.load_date as string,
      value: Number(metric === "volume_kg" ? r.daily_volume_kg : r.daily_duration_min) || 0,
    }));
  }, [userId, metric]);

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Load Monitoring — ACWR</h1>
        <p className="text-sm text-muted-foreground">
          Acute:Chronic Workload Ratio per athlete. Gabbett 2016 sweet spot 0.8–1.3.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <AthleteFilter value={selected} onChange={setSelected} mode="single" placeholder="Select athlete" />
        <DateRangePicker value={range} onChange={setRange} />
        <MetricSelector value={metric} onChange={(v) => setMetric(v as any)} options={METRIC_OPTIONS} />
      </div>

      {!userId ? (
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Select an athlete to view ACWR and load trend
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AcwrChart userId={userId} metric={metric} endDate={range.to} />
            <PlayerTrendChart
              userId={userId}
              metricKey="acwr"
              metricLabel={metric === "volume_kg" ? "Daily volume (kg)" : "Daily duration (min)"}
              unit={metric === "volume_kg" ? "kg" : "min"}
              dataFetcher={trendFetcher}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <KpiCard label="Current ACWR">
              {kpis?.currentAcwr != null ? (
                <BandIndicator value={Number(kpis.currentAcwr.toFixed(2))} metricKey="acwr" />
              ) : <span className="text-muted-foreground">—</span>}
            </KpiCard>
            <KpiCard label="Avg 7-day load">
              {kpis ? kpis.avg7.toFixed(0) : "—"}
            </KpiCard>
            <KpiCard label="Avg 28-day load">
              {kpis ? kpis.avg28.toFixed(0) : "—"}
            </KpiCard>
            <KpiCard label="Days since peak ACWR">
              {kpis?.daysSincePeak != null ? `${kpis.daysSincePeak}d` : "—"}
            </KpiCard>
          </div>
        </>
      )}
    </main>
  );
};

const LoadMonitoringPage: React.FC = () => {
  const { isCoach, isAdmin } = useRoleCheck();
  const { enabled, loading: flagLoading } = useFeatureFlag("ams_acwr_chart");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarComponent = isCoach() && !isAdmin() ? CoachSidebar : Sidebar;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <SidebarComponent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 bg-background border-b border-border p-2 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {flagLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !enabled ? (
          <div className="p-6">
            <div className="border border-dashed border-border p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">Module disabled</h2>
              <p className="text-sm text-muted-foreground">
                The ACWR Load Monitoring module is currently turned off. Enable the
                <code className="mx-1 px-1 bg-muted">ams_acwr_chart</code> feature flag in AMS Settings.
              </p>
            </div>
          </div>
        ) : (
          <LoadMonitoringContent />
        )}
      </div>
    </div>
  );
};

export default LoadMonitoringPage;
