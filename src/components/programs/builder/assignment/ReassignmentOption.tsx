
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface ReassignmentOptionProps {
  isVisible: boolean;
  completedDatesCount: number;
  isReassignment: boolean;
  onReassignmentToggle: (checked: boolean) => void;
}

export const ReassignmentOption: React.FC<ReassignmentOptionProps> = ({
  isVisible,
  completedDatesCount,
  isReassignment,
  onReassignmentToggle
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-none p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-2">Επανα-ανάθεση Προγράμματος</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Υπάρχουν {completedDatesCount} ολοκληρωμένες προπονήσεις. Μπορείτε να κάνετε επανα-ανάθεση για να διαγράψετε τον τρέχοντα προγραμματισμό και να ξεκινήσετε από την αρχή.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="reassignment"
              checked={isReassignment}
              onCheckedChange={onReassignmentToggle}
            />
            <label htmlFor="reassignment" className="text-sm font-medium text-yellow-800">
              Επανα-ανάθεση (διαγραφή όλου του προγραμματισμού)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
