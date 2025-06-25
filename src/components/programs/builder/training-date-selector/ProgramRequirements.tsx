
import React from 'react';
import { ProgramRequirementsProps } from './types';

export const ProgramRequirements: React.FC<ProgramRequirementsProps> = ({
  programWeeks,
  daysPerWeek,
  totalRequiredDays,
  weekStructure = []
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
      <h4 className="font-medium text-blue-800 mb-2">Απαιτήσεις Προγράμματος</h4>
      <div className="space-y-2 text-sm">
        <p><strong>Εβδομάδες:</strong> {programWeeks}</p>
        
        {weekStructure.length > 0 ? (
          <div>
            <p><strong>Δομή Εβδομάδων:</strong></p>
            <div className="ml-2 space-y-1">
              {weekStructure.map((week, index) => (
                <p key={index} className="text-xs">
                  Εβδομάδα {week.weekNumber}: {week.daysInWeek} ημέρες
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p><strong>Ημέρες ανά εβδομάδα:</strong> {daysPerWeek}</p>
        )}
        
        <p><strong>Συνολικές ημέρες:</strong> {totalRequiredDays}</p>
        
        {weekStructure.length > 0 ? (
          <p className="text-lg font-bold text-blue-700">
            Προσαρμοσμένη δομή: {totalRequiredDays} ημέρες σε {programWeeks} εβδομάδες
          </p>
        ) : (
          <p className="text-lg font-bold text-blue-700">
            {daysPerWeek}days/{programWeeks}weeks
          </p>
        )}
      </div>
    </div>
  );
};
