import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface JumpSession {
  id: string;
  user_id: string;
  test_date: string;
  notes: string | null;
  jump_test_data: Array<{
    id: string;
    cmj_height: number | null;
    sqj_height: number | null;
    dj_height: number | null;
    dj_contact_time: number | null;
    rsi: number | null;
    asymmetry_percentage: number | null;
  }> | any;
}

export const JumpHistoryTab: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<JumpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email');

      if (usersError) throw usersError;

      const userMap = new Map(
        (usersData || []).map(u => [u.id, { name: u.name, email: u.email }])
      );
      setUsersMap(userMap);

      // Fetch jump test sessions
      const { data, error } = await supabase
        .from('jump_test_sessions')
        .select(`
          id,
          user_id,
          test_date,
          notes,
          jump_test_data (
            id,
            non_counter_movement_jump,
            counter_movement_jump,
            depth_jump,
            broad_jump,
            triple_jump_left,
            triple_jump_right
          )
        `)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setSessions(data as any || []);
    } catch (error) {
      console.error('Error fetching jump sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setUserSearch("");
  };

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

  const filteredSessions = useMemo(() => {
    if (!userSearch.trim()) return sessions;

    const searchLower = userSearch.toLowerCase();
    return sessions.filter(session => {
      const user = usersMap.get(session.user_id);
      return user?.name?.toLowerCase().includes(searchLower) || 
             user?.email?.toLowerCase().includes(searchLower);
    });
  }, [sessions, userSearch, usersMap]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
      return;
    }

    try {
      // First delete jump_test_data
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .delete()
        .eq('test_session_id', sessionId);

      if (dataError) throw dataError;

      // Then delete the session
      const { error: sessionError } = await supabase
        .from('jump_test_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε",
      });

      // Refresh the list
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-start">
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
      <div className="flex gap-[1px] overflow-x-auto pb-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 w-full">
            Δεν βρέθηκαν καταγραφές
          </div>
        ) : (
          filteredSessions.map((session) => {
            const user = usersMap.get(session.user_id);
            const jumpData = session.jump_test_data?.[0];

            return (
              <Card key={session.id} className="rounded-none w-60">
                <CardHeader className="pb-1 pt-2 px-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xs">{user?.name || 'Άγνωστος Χρήστης'}</CardTitle>
                      <p className="text-[10px] text-gray-500">
                        {format(new Date(session.test_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(session.id)}
                      className="rounded-none h-5 w-5 p-0 hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-1">
                  {jumpData && (
                    <div className="space-y-0.5">
                      {jumpData.non_counter_movement_jump !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Non-CMJ:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.non_counter_movement_jump} cm
                          </span>
                        </div>
                      )}
                      {jumpData.counter_movement_jump !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">CMJ:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.counter_movement_jump} cm
                          </span>
                        </div>
                      )}
                      {jumpData.depth_jump !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Depth Jump:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.depth_jump} cm
                          </span>
                        </div>
                      )}
                      {jumpData.broad_jump !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Broad Jump:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.broad_jump} cm
                          </span>
                        </div>
                      )}
                      {jumpData.triple_jump_left !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Triple Jump L:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.triple_jump_left} cm
                          </span>
                        </div>
                      )}
                      {jumpData.triple_jump_right !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Triple Jump R:</span>
                          <span className="font-semibold text-[#cb8954]">
                            {jumpData.triple_jump_right} cm
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
