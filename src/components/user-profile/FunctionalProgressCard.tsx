import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity } from "lucide-react";

interface FunctionalProgressCardProps {
  userId: string;
}

export const FunctionalProgressCard: React.FC<FunctionalProgressCardProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestFunctionalTest();
  }, [userId]);

  const fetchLatestFunctionalTest = async () => {
    if (!userId) return;
    
    try {
      // Fetch the latest functional test session for this user
      const { data: session, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .select('id, test_date')
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError || !session) {
        setLoading(false);
        return;
      }

      // Fetch the functional test data
      const { data: funcData, error: dataError } = await supabase
        .from('functional_test_data')
        .select('*')
        .eq('test_session_id', session.id)
        .maybeSingle();

      if (!dataError && funcData) {
        setData({ ...funcData, test_date: session.test_date });
      }
    } catch (error) {
      console.error('Error fetching functional test:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-2">
          <p className="text-xs text-muted-foreground text-center">Φόρτωση...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const fmsScores = data.fms_detailed_scores as Record<string, number> | null;
  const hasIssues = (data.posture_issues?.length > 0) || 
                    (data.squat_issues?.length > 0) || 
                    (data.single_leg_squat_issues?.length > 0);

  return (
    <Card className="rounded-none">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-xs flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Λειτουργικά
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {format(new Date(data.test_date), 'dd/MM/yy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 space-y-2">
        {/* FMS Score */}
        {data.fms_score !== undefined && data.fms_score !== null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">FMS Score</span>
            <Badge 
              variant="outline" 
              className={`rounded-none text-[10px] ${data.fms_score < 14 ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}
            >
              {data.fms_score}
            </Badge>
          </div>
        )}

        {/* FMS Detailed Scores */}
        {fmsScores && Object.keys(fmsScores).length > 0 && (
          <div>
            <p className="text-[9px] text-muted-foreground mb-1">FMS Tests:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(fmsScores).map(([exercise, score]) => (
                <Badge 
                  key={exercise} 
                  variant="secondary" 
                  className={`rounded-none text-[8px] ${score <= 1 ? 'bg-red-100 text-red-700' : ''}`}
                >
                  {exercise}: {score}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Issues Summary */}
        {hasIssues && (
          <div className="space-y-1">
            {/* Posture Issues */}
            {data.posture_issues && data.posture_issues.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Στάση:</p>
                <div className="flex flex-wrap gap-1">
                  {data.posture_issues.map((issue: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none text-[8px] border-orange-400 text-orange-600">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Squat Issues */}
            {data.squat_issues && data.squat_issues.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Κάθισμα:</p>
                <div className="flex flex-wrap gap-1">
                  {data.squat_issues.map((issue: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none text-[8px] border-orange-400 text-orange-600">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Single Leg Squat Issues */}
            {data.single_leg_squat_issues && data.single_leg_squat_issues.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Μονοποδικό:</p>
                <div className="flex flex-wrap gap-1">
                  {data.single_leg_squat_issues.map((issue: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none text-[8px] border-orange-400 text-orange-600">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Muscles to stretch/strengthen */}
        {(data.muscles_need_stretching?.length > 0 || data.muscles_need_strengthening?.length > 0) && (
          <div className="space-y-1 pt-1 border-t border-border">
            {data.muscles_need_stretching?.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Διάταση:</p>
                <div className="flex flex-wrap gap-1">
                  {data.muscles_need_stretching.map((muscle: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none text-[8px] border-blue-400 text-blue-600">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.muscles_need_strengthening?.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Ενδυνάμωση:</p>
                <div className="flex flex-wrap gap-1">
                  {data.muscles_need_strengthening.map((muscle: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none text-[8px] border-green-400 text-green-600">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
