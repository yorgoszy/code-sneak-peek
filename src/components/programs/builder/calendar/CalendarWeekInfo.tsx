
import React from 'react';

interface WeekInfo {
  weekNumber: number;
  remainingDays: number;
  totalDaysInWeek: number;
  selectedInWeek: number;
}

interface CalendarWeekInfoProps {
  weekInfo: WeekInfo | null;
  weekStructureLength: number;
}

export const CalendarWeekInfo: React.FC<CalendarWeekInfoProps> = ({
  weekInfo,
  weekStructureLength
}) => {
  if (!weekInfo || weekStructureLength === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-none p-3">
      <h4 className="font-medium text-blue-800 mb-1">
        Εβδομάδα {weekInfo.weekNumber}
      </h4>
      <p className="text-sm text-blue-700">
        Επιλεγμένες: {weekInfo.selectedInWeek} / {weekInfo.totalDaysInWeek} ημέρες
      </p>
      {weekInfo.remainingDays > 0 && (
        <p className="text-xs text-blue-600 mt-1">
          Απομένουν {weekInfo.remainingDays} ημέρες για αυτή την εβδομάδα
        </p>
      )}
    </div>
  );
};
