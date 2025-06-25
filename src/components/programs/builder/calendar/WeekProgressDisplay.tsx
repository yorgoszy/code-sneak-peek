
import React from 'react';
import { CheckCircle2, AlertCircle } from "lucide-react";

interface WeekProgress {
  weekIndex: number;
  weekName: string;
  selected: number;
  required: number;
  completed: boolean;
}

interface WeekProgressDisplayProps {
  weekProgress: WeekProgress[];
}

export const WeekProgressDisplay: React.FC<WeekProgressDisplayProps> = ({
  weekProgress
}) => {
  if (weekProgress.length === 0) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-none border border-blue-200">
      <h4 className="text-sm font-medium text-blue-800 mb-3">Πρόοδος Επιλογής:</h4>
      <div className="space-y-2">
        {weekProgress.map((week) => (
          <div key={week.weekIndex} className="flex items-center justify-between text-sm">
            <span className="text-blue-700">{week.weekName}:</span>
            <div className="flex items-center gap-2">
              <span className={`${week.completed ? 'text-green-600' : week.selected > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                {week.selected}/{week.required} προπονήσεις
              </span>
              {week.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : week.selected > 0 ? (
                <AlertCircle className="w-4 h-4 text-orange-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
