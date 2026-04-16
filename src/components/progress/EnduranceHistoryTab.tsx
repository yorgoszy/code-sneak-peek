import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface EnduranceHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

export const EnduranceHistoryTab: React.FC<EnduranceHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId, coachUserIds, useCoachTables]);

  const fetchSessions = async () => {
    try {
      let sessionsData: any[] = [];

      if (useCoachTables && selectedUserId) {
        const { data, error } = await supabase
          .from('coach_endurance_test_sessions')
          .select(`
            id, user_id, test_date, notes, created_at,
            coach_endurance_test_data (
              id, exercise_id, mas_meters, mas_minutes, mas_ms, mas_kmh,
              push_ups, pull_ups, t2b, farmer_kg, farmer_meters, farmer_seconds,
              sprint_seconds, sprint_meters, sprint_resistance, sprint_watt,
              vo2_max, max_hr, resting_hr_1min, crunches,
              exercises ( id, name )
            )
          `)
          .eq('user_id', selectedUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        sessionsData = (data || []).map(session => ({
          ...session,
          endurance_test_data: session.coach_endurance_test_data || []
        })).filter(session => session.endurance_test_data && session.endurance_test_data.length > 0);
      } else {
        let sessionsQuery = supabase
          .from('endurance_test_sessions')
          .select(`
            id, user_id, test_date, notes, created_at,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              id, exercise_id, mas_meters, mas_minutes, mas_ms, mas_kmh,
              push_ups, pull_ups, t2b, farmer_kg, farmer_meters, farmer_seconds,
              sprint_seconds, sprint_meters, sprint_resistance, sprint_watt,
              vo2_max, max_hr, resting_hr_1min, crunches,
              exercises ( id, name )
            )
          `)
          .order('created_at', { ascending: false });

        if (selectedUserId) {
          sessionsQuery = sessionsQuery.eq('user_id', selectedUserId);
        } else if (coachUserIds && coachUserIds.length > 0) {
          sessionsQuery = sessionsQuery.in('user_id', coachUserIds);
        }

        const { data, error } = await sessionsQuery;
        if (error) throw error;
        sessionsData = (data || []).filter(session => 
          session.endurance_test_data && session.endurance_test_data.length > 0
        );
      }

      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url');

      const map = new Map<string, any>();
      (usersData || []).forEach(u => map.set(u.id, { name: u.name, email: u.email, avatar_url: u.photo_url || u.avatar_url }));
      setUsersMap(map);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSessionClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSessionConfirm = async () => {
    if (!sessionToDelete) return;
    try {
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .delete()
        .eq('test_session_id', sessionToDelete);
      if (dataError) throw dataError;

      const { error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .delete()
        .eq('id', sessionToDelete);
      if (sessionError) throw sessionError;

      toast({ title: "Επιτυχία", description: "Η καταγραφή διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedExercises([]);
    setSelectedCategory("all");
    setSelectedYear("all");
    setUserSearch("");
  };

  const availableExercises = useMemo(() => {
    const exercisesMap = new Map<string, string>();
    sessions.forEach(session => {
      const data = session.endurance_test_data?.[0];
      if (data?.exercises?.id && data?.exercises?.name) {
        exercisesMap.set(data.exercises.id, data.exercises.name);
      }
    });
    return Array.from(exercisesMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    const searchLower = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, user]) => ({ id, ...user }))
      .filter(user => user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower))
      .slice(0, 10);
  }, [userSearch, usersMap]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (!readOnly && userSearch.trim()) {
        const user = usersMap.get(s.user_id);
        if (!user) return false;
        const searchLower = userSearch.toLowerCase();
        if (!user.name?.toLowerCase().includes(searchLower) && !user.email?.toLowerCase().includes(searchLower)) return false;
      }
      if (selectedExercises.length > 0) {
        const exerciseId = s.endurance_test_data?.[0]?.exercises?.id;
        if (!exerciseId || !selectedExercises.includes(exerciseId)) return false;
      }
      if (selectedYear !== "all" && new Date(s.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [sessions, selectedExercises, selectedYear, userSearch, usersMap, readOnly]);

  const availableYears = useMemo(() => {
    const years = sessions.map(s => new Date(s.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [sessions]);

  // Group by category
  const categorizedGroups = useMemo(() => {
    const categories: { key: string; label: string; sessions: any[] }[] = [];

    const masSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "mas") return false;
      return s.endurance_test_data[0]?.mas_meters;
    });
    if (masSessions.length > 0) categories.push({ key: 'mas', label: 'MAS Test', sessions: masSessions });

    const cardiacSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "cardiac") return false;
      return s.endurance_test_data[0]?.max_hr !== null || s.endurance_test_data[0]?.resting_hr_1min !== null;
    });
    if (cardiacSessions.length > 0) categories.push({ key: 'cardiac', label: 'Cardiac Data', sessions: cardiacSessions });

    const vo2MaxSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "vo2max") return false;
      return s.endurance_test_data[0]?.vo2_max;
    });
    if (vo2MaxSessions.length > 0) categories.push({ key: 'vo2max', label: 'VO2 Max', sessions: vo2MaxSessions });

    const bodyweightSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "bodyweight") return false;
      return s.endurance_test_data[0]?.push_ups !== null || 
             s.endurance_test_data[0]?.pull_ups !== null ||
             s.endurance_test_data[0]?.t2b !== null;
    });
    if (bodyweightSessions.length > 0) categories.push({ key: 'bodyweight', label: 'Push Ups, Pull Ups & T2B', sessions: bodyweightSessions });

    const farmerSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "farmer") return false;
      return s.endurance_test_data[0]?.farmer_kg;
    });
    if (farmerSessions.length > 0) categories.push({ key: 'farmer', label: 'Farmer Walk', sessions: farmerSessions });

    const sprintSessions = filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "sprint") return false;
      return s.endurance_test_data[0]?.sprint_seconds;
    });
    if (sprintSessions.length > 0) categories.push({ key: 'sprint', label: 'Sprint', sessions: sprintSessions });

    return categories;
  }, [filteredSessions, selectedCategory]);

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.includes(exerciseId) ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]);
  };

  const getSessionSummary = (session: any) => {
    const d = session.endurance_test_data[0];
    const parts: string[] = [];
    if (d?.mas_meters) parts.push(`MAS: ${d.mas_ms?.toFixed(2)}m/s`);
    if (d?.sprint_seconds) parts.push(`Sprint: ${d.sprint_seconds}s`);
    if (d?.vo2_max) parts.push(`VO2: ${d.vo2_max}`);
    if (d?.push_ups !== null) parts.push(`PU: ${d.push_ups}`);
    if (d?.pull_ups !== null) parts.push(`Pull: ${d.pull_ups}`);
    if (d?.farmer_kg) parts.push(`Farmer: ${d.farmer_kg}kg`);
    if (d?.max_hr !== null) parts.push(`HR: ${d.max_hr}bpm`);
    return parts.join(', ');
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">{t('history.loading')}</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">{t('history.noRecords')}</div>;
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-start mb-4">
        {!readOnly && (
          <div className="relative w-full sm:w-[250px]">
            <Input
              type="text"
              placeholder="Αναζήτηση χρήστη (όνομα ή email)..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="rounded-none pr-8"
            />
            {userSearch && (
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setUserSearch("")}>
                <X className="w-4 h-4" />
              </Button>
            )}
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
                {userSuggestions.map((user) => (
                  <div key={user.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setUserSearch(user.name); setShowSuggestions(false); }}>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative w-full sm:w-[300px]">
          <Select value={selectedExercises.length === 1 ? selectedExercises[0] : "multiple"} onValueChange={() => {}}>
            <SelectTrigger className="rounded-none">
              <SelectValue>
                {selectedExercises.length === 0 ? "Όλες οι ασκήσεις" : selectedExercises.length === 1 ? availableExercises.find(e => e.id === selectedExercises[0])?.name : `${selectedExercises.length} ασκήσεις επιλεγμένες`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-none max-h-[300px]">
              <div className="p-2 space-y-1">
                {availableExercises.map(exercise => (
                  <div key={exercise.id} className={`p-2 hover:bg-gray-100 cursor-pointer rounded-none ${selectedExercises.includes(exercise.id) ? 'bg-[#00ffba]/20 font-medium' : ''}`} onClick={() => toggleExercise(exercise.id)}>
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px] rounded-none">
            <SelectValue placeholder="Όλες οι κατηγορίες" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλες οι κατηγορίες</SelectItem>
            <SelectItem value="mas">MAS Tests</SelectItem>
            <SelectItem value="bodyweight">Push Ups, Pull Ups & T2B</SelectItem>
            <SelectItem value="farmer">Farmer Walk</SelectItem>
            <SelectItem value="sprint">Sprint</SelectItem>
            <SelectItem value="vo2max">VO2 Max</SelectItem>
            <SelectItem value="cardiac">Cardiac Data</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-none">
            <SelectValue placeholder="Όλα τα έτη" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλα τα έτη</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-none h-10 w-full sm:w-auto">
          <X className="w-4 h-4 mr-2" />
          Καθαρισμός
        </Button>
      </div>

      {/* Avatar Timeline Groups */}
      <div className="space-y-4">
        {categorizedGroups.map((group) => (
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
                      onClick={() => { setSelectedSession(session); setSelectedCategoryName(group.label); }}
                      className="relative group"
                      title={`${userName} - ${format(new Date(session.test_date), 'dd/MM/yy')} - ${getSessionSummary(session)}`}
                    >
                      <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-foreground transition-colors">
                        <AvatarImage src={userAvatar || ''} alt={userName} />
                        <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                    {isLastInYear ? (
                      <div className="flex items-center shrink-0 gap-1">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">
                            {format(new Date(session.test_date), 'MMM', { locale: el }).toUpperCase()}
                          </span>
                          <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground shrink-0">{currentYear}</span>
                      </div>
                    ) : isLastInMonth ? (
                      <div className="flex flex-col items-center mx-0.5 shrink-0">
                        <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">
                          {format(new Date(session.test_date), 'MMM', { locale: el }).toUpperCase()}
                        </span>
                        <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}
              {/* Last month label */}
              {group.sessions.length > 0 && (() => {
                const lastSession = group.sessions[group.sessions.length - 1];
                return (
                  <div className="flex items-center shrink-0 gap-1">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">
                        {format(new Date(lastSession.test_date), 'MMM', { locale: el }).toUpperCase()}
                      </span>
                      <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground shrink-0">
                      {new Date(lastSession.test_date).getFullYear()}
                    </span>
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
              {selectedCategoryName} - {selectedSession && format(new Date(selectedSession.test_date), 'dd/MM/yyyy', { locale: el })}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (() => {
            const userName = usersMap.get(selectedSession.user_id)?.name || 'Άγνωστος';
            const userAvatar = usersMap.get(selectedSession.user_id)?.avatar_url;
            const d = selectedSession.endurance_test_data[0];

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar || ''} alt={userName} />
                    <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{userName}</span>
                </div>

                {d?.exercises?.name && (
                  <div className="text-xs text-muted-foreground">Άσκηση: <span className="font-medium text-foreground">{d.exercises.name}</span></div>
                )}

                <div className="space-y-0.5">
                  {d?.mas_meters && (
                    <>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Απόσταση:</span>
                        <span className="font-semibold">{d.mas_meters}m</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Χρόνος:</span>
                        <span className="font-semibold">{d.mas_minutes}'</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">MAS (m/s):</span>
                        <span className="font-bold text-[#cb8954]">{d.mas_ms?.toFixed(2)} m/s</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">MAS (km/h):</span>
                        <span className="font-bold text-[#cb8954]">{d.mas_kmh?.toFixed(2)} km/h</span>
                      </div>
                    </>
                  )}
                  {d?.push_ups !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">Push Ups:</span>
                      <span className="font-bold text-[#cb8954]">{d.push_ups}</span>
                    </div>
                  )}
                  {d?.pull_ups !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">Pull Ups:</span>
                      <span className="font-bold text-[#cb8954]">{d.pull_ups}</span>
                    </div>
                  )}
                  {d?.t2b !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">T2B:</span>
                      <span className="font-bold text-[#cb8954]">{d.t2b}</span>
                    </div>
                  )}
                  {d?.crunches !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">Crunches:</span>
                      <span className="font-bold text-[#cb8954]">{d.crunches}</span>
                    </div>
                  )}
                  {d?.farmer_kg !== null && (
                    <>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Farmer kg:</span>
                        <span className="font-bold text-[#cb8954]">{d.farmer_kg}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Farmer m:</span>
                        <span className="font-bold text-[#cb8954]">{d.farmer_meters}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Farmer s:</span>
                        <span className="font-bold text-[#cb8954]">{d.farmer_seconds}</span>
                      </div>
                    </>
                  )}
                  {d?.sprint_seconds !== null && (
                    <>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Sprint s:</span>
                        <span className="font-bold text-[#cb8954]">{d.sprint_seconds}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">Sprint m:</span>
                        <span className="font-bold text-[#cb8954]">{d.sprint_meters}</span>
                      </div>
                      {d?.sprint_watt !== null && (
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <span className="text-muted-foreground">Sprint km/h:</span>
                          <span className="font-bold text-[#cb8954]">{parseFloat(d.sprint_watt).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {d?.vo2_max !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">VO2 Max:</span>
                      <span className="font-bold text-[#cb8954]">{d.vo2_max}</span>
                    </div>
                  )}
                  {d?.max_hr !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">Max HR:</span>
                      <span className="font-bold text-red-500">{d.max_hr} bpm</span>
                    </div>
                  )}
                  {d?.resting_hr_1min !== null && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">Resting HR:</span>
                      <span className="font-bold text-blue-500">{d.resting_hr_1min} bpm</span>
                    </div>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { handleDeleteSessionClick(selectedSession.id); setSelectedSession(null); }} className="rounded-none text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Διαγραφή
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteSessionConfirm}
      />
    </>
  );
};
