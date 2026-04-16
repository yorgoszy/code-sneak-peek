import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { useAnthropometricTestResults } from "@/components/results/hooks/useAnthropometricTestResults";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface AnthropometricHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

interface EditFormData {
  height: string; weight: string; muscle_mass_percentage: string; body_fat_percentage: string;
  visceral_fat_percentage: string; bone_density: string; chest_circumference: string;
  waist_circumference: string; hip_circumference: string; thigh_circumference: string; arm_circumference: string;
}

export const AnthropometricHistoryTab: React.FC<AnthropometricHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const { t } = useTranslation();
  const usersMap = useUserNamesMap();
  const { results, loading, refetch } = useAnthropometricTestResults(usersMap, selectedUserId, coachUserIds, useCoachTables);
  const [anthropometricData, setAnthropometricData] = useState<Record<string, any>>({});
  const [usersAvatarMap, setUsersAvatarMap] = useState<Map<string, string>>(new Map());
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    height: '', weight: '', muscle_mass_percentage: '', body_fat_percentage: '',
    visceral_fat_percentage: '', bone_density: '', chest_circumference: '',
    waist_circumference: '', hip_circumference: '', thigh_circumference: '', arm_circumference: '',
  });

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    const fetchAvatars = async () => {
      const { data } = await supabase.from('app_users').select('id, avatar_url, photo_url');
      const map = new Map<string, string>();
      (data || []).forEach(u => map.set(u.id, u.photo_url || u.avatar_url || ''));
      setUsersAvatarMap(map);
    };
    fetchAvatars();
  }, []);

  useEffect(() => {
    if (results.length > 0) fetchAnthropometricData();
  }, [results]);

  const fetchAnthropometricData = async () => {
    const data: Record<string, any> = {};
    const tableName = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';
    for (const result of results) {
      const { data: anthroData, error } = await supabase.from(tableName).select('*').eq('test_session_id', result.id).single();
      if (!error && anthroData) data[result.id] = anthroData;
    }
    setAnthropometricData(data);
  };

  const handleDeleteClick = (sessionId: string) => { setSessionToDelete(sessionId); setIsDeleteDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    const sessionsTable = useCoachTables ? 'coach_anthropometric_test_sessions' : 'anthropometric_test_sessions';
    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';
    try {
      await supabase.from(dataTable).delete().eq('test_session_id', sessionToDelete);
      await supabase.from(sessionsTable).delete().eq('id', sessionToDelete);
      toast.success('Η καταγραφή διαγράφηκε');
      setIsDeleteDialogOpen(false); setSessionToDelete(null);
      await refetch(); fetchAnthropometricData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
      setIsDeleteDialogOpen(false); setSessionToDelete(null);
    }
  };

  const handleEditClick = (sessionId: string) => {
    const data = anthropometricData[sessionId];
    if (data) {
      setEditFormData({
        height: data.height?.toString() || '', weight: data.weight?.toString() || '',
        muscle_mass_percentage: data.muscle_mass_percentage?.toString() || '', body_fat_percentage: data.body_fat_percentage?.toString() || '',
        visceral_fat_percentage: data.visceral_fat_percentage?.toString() || '', bone_density: data.bone_density?.toString() || '',
        chest_circumference: data.chest_circumference?.toString() || '', waist_circumference: data.waist_circumference?.toString() || '',
        hip_circumference: data.hip_circumference?.toString() || '', thigh_circumference: data.thigh_circumference?.toString() || '',
        arm_circumference: data.arm_circumference?.toString() || '',
      });
      setEditingSessionId(sessionId);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSave = async () => {
    if (!editingSessionId) return;
    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';
    try {
      const updateData: Record<string, number | null> = {};
      Object.entries(editFormData).forEach(([key, value]) => { updateData[key] = value ? parseFloat(value) : null; });
      const { error } = await supabase.from(dataTable).update(updateData).eq('test_session_id', editingSessionId);
      if (error) throw error;
      toast.success('Η καταγραφή ενημερώθηκε');
      setIsEditDialogOpen(false); setEditingSessionId(null);
      await fetchAnthropometricData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  const handleClearFilters = () => { setSelectedYear("all"); setUserSearch(""); };

  const availableYears = useMemo(() => {
    const years = results.map(r => new Date(r.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [results]);

  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    const sl = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .filter(user => user.name?.toLowerCase().includes(sl))
      .slice(0, 10);
  }, [userSearch, usersMap]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (!readOnly && userSearch.trim()) {
        const userName = usersMap.get(r.user_id);
        if (!userName?.toLowerCase().includes(userSearch.toLowerCase())) return false;
      }
      if (selectedYear !== "all" && new Date(r.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [results, selectedYear, userSearch, usersMap, readOnly]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">{t('history.loading')}</div>;
  if (results.length === 0) return <div className="text-center py-8 text-muted-foreground">{t('history.noRecords')}</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-start">
        {!readOnly && (
          <div className="relative w-full sm:w-[250px]">
            <Input type="text" placeholder="Αναζήτηση χρήστη..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="rounded-none pr-8" />
            {userSearch && <Button size="sm" variant="ghost" onClick={() => setUserSearch("")} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-none"><X className="w-4 h-4" /></Button>}
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
                {userSuggestions.map(user => (
                  <div key={user.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setUserSearch(user.name); setShowSuggestions(false); }}>
                    <div className="font-medium text-sm">{user.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-none"><SelectValue placeholder="Όλα τα έτη" /></SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλα τα έτη</SelectItem>
            {availableYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-none h-10 w-full sm:w-auto"><X className="w-4 h-4 mr-2" />Καθαρισμός</Button>
      </div>

      {/* Avatar Timeline */}
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold mb-2">Σωματομετρικά</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {filteredResults.map((result, idx) => {
            const userName = result.user_name || '';
            const userAvatar = usersAvatarMap.get(result.user_id) || '';
            const data = anthropometricData[result.id];
            const summary = data ? `${data.weight || ''}kg, ${data.body_fat_percentage || ''}%BF` : '';
            const currentMonth = format(new Date(result.test_date), 'yyyy-MM');
            const currentYear = new Date(result.test_date).getFullYear();
            const nextResult = filteredResults[idx + 1];
            const nextMonth = nextResult ? format(new Date(nextResult.test_date), 'yyyy-MM') : currentMonth;
            const nextYear = nextResult ? new Date(nextResult.test_date).getFullYear() : currentYear;
            const isLastInMonth = nextResult && currentMonth !== nextMonth;
            const isLastInYear = nextResult && currentYear !== nextYear;

            return (
              <React.Fragment key={result.id}>
                <button onClick={() => setSelectedSession(result)} className="relative group" title={`${userName} - ${format(new Date(result.test_date), 'dd/MM/yy')} - ${summary}`}>
                  <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-foreground transition-colors">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </button>
                {isLastInYear ? (
                  <div className="flex items-center shrink-0 gap-1">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(result.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                      <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground shrink-0">{currentYear}</span>
                  </div>
                ) : isLastInMonth ? (
                  <div className="flex flex-col items-center mx-0.5 shrink-0">
                    <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(result.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                    <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {filteredResults.length > 0 && (() => {
            const last = filteredResults[filteredResults.length - 1];
            return (
              <div className="flex items-center shrink-0 gap-1">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(last.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                  <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground shrink-0">{new Date(last.test_date).getFullYear()}</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Σωματομετρικά - {selectedSession && format(new Date(selectedSession.test_date), 'dd/MM/yyyy', { locale: el })}</DialogTitle>
          </DialogHeader>
          {selectedSession && (() => {
            const userName = selectedSession.user_name || '';
            const userAvatar = usersAvatarMap.get(selectedSession.user_id) || '';
            const data = anthropometricData[selectedSession.id];
            const fields = [
              { label: 'Ύψος', value: data?.height, unit: 'cm' },
              { label: 'Βάρος', value: data?.weight, unit: 'kg' },
              { label: 'Μυϊκή Μάζα', value: data?.muscle_mass_percentage, unit: '%' },
              { label: 'Λίπος', value: data?.body_fat_percentage, unit: '%' },
              { label: 'Σπλαχνικό Λίπος', value: data?.visceral_fat_percentage, unit: '%' },
              { label: 'Οστική Πυκνότητα', value: data?.bone_density, unit: 'kg' },
              { label: 'Στήθος', value: data?.chest_circumference, unit: 'cm' },
              { label: 'Μέση', value: data?.waist_circumference, unit: 'cm' },
              { label: 'Ισχία', value: data?.hip_circumference, unit: 'cm' },
              { label: 'Μηρός', value: data?.thigh_circumference, unit: 'cm' },
              { label: 'Βραχίονας', value: data?.arm_circumference, unit: 'cm' },
            ];

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarImage src={userAvatar} alt={userName} /><AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback></Avatar>
                  <span className="font-semibold text-sm">{userName}</span>
                </div>

                <div className="space-y-0.5">
                  {fields.filter(f => f.value != null).map(f => (
                    <div key={f.label} className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">{f.label}:</span>
                      <span className="font-semibold">{f.value} {f.unit}</span>
                    </div>
                  ))}
                </div>

                {!readOnly && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { handleEditClick(selectedSession.id); setSelectedSession(null); }} className="rounded-none text-xs">
                      <Pencil className="w-3 h-3 mr-1" />Επεξεργασία
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { handleDeleteClick(selectedSession.id); setSelectedSession(null); }} className="rounded-none text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />Διαγραφή
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader><DialogTitle className="text-sm">Επεξεργασία Σωματομετρικών</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[
              { key: 'height', label: 'Ύψος (cm)' }, { key: 'weight', label: 'Βάρος (kg)' },
              { key: 'muscle_mass_percentage', label: 'Μυϊκή Μάζα (%)' }, { key: 'body_fat_percentage', label: 'Λίπος (%)' },
              { key: 'visceral_fat_percentage', label: 'Σπλαχνικό (%)' }, { key: 'bone_density', label: 'Οστική (kg)' },
              { key: 'chest_circumference', label: 'Στήθος (cm)' }, { key: 'waist_circumference', label: 'Μέση (cm)' },
              { key: 'hip_circumference', label: 'Ισχία (cm)' }, { key: 'thigh_circumference', label: 'Μηρός (cm)' },
              { key: 'arm_circumference', label: 'Βραχίονας (cm)' },
            ].map(field => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input type="number" value={(editFormData as any)[field.key]} onChange={(e) => setEditFormData(prev => ({ ...prev, [field.key]: e.target.value }))} className="rounded-none h-8 text-xs" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-none text-xs">Ακύρωση</Button>
            <Button onClick={handleEditSave} className="rounded-none text-xs">Αποθήκευση</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSessionToDelete(null); }} onConfirm={handleDeleteConfirm} />
    </div>
  );
};
