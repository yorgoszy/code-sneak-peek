import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Shield, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface UserProfileSafetyProps {
  userProfile: any;
}

const ABUSE_TYPES = [
  { id: 'physical', label: 'Σωματική κακοποίηση' },
  { id: 'psychological', label: 'Ψυχολογική κακοποίηση' },
  { id: 'sexual', label: 'Σεξουαλική παρενόχληση/κακοποίηση' },
  { id: 'verbal', label: 'Λεκτική βία' },
  { id: 'bullying', label: 'Εκφοβισμός / Bullying' },
  { id: 'other', label: 'Άλλο' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Εκκρεμής', color: 'bg-yellow-100 text-yellow-800' },
  investigating: { label: 'Υπό έρευνα', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Επιλύθηκε', color: 'bg-green-100 text-green-800' },
  dismissed: { label: 'Απορρίφθηκε', color: 'bg-gray-100 text-gray-800' },
};

export const UserProfileSafety = ({ userProfile }: UserProfileSafetyProps) => {
  const { userProfile: currentUser, isAdmin } = useRoleCheck();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const isOwnProfile = currentUser?.id === userProfile?.id;
  const adminViewing = isAdmin() && !isOwnProfile;

  useEffect(() => {
    loadReports();
  }, [userProfile?.id]);

  const loadReports = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('abuse_reports')
      .select('*')
      .eq('athlete_id', userProfile.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setReports(data || []);
    setLoading(false);
  };

  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Επίλεξε τουλάχιστον έναν τύπο');
      return;
    }
    if (description.trim().length < 20) {
      toast.error('Η περιγραφή πρέπει να έχει τουλάχιστον 20 χαρακτήρες');
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const { data: inserted, error } = await supabase
        .from('abuse_reports')
        .insert({
          athlete_id: userProfile.id,
          coach_id: userProfile.coach_id || null,
          abuse_types: selectedTypes,
          description: description.trim(),
          incident_date: incidentDate || null,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) throw error;

      // Στείλε ειδοποίηση στις ομοσπονδίες
      try {
        await supabase.functions.invoke('send-abuse-report-notification', {
          body: { reportId: inserted.id },
        });
      } catch (e) {
        console.error('Notification error:', e);
      }

      toast.success('Η καταγγελία υποβλήθηκε. Οι αρμόδιες ομοσπονδίες ειδοποιήθηκαν.');
      setSelectedTypes([]);
      setDescription("");
      setIncidentDate("");
      setIsAnonymous(false);
      loadReports();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Σφάλμα υποβολής');
    } finally {
      setSubmitting(false);
    }
  };

  if (adminViewing) {
    return (
      <div className="space-y-4">
        <Card className="rounded-none border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Καταγγελίες αθλητή (Admin View)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Φόρτωση...</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-500">Δεν υπάρχουν καταγγελίες από τον αθλητή.</p>
            ) : (
              <ReportList reports={reports} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-none border-2 border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" /> Αναφορά Κακοποίησης
          </CardTitle>
          <p className="text-sm text-red-700 mt-2">
            Αν έχεις υποστεί οποιαδήποτε μορφή κακοποίησης από τον προπονητή ή το σωματείο σου,
            μπορείς να υποβάλεις εμπιστευτική καταγγελία. Η αναφορά αποστέλλεται απευθείας στις
            αρμόδιες ομοσπονδίες όπου ανήκει ο προπονητής/σωματείο σου για διερεύνηση.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label className="font-medium mb-2 block">Τύπος κακοποίησης (επιλέγεις ένα ή περισσότερα)</Label>
            <div className="space-y-2">
              {ABUSE_TYPES.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleType(t.id)}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedTypes.includes(t.id) ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox checked={selectedTypes.includes(t.id)} />
                  <span className="text-sm">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="incident-date" className="font-medium mb-2 block">
              Ημερομηνία περιστατικού (προαιρετικό)
            </Label>
            <Input
              id="incident-date"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="rounded-none max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="description" className="font-medium mb-2 block">
              Περιγραφή περιστατικού *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περίγραψε με δικά σου λόγια τι συνέβη. Δώσε όσες λεπτομέρειες θεωρείς σχετικές (πότε, πού, ποιοι ήταν παρόντες)..."
              rows={6}
              className="rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length} χαρακτήρες (ελάχιστο 20)</p>
          </div>

          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
              isAnonymous ? 'border-gray-700 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Checkbox checked={isAnonymous} />
            <div>
              <span className="text-sm font-medium">Ανώνυμη υποβολή</span>
              <p className="text-xs text-gray-500">
                Το όνομά σου δεν θα εμφανιστεί στις ομοσπονδίες (ο admin το βλέπει πάντα).
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-none"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Υποβολή Καταγγελίας
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-base">Οι καταγγελίες μου</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-sm">Φόρτωση...</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν έχεις υποβάλει καμία καταγγελία.</p>
          ) : (
            <ReportList reports={reports} />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Επιβεβαίωση υποβολής</AlertDialogTitle>
            <AlertDialogDescription>
              Η καταγγελία θα αποσταλεί σε όλες τις ομοσπονδίες όπου ανήκει ο προπονητής/σωματείο σου.
              Παρακαλούμε υπόβαλε μόνο αν τα γεγονότα είναι αληθή. Συνέχεια;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-red-600 hover:bg-red-700 rounded-none">
              Υποβολή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ReportList = ({ reports }: { reports: any[] }) => (
  <div className="space-y-3">
    {reports.map(r => {
      const status = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
      return (
        <div key={r.id} className="border p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge className={`${status.color} rounded-none`}>{status.label}</Badge>
              {r.is_anonymous && <Badge variant="outline" className="rounded-none">Ανώνυμη</Badge>}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(r.created_at).toLocaleString('el-GR')}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Τύποι: {(r.abuse_types || []).join(', ')}
          </div>
          <p className="text-sm whitespace-pre-wrap">{r.description}</p>
          {r.admin_notes && (
            <div className="bg-gray-50 p-2 text-xs border-l-2 border-gray-400">
              <strong>Σημειώσεις admin:</strong> {r.admin_notes}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Ειδοποιημένες ομοσπονδίες: {(r.notified_federation_ids || []).length}
          </div>
        </div>
      );
    })}
  </div>
);
