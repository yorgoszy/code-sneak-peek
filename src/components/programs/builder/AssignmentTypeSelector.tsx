
import React from 'react';
import { User, Users } from "lucide-react";

interface AssignmentTypeSelectorProps {
  assignmentMode: 'individual' | 'group';
  onAssignmentModeChange: (mode: 'individual' | 'group') => void;
}

export const AssignmentTypeSelector: React.FC<AssignmentTypeSelectorProps> = ({
  assignmentMode,
  onAssignmentModeChange
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Τύπος Ανάθεσης</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAssignmentModeChange('individual')}
          className={`px-3 py-2 text-sm rounded-none border transition-colors ${
            assignmentMode === 'individual'
              ? 'bg-[#00ffba] text-black border-[#00ffba]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Ατομική
        </button>
        <button
          type="button"
          onClick={() => onAssignmentModeChange('group')}
          className={`px-3 py-2 text-sm rounded-none border transition-colors ${
            assignmentMode === 'group'
              ? 'bg-[#00ffba] text-black border-[#00ffba]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Ομαδική
        </button>
      </div>
    </div>
  );
};
