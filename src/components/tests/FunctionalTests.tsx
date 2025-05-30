
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fmsExercises = [
  'Shoulder Mobility',
  'Active Straight Leg Raise', 
  'Trunk Stability Push-Up',
  'Rotary Stability',
  'Inline Lunge',
  'Hurdle Step',
  'Deep Squat'
];

const postureOptions = ['κύφωση', 'λόρδωση', 'σκολίωση'];

const squatOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ ΑΡΙΣΤΕΡΑ',
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ ΔΕΞΙΑ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ ΑΡΙΣΤΕΡΑ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ ΔΕΞΙΑ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ ΑΡΙΣΤΕΡΑ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ ΔΕΞΙΑ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ ΑΡΙΣΤΕΡΑ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ ΔΕΞΙΑ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ ΑΡΙΣΤΕΡΑ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ ΔΕΞΙΑ',
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

const singleLegSquatOptions = [
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ ΑΡΙΣΤΕΡΑ',
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ ΔΕΞΙΑ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ ΑΡΙΣΤΕΡΑ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ ΔΕΞΙΑ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΑΡΙΣΤΕΡΑ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΔΕΞΙΑ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΑΡΙΣΤΕΡΑ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ ΔΕΞΙΑ'
];

interface FunctionalTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const FunctionalTests = ({ selectedAthleteId, selectedDate }: FunctionalTestsProps) => {
  const { user } = useAuth();
  const [fmsScores, setFmsScores] = useState<Record<string, number>>({});
  const [selectedPosture, setSelectedPosture] = useState<string[]>([]);
  const [selectedSquatIssues, setSelectedSquatIssues] = useState<string[]>([]);
  const [selectedSingleLegIssues, setSelectedSingleLegIssues] = useState<string[]>([]);

  const handleFmsClick = (exercise: string) => {
    setFmsScores(prev => {
      const currentScore = prev[exercise] || 0;
      const nextScore = currentScore === 3 ? 0 : currentScore + 1;
      return { ...prev, [exercise]: nextScore };
    });
  };

  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const getFmsTotal = () => {
    return fmsExercises.reduce((total, exercise) => total + (fmsScores[exercise] || 0), 0);
  };

  const handleSubmit = async () => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    try {
      // Δημιουργία session για λειτουργικά τεστ
      const { data: session, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: user.id
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση λειτουργικών δεδομένων
      const functionalData = {
        test_session_id: session.id,
        fms_score: getFmsTotal(),
        fms_detailed_scores: fmsScores,
        posture_issues: selectedPosture,
        squat_issues: selectedSquatIssues,
        single_leg_squat_issues: selectedSingleLegIssues
      };

      const { error: dataError } = await supabase
        .from('functional_test_data')
        .insert(functionalData);

      if (dataError) throw dataError;

      // Δημιουργία summary για γραφήματα
      const chartData = {
        fmsScore: getFmsTotal(),
        postureIssuesCount: selectedPosture.length,
        squatIssuesCount: selectedSquatIssues.length,
        singleLegIssuesCount: selectedSingleLegIssues.length
      };

      await supabase
        .from('test_results_summary')
        .insert({
          athlete_id: selectedAthleteId,
          test_type: 'functional',
          test_date: selectedDate,
          chart_data: chartData
        });

      toast.success("Τα λειτουργικά δεδομένα αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFmsScores({});
      setSelectedPosture([]);
      setSelectedSquatIssues([]);
      setSelectedSingleLegIssues([]);

    } catch (error) {
      console.error('Error saving functional data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση");
    }
  };

  const fmsTotal = getFmsTotal();

  return (
    <div className="space-y-6">
      {/* Στάση Σώματος */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Στάση Σώματος</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {postureOptions.map((option) => (
              <div
                key={option}
                onClick={() => toggleSelection(option, selectedPosture, setSelectedPosture)}
                className={cn(
                  "p-3 border cursor-pointer text-center text-sm transition-colors",
                  selectedPosture.includes(option)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                )}
              >
                {option}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Καθήματα */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Καθήματα</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {squatOptions.map((option) => (
              <div
                key={option}
                onClick={() => toggleSelection(option, selectedSquatIssues, setSelectedSquatIssues)}
                className={cn(
                  "p-2 border cursor-pointer text-center text-xs transition-colors",
                  selectedSquatIssues.includes(option)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                )}
              >
                {option}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Μονοποδικά Καθήματα */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Μονοποδικά Καθήματα</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {singleLegSquatOptions.map((option) => (
              <div
                key={option}
                onClick={() => toggleSelection(option, selectedSingleLegIssues, setSelectedSingleLegIssues)}
                className={cn(
                  "p-2 border cursor-pointer text-center text-xs transition-colors",
                  selectedSingleLegIssues.includes(option)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                )}
              >
                {option}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FMS */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            FMS 
            <span className={cn(
              "text-lg font-bold px-3 py-1 rounded",
              fmsTotal < 14 ? "bg-red-500 text-white" : "bg-green-500 text-white"
            )}>
              Σκορ: {fmsTotal}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fmsExercises.map((exercise) => (
              <div
                key={exercise}
                onClick={() => handleFmsClick(exercise)}
                className="p-3 border cursor-pointer text-center transition-colors hover:bg-gray-50"
              >
                <div className="font-medium text-sm mb-2">{exercise}</div>
                <div className="flex justify-center space-x-1">
                  {[0, 1, 2, 3].map((score) => (
                    <div
                      key={score}
                      className={cn(
                        "w-8 h-8 rounded border flex items-center justify-center text-sm font-bold",
                        fmsScores[exercise] === score
                          ? score === 0 
                            ? "bg-red-500 text-white" 
                            : "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {score}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Κουμπί Αποθήκευσης */}
      <Card className="rounded-none">
        <CardContent className="p-4 flex items-center justify-center">
          <Button onClick={handleSubmit} className="rounded-none w-full max-w-md">
            Αποθήκευση Λειτουργικών Τεστ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
