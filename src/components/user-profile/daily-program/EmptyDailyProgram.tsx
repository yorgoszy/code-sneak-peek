
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

export const EmptyDailyProgram: React.FC = () => {
  const today = new Date();

  return (
    <div className="text-center p-8">
      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Δεν υπάρχει πρόγραμμα για σήμερα
      </h3>
      <p className="text-gray-600">
        Δεν έχει προγραμματιστεί προπόνηση για την ημερομηνία {format(today, 'dd/MM/yyyy')}
      </p>
    </div>
  );
};
