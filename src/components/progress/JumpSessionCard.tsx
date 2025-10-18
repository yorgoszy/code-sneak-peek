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
};

interface JumpSessionCardProps {
  session: JumpSessionCardSession;
  userName?: string;
  showDelete?: boolean;
  onDelete?: () => void;
  percentageChange?: number | null;
}

export const JumpSessionCard: React.FC<JumpSessionCardProps> = ({ session, userName, showDelete = false, onDelete, percentageChange }) => {
  const jumpData = session.jump_test_data?.[0];

  return (
    <Card key={session.id} className="rounded-none w-[200px]">
      <CardHeader className="pb-1 pt-2 px-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {userName && (
              <CardTitle className="text-xs">{userName}</CardTitle>
            )}

            {session.notes && (
              <>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {session.notes.split(' - ')[0]}
                </p>
                {session.notes.includes(' - ') && (
                  <p className="text-2xl font-bold text-[#cb8954] mt-1">
                    {session.notes.split(' - ')[1]}
                  </p>
                )}
              </>
            )}

            <p className="text-[10px] text-gray-500 mt-0.5">
              {format(new Date(session.test_date), 'dd/MM/yyyy')}
            </p>
          </div>

          {showDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="rounded-none h-5 w-5 p-0 hover:bg-red-100"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 pt-1">
        {jumpData && (
          <div className="space-y-0.5">
            {jumpData.non_counter_movement_jump !== null && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Non-CMJ:</span>
                <span className="font-semibold text-[#cb8954]">
                  {jumpData.non_counter_movement_jump}
                  <span className="text-[9px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.counter_movement_jump !== null && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">CMJ:</span>
                <span className="font-semibold text-[#cb8954]">
                  {jumpData.counter_movement_jump}
                  <span className="text-[9px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.depth_jump !== null && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Depth Jump:</span>
                <span className="font-semibold text-[#cb8954]">
                  {jumpData.depth_jump}
                  <span className="text-[9px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {jumpData.broad_jump !== null && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Broad Jump:</span>
                <span className="font-semibold text-[#cb8954]">
                  {jumpData.broad_jump}
                  <span className="text-[9px] ml-0.5">cm</span>
                </span>
              </div>
            )}
            {(jumpData.triple_jump_left !== null || jumpData.triple_jump_right !== null) && (
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-500">Triple Jump:</span>
                <div className="flex gap-2">
                  {jumpData.triple_jump_left !== null && (
                    <span className="font-semibold text-[#cb8954]">
                      L: {jumpData.triple_jump_left}<span className="text-[8px] ml-0.5">cm</span>
                    </span>
                  )}
                  {jumpData.triple_jump_right !== null && (
                    <span className="font-semibold text-[#cb8954]">
                      R: {jumpData.triple_jump_right}<span className="text-[8px] ml-0.5">cm</span>
                    </span>
                  )}
                </div>
              </div>
            )}
      </div>
    )}
    
    {percentageChange !== null && percentageChange !== undefined && (
      <div className="mt-1 flex justify-end">
        <span className={`text-sm font-semibold ${percentageChange >= 0 ? 'text-[#00ffba]' : 'text-red-600'}`}>
          {percentageChange >= 0 ? '+' : ''}{Math.round(percentageChange)}%
        </span>
      </div>
    )}
  </CardContent>
    </Card>
  );
};