import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { JumpSessionCard } from "@/components/progress/JumpSessionCard";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";
import { normalizeGreekText } from "@/lib/utils";

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

interface JumpHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
}

export const JumpHistoryTab: React.FC<JumpHistoryTabProps> = ({ selectedUserId, readOnly = false }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<JumpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [typeSearch, setTypeSearch] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionIdToDelete, setSessionIdToDelete] = useState<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, [selectedUserId]);

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
      let sessionsQuery = supabase
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
        .order('test_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Filter by specific user if selectedUserId is provided
      if (selectedUserId) {
        sessionsQuery = sessionsQuery.eq('user_id', selectedUserId);
      }

      const { data, error } = await sessionsQuery;

      if (error) throw error;
      setSessions(data as any || []);
    } catch (error) {
      console.error('Error fetching jump sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedYear("all");
    setTypeSearch("");
  };

  // Get unique jump types from notes
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
    const normalizedSearch = normalizeGreekText(typeSearch);
    return availableTypes.filter(type => 
      normalizeGreekText(type).includes(normalizedSearch)
    );
  }, [availableTypes, typeSearch]);

  // Get unique years
  const availableYears = useMemo(() => {
    const years = sessions.map(s => new Date(s.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Filter by jump types
      if (selectedTypes.length > 0) {
        let matchesType = false;
        if (selectedTypes.includes('Non-CMJ') && session.notes?.startsWith('Non-CMJ Test')) matchesType = true;
        if (selectedTypes.includes('CMJ') && session.notes?.startsWith('CMJ Test') && !session.notes?.startsWith('Non-CMJ')) matchesType = true;
        if (selectedTypes.includes('Depth Jump') && session.notes?.startsWith('Depth Jump Test')) matchesType = true;
        if (selectedTypes.includes('Broad Jump') && session.notes?.startsWith('Broad Jump Test')) matchesType = true;
        if (selectedTypes.includes('Triple Jump') && session.notes?.startsWith('Triple Jump Test')) matchesType = true;
        if (!matchesType) return false;
      }
      
      if (selectedYear !== "all" && new Date(session.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [sessions, selectedTypes, selectedYear]);

  const sessionsByType = useMemo(() => {
    const nonCmj = filteredSessions.filter(s => s.notes?.startsWith('Non-CMJ Test'));
    const cmj = filteredSessions.filter(s => s.notes?.startsWith('CMJ Test') && !s.notes?.startsWith('Non-CMJ'));
    const depthJump = filteredSessions.filter(s => s.notes?.startsWith('Depth Jump Test'));
    const broadJump = filteredSessions.filter(s => s.notes?.startsWith('Broad Jump Test'));
    const tripleJump = filteredSessions.filter(s => s.notes?.startsWith('Triple Jump Test'));

    return { nonCmj, cmj, depthJump, broadJump, tripleJump };
  }, [filteredSessions]);

  const handleDeleteClick = (sessionId: string) => {
    setSessionIdToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionIdToDelete) return;

    try {
      // Delete related jump_test_data first, then the session
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .delete()
        .eq('test_session_id', sessionIdToDelete);

      if (dataError) throw dataError;

      const { error: sessionError } = await supabase
        .from('jump_test_sessions')
        .delete()
        .eq('id', sessionIdToDelete);

      if (sessionError) throw sessionError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε",
      });

      // Refresh the list
      fetchSessions();
    } catch (error) {
      console.error('Error deleting jump session:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionIdToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-start">
        {/* Jump Types Multi-Select */}
        <div className="relative w-[250px]" ref={typeDropdownRef}>
          <div
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="w-full h-10 px-3 py-2 rounded-none border border-input bg-background flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <span className="text-sm">
              {selectedTypes.length === 0 
                ? "Επιλογή τύπου άλματος..." 
                : `${selectedTypes.length} τύποι επιλεγμένοι`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>

          {isTypeDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-none shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col">
              <div className="p-2 border-b border-input">
                <Input
                  type="text"
                  placeholder="Αναζήτηση τύπου..."
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  className="rounded-none h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="overflow-y-auto">
                {filteredTypeOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Δεν βρέθηκαν τύποι
                  </div>
                ) : (
                  filteredTypeOptions.map((type) => (
                    <div
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTypes(prev => 
                          prev.includes(type)
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        );
                      }}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${
                        selectedTypes.includes(type) ? 'bg-[#00ffba] hover:bg-[#00ffba]/90' : ''
                      }`}
                    >
                      <span className="text-sm">{type}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
                      showDelete={!readOnly}
                      onDelete={() => handleDeleteClick(session.id)}
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
                      showDelete={!readOnly}
                      onDelete={() => handleDeleteClick(session.id)}
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
                      showDelete={!readOnly}
                      onDelete={() => handleDeleteClick(session.id)}
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
                      showDelete={!readOnly}
                      onDelete={() => handleDeleteClick(session.id)}
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
                      showDelete={!readOnly}
                      onDelete={() => handleDeleteClick(session.id)}
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
