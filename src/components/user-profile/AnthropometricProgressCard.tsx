import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface AnthropometricProgressCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const AnthropometricProgressCard: React.FC<AnthropometricProgressCardProps> = ({ 
  userId,
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnthropometricData();
  }, [userId, useCoachTables, coachId]);

  const fetchAnthropometricData = async () => {
    try {
      let sessionsWithData: any[] = [];

      if (useCoachTables && coachId) {
        // Fetch from coach tables
        const { data: sessionsData, error: sessionError } = await supabase
          .from('coach_anthropometric_test_sessions')
          .select('*')
          .eq('coach_id', coachId)
          .eq('coach_user_id', userId)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (sessionError) throw sessionError;
        if (!sessionsData || sessionsData.length === 0) {
          setLoading(false);
          return;
        }

        for (const session of sessionsData) {
          const { data: anthroData } = await supabase
            .from('coach_anthropometric_test_data')
            .select('*')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (anthroData) {
            sessionsWithData.push({
              ...anthroData,
              test_date: session.test_date,
              session_id: session.id
            });
          }
        }
      } else {
        // Get all sessions from regular tables
        const { data: sessionsData, error: sessionError } = await supabase
          .from('anthropometric_test_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (sessionError) throw sessionError;
        if (!sessionsData || sessionsData.length === 0) {
          setLoading(false);
          return;
        }

        for (const session of sessionsData) {
          const { data: anthroData } = await supabase
            .from('anthropometric_test_data')
            .select('*')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (anthroData) {
            sessionsWithData.push({
              ...anthroData,
              test_date: session.test_date,
              session_id: session.id
            });
          }
        }
      }

      setSessions(sessionsWithData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching anthropometric data:', error);
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number): number | null => {
    if (!previous || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getLatestValue = (field: keyof typeof sessions[0]) => {
    if (sessions.length === 0) return null;
    return sessions[0]?.[field];
  };

  const getPreviousValue = (field: keyof typeof sessions[0]) => {
    if (sessions.length < 2) return null;
    return sessions[1]?.[field];
  };

  if (loading) {
    return (
      <Card className="rounded-none border border-gray-200 w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm">{t('progress.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  const latestData = sessions[0];

  return (
    <Card className="rounded-none border border-gray-200 w-full max-w-2xl">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium">{t('progress.anthropometric')}</CardTitle>
          <div className="text-[9px] text-gray-400">
            {format(new Date(latestData.test_date), 'dd/MM/yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {latestData.height && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">{t('progress.height')}</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1 flex-wrap">
                {latestData.height}<span className="text-[9px] text-gray-400 ml-0.5">cm</span>
                {getPreviousValue('height') && calculatePercentageChange(latestData.height, getPreviousValue('height')!) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.height, getPreviousValue('height')!)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.height, getPreviousValue('height')!)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.height, getPreviousValue('height')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.weight && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">{t('progress.weight')}</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.weight}<span className="text-[9px] text-gray-400 ml-0.5">kg</span>
                {getPreviousValue('weight') && calculatePercentageChange(latestData.weight, getPreviousValue('weight')!) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.weight, getPreviousValue('weight')!)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.weight, getPreviousValue('weight')!)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.weight, getPreviousValue('weight')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.muscle_mass_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">{t('progress.muscleMass')}</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.muscle_mass_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                {getPreviousValue('muscle_mass_percentage') && calculatePercentageChange(latestData.muscle_mass_percentage, getPreviousValue('muscle_mass_percentage')!) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.muscle_mass_percentage, getPreviousValue('muscle_mass_percentage')!)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.muscle_mass_percentage, getPreviousValue('muscle_mass_percentage')!)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.muscle_mass_percentage, getPreviousValue('muscle_mass_percentage')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.body_fat_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">{t('progress.bodyFat')}</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.body_fat_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                {getPreviousValue('body_fat_percentage') && calculatePercentageChange(latestData.body_fat_percentage, getPreviousValue('body_fat_percentage')!) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.body_fat_percentage, getPreviousValue('body_fat_percentage')!)! > 0 
                      ? 'text-red-600' 
                      : 'text-green-700'
                  }`}>
                    {calculatePercentageChange(latestData.body_fat_percentage, getPreviousValue('body_fat_percentage')!)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.body_fat_percentage, getPreviousValue('body_fat_percentage')!)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-2 border-t border-gray-200 mt-2">
            <div className="text-[10px] text-gray-500 font-medium">{t('progress.history')}</div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{format(new Date(sessions[1].test_date), 'dd/MM/yy')}</span>
              <div className="flex gap-2 text-right">
                {sessions[1].height && <span>{t('progress.height')}: {sessions[1].height}cm</span>}
                {sessions[1].weight && <span>{t('progress.weight')}: {sessions[1].weight}kg</span>}
                {sessions[1].body_fat_percentage && <span>{t('progress.bodyFat')}: {sessions[1].body_fat_percentage}%</span>}
                {sessions[1].muscle_mass_percentage && <span>{t('progress.muscleMass')}: {sessions[1].muscle_mass_percentage}%</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
