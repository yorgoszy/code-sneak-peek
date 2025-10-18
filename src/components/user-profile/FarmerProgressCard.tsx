import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface FarmerProgressCardProps {
  userId: string;
}

export const FarmerProgressCard: React.FC<FarmerProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFarmerHistory();
    }
  }, [userId]);

  const fetchFarmerHistory = async () => {
    try {
      const { data, error } = await supabase
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
        .limit(10);

      if (error) throw error;

      const filteredData = (data || []).filter(session => 
        session.endurance_test_data && session.endurance_test_data.length > 0
      );

      setSessions(filteredData);
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
        <CardTitle className="text-sm">Farmer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Βάρος:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_kg')} kg</span>
              {calculatePercentageChange('farmer_kg') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_kg')! > 0 ? 'text-[#00ffba]' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_kg')! > 0 ? '+' : ''}
                  {calculatePercentageChange('farmer_kg')!.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Μέτρα:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_meters')} m</span>
              {calculatePercentageChange('farmer_meters') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_meters')! > 0 ? 'text-[#00ffba]' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_meters')! > 0 ? '+' : ''}
                  {calculatePercentageChange('farmer_meters')!.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Χρόνος:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#cb8954]">{getLatestValue('farmer_seconds')} δευτ.</span>
              {calculatePercentageChange('farmer_seconds') !== null && (
                <span className={`text-[10px] font-semibold ${
                  calculatePercentageChange('farmer_seconds')! > 0 ? 'text-[#00ffba]' : 'text-red-500'
                }`}>
                  {calculatePercentageChange('farmer_seconds')! > 0 ? '+' : ''}
                  {calculatePercentageChange('farmer_seconds')!.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό ({sessions.length - 1} προηγούμενες)</div>
            {sessions.slice(1, 4).map((session, idx) => {
              const data = session.endurance_test_data?.[0];
              return (
                <div key={session.id} className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{format(new Date(session.test_date), 'dd/MM/yy')}</span>
                  <span>{data.farmer_kg}kg × {data.farmer_meters}m × {data.farmer_seconds}s</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
