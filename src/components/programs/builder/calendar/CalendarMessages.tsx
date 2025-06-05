
import React from 'react';

interface CalendarMessagesProps {
  selectedDatesLength: number;
  totalDays: number;
  weekStructure: any[];
}

export const CalendarMessages: React.FC<CalendarMessagesProps> = ({
  selectedDatesLength,
  totalDays,
  weekStructure
}) => {
  return (
    <>
      {/* Warning if not enough dates */}
      {selectedDatesLength < totalDays && (
        <div className="text-orange-600 text-sm p-2 bg-orange-50 border border-orange-200 rounded-none">
          Προειδοποίηση: Χρειάζεστε {totalDays - selectedDatesLength} ακόμη ημερομηνίες για να καλύψετε όλες τις ημέρες προπόνησης.
        </div>
      )}

      {/* Success message when limit reached */}
      {selectedDatesLength === totalDays && (
        <div className="text-green-600 text-sm p-2 bg-green-50 border border-green-200 rounded-none">
          ✓ Έχετε επιλέξει όλες τις απαραίτητες ημερομηνίες προπόνησης!
        </div>
      )}

      {/* Week Structure Debug Info */}
      {weekStructure.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary>Δομή Εβδομάδων</summary>
          <pre className="mt-2 bg-gray-100 p-2 rounded">
            {JSON.stringify(weekStructure, null, 2)}
          </pre>
        </details>
      )}
    </>
  );
};
