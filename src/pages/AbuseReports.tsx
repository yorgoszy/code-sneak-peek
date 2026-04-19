import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, ShieldAlert, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const ABUSE_LABELS: Record<string, string> = {
  physical: 'Σωματική',
  psychological: 'Ψυχολογική',
  sexual: 'Σεξουαλική',
  verbal: 'Λεκτική',
  bullying: 'Bullying',
  other: 'Άλλο',
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: 'Εκκρεμής', color: 'bg-yellow-100 text-yellow-800' },
  investigating: { label: 'Υπό έρευνα', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Επιλύθηκε', color: 'bg-green-100 text-green-800' },
  dismissed: { label: 'Απορρίφθηκε', color: 'bg-gray-100 text-gray-800' },
};

export default function AbuseReports() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const isMobile = useIsMobile();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('abuse_reports')
      .select(`
        *,
        athlete:app_users!abuse_reports_athlete_id_fkey(id, name, email, photo_url),
        coach:app_users!abuse_reports_coach_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateReport = async (id: string, updates: Partial<{ status: string; admin_notes: string }>) => {
    const { error } = await supabase.from('abuse_reports').update(updates).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Ενημερώθηκε');
      load();
    }
  };

  const filtered = (status: string) =>
    status === 'all' ? reports : reports.filter(r => r.status === status);

  const counts = {
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

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
            <div className="hidden lg:flex items-center gap-2 mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl font-bold">Καταγγελίες Κακοποίησης</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

              {['pending', 'investigating', 'resolved', 'dismissed', 'all'].map(s => (
                <TabsContent key={s} value={s} className="mt-4 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filtered(s).length === 0 ? (
                    <Card className="rounded-none"><CardContent className="py-8 text-center text-gray-500">
                      Δεν υπάρχουν καταγγελίες σε αυτή την κατηγορία.
                    </CardContent></Card>
                  ) : (
                    filtered(s).map(r => <ReportCard key={r.id} report={r} onUpdate={updateReport} />)
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
    <CardContent className="p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

const ReportCard = ({ report, onUpdate }: { report: any; onUpdate: (id: string, updates: any) => void }) => {
  const [notes, setNotes] = useState(report.admin_notes || '');
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const statusInfo = STATUS_INFO[report.status] || STATUS_INFO.pending;

  const save = async () => {
    setSaving(true);
    await onUpdate(report.id, { status, admin_notes: notes });
    setSaving(false);
  };

  return (
    <Card className="rounded-none border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {report.athlete?.photo_url && (
              <img src={report.athlete.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            )}
            <div>
              <p className="font-semibold">
                {report.is_anonymous ? '🔒 Ανώνυμη' : report.athlete?.name}
              </p>
              {!report.is_anonymous && (
                <p className="text-xs text-gray-500">{report.athlete?.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} rounded-none`}>{statusInfo.label}</Badge>
            <span className="text-xs text-gray-500">
              {new Date(report.created_at).toLocaleString('el-GR')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Καταγγελλόμενος προπονητής</p>
            <p className="font-medium">{report.coach?.name || '—'}</p>
            {report.coach?.email && <p className="text-xs text-gray-500">{report.coach.email}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500">Ημερομηνία περιστατικού</p>
            <p className="font-medium">
              {report.incident_date ? new Date(report.incident_date).toLocaleDateString('el-GR') : '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Τύποι</p>
          <div className="flex flex-wrap gap-1">
            {(report.abuse_types || []).map((t: string) => (
              <Badge key={t} variant="outline" className="rounded-none">{ABUSE_LABELS[t] || t}</Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Περιγραφή</p>
          <div className="bg-gray-50 p-3 text-sm whitespace-pre-wrap border">{report.description}</div>
        </div>

        <div className="text-xs text-gray-500">
          Ειδοποιημένες ομοσπονδίες: {(report.notified_federation_ids || []).length}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_INFO).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Σημειώσεις admin..."
              rows={2}
              className="rounded-none md:col-span-2"
            />
          </div>
          <Button onClick={save} disabled={saving} size="sm" className="rounded-none">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Αποθήκευση
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
