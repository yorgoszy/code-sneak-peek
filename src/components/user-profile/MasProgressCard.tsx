import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface MasProgressCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const MasProgressCard: React.FC<MasProgressCardProps> = ({ 
  userId, 
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMasHistory();
    }
  }, [userId, useCoachTables, coachId]);

  const fetchMasHistory = async () => {
    try {
      let allData: any[] = [];

      if (useCoachTables && coachId) {
        // Fetch from coach tables
        const { data, error } = await supabase
          .from('coach_endurance_test_sessions')
          .select(`
            id,
            test_date,
            coach_endurance_test_data (
              id,
              mas_meters,
              mas_minutes,
              mas_ms,
              mas_kmh
            )
          `)
          .eq('coach_id', coachId)
          .eq('coach_user_id', userId)
          .order('test_date', { ascending: false });

        if (error) throw error;
        
        allData = (data || []).flatMap(session => 
          (session.coach_endurance_test_data || []).map((ed: any) => ({
            ...ed,
            test_date: session.test_date
          }))
        );
      } else {
        const { data, error } = await supabase
          .from('endurance_test_sessions')
          .select(`
            id,
            test_date,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              id,
              mas_meters,
              mas_minutes,
              mas_ms,
              mas_kmh,
              exercise_id,
              exercises (
                id,
                name
              )
            )
          `)
          .eq('user_id', userId)
          .order('test_date', { ascending: false });

        if (error) throw error;
        
        allData = (data || []).flatMap(session => 
          (session.endurance_test_data || []).map(ed => ({
            ...ed,
            test_date: session.test_date
          }))
        );
      }
      
      // Group by exercise_id and get latest + previous for each
      const exerciseMap = new Map();
      allData.forEach(item => {
        if (!item.exercise_id || !item.mas_ms) return;
        
        if (!exerciseMap.has(item.exercise_id)) {
          exerciseMap.set(item.exercise_id, []);
        }
        exerciseMap.get(item.exercise_id).push(item);
      });
      
      // For each exercise, sort by date and keep the 2 most recent
      const processedSessions = Array.from(exerciseMap.values()).map(items => {
        const sorted = items.sort((a, b) => 
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        );
        
        const latest = sorted[0];
        const previous = sorted[1];
        
        let percentageChange = null;
        if (previous && previous.mas_ms) {
          percentageChange = ((latest.mas_ms - previous.mas_ms) / previous.mas_ms) * 100;
        }
        
        return {
          ...latest,
          percentageChange,
          previousData: previous
        };
      });
      
      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching MAS data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('progress.masTests')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">{t('progress.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-none max-w-2xl" style={{ width: 'calc(100% + 10px)' }}>
      <CardHeader className="p-[5px]">
        <CardTitle className="text-sm">{t('progress.masTests')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row md:overflow-x-auto pb-2 p-[5px] gap-2">
        {sessions.map((exerciseData) => (
          <Card key={exerciseData.id} className="rounded-none min-w-[215px] shrink-0">
            <CardContent className="p-[3px]">
              <div className="space-y-1">
                {/* Header με άσκηση και μέτρα/λεπτά */}
                <div className="flex items-start justify-between">
                  {exerciseData.exercises?.name && (
                    <div className="text-sm font-semibold text-gray-900">
                      {exerciseData.exercises.name}
                    </div>
                  )}
                  <div className="flex flex-col text-xs text-gray-500 text-right">
                    <span>{exerciseData.mas_meters}m</span>
                    <span>{Math.floor(exerciseData.mas_minutes)}:{String(Math.round((exerciseData.mas_minutes % 1) * 60)).padStart(2, '0')}</span>
                  </div>
                </div>
                
                {/* MAS με ποσοστό αλλαγής */}
                <div className="flex items-center gap-1">
                  <div className="font-bold text-[#cb8954]">
                    {exerciseData.mas_ms?.toFixed(2)} m/s
                  </div>
                  {exerciseData.percentageChange !== null && (
                    <div className={`text-xs font-semibold ${
                      exerciseData.percentageChange > 0 ? 'text-[#00ffba]' : 'text-red-500'
                    }`}>
                      {exerciseData.percentageChange > 0 ? '+' : ''}
                      {exerciseData.percentageChange.toFixed(1)}%
                    </div>
                  )}
                </div>
                
                {/* Ημερομηνία κάτω αριστερά */}
                <div className="text-xs text-gray-500">
                  {format(new Date(exerciseData.test_date), 'dd/MM/yy')}
                </div>

                {/* Ιστορικό */}
                {exerciseData.previousData && (
                  <div className="pt-1 border-t border-gray-200">
                    <div className="text-[10px] text-gray-500 font-medium">{t('progress.history')}</div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                      <span>{format(new Date(exerciseData.previousData.test_date), 'dd/MM/yy')}</span>
                      <span>{exerciseData.previousData.mas_meters}m | {Math.floor(exerciseData.previousData.mas_minutes)}:{String(Math.round((exerciseData.previousData.mas_minutes % 1) * 60)).padStart(2, '0')} | {exerciseData.previousData.mas_ms?.toFixed(2)} m/s</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};