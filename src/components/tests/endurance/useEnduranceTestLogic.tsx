
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useEnduranceTestLogic = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    pushUps: '',
    pullUps: '',
    crunches: '',
    farmerKg: '',
    farmerMeters: '',
    farmerSeconds: '',
    sprintSeconds: '',
    sprintMeters: '',
    sprintResistance: '',
    sprintWatt: '',
    sprintKmh: '',
    sprintExercise: 'track',
    masMeters: '',
    masMinutes: '',
    masMs: '',
    masKmh: '',
    maxHr: '',
    restingHr1min: '',
    vo2Max: ''
  });

  // Αυτόματος υπολογισμός m/s και km/h για MAS
  useEffect(() => {
    if (formData.masMeters && formData.masMinutes) {
      const meters = parseFloat(formData.masMeters);
      const minutes = parseFloat(formData.masMinutes);
      
      if (meters > 0 && minutes > 0) {
        const totalSeconds = minutes * 60;
        const ms = meters / totalSeconds;
        const kmh = ms * 3.6;
        
        setFormData(prev => ({
          ...prev,
          masMs: ms.toFixed(2),
          masKmh: kmh.toFixed(2)
        }));
      }
    }
  }, [formData.masMeters, formData.masMinutes]);

  // Αυτόματος υπολογισμός για Sprint
  useEffect(() => {
    if (formData.sprintExercise === 'track' && formData.sprintSeconds && formData.sprintMeters) {
      // Track: υπολογισμός km/h από meters και seconds
      const seconds = parseFloat(formData.sprintSeconds);
      const meters = parseFloat(formData.sprintMeters);
      
      if (seconds > 0 && meters > 0) {
        const ms = meters / seconds;
        const kmh = ms * 3.6;
        
        setFormData(prev => ({
          ...prev,
          sprintKmh: kmh.toFixed(2)
        }));
      }
    } else if (formData.sprintExercise === 'woodway' && formData.sprintSeconds && formData.sprintKmh) {
      // Woodway: υπολογισμός meters από km/h και seconds
      const seconds = parseFloat(formData.sprintSeconds);
      const kmh = parseFloat(formData.sprintKmh);
      
      if (seconds > 0 && kmh > 0) {
        const ms = kmh / 3.6;
        const meters = ms * seconds;
        
        setFormData(prev => ({
          ...prev,
          sprintMeters: meters.toFixed(2)
        }));
      }
    }
  }, [formData.sprintExercise, formData.sprintSeconds, formData.sprintMeters, formData.sprintKmh]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (selectedAthleteId: string, selectedDate: string) => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    console.log("Starting endurance test submission...");
    console.log("Selected athlete:", selectedAthleteId);
    console.log("User:", user.id);
    console.log("Form data:", formData);

    try {
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast.error("Σφάλμα στη δημιουργία χρήστη");
        return;
      }

      console.log("App user ID:", appUserId);

      // Χρησιμοποιώ user_id αντί για athlete_id
      const { data: session, error: sessionError } = await supabase
        .from('endurance_test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          created_by: appUserId
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      console.log("Session created:", session);

      const enduranceData = {
        test_session_id: session.id,
        push_ups: formData.pushUps ? parseInt(formData.pushUps) : null,
        pull_ups: formData.pullUps ? parseInt(formData.pullUps) : null,
        crunches: formData.crunches ? parseInt(formData.crunches) : null,
        farmer_kg: formData.farmerKg ? parseFloat(formData.farmerKg) : null,
        farmer_meters: formData.farmerMeters ? parseFloat(formData.farmerMeters) : null,
        farmer_seconds: formData.farmerSeconds ? parseFloat(formData.farmerSeconds) : null,
        sprint_seconds: formData.sprintSeconds ? parseFloat(formData.sprintSeconds) : null,
        sprint_meters: formData.sprintMeters ? parseFloat(formData.sprintMeters) : null,
        sprint_resistance: formData.sprintResistance || null,
        sprint_watt: formData.sprintWatt ? parseFloat(formData.sprintWatt) : null,
        mas_meters: formData.masMeters ? parseFloat(formData.masMeters) : null,
        mas_minutes: formData.masMinutes ? parseFloat(formData.masMinutes) : null,
        mas_ms: formData.masMs ? parseFloat(formData.masMs) : null,
        mas_kmh: formData.masKmh ? parseFloat(formData.masKmh) : null,
        max_hr: formData.maxHr ? parseInt(formData.maxHr) : null,
        resting_hr_1min: formData.restingHr1min ? parseInt(formData.restingHr1min) : null,
        vo2_max: formData.vo2Max ? parseFloat(formData.vo2Max) : null
      };

      console.log("Endurance data to insert:", enduranceData);

      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert(enduranceData);

      if (dataError) {
        console.error('Data insertion error:', dataError);
        throw dataError;
      }

      console.log("Endurance data inserted successfully");

      const chartData = {
        labels: ['Push Ups', 'Pull Ups', 'Crunches', 'Farmer Walk', 'Sprint', 'MAS', 'Max HR', 'VO2 Max'],
        values: [
          formData.pushUps || 0,
          formData.pullUps || 0,
          formData.crunches || 0,
          formData.farmerKg || 0,
          formData.sprintWatt || 0,
          formData.masKmh || 0,
          formData.maxHr || 0,
          formData.vo2Max || 0
        ]
      };

      // Χρησιμοποιώ user_id αντί για athlete_id
      const { error: summaryError } = await supabase
        .from('test_results_summary')
        .insert({
          user_id: selectedAthleteId,
          test_type: 'endurance',
          test_date: selectedDate,
          chart_data: chartData
        });

      if (summaryError) {
        console.error('Summary error:', summaryError);
      }

      toast.success("Τα δεδομένα αντοχής αποθηκεύτηκαν επιτυχώς!");
      
      // Reset form
      setFormData({
        pushUps: '',
        pullUps: '',
        crunches: '',
        farmerKg: '',
        farmerMeters: '',
        farmerSeconds: '',
        sprintSeconds: '',
        sprintMeters: '',
        sprintResistance: '',
        sprintWatt: '',
        sprintKmh: '',
        sprintExercise: 'track',
        masMeters: '',
        masMinutes: '',
        masMs: '',
        masKmh: '',
        maxHr: '',
        restingHr1min: '',
        vo2Max: ''
      });

    } catch (error) {
      console.error('Error saving endurance data:', error);
      toast.error("Σφάλμα κατά την αποθήκευση: " + (error as any).message);
    }
  };

  return {
    formData,
    handleInputChange,
    handleSubmit
  };
};
