import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ selectedUserId, readOnly = false }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttempt, setEditingAttempt] = useState<any>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editVelocity, setEditVelocity] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  // Filter states
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId]);

  const fetchSessions = async () => {
    try {
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

      // Filter by specific user if selectedUserId is provided
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }

      const [sessionsRes, usersRes] = await Promise.all([
        query,
        supabase.from('app_users').select('id, name, email')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (usersRes.error) throw usersRes.error;

      const map = new Map<string, any>();
      (usersRes.data || []).forEach(u => map.set(u.id, { name: u.name, email: u.email }));
      setUsersMap(map);

      setSessions(sessionsRes.data || []);
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
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρες τιμές",
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
        title: "Επιτυχία",
        description: "Η προσπάθεια ενημερώθηκε"
      });

      setEditingAttempt(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης",
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
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε"
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής",
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

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές</div>;
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
      <div className="flex gap-3 flex-wrap items-start mb-4">
        {!readOnly && (
          <div className="relative w-[250px]">
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

        <div className="relative w-[300px]">
          <Select 
            value={selectedExercises.length === 1 ? selectedExercises[0] : "multiple"}
            onValueChange={() => {}}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue>
                {selectedExercises.length === 0 
                  ? "Όλες οι ασκήσεις" 
                  : selectedExercises.length === 1
                    ? availableExercises.find(e => e.id === selectedExercises[0])?.name
                    : `${selectedExercises.length} ασκήσεις επιλεγμένες`
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
          <SelectTrigger className="w-[150px] rounded-none">
            <SelectValue placeholder="Όλα τα έτη" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλα τα έτη</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="rounded-none h-10"
        >
          <X className="w-4 h-4 mr-2" />
          Καθαρισμός
        </Button>
      </div>

      <div className="space-y-4">
        {filteredSessions.map((session) => {
          // Group attempts by exercise
          const attemptsByExercise = session.strength_test_attempts.reduce((acc: any, attempt: any) => {
            const exerciseId = attempt.exercises?.id;
            if (!acc[exerciseId]) {
              acc[exerciseId] = {
                exerciseName: attempt.exercises?.name || 'Άγνωστη Άσκηση',
                attempts: []
              };
            }
            acc[exerciseId].attempts.push(attempt);
            return acc;
          }, {});

          return (
            <Card key={session.id} className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-base whitespace-nowrap">
                      {session.app_users?.name || 'Άγνωστος Χρήστης'}
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {format(new Date(session.test_date), 'dd MMM yyyy', { locale: el })}
                    </span>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSessionClick(session.id)}
                      className="rounded-none text-destructive hover:text-destructive h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {Object.values(attemptsByExercise).map((exerciseData: any, idx: number) => {
                  // Prepare chart data for this exercise
                  const chartData = exerciseData.attempts.map((attempt: any) => ({
                    exerciseName: exerciseData.exerciseName,
                    exerciseId: attempt.exercises?.id,
                    velocity: attempt.velocity_ms || 0,
                    weight: attempt.weight_kg,
                    date: session.test_date,
                    sessionId: session.id
                  }));

                  return (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
                      {/* Left side - Attempts list */}
                      <div className="space-y-2">
                        <div className="text-sm font-semibold mb-2">{exerciseData.exerciseName}</div>
                        <div className="space-y-1">
                          {/* Header */}
                          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 p-1 text-xs font-medium text-gray-600">
                            <span className="w-4">#</span>
                            <span>Κιλά</span>
                            <span>m/s</span>
                            <span className="w-6"></span>
                          </div>
                          {/* Attempts */}
                          {exerciseData.attempts
                            .sort((a: any, b: any) => a.attempt_number - b.attempt_number)
                            .map((attempt: any) => (
                              <div key={attempt.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 p-1 border rounded-none bg-white">
                                <span className="text-xs font-medium w-4">#{attempt.attempt_number}</span>
                                <span className="text-xs border rounded-none p-1 bg-gray-50">{attempt.weight_kg} kg</span>
                                <span className="text-xs border rounded-none p-1 bg-gray-50">{attempt.velocity_ms} m/s</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditAttempt(attempt)}
                                  className="rounded-none h-6 w-6 p-0"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Right side - Chart */}
                      <div className="flex items-center justify-center">
                        {chartData.length > 0 && (
                          <div className="w-full">
                            <LoadVelocityChart 
                              data={chartData}
                              selectedExercises={[exerciseData.exerciseName]}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingAttempt} onOpenChange={() => setEditingAttempt(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Προσπάθειας</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Βάρος (kg)</label>
              <Input
                type="number"
                step="0.5"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ταχύτητα (m/s)</label>
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
                Αποθήκευση
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingAttempt(null)}
                className="rounded-none flex-1"
              >
                Ακύρωση
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
