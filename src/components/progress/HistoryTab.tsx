import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Pencil, Trash2, ChevronDown, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface HistoryTabProps {
  selectedUserId?: string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ selectedUserId }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttempt, setEditingAttempt] = useState<any>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editVelocity, setEditVelocity] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  // Filter states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

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
            name
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

      const { data, error } = await query;

      if (error) throw error;

      setSessions(data || []);
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

  // Extract unique values for filters
  const uniqueUsers = useMemo(() => {
    const users = sessions.map(s => ({ id: s.app_users?.id, name: s.app_users?.name || 'Άγνωστος' }));
    return Array.from(new Map(users.map(u => [u.id, u])).values());
  }, [sessions]);

  const uniqueExercises = useMemo(() => {
    const exercises = new Map<string, string>();
    sessions.forEach(s => {
      s.strength_test_attempts.forEach((a: any) => {
        if (a.exercises?.id && a.exercises?.name) {
          exercises.set(a.exercises.id, a.exercises.name);
        }
      });
    });
    return Array.from(exercises.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  const uniqueMonths = useMemo(() => {
    const months = new Set(sessions.map(s => format(new Date(s.test_date), 'yyyy-MM')));
    return Array.from(months).sort().reverse();
  }, [sessions]);

  const uniqueYears = useMemo(() => {
    const years = new Set(sessions.map(s => format(new Date(s.test_date), 'yyyy')));
    return Array.from(years).sort().reverse();
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // User filter
      if (selectedUsers.length > 0 && !selectedUsers.includes(session.app_users?.id)) {
        return false;
      }

      // Exercise filter
      if (selectedExercises.length > 0) {
        const hasSelectedExercise = session.strength_test_attempts.some((a: any) => 
          selectedExercises.includes(a.exercises?.id)
        );
        if (!hasSelectedExercise) return false;
      }

      // Month filter
      if (selectedMonths.length > 0) {
        const sessionMonth = format(new Date(session.test_date), 'yyyy-MM');
        if (!selectedMonths.includes(sessionMonth)) return false;
      }

      // Year filter
      if (selectedYears.length > 0) {
        const sessionYear = format(new Date(session.test_date), 'yyyy');
        if (!selectedYears.includes(sessionYear)) return false;
      }

      return true;
    });
  }, [sessions, selectedUsers, selectedExercises, selectedMonths, selectedYears]);

  const toggleFilter = (value: string, selected: string[], setSelected: (values: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές</div>;
  }

  return (
    <>
      {/* Filters Section */}
      <Card className="rounded-none mb-4">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <CardTitle className="text-base">Φίλτρα</CardTitle>
                  {(selectedUsers.length + selectedExercises.length + selectedMonths.length + selectedYears.length) > 0 && (
                    <span className="text-xs bg-[#00ffba] text-black px-2 py-0.5 rounded-full">
                      {selectedUsers.length + selectedExercises.length + selectedMonths.length + selectedYears.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Users Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Χρήστες</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-none p-2">
                  {uniqueUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleFilter(user.id, selectedUsers, setSelectedUsers)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {user.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercises Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ασκήσεις</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-none p-2">
                  {uniqueExercises.map(exercise => (
                    <div key={exercise.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exercise-${exercise.id}`}
                        checked={selectedExercises.includes(exercise.id)}
                        onCheckedChange={() => toggleFilter(exercise.id, selectedExercises, setSelectedExercises)}
                      />
                      <label
                        htmlFor={`exercise-${exercise.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {exercise.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Months Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Μήνες</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-none p-2">
                  {uniqueMonths.map(month => (
                    <div key={month} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${month}`}
                        checked={selectedMonths.includes(month)}
                        onCheckedChange={() => toggleFilter(month, selectedMonths, setSelectedMonths)}
                      />
                      <label
                        htmlFor={`month-${month}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {format(new Date(month + '-01'), 'MMMM yyyy', { locale: el })}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Years Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Έτη</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-none p-2">
                  {uniqueYears.map(year => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox
                        id={`year-${year}`}
                        checked={selectedYears.includes(year)}
                        onCheckedChange={() => toggleFilter(year, selectedYears, setSelectedYears)}
                      />
                      <label
                        htmlFor={`year-${year}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {year}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            {/* Clear Filters Button */}
            {(selectedUsers.length + selectedExercises.length + selectedMonths.length + selectedYears.length) > 0 && (
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUsers([]);
                    setSelectedExercises([]);
                    setSelectedMonths([]);
                    setSelectedYears([]);
                  }}
                  className="rounded-none"
                >
                  Καθαρισμός Φίλτρων
                </Button>
              </CardContent>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

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
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base whitespace-nowrap">
                    {session.app_users?.name || 'Άγνωστος Χρήστης'}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {format(new Date(session.test_date), 'dd MMM yyyy', { locale: el })}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSessionClick(session.id)}
                    className="rounded-none ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                        <Label className="text-sm font-semibold">{exerciseData.exerciseName}</Label>
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
              <Label>Βάρος (kg)</Label>
              <Input
                type="number"
                step="0.5"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Ταχύτητα (m/s)</Label>
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
