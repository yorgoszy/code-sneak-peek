import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { JumpSessionCard } from "@/components/progress/JumpSessionCard";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface JumpSession {
  id: string;
  user_id: string;
  test_date: string;
  notes: string | null;
  jump_test_data: Array<{
    id: string;
    test_session_id: string;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

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

  const sessionsByType = useMemo(() => {
    const nonCmj = filteredSessions.filter(s => s.notes?.includes('Non-CMJ Test'));
    const cmj = filteredSessions.filter(s => s.notes?.includes('CMJ Test'));
    const depthJump = filteredSessions.filter(s => s.notes?.includes('Depth Jump Test'));
    const broadJump = filteredSessions.filter(s => s.notes?.includes('Broad Jump Test'));
    const tripleJump = filteredSessions.filter(s => s.notes?.includes('Triple Jump Test'));

    return { nonCmj, cmj, depthJump, broadJump, tripleJump };
  }, [filteredSessions]);

  const handleDeleteClick = (jumpDataId: string) => {
    setSessionToDelete(jumpDataId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      // Delete only the specific jump_test_data record
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .delete()
        .eq('id', sessionToDelete);

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε",
      });

      // Refresh the list
      fetchSessions();
    } catch (error) {
      console.error('Error deleting jump data:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 w-full">
            Δεν βρέθηκαν καταγραφές
          </div>
        ) : (
          <>
            {/* Non-CMJ Column */}
            {sessionsByType.nonCmj.length > 0 && (
              <div className="space-y-[1px]">
                <div className="bg-gray-100 px-2 py-1 rounded-none">
                  <h3 className="text-xs font-semibold">Non-CMJ</h3>
                </div>
                {sessionsByType.nonCmj.map((session) => {
                  const user = usersMap.get(session.user_id);
                  const jumpDataId = session.jump_test_data?.[0]?.id;
                  return (
                    <JumpSessionCard
                      key={session.id}
                      session={session}
                      userName={user?.name || 'Άγνωστος Χρήστης'}
                      showDelete
                      onDelete={() => jumpDataId && handleDeleteClick(jumpDataId)}
                    />
                  );
                })}
              </div>
            )}

            {/* CMJ Column */}
            {sessionsByType.cmj.length > 0 && (
              <div className="space-y-[1px]">
                <div className="bg-gray-100 px-2 py-1 rounded-none">
                  <h3 className="text-xs font-semibold">CMJ</h3>
                </div>
                {sessionsByType.cmj.map((session) => {
                  const user = usersMap.get(session.user_id);
                  const jumpDataId = session.jump_test_data?.[0]?.id;
                  return (
                    <JumpSessionCard
                      key={session.id}
                      session={session}
                      userName={user?.name || 'Άγνωστος Χρήστης'}
                      showDelete
                      onDelete={() => jumpDataId && handleDeleteClick(jumpDataId)}
                    />
                  );
                })}
              </div>
            )}

            {/* Depth Jump Column */}
            {sessionsByType.depthJump.length > 0 && (
              <div className="space-y-[1px]">
                <div className="bg-gray-100 px-2 py-1 rounded-none">
                  <h3 className="text-xs font-semibold">Depth Jump</h3>
                </div>
                {sessionsByType.depthJump.map((session) => {
                  const user = usersMap.get(session.user_id);
                  const jumpDataId = session.jump_test_data?.[0]?.id;
                  return (
                    <JumpSessionCard
                      key={session.id}
                      session={session}
                      userName={user?.name || 'Άγνωστος Χρήστης'}
                      showDelete
                      onDelete={() => jumpDataId && handleDeleteClick(jumpDataId)}
                    />
                  );
                })}
              </div>
            )}

            {/* Broad Jump Column */}
            {sessionsByType.broadJump.length > 0 && (
              <div className="space-y-[1px]">
                <div className="bg-gray-100 px-2 py-1 rounded-none">
                  <h3 className="text-xs font-semibold">Broad Jump</h3>
                </div>
                {sessionsByType.broadJump.map((session) => {
                  const user = usersMap.get(session.user_id);
                  const jumpDataId = session.jump_test_data?.[0]?.id;
                  return (
                    <JumpSessionCard
                      key={session.id}
                      session={session}
                      userName={user?.name || 'Άγνωστος Χρήστης'}
                      showDelete
                      onDelete={() => jumpDataId && handleDeleteClick(jumpDataId)}
                    />
                  );
                })}
              </div>
            )}

            {/* Triple Jump Column */}
            {sessionsByType.tripleJump.length > 0 && (
              <div className="space-y-[1px]">
                <div className="bg-gray-100 px-2 py-1 rounded-none">
                  <h3 className="text-xs font-semibold">Triple Jump</h3>
                </div>
                {sessionsByType.tripleJump.map((session) => {
                  const user = usersMap.get(session.user_id);
                  const jumpDataId = session.jump_test_data?.[0]?.id;
                  return (
                    <JumpSessionCard
                      key={session.id}
                      session={session}
                      userName={user?.name || 'Άγνωστος Χρήστης'}
                      showDelete
                      onDelete={() => jumpDataId && handleDeleteClick(jumpDataId)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
