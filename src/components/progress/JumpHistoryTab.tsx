import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";
import { normalizeGreekText } from "@/lib/utils";

interface JumpHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

export const JumpHistoryTab: React.FC<JumpHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [typeSearch, setTypeSearch] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionIdToDelete, setSessionIdToDelete] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string>("");
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId, coachUserIds, useCoachTables]);

  const fetchSessions = async () => {
    try {
      const { data: usersData } = await supabase.from('app_users').select('id, name, email, avatar_url, photo_url');
      const userMap = new Map<string, any>();
      (usersData || []).forEach(u => userMap.set(u.id, { name: u.name, email: u.email, avatar_url: u.photo_url || u.avatar_url }));
      setUsersMap(userMap);

      let sessionsData: any[] = [];

      if (useCoachTables && selectedUserId) {
        const { data, error } = await supabase
          .from('coach_jump_test_sessions')
          .select(`id, user_id, test_date, notes, coach_jump_test_data (id, non_counter_movement_jump, counter_movement_jump, depth_jump, broad_jump, triple_jump_left, triple_jump_right)`)
          .eq('user_id', selectedUserId)
          .order('test_date', { ascending: false });
        if (error) throw error;
        sessionsData = (data || []).map(s => ({ ...s, jump_test_data: s.coach_jump_test_data || [] }));
      } else {
        let q = supabase
          .from('jump_test_sessions')
          .select(`id, user_id, test_date, notes, jump_test_data (id, non_counter_movement_jump, counter_movement_jump, depth_jump, broad_jump, triple_jump_left, triple_jump_right)`)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false });
        if (selectedUserId) q = q.eq('user_id', selectedUserId);
        else if (coachUserIds?.length) q = q.in('user_id', coachUserIds);
        const { data, error } = await q;
        if (error) throw error;
        sessionsData = data || [];
      }

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching jump sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearFilters = () => { setSelectedTypes([]); setSelectedYear("all"); setTypeSearch(""); setUserSearch(""); };

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    sessions.forEach(s => {
      if (s.notes?.startsWith('Non-CMJ Test')) types.add('Non-CMJ');
      else if (s.notes?.startsWith('CMJ Test')) types.add('CMJ');
      else if (s.notes?.startsWith('Depth Jump Test')) types.add('Depth Jump');
      else if (s.notes?.startsWith('Broad Jump Test')) types.add('Broad Jump');
      else if (s.notes?.startsWith('Triple Jump Test')) types.add('Triple Jump');
    });
    return Array.from(types).sort();
  }, [sessions]);

  const filteredTypeOptions = useMemo(() => {
    if (!typeSearch.trim()) return availableTypes;
    const ns = normalizeGreekText(typeSearch);
    return availableTypes.filter(type => normalizeGreekText(type).includes(ns));
  }, [availableTypes, typeSearch]);

  const availableYears = useMemo(() => {
    const years = sessions.map(s => new Date(s.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [sessions]);

  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    const sl = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, user]) => ({ id, ...user }))
      .filter(user => user.name?.toLowerCase().includes(sl) || user.email?.toLowerCase().includes(sl))
      .slice(0, 10);
  }, [userSearch, usersMap]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (!readOnly && userSearch.trim()) {
        const user = usersMap.get(session.user_id);
        if (!user) return false;
        const sl = userSearch.toLowerCase();
        if (!user.name?.toLowerCase().includes(sl) && !user.email?.toLowerCase().includes(sl)) return false;
      }
      if (selectedTypes.length > 0) {
        let m = false;
        if (selectedTypes.includes('Non-CMJ') && session.notes?.startsWith('Non-CMJ Test')) m = true;
        if (selectedTypes.includes('CMJ') && session.notes?.startsWith('CMJ Test') && !session.notes?.startsWith('Non-CMJ')) m = true;
        if (selectedTypes.includes('Depth Jump') && session.notes?.startsWith('Depth Jump Test')) m = true;
        if (selectedTypes.includes('Broad Jump') && session.notes?.startsWith('Broad Jump Test')) m = true;
        if (selectedTypes.includes('Triple Jump') && session.notes?.startsWith('Triple Jump Test')) m = true;
        if (!m) return false;
      }
      if (selectedYear !== "all" && new Date(session.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [sessions, selectedTypes, selectedYear, userSearch, usersMap, readOnly]);

  const sessionsByType = useMemo(() => {
    const groups: { key: string; label: string; sessions: any[] }[] = [];
    const nonCmj = filteredSessions.filter(s => s.notes?.startsWith('Non-CMJ Test'));
    const cmj = filteredSessions.filter(s => s.notes?.startsWith('CMJ Test') && !s.notes?.startsWith('Non-CMJ'));
    const depthJump = filteredSessions.filter(s => s.notes?.startsWith('Depth Jump Test'));
    const broadJump = filteredSessions.filter(s => s.notes?.startsWith('Broad Jump Test'));
    const tripleJump = filteredSessions.filter(s => s.notes?.startsWith('Triple Jump Test'));

    if (nonCmj.length > 0) groups.push({ key: 'non-cmj', label: t('history.nonCmj') || 'Non-CMJ', sessions: nonCmj });
    if (cmj.length > 0) groups.push({ key: 'cmj', label: t('history.cmj') || 'CMJ', sessions: cmj });
    if (depthJump.length > 0) groups.push({ key: 'depth', label: t('history.depthJump') || 'Depth Jump', sessions: depthJump });
    if (broadJump.length > 0) groups.push({ key: 'broad', label: t('history.broadJump') || 'Broad Jump', sessions: broadJump });
    if (tripleJump.length > 0) groups.push({ key: 'triple', label: t('history.tripleJump') || 'Triple Jump', sessions: tripleJump });
    return groups;
  }, [filteredSessions, t]);

  const handleDeleteClick = (sessionId: string) => { setSessionIdToDelete(sessionId); setDeleteDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!sessionIdToDelete) return;
    try {
      await supabase.from('jump_test_data').delete().eq('test_session_id', sessionIdToDelete);
      await supabase.from('jump_test_sessions').delete().eq('id', sessionIdToDelete);
      toast({ title: "Επιτυχία", description: "Η καταγραφή διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      console.error('Error deleting jump session:', error);
      toast({ title: "Σφάλμα", description: "Σφάλμα κατά τη διαγραφή", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionIdToDelete(null);
    }
  };

  const getJumpSummary = (session: any) => {
    const parts: string[] = [];
    if (session.notes) {
      const val = session.notes.split(' - ')[1];
      if (val) parts.push(val);
    }
    return parts.join(', ');
  };

  if (loading) return <div className="text-center py-8">{t('history.loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-start">
        {!readOnly && (
          <div className="relative w-full sm:w-[250px]">
            <Input type="text" placeholder={t('history.searchUser')} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="rounded-none pr-8" />
            {userSearch && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setUserSearch("")}><X className="w-4 h-4" /></Button>}
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
                {userSuggestions.map(user => (
                  <div key={user.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setUserSearch(user.name); setShowSuggestions(false); }}>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative w-full sm:w-[250px]" ref={typeDropdownRef}>
          <div onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full h-10 px-3 py-2 rounded-none border border-input bg-background flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground">
            <span className="text-sm">{selectedTypes.length === 0 ? t('history.selectJumpType') : `${selectedTypes.length} ${t('history.typesSelected')}`}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
          {isTypeDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-none shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col">
              <div className="p-2 border-b border-input">
                <Input type="text" placeholder={t('history.searchType')} value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)} className="rounded-none h-8" onClick={(e) => e.stopPropagation()} />
              </div>
              <div className="overflow-y-auto">
                {filteredTypeOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t('history.noTypesFound')}</div>
                ) : (
                  filteredTypeOptions.map((type) => (
                    <div key={type} onClick={(e) => { e.stopPropagation(); setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); }}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${selectedTypes.includes(type) ? 'bg-[#00ffba] hover:bg-[#00ffba]/90' : ''}`}>
                      <span className="text-sm">{type}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-none"><SelectValue placeholder={t('history.allYears')} /></SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">{t('history.allYears')}</SelectItem>
            {availableYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-none h-10 w-full sm:w-auto">
          <X className="w-4 h-4 mr-2" />{t('history.clear')}
        </Button>
      </div>

      {/* Avatar Timeline Groups */}
      <div className="space-y-4">
        {sessionsByType.map((group) => (
          <div key={group.key} className="border-b border-border pb-3">
            <h3 className="text-sm font-semibold mb-2">{group.label}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {group.sessions.map((session, idx) => {
                const userName = usersMap.get(session.user_id)?.name || '';
                const userAvatar = usersMap.get(session.user_id)?.avatar_url;
                const currentMonth = format(new Date(session.test_date), 'yyyy-MM');
                const currentYear = new Date(session.test_date).getFullYear();
                const nextSession = group.sessions[idx + 1];
                const nextMonth = nextSession ? format(new Date(nextSession.test_date), 'yyyy-MM') : currentMonth;
                const nextYear = nextSession ? new Date(nextSession.test_date).getFullYear() : currentYear;
                const isLastInMonth = nextSession && currentMonth !== nextMonth;
                const isLastInYear = nextSession && currentYear !== nextYear;

                return (
                  <React.Fragment key={session.id}>
                    <button
                      onClick={() => { setSelectedSession(session); setSelectedTypeName(group.label); }}
                      className="relative group"
                      title={`${userName} - ${format(new Date(session.test_date), 'dd/MM/yy')} - ${getJumpSummary(session)}`}
                    >
                      <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-foreground transition-colors">
                        <AvatarImage src={userAvatar || ''} alt={userName} />
                        <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                    {isLastInYear ? (
                      <div className="flex items-center shrink-0 gap-1">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(session.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                          <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground shrink-0">{currentYear}</span>
                      </div>
                    ) : isLastInMonth ? (
                      <div className="flex flex-col items-center mx-0.5 shrink-0">
                        <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(session.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                        <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}
              {group.sessions.length > 0 && (() => {
                const lastSession = group.sessions[group.sessions.length - 1];
                return (
                  <div className="flex items-center shrink-0 gap-1">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">{format(new Date(lastSession.test_date), 'MMM', { locale: el }).toUpperCase()}</span>
                      <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground shrink-0">{new Date(lastSession.test_date).getFullYear()}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {selectedTypeName} - {selectedSession && format(new Date(selectedSession.test_date), 'dd/MM/yyyy', { locale: el })}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (() => {
            const userName = usersMap.get(selectedSession.user_id)?.name || 'Άγνωστος';
            const userAvatar = usersMap.get(selectedSession.user_id)?.avatar_url;
            const jumpData = selectedSession.jump_test_data?.[0];

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar || ''} alt={userName} />
                    <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{userName}</span>
                </div>

                {selectedSession.notes && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedSession.notes.split(' - ')[0]}</span>
                    {selectedSession.notes.includes(' - ') && (
                      <p className="text-base font-bold text-blue-600 mt-1">{selectedSession.notes.split(' - ').slice(1).join(' - ')}</p>
                    )}
                  </div>
                )}

                {jumpData && (
                  <div className="space-y-0.5">
                    {jumpData.non_counter_movement_jump !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">Non-CMJ:</span><span className="font-semibold text-blue-600">{jumpData.non_counter_movement_jump} cm</span></div>
                    )}
                    {jumpData.counter_movement_jump !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">CMJ:</span><span className="font-semibold text-blue-600">{jumpData.counter_movement_jump} cm</span></div>
                    )}
                    {jumpData.depth_jump !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">Depth Jump:</span><span className="font-semibold text-blue-600">{jumpData.depth_jump} cm</span></div>
                    )}
                    {jumpData.broad_jump !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">Broad Jump:</span><span className="font-semibold text-blue-600">{jumpData.broad_jump} cm</span></div>
                    )}
                    {jumpData.triple_jump_left !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">Triple Jump L:</span><span className="font-semibold text-blue-600">{jumpData.triple_jump_left} cm</span></div>
                    )}
                    {jumpData.triple_jump_right !== null && (
                      <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="text-muted-foreground">Triple Jump R:</span><span className="font-semibold text-blue-600">{jumpData.triple_jump_right} cm</span></div>
                    )}
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

      <DeleteConfirmDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleDeleteConfirm} />
    </div>
  );
};
