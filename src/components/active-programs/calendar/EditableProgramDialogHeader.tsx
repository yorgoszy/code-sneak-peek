
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
    <div className="sticky top-0 bg-white z-10 border-b border-gray-200 pb-4">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{programData?.name}</span>
          <div className="flex items-center gap-2">
            {editMode && (
              <>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={onSaveChanges}
                      size="sm"
                      className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Αποθήκευση
                    </Button>
                    <Button
                      onClick={onCancelEditing}
                      size="sm"
                      variant="outline"
                      className="rounded-none"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Ακύρωση
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onToggleEditing}
                    size="sm"
                    variant="outline"
                    className="rounded-none"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Επεξεργασία
                  </Button>
                )}
              </>
            )}
            <Badge variant="outline" className="rounded-none">
              {assignment?.status}
            </Badge>
            {onClose && (
              <Button
                onClick={onClose}
                size="sm"
                variant="outline"
                className="rounded-none"
              >
                <X className="w-4 h-4" />
                Κλείσιμο
              </Button>
            )}
          </div>
        </DialogTitle>
        {programData?.description && (
          <p className="text-sm text-gray-600">{programData.description}</p>
        )}
      </DialogHeader>
    </div>
  );
};
