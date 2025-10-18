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
          notes,
          jump_test_data (
            id,
            non_counter_movement_jump,
            counter_movement_jump,
            depth_jump,
            broad_jump,
            triple_jump_left,
            triple_jump_right
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
            .filter(jd => jd.non_counter_movement_jump !== null || jd.counter_movement_jump !== null || jd.depth_jump !== null)
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
        nonCmjChange: recentSessions[0].non_counter_movement_jump && recentSessions[1].non_counter_movement_jump
          ? ((recentSessions[0].non_counter_movement_jump - recentSessions[1].non_counter_movement_jump) / recentSessions[1].non_counter_movement_jump) * 100
          : null,
        cmjChange: recentSessions[0].counter_movement_jump && recentSessions[1].counter_movement_jump
          ? ((recentSessions[0].counter_movement_jump - recentSessions[1].counter_movement_jump) / recentSessions[1].counter_movement_jump) * 100
          : null,
        djChange: recentSessions[0].depth_jump && recentSessions[1].depth_jump
          ? ((recentSessions[0].depth_jump - recentSessions[1].depth_jump) / recentSessions[1].depth_jump) * 100
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
        <div>
          <CardTitle className="text-sm">Jump Profile</CardTitle>
          {sessions[0]?.notes && (
            <>
              <p className="text-[10px] text-gray-600 mt-1">
                {sessions[0].notes.split(' - ')[0]}
              </p>
              {sessions[0].notes.includes(' - ') && (
                <p className="text-2xl font-bold text-[#cb8954] mt-1">
                  {sessions[0].notes.split(' - ')[1]}
                </p>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((data) => (
          <div key={data.id} className="space-y-1">
            {/* Non-CMJ */}
            {data.non_counter_movement_jump !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Non-CMJ:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.non_counter_movement_jump} cm</span>
                <div className="text-right">
                  {data.nonCmjChange !== null && data.nonCmjChange !== undefined && (
                    <span className={`text-[10px] font-semibold ${
                      data.nonCmjChange > 0 ? 'text-green-700' : 'text-red-500'
                    }`}>
                      {data.nonCmjChange > 0 ? '+' : ''}
                      {Math.round(data.nonCmjChange)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* CMJ */}
            {data.counter_movement_jump !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">CMJ:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.counter_movement_jump} cm</span>
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
            
            {/* Depth Jump */}
            {data.depth_jump !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Depth Jump:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.depth_jump} cm</span>
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
            
            {/* Broad Jump */}
            {data.broad_jump !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Broad Jump:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.broad_jump} cm</span>
                <div className="text-right"></div>
              </div>
            )}
            
            {/* Triple Jump Left */}
            {data.triple_jump_left !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Triple Jump L:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.triple_jump_left} cm</span>
                <div className="text-right"></div>
              </div>
            )}
            
            {/* Triple Jump Right */}
            {data.triple_jump_right !== null && (
              <div className="grid grid-cols-[1fr_40px_50px] gap-2 items-center text-xs">
                <span className="text-gray-500">Triple Jump R:</span>
                <span className="font-semibold text-[#cb8954] text-right">{data.triple_jump_right} cm</span>
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
