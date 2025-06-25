
import React from 'react';
import { InstructionsProps } from './types';

export const Instructions: React.FC<InstructionsProps> = ({ totalRequiredDays }) => {
  return (
    <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded-none">
      <p className="font-medium">Οδηγίες:</p>
      <ul className="mt-1 space-y-1 text-xs">
        <li>💡 Κάντε κλικ σε μια ημερομηνία για επιλογή</li>
        <li>💡 Κάντε κλικ στο "X" για αποεπιλογή επιλεγμένης ημερομηνίας</li>
        <li>⚠️ Μπορείτε να επιλέξετε μέχρι {totalRequiredDays} ημερομηνίες συνολικά</li>
        <li>📅 Η σημερινή ημερομηνία εμφανίζεται με γκρι χρώμα</li>
      </ul>
    </div>
  );
};
