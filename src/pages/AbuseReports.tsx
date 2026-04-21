import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Menu, ShieldAlert, Loader2, Save, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ReportAbuseQRDialog } from "@/components/abuse/ReportAbuseQRDialog";

const ABUSE_LABELS: Record<string, string> = {
  physical: "Σωματική",
  psychological: "Ψυχολογική",
  sexual: "Σεξουαλική",
  verbal: "Λεκτική",
  bullying: "Bullying",
  other: "Άλλο",
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: "Εκκρεμής", color: "bg-yellow-100 text-yellow-800" },
  investigating: { label: "Υπό έρευνα", color: "bg-blue-100 text-blue-800" },
  resolved: { label: "Επιλύθηκε", color: "bg-green-100 text-green-800" },
  dismissed: { label: "Απορρίφθηκε", color: "bg-gray-100 text-gray-800" },
};

export default function AbuseReports() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const isMobile = useIsMobile();
  const { userProfile } = useRoleCheck();
  const adminId = userProfile?.id;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("abuse_reports")
      .select(`
        *,
        athlete:app_users!abuse_reports_athlete_id_fkey(id, name, email, photo_url),
        coach:app_users!abuse_reports_coach_id_fkey(id, name, email)
      `)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setReports(data || []);

    if (adminId) {
      const { data: acks } = await supabase
        .from("acknowledged_abuse_reports")
        .select("report_id")
        .eq("user_id", adminId);
      setAcknowledged(new Set((acks || []).map((a: any) => a.report_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [adminId]);

  const updateReport = async (id: string, updates: Partial<{ status: string; admin_notes: string }>) => {
    const { error } = await supabase.from("abuse_reports").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Ενημερώθηκε");
      load();
    }
  };

  const acknowledge = async (reportId: string) => {
    if (!adminId) return;
    const { error } = await supabase
      .from("acknowledged_abuse_reports")
      .insert({ user_id: adminId, report_id: reportId });
    if (error) {
      toast.error("Σφάλμα: " + error.message);
      return;
    }
    setAcknowledged((prev) => new Set(prev).add(reportId));
    toast.success("Σημειώθηκε ως ενημερωμένο");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = (status: string) =>
    status === "all" ? reports : reports.filter((r) => r.status === status);

  const counts = {
    pending: reports.filter((r) => r.status === "pending").length,
    investigating: reports.filter((r) => r.status === "investigating").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const newCount = useMemo(
    () => reports.filter((r) => !acknowledged.has(r.id)).length,
    [reports, acknowledged]
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowMobileSidebar(true)} className="rounded-none">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Καταγγελίες</h1>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="hidden lg:flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold">Καταγγελίες Κακοποίησης</h1>
                {newCount > 0 && (
                  <Badge className="bg-red-600 text-white rounded-none ml-2">{newCount} νέες</Badge>
                )}
              </div>
              <ReportAbuseQRDialog />
            </div>
            <div className="lg:hidden">
              <ReportAbuseQRDialog />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard label="Εκκρεμείς" value={counts.pending} color="text-yellow-700" />
              <StatCard label="Υπό έρευνα" value={counts.investigating} color="text-blue-700" />
              <StatCard label="Επιλύθηκαν" value={counts.resolved} color="text-green-700" />
              <StatCard label="Απορρίφθηκαν" value={counts.dismissed} color="text-gray-700" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 rounded-none">
                <TabsTrigger value="pending" className="rounded-none">Εκκρεμείς</TabsTrigger>
                <TabsTrigger value="investigating" className="rounded-none">Υπό έρευνα</TabsTrigger>
                <TabsTrigger value="resolved" className="rounded-none">Επιλυμένες</TabsTrigger>
                <TabsTrigger value="dismissed" className="rounded-none">Απορρίφθηκαν</TabsTrigger>
                <TabsTrigger value="all" className="rounded-none">Όλες</TabsTrigger>
              </TabsList>

              {["pending", "investigating", "resolved", "dismissed", "all"].map((s) => (
                <TabsContent key={s} value={s} className="mt-3 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filtered(s).length === 0 ? (
                    <Card className="rounded-none">
                      <CardContent className="py-8 text-center text-gray-500">
                        Δεν υπάρχουν καταγγελίες σε αυτή την κατηγορία.
                      </CardContent>
                    </Card>
                  ) : (
                    filtered(s).map((r) => (
                      <CompactReportCard
                        key={r.id}
                        report={r}
                        isNew={!acknowledged.has(r.id)}
                        isExpanded={expanded.has(r.id)}
                        onToggle={() => toggleExpand(r.id)}
                        onAcknowledge={() => acknowledge(r.id)}
                        onUpdate={updateReport}
                      />
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Card className="rounded-none">
    <CardContent className="p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

const CompactReportCard = ({
  report,
  isNew,
  isExpanded,
  onToggle,
  onAcknowledge,
  onUpdate,
}: {
  report: any;
  isNew: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
  onUpdate: (id: string, updates: any) => void;
}) => {
  const [notes, setNotes] = useState(report.admin_notes || "");
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const statusInfo = STATUS_INFO[report.status] || STATUS_INFO.pending;

  const save = async () => {
    setSaving(true);
    await onUpdate(report.id, { status, admin_notes: notes });
    setSaving(false);
  };

  return (
    <Card className={`rounded-none border-l-4 ${isNew ? "border-l-red-500" : "border-l-gray-300"}`}>
      <CardContent className="p-3">
        {/* Compact row */}
        <div className="flex items-center gap-3 flex-wrap">
          {isNew && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Νέα" />}
          {report.athlete?.photo_url && !report.is_anonymous ? (
            <img src={report.athlete.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0">
              {report.is_anonymous ? "🔒" : "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">
                {report.is_anonymous ? "Ανώνυμη" : report.athlete?.name || "—"}
              </span>
              <span className="text-xs text-gray-400">→</span>
              <span className="text-sm text-gray-700 truncate">{report.coach?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <Badge className={`${statusInfo.color} rounded-none text-[10px] px-1.5 py-0`}>
                {statusInfo.label}
              </Badge>
              <span className="text-[11px] text-gray-500">
                {(report.abuse_types || []).map((t: string) => ABUSE_LABELS[t] || t).join(", ")}
              </span>
              <span className="text-[11px] text-gray-400 ml-auto">
                {new Date(report.created_at).toLocaleDateString("el-GR")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" className="rounded-none h-7 w-7 p-0" onClick={onToggle}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isNew && (
              <Button variant="outline" size="sm" className="rounded-none h-7 text-xs" onClick={onAcknowledge}>
                <Check className="h-3 w-3 mr-1" />
                Ενημερώθηκα
              </Button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {report.incident_date && (
              <div className="text-xs">
                <span className="text-gray-500">Ημερομηνία περιστατικού: </span>
                <span className="font-medium">
                  {new Date(report.incident_date).toLocaleDateString("el-GR")}
                </span>
              </div>
            )}
            {!report.is_anonymous && report.athlete?.email && (
              <div className="text-xs text-gray-500">Email αθλητή: {report.athlete.email}</div>
            )}
            {report.coach?.email && (
              <div className="text-xs text-gray-500">Email προπονητή: {report.coach.email}</div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Περιγραφή</p>
              <div className="bg-gray-50 p-2 text-sm whitespace-pre-wrap border">
                {report.description || "—"}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Ειδοποιημένες ομοσπονδίες: {(report.notified_federation_ids || []).length}
            </div>

            {/* Admin actions */}
            <div className="border-t pt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-none h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_INFO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Σημειώσεις admin..."
                rows={2}
                className="rounded-none md:col-span-2 text-xs"
              />
            </div>
            <Button onClick={save} disabled={saving} size="sm" className="rounded-none h-7 text-xs">
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Αποθήκευση
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
