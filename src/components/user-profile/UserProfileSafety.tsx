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
import { useTranslation } from "react-i18next";

interface UserProfileSafetyProps {
  userProfile: any;
}

const ABUSE_TYPE_IDS = ['physical', 'psychological', 'sexual', 'verbal', 'bullying', 'other'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export const UserProfileSafety = ({ userProfile }: UserProfileSafetyProps) => {
  const { t } = useTranslation();
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
      toast.error(t('safety.errorMinTypes'));
      return;
    }
    if (description.trim().length < 20) {
      toast.error(t('safety.errorMinDesc'));
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

      try {
        await supabase.functions.invoke('send-abuse-report-notification', {
          body: { reportId: inserted.id },
        });
      } catch (e) {
        console.error('Notification error:', e);
      }

      toast.success(t('safety.successSubmit'));
      setSelectedTypes([]);
      setDescription("");
      setIncidentDate("");
      setIsAnonymous(false);
      loadReports();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('safety.errorSubmit'));
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
              <Shield className="h-5 w-5" /> {t('safety.adminViewTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">{t('safety.loading')}</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-500">{t('safety.adminNoReports')}</p>
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
            <AlertTriangle className="h-5 w-5" /> {t('safety.title')}
          </CardTitle>
          <p className="text-sm text-red-700 mt-2">{t('safety.intro')}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label className="font-medium mb-2 block">{t('safety.abuseTypeLabel')}</Label>
            <div className="space-y-2">
              {ABUSE_TYPE_IDS.map(id => (
                <div
                  key={id}
                  onClick={() => toggleType(id)}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedTypes.includes(id) ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox checked={selectedTypes.includes(id)} />
                  <span className="text-sm">{t(`safety.types.${id}`)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="incident-date" className="font-medium mb-2 block">
              {t('safety.incidentDate')}
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
              {t('safety.description')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('safety.descriptionPlaceholder')}
              rows={6}
              className="rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">{t('safety.charactersMin', { count: description.length })}</p>
          </div>

          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
              isAnonymous ? 'border-gray-700 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Checkbox checked={isAnonymous} />
            <div>
              <span className="text-sm font-medium">{t('safety.anonymous')}</span>
              <p className="text-xs text-gray-500">{t('safety.anonymousHint')}</p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-none"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t('safety.submit')}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-base">{t('safety.myReports')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-sm">{t('safety.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('safety.noReports')}</p>
          ) : (
            <ReportList reports={reports} />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('safety.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('safety.confirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('safety.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-red-600 hover:bg-red-700 rounded-none">
              {t('safety.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ReportList = ({ reports }: { reports: any[] }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {reports.map(r => {
        const color = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
        return (
          <div key={r.id} className="border p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge className={`${color} rounded-none`}>{t(`safety.status.${r.status}`)}</Badge>
                {r.is_anonymous && <Badge variant="outline" className="rounded-none">{t('safety.anonymousBadge')}</Badge>}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {t('safety.typesLabel')}: {(r.abuse_types || []).map((x: string) => t(`safety.types.${x}`)).join(', ')}
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.description}</p>
            {r.admin_notes && (
              <div className="bg-gray-50 p-2 text-xs border-l-2 border-gray-400">
                <strong>{t('safety.adminNotes')}:</strong> {r.admin_notes}
              </div>
            )}
            <div className="text-xs text-gray-500">
              {t('safety.notifiedFeds')}: {(r.notified_federation_ids || []).length}
            </div>
          </div>
        );
      })}
    </div>
  );
};
