
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface DialogActionsProps {
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const DialogActions = ({ loading, onClose, onSubmit }: DialogActionsProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSubmitClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit();
  };

  return (
    <>
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="rounded-none"
          disabled={loading}
        >
          Ακύρωση
        </Button>
        <Button 
          onClick={handleSubmitClick}
          disabled={loading}
          className="rounded-none"
        >
          {loading ? "Ενημέρωση..." : "Ενημέρωση"}
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Επιβεβαίωση Ενημέρωσης"
        description="Είστε σίγουροι ότι θέλετε να ενημερώσετε τα στοιχεία;"
        confirmText="Ενημέρωση"
      />
    </>
  );
};
