import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";

interface CompetitionDaySelectorProps {
  isCompetitionDay: boolean;
  onCompetitionDayChange: (isCompetitionDay: boolean) => void;
}

export const CompetitionDaySelector: React.FC<CompetitionDaySelectorProps> = ({
  isCompetitionDay,
  onCompetitionDayChange
}) => {
  return (
    <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-600" />
          <Label htmlFor="competition-day-switch" className="text-sm font-semibold text-purple-900">
            Ημέρα Αγώνα
          </Label>
        </div>
        <Switch
          id="competition-day-switch"
          checked={isCompetitionDay}
          onCheckedChange={onCompetitionDayChange}
        />
      </div>
    </div>
  );
};
