
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

export const DailyProgramHeader: React.FC = () => {
  const today = new Date();

  return (
    <div className="flex items-center space-x-3 mb-6">
      <Calendar className="h-6 w-6 text-blue-600" />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Πρόγραμμα για σήμερα
        </h2>
        <p className="text-xs text-gray-600">
          {format(today, 'dd/MM/yy')}
        </p>
      </div>
    </div>
  );
};
