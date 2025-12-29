import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

type JumpData = {
  id: string;
  non_counter_movement_jump: number | null;
  counter_movement_jump: number | null;
  depth_jump: number | null;
  broad_jump: number | null;
  triple_jump_left: number | null;
  triple_jump_right: number | null;
};

export type JumpSessionCardSession = {
  id: string;
  user_id?: string;
  test_date: string;
  notes: string | null;
  jump_test_data?: JumpData[];
  coach_jump_test_data?: JumpData[];
};

interface JumpSessionCardProps {
  session: JumpSessionCardSession;
  userName?: string;
  showDelete?: boolean;
  onDelete?: () => void;
  percentageChange?: number | null;
  previousSession?: JumpSessionCardSession | null;
  historySessions?: JumpSessionCardSession[];
  useCoachTables?: boolean;
}

export const JumpSessionCard: React.FC<JumpSessionCardProps> = ({ session, userName, showDelete = false, onDelete, percentageChange, previousSession, historySessions, useCoachTables = false }) => {
  const jumpData = useCoachTables 
    ? session.coach_jump_test_data?.[0] 
    : session.jump_test_data?.[0];

  return (
    <Card key={session.id} className="rounded-none w-full flex flex-col">
      <CardHeader className="pb-1 pt-2 px-1.5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {userName && (
              <CardTitle className="text-xs">{userName}</CardTitle>
            )}

                {session.notes && (
                  <>
                    <p className="text-[11px] font-bold text-gray-700 mt-0.5 truncate">
                      {session.notes.split(' - ')[0]}
                    </p>
                    {session.notes.includes(' - ') && (
                      <>
                        {session.notes.includes('L:') && session.notes.includes('R:') ? (
                          <div className="mt-0.5 space-y-0.5">
                            <p className="text-base font-bold text-blue-600">
                              L: {session.notes.split('L:')[1].split('R:')[0].trim()}
                            </p>
                            <p className="text-base font-bold text-blue-600">
                              R: {session.notes.split('R:')[1].trim()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-base font-bold text-blue-600 mt-0.5">
                            {session.notes.split(' - ')[1]}
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

          </div>

          {showDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="rounded-none h-4 w-4 p-0 hover:bg-red-100"
            >
              <Trash2 className="w-2.5 h-2.5 text-red-600" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-1.5 pt-1 flex flex-col flex-1">
        {jumpData && (
          <div className="space-y-0.5">
            {jumpData.non_counter_movement_jump !== null && (
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-500">Non-CMJ:</span>
                <span className="font-semibold text-blue-600">
                  {jumpData.non_counter_movement_jump}
                  <span className="text-[8px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.counter_movement_jump !== null && (
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-500">CMJ:</span>
                <span className="font-semibold text-blue-600">
                  {jumpData.counter_movement_jump}
                  <span className="text-[8px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.depth_jump !== null && (
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-500">Depth:</span>
                <span className="font-semibold text-blue-600">
                  {jumpData.depth_jump}
                  <span className="text-[8px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.broad_jump !== null && (
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-500">Broad:</span>
                <span className="font-semibold text-blue-600">
                  {jumpData.broad_jump}
                  <span className="text-[8px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {(jumpData.triple_jump_left !== null || jumpData.triple_jump_right !== null) && (
              <div className="space-y-1">
                {jumpData.triple_jump_left !== null && (
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-gray-500">L:</span>
                  <span className="font-semibold text-blue-600">
                    {jumpData.triple_jump_left}
                    <span className="text-[8px] ml-0.5">cm</span>
                  </span>
                </div>
                )}
                {jumpData.triple_jump_right !== null && (
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-gray-500">R:</span>
                  <span className="font-semibold text-blue-600">
                    {jumpData.triple_jump_right}
                    <span className="text-[8px] ml-0.5">cm</span>
                  </span>
                </div>
                )}
              </div>
            )}
      </div>
    )}
    
    {percentageChange !== null && percentageChange !== undefined && (
      <div className="mt-1 flex justify-end">
        <span className={`text-xs font-semibold ${percentageChange >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {percentageChange >= 0 ? '+' : ''}{Math.round(percentageChange)}%
        </span>
      </div>
    )}

    <div className="pt-1 border-t border-gray-200 mt-auto">
      <div className="text-[10px] text-gray-400 text-center">
        {format(new Date(session.test_date), 'dd/MM/yy')}
      </div>
    </div>

    {/* History section - similar to Cardiac Data card */}
    {historySessions && historySessions.length > 0 && (
      <div className="space-y-1 pt-1 border-t border-gray-200">
        <div className="text-[10px] text-gray-500 font-medium">Ιστορικό</div>
        {historySessions.map((historySession, idx) => {
          const isTripleJump = historySession.notes?.includes('Triple Jump Test') && 
                                historySession.notes?.includes('L:') && 
                                historySession.notes?.includes('R:');
          
          if (isTripleJump) {
            // Extract L and R values from notes
            const lMatch = historySession.notes?.match(/L:\s*(\d+(?:\.\d+)?)/);
            const rMatch = historySession.notes?.match(/R:\s*(\d+(?:\.\d+)?)/);
            const lValue = lMatch ? lMatch[1] : '';
            const rValue = rMatch ? rMatch[1] : '';
            
            return (
              <div key={idx} className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{format(new Date(historySession.test_date), 'dd/MM/yy')}</span>
                <div className="flex flex-col gap-0.5 text-right">
                  <div>L: {lValue}cm</div>
                  <div>R: {rValue}cm</div>
                </div>
              </div>
            );
          }
          
          return (
            <div key={idx} className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{format(new Date(historySession.test_date), 'dd/MM/yy')}</span>
              <span>{historySession.notes?.split(' - ')[1] || ''}</span>
            </div>
          );
        })}
      </div>
    )}
  </CardContent>
    </Card>
  );
};