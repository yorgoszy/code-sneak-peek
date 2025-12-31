
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Edit, Save, X } from "lucide-react";

interface EditableProgramDialogHeaderProps {
  programData: any;
  assignment: any;
  editMode: boolean;
  isEditing: boolean;
  onToggleEditing: () => void;
  onSaveChanges: () => void;
  onCancelEditing: () => void;
  onClose?: () => void;
}

export const EditableProgramDialogHeader: React.FC<EditableProgramDialogHeaderProps> = ({
  programData,
  assignment,
  editMode,
  isEditing,
  onToggleEditing,
  onSaveChanges,
  onCancelEditing,
  onClose
}) => {
  return (
    <div className="sticky top-0 bg-white z-10 border-b border-gray-200 pb-2 sm:pb-4">
      <DialogHeader>
        <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-base sm:text-lg truncate">{programData?.name}</span>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {editMode && (
              <>
                {isEditing ? (
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      onClick={onSaveChanges}
                      size="sm"
                      className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Αποθήκευση</span>
                      <span className="xs:hidden">Save</span>
                    </Button>
                    <Button
                      onClick={onCancelEditing}
                      size="sm"
                      variant="outline"
                      className="rounded-none text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Ακύρωση</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onToggleEditing}
                    size="sm"
                    variant="outline"
                    className="rounded-none text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Επεξεργασία</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                )}
              </>
            )}
            <Badge variant="outline" className="rounded-none text-xs h-6 sm:h-7">
              {assignment?.status}
            </Badge>
            {onClose && (
              <Button
                onClick={onClose}
                size="sm"
                variant="outline"
                className="rounded-none h-7 sm:h-8 px-2"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Κλείσιμο</span>
              </Button>
            )}
          </div>
        </DialogTitle>
        {programData?.description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{programData.description}</p>
        )}
      </DialogHeader>
    </div>
  );
};
