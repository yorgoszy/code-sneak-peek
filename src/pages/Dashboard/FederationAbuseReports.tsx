import { useState, useEffect, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Menu, ShieldAlert, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";

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

const FederationAbuseReports = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const [reports, setReports] = useState<any[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const federationId = userProfile?.id;

  useEffect(() => {
    if (federationId) load();
  }, [federationId]);

  const load = async () => {
    if (!federationId) return;
    setLoading(true);
    try {
      // 1. Get all coaches (clubs) of this federation
      const { data: clubs } = await supabase
        .from("federation_clubs")
        .select("club_id")
        .eq("federation_id", federationId);

      const coachIds = (clubs || []).map((c: any) => c.club_id);

      if (coachIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // 2. Get all abuse reports for these coaches
      const { data: reportsData, error } = await supabase
        .from("abuse_reports")
        .select(`
          *,
          athlete:app_users!abuse_reports_athlete_id_fkey(id, name, email, photo_url),
          coach:app_users!abuse_reports_coach_id_fkey(id, name, email)
        `)
        .in("coach_id", coachIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(reportsData || []);

      // 3. Get acknowledged reports for current federation user
      const { data: acks } = await supabase
        .from("acknowledged_abuse_reports")
        .select("report_id")
        .eq("user_id", federationId);

      setAcknowledged(new Set((acks || []).map((a: any) => a.report_id)));
    } catch (e: any) {
      toast.error("Σφάλμα φόρτωσης: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (reportId: string) => {
    if (!federationId) return;
    const { error } = await supabase
      .from("acknowledged_abuse_reports")
      .insert({ user_id: federationId, report_id: reportId });
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

  const newCount = useMemo(
    () => reports.filter((r) => !acknowledged.has(r.id)).length,
    [reports, acknowledged]
  );

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Καταγγελίες</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="hidden lg:flex items-center gap-2 mb-2">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold">Καταγγελίες Κακοποίησης</h1>
                {newCount > 0 && (
                  <Badge className="bg-red-600 text-white rounded-none ml-2">
                    {newCount} νέες
                  </Badge>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : reports.length === 0 ? (
                <Card className="rounded-none">
                  <CardContent className="py-8 text-center text-gray-500">
                    Δεν υπάρχουν καταγγελίες για προπονητές της ομοσπονδίας σας.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => {
                    const isNew = !acknowledged.has(r.id);
                    const isOpen = expanded.has(r.id);
                    const status = STATUS_INFO[r.status] || STATUS_INFO.pending;
                    return (
                      <Card
                        key={r.id}
                        className={`rounded-none border-l-4 ${isNew ? "border-l-red-500" : "border-l-gray-300"}`}
                      >
                        <CardContent className="p-3">
                          {/* Compact row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {isNew && (
                              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Νέα" />
                            )}
                            {r.athlete?.photo_url && !r.is_anonymous ? (
                              <img src={r.athlete.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs flex-shrink-0">
                                {r.is_anonymous ? "🔒" : "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium truncate">
                                  {r.is_anonymous ? "Ανώνυμη" : r.athlete?.name || "—"}
                                </span>
                                <span className="text-xs text-gray-400">→</span>
                                <span className="text-sm text-gray-700 truncate">
                                  {r.coach?.name || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <Badge className={`${status.color} rounded-none text-[10px] px-1.5 py-0`}>
                                  {status.label}
                                </Badge>
                                <span className="text-[11px] text-gray-500">
                                  {(r.abuse_types || []).map((t: string) => ABUSE_LABELS[t] || t).join(", ")}
                                </span>
                                <span className="text-[11px] text-gray-400 ml-auto">
                                  {new Date(r.created_at).toLocaleDateString("el-GR")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-none h-7 w-7 p-0"
                                onClick={() => toggleExpand(r.id)}
                              >
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              {isNew && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-none h-7 text-xs"
                                  onClick={() => acknowledge(r.id)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Ενημερώθηκα
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isOpen && (
                            <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                              {r.incident_date && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Ημερομηνία περιστατικού: </span>
                                  <span className="font-medium">
                                    {new Date(r.incident_date).toLocaleDateString("el-GR")}
                                  </span>
                                </div>
                              )}
                              {!r.is_anonymous && r.athlete?.email && (
                                <div className="text-xs text-gray-500">Email αθλητή: {r.athlete.email}</div>
                              )}
                              {r.coach?.email && (
                                <div className="text-xs text-gray-500">Email προπονητή: {r.coach.email}</div>
                              )}
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Περιγραφή</p>
                                <div className="bg-gray-50 p-2 text-sm whitespace-pre-wrap border">
                                  {r.description || "—"}
                                </div>
                              </div>
                              {r.admin_notes && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Σημειώσεις admin</p>
                                  <div className="bg-gray-50 p-2 text-xs border-l-2 border-gray-400">
                                    {r.admin_notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationAbuseReports;
