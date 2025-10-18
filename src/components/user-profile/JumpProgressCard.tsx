import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface JumpProgressCardProps {
  userId: string;
}

export const JumpProgressCard: React.FC<JumpProgressCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchJumpHistory();
    }
  }, [userId]);

  const fetchJumpHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('jump_test_sessions')
        .select(`
          id,
          test_date,
          jump_test_data (
            id,
            cmj_height,
            sqj_height,
            dj_height,
            dj_contact_time,
            rsi,
            asymmetry_percentage
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;
      
      // Filter only sessions with jump data
      const jumpSessions = (data || [])
        .map(session => ({
          ...session,
          jump_test_data: (session.jump_test_data || [])
            .filter(jd => jd.cmj_height !== null || jd.sqj_height !== null || jd.dj_height !== null)
        }))
        .filter(session => session.jump_test_data.length > 0);

      // Flatten data with test dates
      const allData = jumpSessions.flatMap(session => 
        session.jump_test_data.map(jd => ({
          ...jd,
          test_date: session.test_date
        }))
      );

      // Get the two most recent entries
      const recentSessions = allData.slice(0, 2);
      
      // Calculate percentage changes if we have at least 2 entries
      const processedSessions = recentSessions.length >= 2 ? [{
        ...recentSessions[0],
        cmjChange: recentSessions[0].cmj_height && recentSessions[1].cmj_height
          ? ((recentSessions[0].cmj_height - recentSessions[1].cmj_height) / recentSessions[1].cmj_height) * 100
          : null,
        sqjChange: recentSessions[0].sqj_height && recentSessions[1].sqj_height
          ? ((recentSessions[0].sqj_height - recentSessions[1].sqj_height) / recentSessions[1].sqj_height) * 100
          : null,
        djChange: recentSessions[0].dj_height && recentSessions[1].dj_height
          ? ((recentSessions[0].dj_height - recentSessions[1].dj_height) / recentSessions[1].dj_height) * 100
          : null
      }] : recentSessions.slice(0, 1);
      
      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching jump data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jump Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-xs">Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Jump Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((data) => (
          <div key={data.id} className="space-y-1">
            {/* CMJ Height */}
            {data.cmj_height !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">CMJ:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.cmj_height} cm</span>
                <div className="text-right">
                  {data.cmjChange !== null && data.cmjChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.cmjChange > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {data.cmjChange > 0 ? '+' : ''}
                      {Math.round(data.cmjChange)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* SQJ Height */}
            {data.sqj_height !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">SQJ:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.sqj_height} cm</span>
                <div className="text-right">
                  {data.sqjChange !== null && data.sqjChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.sqjChange > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {data.sqjChange > 0 ? '+' : ''}
                      {Math.round(data.sqjChange)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* DJ Height */}
            {data.dj_height !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">DJ Height:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.dj_height} cm</span>
                <div className="text-right">
                  {data.djChange !== null && data.djChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.djChange > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {data.djChange > 0 ? '+' : ''}
                      {Math.round(data.djChange)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* DJ Contact Time */}
            {data.dj_contact_time !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">DJ Contact:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.dj_contact_time} ms</span>
                <div className="text-right"></div>
              </div>
            )}
            
            {/* RSI */}
            {data.rsi !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">RSI:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.rsi}</span>
                <div className="text-right"></div>
              </div>
            )}
            
            {/* Asymmetry */}
            {data.asymmetry_percentage !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Asymmetry:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.asymmetry_percentage}%</span>
                <div className="text-right"></div>
              </div>
            )}
          </div>
        ))}

        <div className="pt-1 border-t border-gray-200">
          <div className="text-[10px] text-gray-400 text-center">
            Τελευταία μέτρηση: {format(new Date(sessions[0].test_date), 'dd/MM/yy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
