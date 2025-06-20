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
      if (testData.anthropometric && hasValidData(testData.anthropometric)) testTypes.push('Σωματομετρικά');
      if (testData.functional && hasValidData(testData.functional)) testTypes.push('Λειτουργικότητα');
      if (testData.endurance && hasValidData(testData.endurance)) testTypes.push('Αντοχή');
      if (testData.jump && hasValidData(testData.jump)) testTypes.push('Άλματα');
      if (testData.strength && hasValidStrengthData(testData.strength)) testTypes.push('Δύναμη');

      if (testTypes.length === 0) {
        toast({
          title: "Σφάλμα",
          description: "Δεν υπάρχουν δεδομένα για αποθήκευση",
          variant: "destructive"
        });
        return false;
      }

      console.log('🔄 Δημιουργία κεντρικού test session για:', testTypes);

      const { data: testSession, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          test_types: testTypes,
          completed_at: new Date().toISOString(),
          notes: `Ολοκληρωμένο session τεστ - ${testTypes.join(', ')}`
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const sessionId = testSession.id;
      console.log('✅ Κεντρικό session δημιουργήθηκε:', sessionId);

      // Αποθήκευση σωματομετρικών δεδομένων
      if (testData.anthropometric && hasValidData(testData.anthropometric)) {
        await saveAnthropometricData(sessionId, testData.anthropometric);
      }

      // Αποθήκευση λειτουργικών δεδομένων
      if (testData.functional && hasValidData(testData.functional)) {
        await saveFunctionalData(sessionId, testData.functional);
      }

      // Αποθήκευση δεδομένων αντοχής
      if (testData.endurance && hasValidData(testData.endurance)) {
        await saveEnduranceData(sessionId, testData.endurance);
      }

      // Αποθήκευση δεδομένων αλμάτων
      if (testData.jump && hasValidData(testData.jump)) {
        await saveJumpData(sessionId, testData.jump);
      }

      // Αποθήκευση δεδομένων δύναμης - ΝΕΑ ΛΟΓΙΚΗ
      if (testData.strength && hasValidStrengthData(testData.strength)) {
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
    const { error } = await supabase
      .from('anthropometric_test_data')
      .insert({
        test_session_id: sessionId,
        height: parseFloat(data.height) || null,
        weight: parseFloat(data.weight) || null,
        body_fat_percentage: parseFloat(data.bodyFatPercentage) || null,
        muscle_mass_percentage: parseFloat(data.muscleMassPercentage) || null,
        waist_circumference: parseFloat(data.waistCircumference) || null,
        hip_circumference: parseFloat(data.hipCircumference) || null,
        chest_circumference: parseFloat(data.chestCircumference) || null,
        arm_circumference: parseFloat(data.armCircumference) || null,
        thigh_circumference: parseFloat(data.thighCircumference) || null
      });

    if (error) throw error;
    console.log('✅ Σωματομετρικά δεδομένα αποθηκεύτηκαν');
  };

  const saveFunctionalData = async (sessionId: string, data: any) => {
    const totalFmsScore = data.fmsScores ? 
      Object.values(data.fmsScores).reduce((sum: number, score: any) => sum + (parseInt(String(score)) || 0), 0) : 
      null;

    const { error } = await supabase
      .from('functional_test_data')
      .insert({
        test_session_id: sessionId,
        fms_score: totalFmsScore,
        fms_detailed_scores: data.fmsScores || null,
        posture_issues: data.selectedPosture || null,
        squat_issues: data.selectedSquatIssues || null,
        single_leg_squat_issues: data.selectedSingleLegIssues || null
      });

    if (error) throw error;
    console.log('✅ Λειτουργικά δεδομένα αποθηκεύτηκαν');
  };

  const saveEnduranceData = async (sessionId: string, data: any) => {
    const { error } = await supabase
      .from('endurance_test_data')
      .insert({
        test_session_id: sessionId,
        push_ups: parseInt(data.pushUps) || null,
        pull_ups: parseInt(data.pullUps) || null,
        crunches: parseInt(data.crunches) || null,
        farmer_kg: parseFloat(data.farmerKg) || null,
        farmer_meters: parseFloat(data.farmerMeters) || null,
        farmer_seconds: parseFloat(data.farmerSeconds) || null,
        sprint_seconds: parseFloat(data.sprintSeconds) || null,
        sprint_meters: parseFloat(data.sprintMeters) || null,
        sprint_watt: parseFloat(data.sprintWatt) || null,
        sprint_resistance: data.sprintResistance || null,
        mas_meters: parseFloat(data.masMeters) || null,
        mas_minutes: parseFloat(data.masMinutes) || null,
        mas_ms: parseFloat(data.masMs) || null,
        mas_kmh: parseFloat(data.masKmh) || null,
        max_hr: parseInt(data.maxHr) || null,
        resting_hr_1min: parseInt(data.restingHr1min) || null,
        vo2_max: parseFloat(data.vo2Max) || null
      });

    if (error) throw error;
    console.log('✅ Δεδομένα αντοχής αποθηκεύτηκαν');
  };

  const saveJumpData = async (sessionId: string, data: any) => {
    const { error } = await supabase
      .from('jump_test_data')
      .insert({
        test_session_id: sessionId,
        non_counter_movement_jump: parseFloat(data.nonCounterMovementJump) || null,
        counter_movement_jump: parseFloat(data.counterMovementJump) || null,
        depth_jump: parseFloat(data.depthJump) || null,
        broad_jump: parseFloat(data.broadJump) || null,
        triple_jump_left: parseFloat(data.tripleJumpLeft) || null,
        triple_jump_right: parseFloat(data.tripleJumpRight) || null
      });

    if (error) throw error;
    console.log('✅ Δεδομένα αλμάτων αποθηκεύτηκαν');
  };

  const saveStrengthData = async (sessionId: string, data: any) => {
    console.log('💪 Αποθήκευση δεδομένων δύναμης:', data);
    
    if (!data || !data.exercise_tests || data.exercise_tests.length === 0) {
      console.log('⚠️ Δεν υπάρχουν δεδομένα δύναμης για αποθήκευση');
      return;
    }

    for (const exerciseTest of data.exercise_tests) {
      if (!exerciseTest.exercise_id || !exerciseTest.attempts || exerciseTest.attempts.length === 0) {
        console.log('⚠️ Παραλείπεται άσκηση χωρίς προσπάθειες:', exerciseTest);
        continue;
      }

      for (const attempt of exerciseTest.attempts) {
        const { error } = await supabase
          .from('strength_test_data')
          .insert({
            test_session_id: sessionId,
            exercise_id: exerciseTest.exercise_id,
            attempt_number: attempt.attempt_number,
            weight_kg: parseFloat(attempt.weight_kg) || null,
            velocity_ms: parseFloat(attempt.velocity_ms) || null,
            is_1rm: attempt.is_1rm || false,
            notes: attempt.notes || null
          });

        if (error) {
          console.error('❌ Σφάλμα κατά την αποθήκευση προσπάθειας δύναμης:', error);
          throw error;
        }
      }
    }

    console.log('✅ Δεδομένα δύναμης αποθηκεύτηκαν στον κεντρικό πίνακα');
  };

  const hasValidData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    return Object.values(data).some(value => 
      value !== null && value !== undefined && value !== '' && value !== 0 && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
  };

  const hasValidStrengthData = (data: any): boolean => {
    if (!data || !data.exercise_tests || !Array.isArray(data.exercise_tests)) return false;
    
    return data.exercise_tests.some((exerciseTest: any) => 
      exerciseTest.exercise_id && 
      exerciseTest.attempts && 
      Array.isArray(exerciseTest.attempts) && 
      exerciseTest.attempts.length > 0
    );
  };

  return {
    saveAllTests,
    saving
  };
};
