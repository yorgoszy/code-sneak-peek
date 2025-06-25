
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
        <p><strong>Μέσες ημέρες ανά εβδομάδα:</strong> {daysPerWeek}</p>
        <p><strong>Συνολικές ημέρες:</strong> {totalRequiredDays}</p>
        
        {weekStructure.length > 0 && (
          <div className="mt-3 pt-2 border-t border-blue-300">
            <p className="font-medium text-blue-800 mb-1">Δομή εβδομάδων:</p>
            {weekStructure.map((week, index) => (
              <div key={week.id} className="text-xs text-blue-700">
                <span>Εβδομάδα {week.week_number}: </span>
                <span className="font-medium">{week.program_days?.length || 0} ημέρες</span>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-lg font-bold text-blue-700 mt-2">
          {totalRequiredDays} συνολικές προπονήσεις
        </p>
      </div>
    </div>
  );
};
