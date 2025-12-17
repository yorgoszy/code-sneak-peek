import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface FunctionalHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
}

interface FunctionalResult {
  id: string;
  test_date: string;
  user_name: string;
  user_id: string;
}

export const FunctionalHistoryTab: React.FC<FunctionalHistoryTabProps> = ({ selectedUserId, readOnly = false }) => {
  const usersMap = useUserNamesMap();
  const [results, setResults] = useState<FunctionalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [functionalData, setFunctionalData] = useState<Record<string, any>>({});
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('functional_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });
      
      // Αν έχουμε selectedUserId, φιλτράρουμε απευθείας
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      const newResults: FunctionalResult[] = (sessions || []).map(session => ({
        id: session.id,
        test_date: session.test_date,
        user_name: usersMap.get(session.user_id) || "Άγνωστος Χρήστης",
        user_id: session.user_id
      }));

      setResults(newResults);
    } catch (error) {
      console.error('Error fetching functional results:', error);
    } finally {
      setLoading(false);
    }
  }, [usersMap, selectedUserId]);

  useEffect(() => {
    // Αν έχουμε selectedUserId και readOnly, δεν χρειαζόμαστε το usersMap
    if (selectedUserId && readOnly) {
      fetchResults();
    } else if (usersMap.size > 0) {
      fetchResults();
    }
  }, [fetchResults, usersMap, selectedUserId, readOnly]);

  useEffect(() => {
    if (results.length > 0) {
      fetchFunctionalData();
    }
  }, [results]);

  const fetchFunctionalData = async () => {
    const data: Record<string, any> = {};
    
    for (const result of results) {
      const { data: funcData, error } = await supabase
        .from('functional_test_data')
        .select('*')
        .eq('test_session_id', result.id)
        .maybeSingle();

      if (!error && funcData) {
        data[result.id] = funcData;
      }
    }
    
    setFunctionalData(data);
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      const { error: dataError } = await supabase
        .from('functional_test_data')
        .delete()
        .eq('test_session_id', sessionToDelete);

      if (dataError) throw dataError;

      const { error: sessionError } = await supabase
        .from('functional_test_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (sessionError) throw sessionError;

      toast.success('Η καταγραφή διαγράφηκε επιτυχώς');
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
      await fetchResults();
      fetchFunctionalData();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedYear("all");
    setUserSearch("");
  };

  const availableYears = useMemo(() => {
    const years = results.map(r => new Date(r.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [results]);

  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    
    const searchLower = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .filter(user => user.name?.toLowerCase().includes(searchLower))
      .slice(0, 10);
  }, [userSearch, usersMap]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    
    if (selectedUserId) {
      filtered = filtered.filter(r => r.user_id === selectedUserId);
    }
    
    if (!readOnly && userSearch.trim()) {
      filtered = filtered.filter(r => {
        const userName = usersMap.get(r.user_id);
        if (!userName) return false;
        return userName.toLowerCase().includes(userSearch.toLowerCase());
      });
    }
    
    if (selectedYear !== "all") {
      filtered = filtered.filter(r => 
        new Date(r.test_date).getFullYear().toString() === selectedYear
      );
    }
    
    return filtered;
  }, [results, selectedYear, userSearch, usersMap, readOnly, selectedUserId]);

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Φόρτωση...</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Δεν υπάρχουν καταγραφές</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-start">
        {!readOnly && (
          <div className="relative w-[250px]">
            <Input
              type="text"
              placeholder="Αναζήτηση χρήστη..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="rounded-none pr-8"
            />
            {userSearch && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUserSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-none"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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


      {filteredResults.map((result) => {
        const data = functionalData[result.id];
        const fmsScores = data?.fms_detailed_scores as Record<string, number> | null;
        
        return (
          <Card key={result.id} className="rounded-none">
            <CardHeader className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm">{result.user_name}</CardTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {format(new Date(result.test_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {data?.fms_score !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={`rounded-none text-[10px] ${data.fms_score < 14 ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}
                    >
                      FMS: {data.fms_score}
                    </Badge>
                  )}
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(result.id)}
                      className="rounded-none text-destructive hover:text-destructive h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {data && (
              <CardContent className="p-2 sm:p-3 pt-0 space-y-2">
                {/* FMS Detailed Scores */}
                {fmsScores && Object.keys(fmsScores).length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">FMS Scores:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(fmsScores).map(([exercise, score]) => (
                        <Badge key={exercise} variant="secondary" className="rounded-none text-[8px]">
                          {exercise}: {score}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posture Issues */}
                {data.posture_issues && data.posture_issues.length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Στάση Σώματος:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.posture_issues.map((issue: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-none text-[8px]">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squat Issues */}
                {data.squat_issues && data.squat_issues.length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Κάθισμα:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.squat_issues.map((issue: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-none text-[8px]">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Leg Squat Issues */}
                {data.single_leg_squat_issues && data.single_leg_squat_issues.length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Μονοποδικό:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.single_leg_squat_issues.map((issue: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-none text-[8px]">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Muscles Need Stretching */}
                {data.muscles_need_stretching && data.muscles_need_stretching.length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Μύες για Διάταση:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.muscles_need_stretching.map((muscle: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-none text-[8px] border-yellow-500 text-yellow-600 bg-yellow-50">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Muscles Need Strengthening */}
                {data.muscles_need_strengthening && data.muscles_need_strengthening.length > 0 && (
                  <div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Μύες για Ενδυνάμωση:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.muscles_need_strengthening.map((muscle: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-none text-[8px] border-pink-500 text-pink-600 bg-pink-50">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
