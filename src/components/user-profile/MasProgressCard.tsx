import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface MasProgressCardProps {
  userId: string;
}

export const MasProgressCard: React.FC<MasProgressCardProps> = ({ userId }) => {
  const [latestMas, setLatestMas] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchLatestMas();
    }
  }, [userId]);

  const fetchLatestMas = async () => {
    try {
      const { data, error } = await supabase
        .from('endurance_test_data')
        .select(`
          id,
          mas_meters,
          mas_minutes,
          mas_ms,
          mas_kmh,
          test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('test_sessions.user_id', userId)
        .not('mas_ms', 'is', null)
        .order('test_sessions(test_date)', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLatestMas(data);
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
          <CardTitle className="text-sm">MAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  if (!latestMas) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">MAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Δεν υπάρχουν δεδομένα</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">MAS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-gray-200 rounded-none p-2">
            <div className="text-[10px] text-gray-500 mb-1">Απόσταση</div>
            <div className="text-base font-bold text-gray-900">
              {latestMas.mas_meters}<span className="text-[9px] text-gray-500 ml-0.5">m</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-none p-2">
            <div className="text-[10px] text-gray-500 mb-1">Διάρκεια</div>
            <div className="text-base font-bold text-gray-900">
              {latestMas.mas_minutes}<span className="text-[9px] text-gray-500 ml-0.5">min</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-none p-2">
            <div className="text-[10px] text-gray-500 mb-1">MAS</div>
            <div className="text-base font-bold text-[#00ffba]">
              {latestMas.mas_ms?.toFixed(2)}<span className="text-[9px] text-gray-500 ml-0.5">m/s</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-none p-2">
            <div className="text-[10px] text-gray-500 mb-1">MAS</div>
            <div className="text-base font-bold text-[#00ffba]">
              {latestMas.mas_kmh?.toFixed(2)}<span className="text-[9px] text-gray-500 ml-0.5">km/h</span>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-gray-400 text-center">
          {new Date(latestMas.test_sessions.test_date).toLocaleDateString('el-GR')}
        </div>
      </CardContent>
    </Card>
  );
};