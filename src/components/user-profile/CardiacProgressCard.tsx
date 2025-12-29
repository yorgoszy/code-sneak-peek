import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface CardiacProgressCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const CardiacProgressCard: React.FC<CardiacProgressCardProps> = ({ 
  userId,
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCardiacHistory();
    }
  }, [userId, useCoachTables, coachId]);

  const fetchCardiacHistory = async () => {
    try {
      let data, error;

      if (useCoachTables && coachId) {
        // Fetch from coach tables
        const result = await supabase
          .from('coach_endurance_test_sessions')
          .select(`
            id,
            test_date,
            coach_endurance_test_data (
              max_hr,
              resting_hr_1min
            )
          `)
          .eq('coach_id', coachId)
          .eq('coach_user_id', userId)
          .order('test_date', { ascending: false })
          .limit(10);
        
        if (result.error) throw result.error;
        
        // Transform to match expected format
        data = (result.data || []).map(session => ({
          ...session,
          endurance_test_data: session.coach_endurance_test_data
        }));
      } else {
        const result = await supabase
          .from('endurance_test_sessions')
          .select(`
            id,
            test_date,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              max_hr,
              resting_hr_1min
            )
          `)
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .limit(10);

        if (result.error) throw result.error;
        data = result.data;
      }

      const filteredData = (data || []).filter(session => {
        const rows = session.endurance_test_data || [];
        return rows.some((r: any) => r.max_hr !== null || r.resting_hr_1min !== null);
      });

      setSessions(filteredData);
    } catch (error) {
      console.error('Error fetching cardiac history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = (field: 'max_hr' | 'resting_hr_1min') => {
    if (sessions.length === 0) return null;
    return sessions[0]?.endurance_test_data?.[0]?.[field];
  };

  const calculatePercentageChange = (field: 'max_hr' | 'resting_hr_1min') => {
    if (sessions.length < 2) return null;
    const current = sessions[0]?.endurance_test_data?.[0]?.[field];
    const previous = sessions[1]?.endurance_test_data?.[0]?.[field];
    if (!current || !previous) return null;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return null;
  }

  if (sessions.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {t('progress.cardiacData')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2 text-gray-400 text-xs">{t('progress.noData')}</div>
        </CardContent>
      </Card>
    );
  }

  const latestMaxHr = getLatestValue('max_hr');
  const latestRestingHr = getLatestValue('resting_hr_1min');

  return (
    <Card className="rounded-none w-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {t('progress.cardiacData')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Latest Values */}
        <div className="space-y-1">
          {latestMaxHr && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Max HR:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{latestMaxHr} bpm</span>
                {calculatePercentageChange('max_hr') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculatePercentageChange('max_hr')! > 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange('max_hr')! > 0 ? '+' : ''}
                    {Math.round(calculatePercentageChange('max_hr')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          {latestRestingHr && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">1min Rest:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#cb8954]">{latestRestingHr} bpm</span>
                {calculatePercentageChange('resting_hr_1min') !== null && (
                  <span className={`text-[10px] font-semibold ${
                    calculatePercentageChange('resting_hr_1min')! < 0 ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {calculatePercentageChange('resting_hr_1min')! > 0 ? '+' : ''}
                    {Math.round(calculatePercentageChange('resting_hr_1min')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            {t('progress.lastMeasurement')}: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>

        {/* History */}
        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">{t('progress.history')}</div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{format(new Date(sessions[1].test_date), 'dd/MM/yy')}</span>
              <div className="flex gap-2">
                {sessions[1].endurance_test_data?.[0]?.max_hr && <span>Max: {sessions[1].endurance_test_data?.[0].max_hr}</span>}
                {sessions[1].endurance_test_data?.[0]?.resting_hr_1min && <span>Rest: {sessions[1].endurance_test_data?.[0].resting_hr_1min}</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
