import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface OneRMData {
  weight: number;
  velocity: number;
}

export const use1RMCalculation = (userId: string | undefined, exerciseId: string | undefined) => {
  const [oneRMData, setOneRMData] = useState<OneRMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lvModel, setLvModel] = useState<{ slope: number; intercept: number } | null>(null);

  useEffect(() => {
    if (!userId || !exerciseId) {
      setOneRMData(null);
      setLvModel(null);
      return;
    }

    const fetchOneRM = async () => {
      setLoading(true);
      try {
        // Fetch τελευταία καταγραφή για τον συγκεκριμένο χρήστη και άσκηση (όχι απαραίτητα με δηλωμένη ταχύτητα)
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
          .eq('exercise_id', exerciseId);

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

          // Δημιουργία γραμμικού μοντέλου load-velocity: v = a + b * weight
          const points = latestSessionAttempts
            .filter(a => typeof a.velocity_ms === 'number' && typeof a.weight_kg === 'number')
            .map(a => ({ x: Number(a.weight_kg), y: Number(a.velocity_ms) }));

          if (points.length >= 2) {
            const n = points.length;
            const sumX = points.reduce((s, p) => s + p.x, 0);
            const sumY = points.reduce((s, p) => s + p.y, 0);
            const meanX = sumX / n;
            const meanY = sumY / n;

            let num = 0;
            let den = 0;
            for (const p of points) {
              const dx = p.x - meanX;
              num += dx * (p.y - meanY);
              den += dx * dx;
            }
            const slope = den !== 0 ? num / den : 0;
            const intercept = meanY - slope * meanX;
            setLvModel({ slope, intercept });
          } else {
            setLvModel(null);
          }
        } else {
          // Fallback: RPC για τελευταίο 1RM βάρος αν δεν υπάρχουν attempts
          const { data: rpcWeight, error: rpcError } = await supabase.rpc('get_latest_1rm', {
            athlete_id: userId,
            exercise_id: exerciseId
          });
          if (rpcError) {
            setOneRMData(null);
          } else if (rpcWeight) {
            setOneRMData({ weight: Number(rpcWeight), velocity: 0 });
          } else {
            setOneRMData(null);
          }
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
    const kgForPercent = oneRMData.weight * (percentValue / 100);
    const calculatedKg = kgForPercent.toFixed(1);

    // Υπολογισμός ταχύτητας από το γραμμικό μοντέλο v = a + b * weight (fallback αν δεν υπάρχει)
    let velocityValue: number;
    if (lvModel) {
      const v = lvModel.intercept + lvModel.slope * kgForPercent;
      velocityValue = Math.max(0, v);
    } else {
      // Fallback: απλή κλιμάκωση σε σχέση με το 1RM velocity
      const velocityMultiplier = 1 + ((100 - percentValue) / 100) * 0.3; // +30% max στο 0%
      velocityValue = oneRMData.velocity * velocityMultiplier;
    }
    const calculatedVelocity = velocityValue.toFixed(2);

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
