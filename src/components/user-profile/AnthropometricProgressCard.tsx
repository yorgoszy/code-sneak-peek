import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AnthropometricProgressCardProps {
  userId: string;
}

export const AnthropometricProgressCard: React.FC<AnthropometricProgressCardProps> = ({ userId }) => {
  const [latestData, setLatestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestAnthropometric();
  }, [userId]);

  const fetchLatestAnthropometric = async () => {
    try {
      // Get latest session
      const { data: session, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!session) {
        setLoading(false);
        return;
      }

      // Get anthropometric data for this session
      const { data: anthroData, error: anthroError } = await supabase
        .from('anthropometric_test_data')
        .select('*')
        .eq('test_session_id', session.id)
        .maybeSingle();

      if (anthroError) throw anthroError;

      setLatestData({
        ...anthroData,
        test_date: session.test_date
      });
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
              <div className="text-sm font-bold text-gray-900">
                {latestData.height}<span className="text-[9px] text-gray-400 ml-0.5">cm</span>
              </div>
            </div>
          )}
          
          {latestData.weight && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Βάρος</div>
              <div className="text-sm font-bold text-gray-900">
                {latestData.weight}<span className="text-[9px] text-gray-400 ml-0.5">kg</span>
              </div>
            </div>
          )}
          
          {latestData.body_fat_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Λίπος</div>
              <div className="text-sm font-bold text-gray-900">
                {latestData.body_fat_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
              </div>
            </div>
          )}
          
          {latestData.muscle_mass_percentage && (
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-500">Μυϊκή Μάζα</div>
              <div className="text-sm font-bold text-gray-900">
                {latestData.muscle_mass_percentage}<span className="text-[9px] text-gray-400 ml-0.5">%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
