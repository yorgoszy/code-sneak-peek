import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EnduranceHistoryTab: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const [sessionsRes, usersRes] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false }),
        supabase
          .from('app_users')
          .select('id, name')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (usersRes.error) throw usersRes.error;

      const map = new Map<string, string>();
      (usersRes.data || []).forEach(u => map.set(u.id, u.name));
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

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
      return;
    }

    try {
      // Delete endurance test data first (due to foreign key)
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .delete()
        .eq('test_session_id', sessionId);

      if (dataError) throw dataError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .delete()
        .eq('id', sessionId);

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
    }
  };

  // Get unique years - MUST be before any conditional returns
  const availableYears = useMemo(() => {
    const years = sessions.map(s => new Date(s.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [sessions]);

  // Get unique users - MUST be before any conditional returns
  const availableUsers = useMemo(() => {
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [usersMap]);

  // Filter sessions - MUST be before any conditional returns
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (selectedUser !== "all" && s.user_id !== selectedUser) return false;
      if (selectedYear !== "all" && new Date(s.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [sessions, selectedUser, selectedYear]);

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
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές</div>;
  }

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
                    {usersMap.get(session.user_id) || 'Άγνωστος'}
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteSession(session.id)}
                className="rounded-none h-8 w-8 p-0 shrink-0"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
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
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px] rounded-none">
            <SelectValue placeholder="Όλοι οι χρήστες" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
            {availableUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </div>

      {/* Results */}
      <div className="flex gap-4 overflow-x-auto pb-2">
      {/* MAS Tests */}
      {masSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">MAS Tests</h3>
          <div className="flex flex-col gap-2">
            {masSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Bodyweight Tests */}
      {bodyweightSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Push Ups, Pull Ups & T2B</h3>
          <div className="flex flex-col gap-2">
            {bodyweightSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Farmer Tests */}
      {farmerSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Farmer Walk</h3>
          <div className="flex flex-col gap-2">
            {farmerSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Sprint Tests */}
      {sprintSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Sprint</h3>
          <div className="flex flex-col gap-2">
            {sprintSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* VO2 Max Tests */}
      {vo2MaxSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">VO2 Max</h3>
          <div className="flex flex-col gap-2">
            {vo2MaxSessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {/* Cardiac Tests */}
      {cardiacSessions.length > 0 && (
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Cardiac Data</h3>
          <div className="flex flex-col gap-2">
            {cardiacSessions.map(renderSessionCard)}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};