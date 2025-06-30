
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Edit, Save } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface EditableProgramDialogHeaderProps {
  programData: any;
  assignment: EnrichedAssignment;
  editMode: boolean;
  isEditing: boolean;
  onToggleEditing: () => void;
  onSaveChanges: () => void;
}

export const EditableProgramDialogHeader: React.FC<EditableProgramDialogHeaderProps> = ({
  programData,
  assignment,
  editMode,
  isEditing,
  onToggleEditing,
  onSaveChanges
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 p-6 rounded-t-none">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>{programData.name}</span>
            {!editMode && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-none px-3 py-1">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 italic">
                  Κάνε διπλό κλικ στην ημέρα που θέλεις να προπονηθείς
                </span>
              </div>
            )}
            {editMode && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={onToggleEditing}
                  variant={isEditing ? "destructive" : "outline"}
                  size="sm"
                  className="rounded-none"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Άκυρο' : 'Επεξεργασία'}
                </Button>
                {isEditing && (
                  <Button
                    onClick={onSaveChanges}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Αποθήκευση
                  </Button>
                )}
              </div>
            )}
          </div>
          <Badge variant="outline" className="rounded-none">
            {assignment.status}
          </Badge>
        </DialogTitle>
        {programData.description && (
          <p className="text-sm text-gray-600">{programData.description}</p>
        )}
      </DialogHeader>
    </div>
  );
};
