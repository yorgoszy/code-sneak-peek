
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TestSessionData {
  anthropometric?: any;
  functional?: any;
  endurance?: any;
  jump?: any;
  strength?: any;
}

export const useCentralizedTestSession = (selectedAthleteId: string, selectedDate: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveAllTests = async (testData: TestSessionData) => {
    if (!user) {
      toast({
        title: "Σφάλμα",
        description: "Πρέπει να είστε συνδεδεμένοι για να αποθηκεύσετε δεδομένα",
        variant: "destructive"
      });
      return false;
    }

    setSaving(true);
    
    try {
      // Δημιουργία κεντρικού test session
      const testTypes: string[] = [];
      if (testData.anthropometric) testTypes.push('Σωματομετρικά');
      if (testData.functional) testTypes.push('Λειτουργικότητα');
      if (testData.endurance) testTypes.push('Αντοχή');
      if (testData.jump) testTypes.push('Άλματα');
      if (testData.strength) testTypes.push('Δύναμη');

      if (testTypes.length === 0) {
        toast({
          title: "Σφάλμα",
          description: "Δεν υπάρχουν δεδομένα για αποθήκευση",
          variant: "destructive"
        });
        return false;
      }

      const { data: testSession, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          test_types: testTypes,
          completed_at: new Date().toISOString(),
          notes: 'Ολοκληρωμένο session τεστ'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const sessionId = testSession.id;
      console.log('✅ Κεντρικό session δημιουργήθηκε:', sessionId);

      // Αποθήκευση σωματομετρικών δεδομένων
      if (testData.anthropometric) {
        await saveAnthropometricData(sessionId, testData.anthropometric);
      }

      // Αποθήκευση λειτουργικών δεδομένων
      if (testData.functional) {
        await saveFunctionalData(sessionId, testData.functional);
      }

      // Αποθήκευση δεδομένων αντοχής
      if (testData.endurance) {
        await saveEnduranceData(sessionId, testData.endurance);
      }

      // Αποθήκευση δεδομένων αλμάτων
      if (testData.jump) {
        await saveJumpData(sessionId, testData.jump);
      }

      // Αποθήκευση δεδομένων δύναμης
      if (testData.strength) {
        await saveStrengthData(sessionId, testData.strength);
      }

      toast({
        title: "Επιτυχία",
        description: `Όλα τα τεστ αποθηκεύτηκαν επιτυχώς (${testTypes.join(', ')})`,
      });

      return true;

    } catch (error) {
      console.error('❌ Σφάλμα κατά την αποθήκευση των τεστ:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση: " + (error as any).message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAnthropometricData = async (sessionId: string, data: any) => {
    if (!hasValidData(data)) return;

    const { error } = await supabase
      .from('anthropometric_test_data')
      .insert({
        test_session_id: sessionId,
        height: data.height || null,
        weight: data.weight || null,
        body_fat_percentage: data.body_fat_percentage || null,
        muscle_mass_percentage: data.muscle_mass_percentage || null,
        waist_circumference: data.waist_circumference || null,
        hip_circumference: data.hip_circumference || null,
        chest_circumference: data.chest_circumference || null,
        arm_circumference: data.arm_circumference || null,
        thigh_circumference: data.thigh_circumference || null
      });

    if (error) throw error;
    console.log('✅ Σωματομετρικά δεδομένα αποθηκεύτηκαν');
  };

  const saveFunctionalData = async (sessionId: string, data: any) => {
    if (!hasValidData(data)) return;

    const { error } = await supabase
      .from('functional_test_data')
      .insert({
        test_session_id: sessionId,
        fms_score: data.fms_score || null,
        sit_and_reach: data.sit_and_reach || null,
        shoulder_mobility_left: data.shoulder_mobility_left || null,
        shoulder_mobility_right: data.shoulder_mobility_right || null,
        flamingo_balance: data.flamingo_balance || null,
        fms_detailed_scores: data.fms_detailed_scores || null,
        posture_assessment: data.posture_assessment || null,
        muscles_need_stretching: data.muscles_need_stretching || null,
        muscles_need_strengthening: data.muscles_need_strengthening || null,
        posture_issues: data.posture_issues || null,
        squat_issues: data.squat_issues || null,
        single_leg_squat_issues: data.single_leg_squat_issues || null
      });

    if (error) throw error;
    console.log('✅ Λειτουργικά δεδομένα αποθηκεύτηκαν');
  };

  const saveEnduranceData = async (sessionId: string, data: any) => {
    if (!hasValidData(data)) return;

    const { error } = await supabase
      .from('endurance_test_data')
      .insert({
        test_session_id: sessionId,
        push_ups: data.push_ups || null,
        pull_ups: data.pull_ups || null,
        crunches: data.crunches || null,
        farmer_kg: data.farmer_kg || null,
        farmer_meters: data.farmer_meters || null,
        farmer_seconds: data.farmer_seconds || null,
        sprint_seconds: data.sprint_seconds || null,
        sprint_meters: data.sprint_meters || null,
        sprint_watt: data.sprint_watt || null,
        sprint_resistance: data.sprint_resistance || null,
        mas_meters: data.mas_meters || null,
        mas_minutes: data.mas_minutes || null,
        mas_ms: data.mas_ms || null,
        mas_kmh: data.mas_kmh || null,
        max_hr: data.max_hr || null,
        resting_hr_1min: data.resting_hr_1min || null,
        vo2_max: data.vo2_max || null
      });

    if (error) throw error;
    console.log('✅ Δεδομένα αντοχής αποθηκεύτηκαν');
  };

  const saveJumpData = async (sessionId: string, data: any) => {
    if (!hasValidData(data)) return;

    const { error } = await supabase
      .from('jump_test_data')
      .insert({
        test_session_id: sessionId,
        non_counter_movement_jump: data.non_counter_movement_jump || null,
        counter_movement_jump: data.counter_movement_jump || null,
        depth_jump: data.depth_jump || null,
        broad_jump: data.broad_jump || null,
        triple_jump_left: data.triple_jump_left || null,
        triple_jump_right: data.triple_jump_right || null
      });

    if (error) throw error;
    console.log('✅ Δεδομένα αλμάτων αποθηκεύτηκαν');
  };

  const saveStrengthData = async (sessionId: string, data: any) => {
    if (!data || !data.exercise_tests || data.exercise_tests.length === 0) return;

    for (const exerciseTest of data.exercise_tests) {
      if (!exerciseTest.exercise_id || !exerciseTest.attempts || exerciseTest.attempts.length === 0) continue;

      for (const attempt of exerciseTest.attempts) {
        const { error } = await supabase
          .from('strength_test_data')
          .insert({
            test_session_id: sessionId,
            exercise_id: exerciseTest.exercise_id,
            attempt_number: attempt.attempt_number,
            weight_kg: attempt.weight_kg,
            velocity_ms: attempt.velocity_ms,
            is_1rm: attempt.is_1rm,
            notes: attempt.notes || null
          });

        if (error) throw error;
      }
    }

    console.log('✅ Δεδομένα δύναμης αποθηκεύτηκαν');
  };

  const hasValidData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    return Object.values(data).some(value => 
      value !== null && value !== undefined && value !== '' && value !== 0
    );
  };

  return {
    saveAllTests,
    saving
  };
};
