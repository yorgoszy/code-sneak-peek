import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Pencil, Trash2, ChevronDown, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface HistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttempt, setEditingAttempt] = useState<any>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editVelocity, setEditVelocity] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedExerciseGroup, setSelectedExerciseGroup] = useState<any>(null);
  
  // Filter states
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId, coachUserIds, useCoachTables]);

  const fetchSessions = async () => {
    try {
      let sessionsData: any[] = [];
      
      if (useCoachTables && selectedUserId) {
        // Fetch from coach tables
        const { data, error } = await supabase
          .from('coach_strength_test_sessions')
          .select(`
            id,
            test_date,
            notes,
            created_at,
            user_id,
            coach_strength_test_data (
              id,
              weight_kg,
              velocity_ms,
              exercise_id,
              exercises (
                id,
                name
              )
            )
          `)
          .eq('user_id', selectedUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform coach data to match expected format
        sessionsData = (data || []).map(session => ({
          ...session,
          strength_test_attempts: session.coach_strength_test_data?.map((d: any, index: number) => ({
            id: d.id,
            weight_kg: d.weight_kg,
            velocity_ms: d.velocity_ms,
            attempt_number: index + 1,
            exercises: d.exercises
          })) || []
        }));
      } else {
        // Fetch from regular tables
        let query = supabase
          .from('strength_test_sessions')
          .select(`
            id,
            test_date,
            notes,
            created_at,
            user_id,
            app_users!strength_test_sessions_user_id_fkey (
              id,
              name,
              email
            ),
            strength_test_attempts (
              id,
              weight_kg,
              velocity_ms,
              attempt_number,
              exercises (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (selectedUserId) {
          query = query.eq('user_id', selectedUserId);
        } else if (coachUserIds && coachUserIds.length > 0) {
          query = query.in('user_id', coachUserIds);
        }

        const { data, error } = await query;
        if (error) throw error;
        sessionsData = data || [];
      }

      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url');
        
      if (usersError) throw usersError;

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

  const handleEditAttempt = (attempt: any) => {
    setEditingAttempt(attempt);
    setEditWeight(attempt.weight_kg.toString());
    setEditVelocity(attempt.velocity_ms.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingAttempt) return;

    const weight = parseFloat(editWeight);
    const velocity = parseFloat(editVelocity);

    if (isNaN(weight) || isNaN(velocity) || weight <= 0 || velocity <= 0) {
      toast({
        title: t('history.error'),
        description: t('history.validValues'),
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('strength_test_attempts')
        .update({
          weight_kg: weight,
          velocity_ms: velocity
        })
        .eq('id', editingAttempt.id);

      if (error) throw error;

      toast({
        title: t('history.success'),
        description: t('history.attemptUpdated')
      });

      setEditingAttempt(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast({
        title: t('history.error'),
        description: t('history.updateFailed'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteSessionClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSessionConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      // Delete attempts first (due to foreign key)
      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .delete()
        .eq('test_session_id', sessionToDelete);

      if (attemptsError) throw attemptsError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('strength_test_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (sessionError) throw sessionError;

      toast({
        title: t('history.success'),
        description: t('history.recordDeleted')
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t('history.error'),
        description: t('history.deleteFailed'),
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedExercises([]);
    setSelectedYear("all");
    setUserSearch("");
  };

  // Get unique exercises
  const availableExercises = useMemo(() => {
    const exercisesMap = new Map<string, string>();
    sessions.forEach(session => {
      session.strength_test_attempts?.forEach((attempt: any) => {
        if (attempt.exercises?.id && attempt.exercises?.name) {
          exercisesMap.set(attempt.exercises.id, attempt.exercises.name);
        }
      });
    });
    return Array.from(exercisesMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  // Get filtered user suggestions
  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    
    const searchLower = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, user]) => ({ id, ...user }))
      .filter(user => 
        user.name?.toLowerCase().includes(searchLower) || 
        user.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
  }, [userSearch, usersMap]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Filter by user search (name or email) - only in admin dashboard
      if (!readOnly && userSearch.trim()) {
        const user = usersMap.get(s.user_id);
        if (!user) return false;
        
        const searchLower = userSearch.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch) return false;
      }
      
      // Filter by selected exercises
      if (selectedExercises.length > 0) {
        const hasSelectedExercise = s.strength_test_attempts?.some((attempt: any) => 
          selectedExercises.includes(attempt.exercises?.id)
        );
        if (!hasSelectedExercise) return false;
      }
      
      if (selectedYear !== "all" && new Date(s.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [sessions, selectedExercises, selectedYear, userSearch, usersMap, readOnly]);

  // Get unique years
  const availableYears = useMemo(() => {
    const years = sessions.map(s => new Date(s.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [sessions]);

  // Group filtered sessions by exercise
  const sessionsByExercise = useMemo(() => {
    const grouped = new Map<string, { exerciseName: string; sessions: any[] }>();
    
    filteredSessions.forEach(session => {
      session.strength_test_attempts?.forEach((attempt: any) => {
        const exerciseId = attempt.exercises?.id;
        const exerciseName = attempt.exercises?.name || t('history.unknownExercise');
        
        if (!exerciseId) return;
        
        if (!grouped.has(exerciseId)) {
          grouped.set(exerciseId, { exerciseName, sessions: [] });
        }
        
        // Check if this session is already added for this exercise
        const existingSession = grouped.get(exerciseId)!.sessions.find(s => s.id === session.id);
        if (!existingSession) {
          grouped.get(exerciseId)!.sessions.push({
            ...session,
            exerciseAttempts: [attempt]
          });
        } else {
          existingSession.exerciseAttempts.push(attempt);
        }
      });
    });
    
    // Προτεραιότητα ασκήσεων
    const priorityOrder = ['BP', 'SQ', 'Deadlift Trapbar', 'DL'];
    
    return Array.from(grouped.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        const aIndex = priorityOrder.findIndex(name => 
          a.exerciseName.toLowerCase().includes(name.toLowerCase())
        );
        const bIndex = priorityOrder.findIndex(name => 
          b.exerciseName.toLowerCase().includes(name.toLowerCase())
        );
        
        // Αν και οι δύο είναι στη λίστα προτεραιότητας
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // Αν μόνο το a είναι στη λίστα προτεραιότητας
        if (aIndex !== -1) return -1;
        // Αν μόνο το b είναι στη λίστα προτεραιότητας
        if (bIndex !== -1) return 1;
        // Αλφαβητική ταξινόμηση για τις υπόλοιπες
        return a.exerciseName.localeCompare(b.exerciseName);
      });
  }, [filteredSessions, t]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">{t('history.loading')}</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">{t('history.noRecords')}</div>;
  }

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-start mb-4">
        {!readOnly && (
          <div className="relative w-full sm:w-[250px]">
            <Input
              type="text"
              placeholder={t('history.searchUser')}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="rounded-none pr-8"
            />
            {userSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setUserSearch("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
                {userSuggestions.map((user) => (
                  <div
                    key={user.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setUserSearch(user.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative w-full sm:w-[300px]">
          <Select 
            value={selectedExercises.length === 1 ? selectedExercises[0] : "multiple"}
            onValueChange={() => {}}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue>
                {selectedExercises.length === 0 
                  ? t('history.allExercises')
                  : selectedExercises.length === 1
                    ? availableExercises.find(e => e.id === selectedExercises[0])?.name
                    : `${selectedExercises.length} ${t('history.exercisesSelected')}`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-none max-h-[300px]">
              <div className="p-2 space-y-1">
                {availableExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className={`p-2 hover:bg-gray-100 cursor-pointer rounded-none ${
                      selectedExercises.includes(exercise.id) ? 'bg-[#00ffba]/20 font-medium' : ''
                    }`}
                    onClick={() => toggleExercise(exercise.id)}
                  >
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-none">
            <SelectValue placeholder={t('history.allYears')} />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">{t('history.allYears')}</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="rounded-none h-10 w-full sm:w-auto"
        >
          <X className="w-4 h-4 mr-2" />
          {t('history.clear')}
        </Button>
      </div>

      <div className="space-y-4">
        {sessionsByExercise.map((exerciseGroup) => (
          <div key={exerciseGroup.id} className="border-b border-border pb-3">
            <h3 className="text-sm font-semibold mb-2">{exerciseGroup.exerciseName}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {exerciseGroup.sessions.map((session, idx) => {
                const userName = session.app_users?.name || usersMap.get(session.user_id)?.name || '';
                const userAvatar = usersMap.get(session.user_id)?.avatar_url;
                const sortedAttempts = session.exerciseAttempts
                  ?.sort((a: any, b: any) => a.attempt_number - b.attempt_number) || [];
                const lastAttempt = sortedAttempts[sortedAttempts.length - 1];
                
                // Check if next session is in a different month
                const currentMonth = format(new Date(session.test_date), 'yyyy-MM');
                const currentYear = new Date(session.test_date).getFullYear();
                const nextSession = exerciseGroup.sessions[idx + 1];
                const nextMonth = nextSession ? format(new Date(nextSession.test_date), 'yyyy-MM') : currentMonth;
                const nextYear = nextSession ? new Date(nextSession.test_date).getFullYear() : currentYear;
                const isLastInMonth = nextSession && currentMonth !== nextMonth;
                const isLastInYear = nextSession && currentYear !== nextYear;
                
                return (
                  <React.Fragment key={session.id}>
                    <button
                      onClick={() => { setSelectedSession(session); setSelectedExerciseGroup(exerciseGroup); }}
                      className="relative group"
                      title={`${userName} - ${format(new Date(session.test_date), 'dd/MM/yy')} - ${lastAttempt ? `${lastAttempt.weight_kg}kg @ ${lastAttempt.velocity_ms}m/s` : ''}`}
                    >
                      <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-foreground transition-colors">
                        <AvatarImage src={userAvatar || ''} alt={userName} />
                        <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                    {isLastInYear ? (
                      <div className="flex items-center mx-1 shrink-0 gap-1">
                        {/* Month separator */}
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[8px] font-bold text-destructive leading-none mb-0.5">
                            {format(new Date(session.test_date), 'MMM', { locale: el }).toUpperCase()}
                          </span>
                          <div className="w-0.5 flex-1 min-h-[20px] bg-destructive" />
                        </div>
                        {/* Year separator */}
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[9px] font-bold text-muted-foreground leading-none mb-0.5">
                            {currentYear}
                          </span>
                          <div className="w-0.5 flex-1 min-h-[20px] bg-muted-foreground/40" />
                        </div>
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
            </div>
          </div>
        ))}
      </div>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => { setSelectedSession(null); setSelectedExerciseGroup(null); }}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {selectedExerciseGroup?.exerciseName} - {selectedSession && format(new Date(selectedSession.test_date), 'dd/MM/yyyy', { locale: el })}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (() => {
            const userName = selectedSession.app_users?.name || usersMap.get(selectedSession.user_id)?.name || t('history.unknownUser');
            const userAvatar = usersMap.get(selectedSession.user_id)?.avatar_url;
            const sortedAttempts = selectedSession.exerciseAttempts
              ?.sort((a: any, b: any) => a.attempt_number - b.attempt_number) || [];

            return (
              <div className="space-y-3">
                {/* User info */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar || ''} alt={userName} />
                    <AvatarFallback className="text-[9px]">{userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{userName}</span>
                </div>

                {/* Attempts table */}
                <div className="space-y-0.5">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 text-[10px] font-medium text-muted-foreground">
                    <span className="w-5">#</span>
                    <span>{t('history.kg')}</span>
                    <span>m/s</span>
                    <span className="w-6"></span>
                  </div>
                  {sortedAttempts.map((attempt: any) => (
                    <div key={attempt.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-1">
                      <span className="text-[10px] font-medium w-5 flex items-center">#{attempt.attempt_number}</span>
                      <span className="text-[10px] border rounded-none p-1 bg-muted/30 flex items-center justify-center">
                        {attempt.weight_kg} kg
                      </span>
                      <span className="text-[10px] border rounded-none p-1 bg-muted/30 flex items-center justify-center">
                        {attempt.velocity_ms} m/s
                      </span>
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAttempt(attempt)}
                          className="rounded-none h-5 w-5 p-0"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chart */}
                {sortedAttempts.length > 0 && (
                  <div className="border-t border-border pt-2">
                    <LoadVelocityChart 
                      data={sortedAttempts.map((attempt: any) => ({
                        exerciseName: selectedExerciseGroup?.exerciseName,
                        exerciseId: attempt.exercises?.id,
                        velocity: attempt.velocity_ms || 0,
                        weight: attempt.weight_kg,
                        date: selectedSession.test_date,
                        sessionId: selectedSession.id
                      }))}
                      selectedExercises={[selectedExerciseGroup?.exerciseName]}
                    />
                  </div>
                )}

                {/* Actions */}
                {!readOnly && (
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleDeleteSessionClick(selectedSession.id);
                      }}
                      className="rounded-none text-xs"
                    >
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

      <Dialog open={!!editingAttempt} onOpenChange={() => setEditingAttempt(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>{t('common.edit')} {t('history.kg')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('history.weight')} (kg)</label>
              <Input
                type="number"
                step="0.5"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('history.velocity')} (m/s)</label>
              <Input
                type="number"
                step="0.01"
                value={editVelocity}
                onChange={(e) => setEditVelocity(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                className="rounded-none flex-1"
              >
                {t('common.save')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingAttempt(null)}
                className="rounded-none flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
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
