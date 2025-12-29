import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface FarmerProgressCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

export const FarmerProgressCard: React.FC<FarmerProgressCardProps> = ({ 
  userId,
  useCoachTables = false,
  coachId 
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFarmerHistory();
    }
  }, [userId, useCoachTables, coachId]);

  const fetchFarmerHistory = async () => {
    try {
      let data: any[] = [];

      if (useCoachTables && coachId) {
        const { data: coachData, error } = await supabase
          .from('coach_endurance_test_sessions')
          .select(`
            id,
            test_date,
            coach_endurance_test_data (
              farmer_kg,
              farmer_meters,
              farmer_seconds
            )
          `)
          .eq('coach_id', coachId)
          .eq('coach_user_id', userId)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        // Transform and filter
        data = (coachData || [])
          .map(s => ({
            ...s,
            endurance_test_data: s.coach_endurance_test_data
          }))
          .filter(session => 
            session.endurance_test_data?.some((d: any) => d.farmer_kg !== null)
          );
      } else {
        const { data: regularData, error } = await supabase
          .from('endurance_test_sessions')
          .select(`
            id,
            test_date,
            endurance_test_data!endurance_test_data_test_session_id_fkey (
              farmer_kg,
              farmer_meters,
              farmer_seconds
            )
          `)
          .eq('user_id', userId)
          .not('endurance_test_data.farmer_kg', 'is', null)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        data = (regularData || []).filter(session => 
          session.endurance_test_data && session.endurance_test_data.length > 0
        );
      }

      setSessions(data);
    } catch (error) {
      console.error('Error fetching farmer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = (field: 'farmer_kg' | 'farmer_meters' | 'farmer_seconds') => {
    if (sessions.length === 0) return null;
    return sessions[0]?.endurance_test_data?.[0]?.[field];
  };

  const calculatePercentageChange = (field: 'farmer_kg' | 'farmer_meters' | 'farmer_seconds') => {
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
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('progress.farmer')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('progress.farmerWeight')}:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_kg')} kg</span>
              {calculatePercentageChange('farmer_kg') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_kg')! > 0 ? 'text-green-700' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_kg')! > 0 ? '+' : ''}
                  {Math.round(calculatePercentageChange('farmer_kg')!)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('progress.farmerMeters')}:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_meters')} m</span>
              {calculatePercentageChange('farmer_meters') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_meters')! > 0 ? 'text-green-700' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_meters')! > 0 ? '+' : ''}
                  {Math.round(calculatePercentageChange('farmer_meters')!)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('progress.farmerTime')}:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_seconds')} {t('progress.seconds')}</span>
              {calculatePercentageChange('farmer_seconds') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_seconds')! > 0 ? 'text-green-700' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_seconds')! > 0 ? '+' : ''}
                  {Math.round(calculatePercentageChange('farmer_seconds')!)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            {t('progress.lastMeasurement')}: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">{t('progress.history')}</div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{format(new Date(sessions[1].test_date), 'dd/MM/yy')}</span>
              <span>{sessions[1].endurance_test_data?.[0].farmer_kg}kg × {sessions[1].endurance_test_data?.[0].farmer_meters}m × {sessions[1].endurance_test_data?.[0].farmer_seconds}s</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
