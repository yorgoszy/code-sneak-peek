import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface BodyweightProgressCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const BodyweightProgressCard: React.FC<BodyweightProgressCardProps> = ({ 
  userId,
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBodyweightHistory();
    }
  }, [userId, useCoachTables, coachId]);

  const fetchBodyweightHistory = async () => {
    try {
      let data: any[] = [];

      if (useCoachTables && coachId) {
        const { data: coachData, error } = await supabase
          .from('coach_endurance_test_sessions')
          .select(`
            id,
            test_date,
            coach_endurance_test_data (
              id,
              push_ups,
              pull_ups,
              t2b
            )
          `)
          .eq('coach_id', coachId)
          .eq('coach_user_id', userId)
          .order('test_date', { ascending: false });

        if (error) throw error;
        
        // Transform to match expected format
        data = (coachData || []).map(s => ({
          ...s,
          endurance_test_data: s.coach_endurance_test_data
        }));
      } else {
        const { data: regularData, error } = await supabase
          .from('endurance_test_sessions')
          .select(`
            id,
            test_date,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              id,
              push_ups,
              pull_ups,
              t2b
            )
          `)
          .eq('user_id', userId)
          .order('test_date', { ascending: false });

        if (error) throw error;
        data = regularData || [];
      }
      
      // Filter only sessions with bodyweight data
      const bodyweightSessions = data
        .map(session => ({
          ...session,
          endurance_test_data: (session.endurance_test_data || [])
            .filter((ed: any) => ed.push_ups !== null || ed.pull_ups !== null || ed.t2b !== null)
        }))
        .filter(session => session.endurance_test_data.length > 0);

      // Flatten data with test dates
      const allData = bodyweightSessions.flatMap(session => 
        session.endurance_test_data.map((ed: any) => ({
          ...ed,
          test_date: session.test_date
        }))
      );

      // Store all sessions (limit to 10 for history)
      setSessions(allData.slice(0, 10));
    } catch (error) {
      console.error('Error fetching bodyweight data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('progress.pushUpsPullUps')}</CardTitle>
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

  const currentSession = sessions[0];

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getPreviousValue = (field: 'push_ups' | 'pull_ups' | 't2b') => {
    if (sessions.length < 2) return null;
    return sessions[1]?.[field];
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('progress.pushUpsPullUps')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {/* Push Ups */}
          {currentSession.push_ups !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">{t('progress.pushUps')}:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.push_ups}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.push_ups, getPreviousValue('push_ups'));
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
          
          {/* Pull Ups */}
          {currentSession.pull_ups !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">{t('progress.pullUps')}:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.pull_ups}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.pull_ups, getPreviousValue('pull_ups'));
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
          
          {/* T2B */}
          {currentSession.t2b !== null && (
            <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
              <span className="text-gray-500">T2B:</span>
              <span className="font-semibold text-[#cb8954] text-right">{currentSession.t2b}</span>
              <div className="text-right">
                {(() => {
                  const change = calculateChange(currentSession.t2b, getPreviousValue('t2b'));
                  return change !== null ? (
                    <span className={`text-[10px] font-semibold ${
                      change > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {change > 0 ? '+' : ''}
                      {Math.round(change)}%
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            {t('progress.lastMeasurement')}: {format(new Date(currentSession.test_date), 'dd/MM/yy')}
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">{t('progress.history')}</div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{format(new Date(sessions[1].test_date), 'dd/MM/yy')}</span>
              <div className="flex gap-2">
                {sessions[1].push_ups !== null && <span>Push: {sessions[1].push_ups}</span>}
                {sessions[1].pull_ups !== null && <span>Pull: {sessions[1].pull_ups}</span>}
                {sessions[1].t2b !== null && <span>T2B: {sessions[1].t2b}</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
