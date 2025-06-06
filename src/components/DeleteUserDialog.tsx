
import React from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useUserDeletion } from "./user-deletion/useUserDeletion";
import { DeleteUserDialogContent } from "./user-deletion/DeleteUserDialogContent";
import type { DeleteUserDialogProps } from "./user-deletion/types";

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUserDeleted, 
  user 
}) => {
  const { deleteUser, loading } = useUserDeletion();

  const handleDelete = () => {
    if (user) {
      deleteUser(user, onUserDeleted, onClose);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <DeleteUserDialogContent
        user={user}
        loading={loading}
        onDelete={handleDelete}
        onClose={onClose}
      />
    </AlertDialog>
  );
};
