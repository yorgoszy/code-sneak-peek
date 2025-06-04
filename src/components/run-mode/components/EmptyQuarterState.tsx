
import React from 'react';
import { User } from 'lucide-react';

export const EmptyQuarterState: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-gray-400">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Επιλέξτε αθλητή για να δείτε το ημερολόγιο</p>
      </div>
    </div>
  );
};
