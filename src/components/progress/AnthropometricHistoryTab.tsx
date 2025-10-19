import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { useAnthropometricTestResults } from "@/components/results/hooks/useAnthropometricTestResults";
import { format } from "date-fns";

interface AnthropometricHistoryTabProps {
  selectedUserId?: string;
}

export const AnthropometricHistoryTab: React.FC<AnthropometricHistoryTabProps> = ({ selectedUserId }) => {
  const usersMap = useUserNamesMap();
  const { results, loading, refetch } = useAnthropometricTestResults(usersMap, selectedUserId);
  const [anthropometricData, setAnthropometricData] = useState<Record<string, any>>({});

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
      {results.map((result) => {
        const data = anthropometricData[result.id];
        
        return (
          <Card key={result.id} className="rounded-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{result.user_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(result.test_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(result.id)}
                  className="rounded-none text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            {data && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.height && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ύψος</p>
                      <p className="font-medium">{data.height} cm</p>
                    </div>
                  )}
                  {data.weight && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Βάρος</p>
                      <p className="font-medium">{data.weight} kg</p>
                    </div>
                  )}
                  {data.body_fat_percentage && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Λίπος</p>
                      <p className="font-medium">{data.body_fat_percentage}%</p>
                    </div>
                  )}
                  {data.muscle_mass_percentage && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Μυϊκή Μάζα</p>
                      <p className="font-medium">{data.muscle_mass_percentage}%</p>
                    </div>
                  )}
                  {data.chest_circumference && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Στήθος</p>
                      <p className="font-medium">{data.chest_circumference} cm</p>
                    </div>
                  )}
                  {data.waist_circumference && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Μέση</p>
                      <p className="font-medium">{data.waist_circumference} cm</p>
                    </div>
                  )}
                  {data.hip_circumference && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ισχία</p>
                      <p className="font-medium">{data.hip_circumference} cm</p>
                    </div>
                  )}
                  {data.thigh_circumference && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Μηρός</p>
                      <p className="font-medium">{data.thigh_circumference} cm</p>
                    </div>
                  )}
                  {data.arm_circumference && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Βραχίονας</p>
                      <p className="font-medium">{data.arm_circumference} cm</p>
                    </div>
                  )}
                </div>
                
                {result.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Σημειώσεις</p>
                    <p className="text-sm">{result.notes}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
