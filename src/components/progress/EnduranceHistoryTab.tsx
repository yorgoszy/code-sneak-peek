import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

export const EnduranceHistoryTab: React.FC<EnduranceHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds }) => {
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

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId, coachUserIds]);

  const fetchSessions = async () => {
    try {
      let sessionsQuery = supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          user_id,
          test_date,
          notes,
          created_at,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            id,
            exercise_id,
            mas_meters,
            mas_minutes,
            mas_ms,
            mas_kmh,
            push_ups,
            pull_ups,
            t2b,
            farmer_kg,
            farmer_meters,
            farmer_seconds,
            sprint_seconds,
            sprint_meters,
            sprint_resistance,
            sprint_watt,
            vo2_max,
            max_hr,
            resting_hr_1min,
            exercises (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by specific user if selectedUserId is provided
      if (selectedUserId) {
        sessionsQuery = sessionsQuery.eq('user_id', selectedUserId);
      } else if (coachUserIds && coachUserIds.length > 0) {
        sessionsQuery = sessionsQuery.in('user_id', coachUserIds);
      }

      const [sessionsRes, usersRes] = await Promise.all([
        sessionsQuery,
        supabase.from('app_users').select('id, name, email')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (usersRes.error) throw usersRes.error;

      const map = new Map<string, any>();
      (usersRes.data || []).forEach(u => map.set(u.id, { name: u.name, email: u.email }));
      setUsersMap(map);

      const filteredData = (sessionsRes.data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );
      setSessions(filteredData);
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
      // Delete endurance test data first (due to foreign key)
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .delete()
        .eq('test_session_id', sessionToDelete);

      if (dataError) throw dataError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('endurance_test_sessions')
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
    setSelectedCategory("all");
    setSelectedYear("all");
    setUserSearch("");
  };

  // Get unique exercises
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

  // Filter sessions
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
        const exerciseId = s.endurance_test_data?.[0]?.exercises?.id;
        if (!exerciseId || !selectedExercises.includes(exerciseId)) return false;
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

  // Group filtered sessions by test type - MUST be before any conditional returns
  const masSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "mas") return false;
      return s.endurance_test_data[0]?.mas_meters;
    });
  }, [filteredSessions, selectedCategory]);

  const bodyweightSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "bodyweight") return false;
      return s.endurance_test_data[0]?.push_ups !== null || 
             s.endurance_test_data[0]?.pull_ups !== null ||
             s.endurance_test_data[0]?.t2b !== null;
    });
  }, [filteredSessions, selectedCategory]);

  const farmerSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "farmer") return false;
      return s.endurance_test_data[0]?.farmer_kg;
    });
  }, [filteredSessions, selectedCategory]);

  const sprintSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "sprint") return false;
      return s.endurance_test_data[0]?.sprint_seconds;
    });
  }, [filteredSessions, selectedCategory]);

  const vo2MaxSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "vo2max") return false;
      return s.endurance_test_data[0]?.vo2_max;
    });
  }, [filteredSessions, selectedCategory]);

  const cardiacSessions = useMemo(() => {
    return filteredSessions.filter(s => {
      if (selectedCategory !== "all" && selectedCategory !== "cardiac") return false;
      return s.endurance_test_data[0]?.max_hr !== null || 
             s.endurance_test_data[0]?.resting_hr_1min !== null;
    });
  }, [filteredSessions, selectedCategory]);

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

  const renderSessionCard = (session: any) => {
    const enduranceData = session.endurance_test_data[0];
    
    return (
      <Card key={session.id} className="rounded-none min-w-[220px] shrink-0">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Header με χρήστη, ημερομηνία, άσκηση */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {usersMap.get(session.user_id)?.name || 'Άγνωστος'}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(session.test_date), 'dd/MM/yy')}
                  </span>
                </div>
                {enduranceData.exercises?.name && (
                  <span className="text-xs text-gray-600 truncate">
                    {enduranceData.exercises.name}
                  </span>
                )}
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteSessionClick(session.id)}
                  className="rounded-none h-8 w-8 p-0 shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
            
            {/* Μετρήσεις */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {enduranceData.mas_meters && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Απόσταση:</span>
                    <span className="font-semibold text-gray-900">{enduranceData.mas_meters}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Χρόνος:</span>
                    <span className="font-semibold text-gray-900">{enduranceData.mas_minutes}'</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">MAS:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.mas_ms?.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">MAS:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.mas_kmh?.toFixed(2)} km/h</span>
                  </div>
                </>
              )}
              {enduranceData.push_ups !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Push Ups:</span>
                  <span className="font-bold text-[#cb8954]">{enduranceData.push_ups}</span>
                </div>
              )}
              {enduranceData.pull_ups !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pull Ups:</span>
                  <span className="font-bold text-[#cb8954]">{enduranceData.pull_ups}</span>
                </div>
              )}
              {enduranceData.t2b !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">T2B:</span>
                  <span className="font-bold text-[#cb8954]">{enduranceData.t2b}</span>
                </div>
              )}
              {enduranceData.farmer_kg !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Farmer kg:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.farmer_kg}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Farmer m:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.farmer_meters}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Farmer s:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.farmer_seconds}</span>
                  </div>
                </>
              )}
              {enduranceData.sprint_seconds !== null && (
                <>
                  <div className="flex items-center justify-between col-span-2">
                    <span className="text-gray-500">Sprint Άσκηση:</span>
                    <span className="font-bold text-[#cb8954]">
                      {enduranceData.exercises?.name || 'Track'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sprint s:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.sprint_seconds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sprint m:</span>
                    <span className="font-bold text-[#cb8954]">{enduranceData.sprint_meters}</span>
                  </div>
                  {enduranceData.sprint_watt !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Sprint km/h:</span>
                      <span className="font-bold text-[#cb8954]">{parseFloat(enduranceData.sprint_watt).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {enduranceData.vo2_max !== null && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-gray-500">VO2 Max:</span>
                  <span className="font-bold text-[#cb8954]">{enduranceData.vo2_max}</span>
                </div>
              )}
              {enduranceData.max_hr !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Max HR:</span>
                  <span className="font-bold text-red-500">{enduranceData.max_hr} bpm</span>
                </div>
              )}
              {enduranceData.resting_hr_1min !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Resting HR:</span>
                  <span className="font-bold text-blue-500">{enduranceData.resting_hr_1min} bpm</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-start">
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

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px] rounded-none">
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

      {/* Results */}
      <div className="flex gap-4 overflow-x-auto pb-2">
      {/* MAS Test */}
      {masSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">MAS Test</h3>
          <div className="flex flex-col gap-2">
            {masSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Cardiac Data */}
      {cardiacSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Cardiac Data</h3>
          <div className="flex flex-col gap-2">
            {cardiacSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* VO2 Max */}
      {vo2MaxSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">VO2 Max</h3>
          <div className="flex flex-col gap-2">
            {vo2MaxSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Push Ups, Pull Ups & T2B */}
      {bodyweightSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Push Ups, Pull Ups & T2B</h3>
          <div className="flex flex-col gap-2">
            {bodyweightSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Farmer */}
      {farmerSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Farmer</h3>
          <div className="flex flex-col gap-2">
            {farmerSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Sprint */}
      {sprintSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Sprint</h3>
          <div className="flex flex-col gap-2">
            {sprintSessions.map(renderSessionCard)}
          </div>
        </div>
      )}
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteSessionConfirm}
      />
    </div>
  );
};