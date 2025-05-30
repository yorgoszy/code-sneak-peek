
import { useEffect } from "react";
import { useStrengthDataFetching } from "./useStrengthDataFetching";
import { useStrengthSessionManager } from "./useStrengthSessionManager";

export const useStrengthTestData = (selectedAthleteId: string, selectedDate: string) => {
  const {
    exercises,
    sessions,
    fetchExercises,
    fetchSessions
  } = useStrengthDataFetching();

  const {
    currentSession,
    editingSessionId,
    setCurrentSession,
    saveSession,
    deleteSession,
    resetForm,
    editSession
  } = useStrengthSessionManager(
    selectedAthleteId,
    selectedDate,
    () => fetchSessions(selectedAthleteId),
    () => fetchExercises(selectedAthleteId)
  );

  useEffect(() => {
    setCurrentSession(prev => ({ 
      ...prev, 
      athlete_id: selectedAthleteId,
      start_date: selectedDate,
      end_date: selectedDate
    }));
    fetchExercises(selectedAthleteId);
    fetchSessions(selectedAthleteId);
  }, [selectedAthleteId, selectedDate]);

  return {
    exercises,
    sessions,
    currentSession,
    editingSessionId,
    setCurrentSession,
    saveSession,
    deleteSession,
    resetForm,
    editSession,
    fetchExercises: () => fetchExercises(selectedAthleteId),
    fetchSessions: () => fetchSessions(selectedAthleteId)
  };
};
