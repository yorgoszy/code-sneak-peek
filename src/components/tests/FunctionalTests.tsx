
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PostureTest } from "./functional/PostureTest";
import { SquatTest } from "./functional/SquatTest";
import { SingleLegSquatTest } from "./functional/SingleLegSquatTest";
import { FMSTest } from "./functional/FMSTest";

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

  const getFmsTotal = () => {
    const fmsExercises = [
      ['Shoulder Mobility', 'Active Straight Leg Raise'],
      ['Trunk Stability Push-Up', 'Rotary Stability'],
      ['Inline Lunge', 'Hurdle Step', 'Deep Squat']
    ];
    return fmsExercises.flat().reduce((total, exercise) => total + (fmsScores[exercise] || 0), 0);
  };

  // Δημιουργία app_user εάν δεν υπάρχει
  const ensureAppUserExists = async () => {
    if (!user) return null;

    const { data: existingAppUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingAppUser) {
      return existingAppUser.id;
    }

    if (checkError) {
      console.error('Error checking app_user:', checkError);
    }

    const { data: newAppUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: user.id,
        email: user.email || 'unknown@email.com',
        name: user.user_metadata?.full_name || user.email || 'Unknown User',
        role: 'coach'
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating app_user:', createError);
      throw createError;
    }

    return newAppUser.id;
  };

  const handleSubmit = async () => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    try {
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast.error("Σφάλμα στη δημιουργία χρήστη");
        return;
      }

      // Δημιουργία session για λειτουργικά τεστ
      const { data: session, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .insert({
          athlete_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: appUserId
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
      toast.error("Σφάλμα κατά την αποθήκευση: " + (error as any).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Πρώτη γραμμή: Στάση Σώματος, Καθήματα, Μονοποδικά Καθήματα */}
      <div className="grid grid-cols-3 gap-4">
        <PostureTest 
          selectedPosture={selectedPosture}
          onPostureChange={setSelectedPosture}
        />
        <SquatTest 
          selectedSquatIssues={selectedSquatIssues}
          onSquatChange={setSelectedSquatIssues}
        />
        <SingleLegSquatTest 
          selectedSingleLegIssues={selectedSingleLegIssues}
          onSingleLegChange={setSelectedSingleLegIssues}
        />
      </div>

      {/* FMS */}
      <FMSTest 
        fmsScores={fmsScores}
        onFmsScoreChange={setFmsScores}
      />

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
