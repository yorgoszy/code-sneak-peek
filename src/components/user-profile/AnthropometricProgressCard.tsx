import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AnthropometricProgressCardProps {
  userId: string;
}

interface AnthroData {
  height?: number;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass_percentage?: number;
  test_date: string;
}

export const AnthropometricProgressCard: React.FC<AnthropometricProgressCardProps> = ({ userId }) => {
  const [latestData, setLatestData] = useState<AnthroData | null>(null);
  const [previousData, setPreviousData] = useState<AnthroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestAnthropometric();
  }, [userId]);

  const calculatePercentageChange = (current: number | undefined, previous: number | undefined): number | null => {
    if (!current || !previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change); // Στρογγυλοποίηση χωρίς δεκαδικά
  };

  const fetchLatestAnthropometric = async () => {
    try {
      // Get latest 2 sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(2);

      if (sessionError) throw sessionError;
      if (!sessions || sessions.length === 0) {
        setLoading(false);
        return;
      }

      // Get latest session data
      const { data: latestAnthroData, error: latestError } = await supabase
        .from('anthropometric_test_data')
        .select('*')
        .eq('test_session_id', sessions[0].id)
        .maybeSingle();

      if (latestError) throw latestError;

      if (latestAnthroData) {
        setLatestData({
          ...latestAnthroData,
          test_date: sessions[0].test_date
        });
      }

      // Get previous session data if exists
      if (sessions.length > 1) {
        const { data: previousAnthroData, error: previousError } = await supabase
          .from('anthropometric_test_data')
          .select('*')
          .eq('test_session_id', sessions[1].id)
          .maybeSingle();

        if (previousError) throw previousError;

        if (previousAnthroData) {
          setPreviousData({
            ...previousAnthroData,
            test_date: sessions[1].test_date
          });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching anthropometric data:', error);
      setLoading(false);
    }
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {latestData.height && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Ύψος</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-gray-900">
                  {latestData.height}<span className="text-[9px] text-gray-400 ml-0.5">cm</span>
                </span>
                {(() => {
                  const change = calculatePercentageChange(latestData.height, previousData?.height);
                  if (change !== null) {
                    return (
                      <span className={`text-[10px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          
          {latestData.weight && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Βάρος</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-gray-900">
                  {latestData.weight}<span className="text-[9px] text-gray-400 ml-0.5">kg</span>
                </span>
                {(() => {
                  const change = calculatePercentageChange(latestData.weight, previousData?.weight);
                  if (change !== null) {
                    return (
                      <span className={`text-[10px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          
          {latestData.body_fat_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Λίπος</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-gray-900">
                  {latestData.body_fat_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                </span>
                {(() => {
                  const change = calculatePercentageChange(latestData.body_fat_percentage, previousData?.body_fat_percentage);
                  if (change !== null) {
                    return (
                      <span className={`text-[10px] font-medium ${change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          
          {latestData.muscle_mass_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Μυϊκή Μάζα</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-gray-900">
                  {latestData.muscle_mass_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
                </span>
                {(() => {
                  const change = calculatePercentageChange(latestData.muscle_mass_percentage, previousData?.muscle_mass_percentage);
                  if (change !== null) {
                    return (
                      <span className={`text-[10px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
