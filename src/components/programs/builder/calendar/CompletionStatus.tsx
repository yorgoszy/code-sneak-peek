
import React from 'react';

interface CompletionStatusProps {
  selectedDatesCount: number;
  totalDaysRequired: number;
}

export const CompletionStatus: React.FC<CompletionStatusProps> = ({
  selectedDatesCount,
  totalDaysRequired
}) => {
  if (selectedDatesCount !== totalDaysRequired) return null;

  return (
    <div className="bg-green-50 p-3 rounded-none border border-green-200">
      <p className="text-sm text-green-800">
        ✅ Έχετε επιλέξει όλες τις απαραίτητες ημερομηνίες για την ανάθεση!
      </p>
    </div>
  );
};
