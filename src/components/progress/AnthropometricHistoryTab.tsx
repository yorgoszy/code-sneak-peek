import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { useAnthropometricTestResults } from "@/components/results/hooks/useAnthropometricTestResults";
import { format } from "date-fns";

interface AnthropometricHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
}

export const AnthropometricHistoryTab: React.FC<AnthropometricHistoryTabProps> = ({ selectedUserId, readOnly = false }) => {
  const usersMap = useUserNamesMap();
  const { results, loading, refetch } = useAnthropometricTestResults(usersMap, selectedUserId);
  const [anthropometricData, setAnthropometricData] = useState<Record<string, any>>({});
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refetch when component mounts or key changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (results.length > 0) {
      fetchAnthropometricData();
    }
  }, [results]);

  const fetchAnthropometricData = async () => {
    const data: Record<string, any> = {};
    
    for (const result of results) {
      const { data: anthroData, error } = await supabase
        .from('anthropometric_test_data')
        .select('*')
        .eq('test_session_id', result.id)
        .single();

      if (!error && anthroData) {
        data[result.id] = anthroData;
      }
    }
    
    setAnthropometricData(data);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
      return;
    }

    try {
      // Delete anthropometric data first (foreign key)
      const { error: dataError } = await supabase
        .from('anthropometric_test_data')
        .delete()
        .eq('test_session_id', sessionId);

      if (dataError) throw dataError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast.success('Η καταγραφή διαγράφηκε επιτυχώς');
      fetchAnthropometricData();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const handleClearFilters = () => {
    setSelectedYear("all");
    setUserSearch("");
  };

  // Get unique years
  const availableYears = useMemo(() => {
    const years = results.map(r => new Date(r.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [results]);

  // Get filtered user suggestions
  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    
    const searchLower = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .filter(user => 
        user.name?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
  }, [userSearch, usersMap]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      // Filter by user search - only in admin dashboard
      if (!readOnly && userSearch.trim()) {
        const userName = usersMap.get(r.user_id);
        if (!userName) return false;
        
        const searchLower = userSearch.toLowerCase();
        const nameMatch = userName.toLowerCase().includes(searchLower);
        
        if (!nameMatch) return false;
      }
      
      if (selectedYear !== "all" && new Date(r.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [results, selectedYear, userSearch, usersMap, readOnly]);

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
            
            {/* Suggestions dropdown */}
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
        const data = anthropometricData[result.id];
        
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
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(result.id)}
                    className="rounded-none text-destructive hover:text-destructive h-6 w-6 sm:h-7 sm:w-7"
                  >
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {data && (
              <CardContent className="p-2 sm:p-3 pt-0">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
                  {data.height && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Ύψος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.height} cm</p>
                    </div>
                  )}
                  {data.weight && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Βάρος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.weight} kg</p>
                    </div>
                  )}
                  {data.body_fat_percentage && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Λίπος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.body_fat_percentage}%</p>
                    </div>
                  )}
                  {data.muscle_mass_percentage && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μυϊκή Μάζα</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.muscle_mass_percentage}%</p>
                    </div>
                  )}
                  {data.chest_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Στήθος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.chest_circumference} cm</p>
                    </div>
                  )}
                  {data.waist_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μέση</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.waist_circumference} cm</p>
                    </div>
                  )}
                  {data.hip_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Ισχία</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.hip_circumference} cm</p>
                    </div>
                  )}
                  {data.thigh_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μηρός</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.thigh_circumference} cm</p>
                    </div>
                  )}
                  {data.arm_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Βραχίονας</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.arm_circumference} cm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
