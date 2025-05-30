
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fmsExercises = [
  // Πρώτη σειρά
  ['Shoulder Mobility', 'Active Straight Leg Raise'],
  // Δεύτερη σειρά  
  ['Trunk Stability Push-Up', 'Rotary Stability'],
  // Τρίτη σειρά
  ['Inline Lunge', 'Hurdle Step', 'Deep Squat']
];

const postureOptions = ['κύφωση', 'λόρδωση', 'σκολίωση'];

const squatOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΩΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ',
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

const singleLegSquatOptions = [
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ'
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

  const toggleSquatSelection = (item: string, side: 'ΑΡΙΣΤΕΡΑ' | 'ΔΕΞΙΑ') => {
    const fullItem = `${item} ${side}`;
    if (selectedSquatIssues.includes(fullItem)) {
      setSelectedSquatIssues(prev => prev.filter(i => i !== fullItem));
    } else {
      setSelectedSquatIssues(prev => [...prev, fullItem]);
    }
  };

  const toggleSingleLegSelection = (item: string, side: 'ΑΡΙΣΤΕΡΑ' | 'ΔΕΞΙΑ') => {
    const fullItem = `${item} ${side}`;
    if (selectedSingleLegIssues.includes(fullItem)) {
      setSelectedSingleLegIssues(prev => prev.filter(i => i !== fullItem));
    } else {
      setSelectedSingleLegIssues(prev => [...prev, fullItem]);
    }
  };

  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const getFmsTotal = () => {
    return fmsExercises.flat().reduce((total, exercise) => total + (fmsScores[exercise] || 0), 0);
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
    <div className="space-y-4">
      {/* Πρώτη γραμμή: Στάση Σώματος, Καθήματα, Μονοποδικά Καθήματα */}
      <div className="grid grid-cols-3 gap-4">
        {/* Στάση Σώματος */}
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Στάση Σώματος</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {postureOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleSelection(option, selectedPosture, setSelectedPosture)}
                  className={cn(
                    "p-2 border cursor-pointer text-center text-xs transition-colors",
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Καθήματα</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {/* Επιλογές χωρίς αριστερά/δεξιά */}
              {squatOptions.slice(5).map((option) => (
                <div
                  key={option}
                  onClick={() => toggleSelection(option, selectedSquatIssues, setSelectedSquatIssues)}
                  className={cn(
                    "p-1 border cursor-pointer text-center text-xs transition-colors",
                    selectedSquatIssues.includes(option)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {option}
                </div>
              ))}
              
              {/* Πίνακας για αριστερά/δεξιά */}
              <div className="text-xs">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-1 text-left text-xs">Επιλογή</th>
                      <th className="border border-gray-300 p-1 text-center text-xs">Α</th>
                      <th className="border border-gray-300 p-1 text-center text-xs">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {squatOptions.slice(0, 5).map((option) => (
                      <tr key={option}>
                        <td className="border border-gray-300 p-1 text-xs">{option}</td>
                        <td className="border border-gray-300 p-0 text-center">
                          <div
                            onClick={() => toggleSquatSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                            className={cn(
                              "w-6 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                              selectedSquatIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            ✓
                          </div>
                        </td>
                        <td className="border border-gray-300 p-0 text-center">
                          <div
                            onClick={() => toggleSquatSelection(option, 'ΔΕΞΙΑ')}
                            className={cn(
                              "w-6 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                              selectedSquatIssues.includes(`${option} ΔΕΞΙΑ`)
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            ✓
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Μονοποδικά Καθήματα */}
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Μονοποδικά Καθήματα</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-1 text-left text-xs">Επιλογή</th>
                    <th className="border border-gray-300 p-1 text-center text-xs">Α</th>
                    <th className="border border-gray-300 p-1 text-center text-xs">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {singleLegSquatOptions.map((option) => (
                    <tr key={option}>
                      <td className="border border-gray-300 p-1 text-xs">{option}</td>
                      <td className="border border-gray-300 p-0 text-center">
                        <div
                          onClick={() => toggleSingleLegSelection(option, 'ΑΡΙΣΤΕΡΑ')}
                          className={cn(
                            "w-6 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                            selectedSingleLegIssues.includes(`${option} ΑΡΙΣΤΕΡΑ`)
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          ✓
                        </div>
                      </td>
                      <td className="border border-gray-300 p-0 text-center">
                        <div
                          onClick={() => toggleSingleLegSelection(option, 'ΔΕΞΙΑ')}
                          className={cn(
                            "w-6 h-6 border cursor-pointer flex items-center justify-center mx-auto text-xs",
                            selectedSingleLegIssues.includes(`${option} ΔΕΞΙΑ`)
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          ✓
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FMS */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            FMS 
            <span className={cn(
              "text-sm font-bold px-2 py-1",
              fmsTotal < 14 ? "bg-red-500 text-white" : "bg-green-500 text-white"
            )}>
              Σκορ: {fmsTotal}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {fmsExercises.map((row, rowIndex) => (
              <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
                {row.map((exercise) => (
                  <div
                    key={exercise}
                    onClick={() => handleFmsClick(exercise)}
                    className="p-2 border cursor-pointer text-center transition-colors hover:bg-gray-50"
                  >
                    <div className="font-medium text-xs mb-1">{exercise}</div>
                    <div className="flex justify-center space-x-1">
                      {[0, 1, 2, 3].map((score) => (
                        <div
                          key={score}
                          className={cn(
                            "w-6 h-6 border flex items-center justify-center text-xs font-bold",
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
