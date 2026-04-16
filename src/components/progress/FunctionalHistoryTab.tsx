import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface FunctionalHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

interface FunctionalResult {
  id: string;
  test_date: string;
  user_name: string;
  user_id: string;
}

export const FunctionalHistoryTab: React.FC<FunctionalHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const usersMap = useUserNamesMap();
  const [results, setResults] = useState<FunctionalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [functionalData, setFunctionalData] = useState<Record<string, any>>({});
  const [usersAvatarMap, setUsersAvatarMap] = useState<Map<string, string>>(new Map());
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<FunctionalResult | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      const { data } = await supabase.from('app_users').select('id, avatar_url, photo_url');
      const map = new Map<string, string>();
      (data || []).forEach(u => map.set(u.id, u.photo_url || u.avatar_url || ''));
      setUsersAvatarMap(map);
    };
    fetchAvatars();
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let sessionsData: any[] = [];
      if (useCoachTables && selectedUserId) {
        const { data, error } = await supabase.from('coach_functional_test_sessions').select('id, user_id, test_date, notes').eq('user_id', selectedUserId).order('test_date', { ascending: false });
        if (error) throw error;
        sessionsData = data || [];
      } else {
        let query = supabase.from('functional_test_sessions').select('id, user_id, test_date, notes').order('test_date', { ascending: false });
        if (selectedUserId) query = query.eq('user_id', selectedUserId);
        else if (coachUserIds?.length) query = query.in('user_id', coachUserIds);
        const { data, error } = await query;
        if (error) throw error;
        sessionsData = data || [];
      }
      setResults(sessionsData.map(s => ({ id: s.id, test_date: s.test_date, user_name: usersMap.get(s.user_id) || "Άγνωστος", user_id: s.user_id })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [usersMap, selectedUserId, useCoachTables, coachUserIds]);

  useEffect(() => {
    if (selectedUserId && readOnly) fetchResults();
    else if (usersMap.size > 0) fetchResults();
  }, [fetchResults, usersMap, selectedUserId, readOnly]);

  useEffect(() => {
    if (results.length > 0) fetchFunctionalData();
  }, [results, useCoachTables]);

  const fetchFunctionalData = async () => {
    const data: Record<string, any> = {};
    const tableName = useCoachTables ? 'coach_functional_test_data' : 'functional_test_data';
    for (const result of results) {
      const { data: funcData, error } = await supabase.from(tableName).select('*').eq('test_session_id', result.id).maybeSingle();
      if (!error && funcData) data[result.id] = funcData;
    }
    setFunctionalData(data);
  };

  const handleDeleteClick = (sessionId: string) => { setSessionToDelete(sessionId); setIsDeleteDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    try {
      await supabase.from('functional_test_data').delete().eq('test_session_id', sessionToDelete);
      await supabase.from('functional_test_sessions').delete().eq('id', sessionToDelete);
      toast.success('Η καταγραφή διαγράφηκε');
      setIsDeleteDialogOpen(false); setSessionToDelete(null);
      await fetchResults(); fetchFunctionalData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
      setIsDeleteDialogOpen(false); setSessionToDelete(null);
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
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name })).filter(u => u.name?.toLowerCase().includes(sl)).slice(0, 10);
  }, [userSearch, usersMap]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (selectedUserId) filtered = filtered.filter(r => r.user_id === selectedUserId);
    if (!readOnly && userSearch.trim()) {
      filtered = filtered.filter(r => {
        const un = usersMap.get(r.user_id);
        return un?.toLowerCase().includes(userSearch.toLowerCase());
      });
    }
    if (selectedYear !== "all") filtered = filtered.filter(r => new Date(r.test_date).getFullYear().toString() === selectedYear);
    return filtered;
  }, [results, selectedYear, userSearch, usersMap, readOnly, selectedUserId]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (results.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

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
        <h3 className="text-sm font-semibold mb-2">Λειτουργικά</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {filteredResults.map((result, idx) => {
            const userName = result.user_name;
            const userAvatar = usersAvatarMap.get(result.user_id) || '';
            const data = functionalData[result.id];
            const summary = data?.fms_score !== undefined ? `FMS: ${data.fms_score}` : '';
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
            <DialogTitle className="text-sm">Λειτουργικά - {selectedSession && format(new Date(selectedSession.test_date), 'dd/MM/yyyy', { locale: el })}</DialogTitle>
          </DialogHeader>
          {selectedSession && (() => {
            const userName = selectedSession.user_name;
            const userAvatar = usersAvatarMap.get(selectedSession.user_id) || '';
            const data = functionalData[selectedSession.id];
            const fmsScores = data?.fms_detailed_scores as Record<string, number> | null;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarImage src={userAvatar} alt={userName} /><AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback></Avatar>
                  <span className="font-semibold text-sm">{userName}</span>
                  {data?.fms_score !== undefined && (
                    <Badge variant="outline" className={`rounded-none text-[10px] ${data.fms_score < 14 ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
                      FMS: {data.fms_score}
                    </Badge>
                  )}
                </div>

                {fmsScores && Object.keys(fmsScores).length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">FMS Scores:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(fmsScores).map(([exercise, score]) => (
                        <Badge key={exercise} variant="secondary" className="rounded-none text-[8px]">{exercise}: {score}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {data?.posture_issues?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">Στάση Σώματος:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.posture_issues.map((issue: string, i: number) => <Badge key={i} variant="outline" className="rounded-none text-[8px]">{issue}</Badge>)}
                    </div>
                  </div>
                )}

                {data?.squat_issues?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">Κάθισμα:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.squat_issues.map((issue: string, i: number) => <Badge key={i} variant="outline" className="rounded-none text-[8px]">{issue}</Badge>)}
                    </div>
                  </div>
                )}

                {data?.single_leg_squat_issues?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">Μονοποδικό:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.single_leg_squat_issues.map((issue: string, i: number) => <Badge key={i} variant="outline" className="rounded-none text-[8px]">{issue}</Badge>)}
                    </div>
                  </div>
                )}

                {data?.muscles_need_stretching?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">Μύες για Διάταση:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.muscles_need_stretching.map((muscle: string, i: number) => <Badge key={i} variant="outline" className="rounded-none text-[8px] border-orange-500 text-orange-600 bg-orange-50">{muscle}</Badge>)}
                    </div>
                  </div>
                )}

                {data?.muscles_need_strengthening?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-muted-foreground mb-1">Μύες για Ενδυνάμωση:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.muscles_need_strengthening.map((muscle: string, i: number) => <Badge key={i} variant="outline" className="rounded-none text-[8px] border-red-500 text-red-600 bg-red-50">{muscle}</Badge>)}
                    </div>
                  </div>
                )}

                {!readOnly && (
                  <div className="flex justify-end pt-2 border-t border-border">
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

      <DeleteConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSessionToDelete(null); }} onConfirm={handleDeleteConfirm} />
    </div>
  );
};
