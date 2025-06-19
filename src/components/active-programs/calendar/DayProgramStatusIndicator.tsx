
import React from 'react';

interface DayProgramStatusIndicatorProps {
  statusLoading: boolean;
}

export const DayProgramStatusIndicator: React.FC<DayProgramStatusIndicatorProps> = ({
  statusLoading
}) => {
  if (!statusLoading) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-none px-2 md:px-4 py-1 md:py-2 mb-1 md:mb-2 text-center text-xs">
      Ενημέρωση κατάστασης...
    </div>
  );
};
