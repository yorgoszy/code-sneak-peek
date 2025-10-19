import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SprintProgressCardProps {
  userId: string;
  exerciseName: 'Track' | 'Woodway';
}

export const SprintProgressCard: React.FC<SprintProgressCardProps> = ({ userId, exerciseName }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && exerciseName) {
      fetchSprintHistory();
    }
  }, [userId, exerciseName]);

  const fetchSprintHistory = async () => {
    try {
      // Φέρνω περισσότερα sessions για να έχω αρκετά και για τα δύο exercises
      const { data, error } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          endurance_test_data!endurance_test_data_test_session_id_fkey (
            sprint_seconds,
            sprint_meters,
            sprint_resistance,
            sprint_watt,
            exercise_id,
            exercises (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .not('endurance_test_data.sprint_seconds', 'is', null)
        .order('test_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Φιλτράρω μόνο τα sessions για τη συγκεκριμένη άσκηση
      const filteredData = (data || []).filter(session => {
        if (!session.endurance_test_data || session.endurance_test_data.length === 0) return false;
        const sessionExerciseName = session.endurance_test_data[0]?.exercises?.name || 'Track';
        return sessionExerciseName === exerciseName;
      });

      console.log(`Sprint ${exerciseName} - Total sessions:`, filteredData.length);
      console.log(`Sprint ${exerciseName} - Sessions:`, filteredData);

      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching sprint history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = (field: 'sprint_seconds' | 'sprint_meters' | 'sprint_watt') => {
    if (sessions.length === 0) return null;
    return sessions[0]?.endurance_test_data?.[0]?.[field];
  };

  const calculatePercentageChange = (field: 'sprint_seconds' | 'sprint_meters' | 'sprint_watt') => {
    if (sessions.length < 2) {
      console.log(`Sprint ${exerciseName} - Not enough sessions for ${field}. Total: ${sessions.length}`);
      return null;
    }
    const current = sessions[0]?.endurance_test_data?.[0]?.[field];
    const previous = sessions[1]?.endurance_test_data?.[0]?.[field];
    console.log(`Sprint ${exerciseName} - ${field}: current=${current}, previous=${previous}`);
    if (!current || !previous) return null;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return null;
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sprint - {exerciseName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Χρόνος:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('sprint_seconds')} δευτ.</span>
              {calculatePercentageChange('sprint_seconds') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('sprint_seconds')! < 0 ? 'text-green-700' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('sprint_seconds')! > 0 ? '+' : ''}
                  {Math.round(calculatePercentageChange('sprint_seconds')!)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Μέτρα:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('sprint_meters')} m</span>
              {calculatePercentageChange('sprint_meters') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('sprint_meters')! > 0 ? 'text-green-700' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('sprint_meters')! > 0 ? '+' : ''}
                  {Math.round(calculatePercentageChange('sprint_meters')!)}%
                </span>
              )}
            </div>
          </div>
          {getLatestValue('sprint_watt') && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Km/h:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{parseFloat(getLatestValue('sprint_watt') as string).toFixed(2)} km/h</span>
                {calculatePercentageChange('sprint_watt') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculatePercentageChange('sprint_watt')! > 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange('sprint_watt')! > 0 ? '+' : ''}
                    {Math.round(calculatePercentageChange('sprint_watt')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό</div>
            {sessions.slice(1, 4).map((session, idx) => {
              const data = session.endurance_test_data?.[0];
              const exerciseName = data?.exercises?.name || 'Track';
              return (
                <div key={session.id} className="flex flex-col gap-0.5 text-[10px] text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>{format(new Date(session.test_date), 'dd/MM/yy')}</span>
                    <span className="font-medium text-[#cb8954]">{exerciseName}</span>
                  </div>
                  <span className="text-right">{data.sprint_seconds}s × {data.sprint_meters}m {data.sprint_watt ? `× ${parseFloat(data.sprint_watt).toFixed(2)}km/h` : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
