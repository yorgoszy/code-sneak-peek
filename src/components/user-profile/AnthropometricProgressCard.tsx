import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AnthropometricProgressCardProps {
  userId: string;
}

export const AnthropometricProgressCard: React.FC<AnthropometricProgressCardProps> = ({ userId }) => {
  const [latestData, setLatestData] = useState<any>(null);
  const [previousData, setPreviousData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnthropometricData();
  }, [userId]);

  const fetchAnthropometricData = async () => {
    try {
      // Get all sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (sessionError) throw sessionError;
      if (!sessions || sessions.length === 0) {
        setLoading(false);
        return;
      }

      // Find the latest session with actual data
      let latestSessionWithData = null;
      let previousSessionWithData = null;

      for (const session of sessions) {
        const { data: anthroData } = await supabase
          .from('anthropometric_test_data')
          .select('*')
          .eq('test_session_id', session.id)
          .maybeSingle();

        if (anthroData) {
          if (!latestSessionWithData) {
            latestSessionWithData = {
              ...anthroData,
              test_date: session.test_date,
              session_id: session.id
            };
          } else if (!previousSessionWithData) {
            previousSessionWithData = {
              ...anthroData,
              test_date: session.test_date
            };
            break; // We found both, no need to continue
          }
        }
      }

      setLatestData(latestSessionWithData);
      setPreviousData(previousSessionWithData);
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

  if (loading) {
    return (
      <Card className="rounded-none border border-gray-200 w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  if (!latestData) {
    return null;
  }

  return (
    <Card className="rounded-none border border-gray-200 w-full max-w-2xl">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium">Σωματομετρικά</CardTitle>
          <div className="text-[9px] text-gray-400">
            {format(new Date(latestData.test_date), 'dd/MM/yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {latestData.height && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Ύψος</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1 flex-wrap">
                {latestData.height}<span className="text-[9px] text-gray-400 ml-0.5">cm</span>
                {previousData?.height && calculatePercentageChange(latestData.height, previousData.height) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.height, previousData.height)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.height, previousData.height)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.height, previousData.height)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.weight && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Βάρος</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.weight}<span className="text-[9px] text-gray-400 ml-0.5">kg</span>
                {previousData?.weight && calculatePercentageChange(latestData.weight, previousData.weight) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.weight, previousData.weight)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.weight, previousData.weight)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.weight, previousData.weight)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.body_fat_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Λίπος</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.body_fat_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                {previousData?.body_fat_percentage && calculatePercentageChange(latestData.body_fat_percentage, previousData.body_fat_percentage) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.body_fat_percentage, previousData.body_fat_percentage)! > 0 
                      ? 'text-red-600' 
                      : 'text-green-700'
                  }`}>
                    {calculatePercentageChange(latestData.body_fat_percentage, previousData.body_fat_percentage)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.body_fat_percentage, previousData.body_fat_percentage)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {latestData.muscle_mass_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Μυϊκή Μάζα</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {latestData.muscle_mass_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                {previousData?.muscle_mass_percentage && calculatePercentageChange(latestData.muscle_mass_percentage, previousData.muscle_mass_percentage) !== null && (
                  <span className={`text-[9px] font-semibold ${
                    calculatePercentageChange(latestData.muscle_mass_percentage, previousData.muscle_mass_percentage)! > 0 
                      ? 'text-green-700' 
                      : 'text-red-600'
                  }`}>
                    {calculatePercentageChange(latestData.muscle_mass_percentage, previousData.muscle_mass_percentage)! > 0 ? '+' : ''}
                    {calculatePercentageChange(latestData.muscle_mass_percentage, previousData.muscle_mass_percentage)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {previousData && (
          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="text-[9px] text-gray-400">
              Ιστορικό (1 προηγούμενες)
            </div>
            <div className="text-[9px] text-gray-400">
              {format(new Date(previousData.test_date), 'dd/MM/yy')}
              {previousData.height && ` Ύψος:${previousData.height}cm`}
              {previousData.weight && ` Βάρος:${previousData.weight}kg`}
              {previousData.body_fat_percentage && ` Λίπος:${previousData.body_fat_percentage}%`}
              {previousData.muscle_mass_percentage && ` Μυϊκή:${previousData.muscle_mass_percentage}%`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
