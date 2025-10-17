import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface OneRMData {
  weight: number;
  velocity: number;
}

export const use1RMCalculation = (userId: string | undefined, exerciseId: string | undefined) => {
  const [oneRMData, setOneRMData] = useState<OneRMData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !exerciseId) {
      setOneRMData(null);
      return;
    }

    const fetchOneRM = async () => {
      setLoading(true);
      try {
        // Fetch τελευταία καταγραφή για τον συγκεκριμένο χρήστη και άσκηση
        const { data: attempts, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            weight_kg,
            velocity_ms,
            test_session_id,
            strength_test_sessions!inner (
              user_id,
              test_date
            )
          `)
          .eq('strength_test_sessions.user_id', userId)
          .eq('exercise_id', exerciseId)
          .not('velocity_ms', 'is', null)
          .order('strength_test_sessions(test_date)', { ascending: false });

        if (error) throw error;

        if (attempts && attempts.length > 0) {
          // Βρίσκουμε την πιο πρόσφατη session
          const latestSession = attempts.reduce((latest, current) => {
            const latestDate = new Date(latest.strength_test_sessions.test_date);
            const currentDate = new Date(current.strength_test_sessions.test_date);
            return currentDate > latestDate ? current : latest;
          });

          // Παίρνουμε όλες τις προσπάθειες από την πιο πρόσφατη session
          const latestSessionAttempts = attempts.filter(
            a => a.test_session_id === latestSession.test_session_id
          );

          // Η προσπάθεια με το μεγαλύτερο βάρος είναι το 1RM
          const oneRM = latestSessionAttempts.reduce((max, current) => {
            return current.weight_kg > max.weight_kg ? current : max;
          });

          setOneRMData({
            weight: oneRM.weight_kg,
            velocity: oneRM.velocity_ms || 0
          });
        } else {
          setOneRMData(null);
        }
      } catch (error) {
        console.error('Error fetching 1RM:', error);
        setOneRMData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOneRM();
  }, [userId, exerciseId]);

  const calculateFromPercentage = (percentage: string): { kg: string; velocity: string } | null => {
    if (!oneRMData) return null;

    // Parse ποσοστό (αφαιρούμε το % αν υπάρχει)
    const percentValue = parseFloat(percentage.replace('%', '').replace(',', '.'));
    
    if (isNaN(percentValue) || percentValue <= 0 || percentValue > 100) {
      return null;
    }

    // Υπολογισμός κιλών
    const calculatedKg = (oneRMData.weight * percentValue / 100).toFixed(1);

    // Προτεινόμενη ταχύτητα βασισμένη στο ποσοστό
    // Απλή προσέγγιση: όσο χαμηλότερο το ποσοστό, τόσο μεγαλύτερη η ταχύτητα
    // Για 100% -> velocity από 1RM
    // Για χαμηλότερα ποσοστά, αυξάνουμε την ταχύτητα ανάλογα
    const velocityMultiplier = 1 + ((100 - percentValue) / 100) * 0.3; // +30% max στο 0%
    const calculatedVelocity = (oneRMData.velocity * velocityMultiplier).toFixed(2);

    return {
      kg: calculatedKg.replace('.', ','),
      velocity: calculatedVelocity.replace('.', ',')
    };
  };

  return {
    oneRMData,
    loading,
    calculateFromPercentage,
    hasData: !!oneRMData
  };
};
