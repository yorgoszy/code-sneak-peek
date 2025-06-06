
import React from 'react';
import { NewUserDialog } from "@/components/NewUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { UserProfileDialog } from "@/components/UserProfileDialog";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  created_at: string;
}

interface UserDialogsProps {
  newUserDialogOpen: boolean;
  editUserDialogOpen: boolean;
  deleteUserDialogOpen: boolean;
  userProfileDialogOpen: boolean;
  selectedUser: AppUser | null;
  onNewUserDialogClose: () => void;
  onEditUserDialogClose: () => void;
  onDeleteUserDialogClose: () => void;
  onUserProfileDialogClose: () => void;
  onUserCreated: () => void;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

export const UserDialogs: React.FC<UserDialogsProps> = ({
  newUserDialogOpen,
  editUserDialogOpen,
  deleteUserDialogOpen,
  userProfileDialogOpen,
  selectedUser,
  onNewUserDialogClose,
  onEditUserDialogClose,
  onDeleteUserDialogClose,
  onUserProfileDialogClose,
  onUserCreated,
  onUserUpdated,
  onUserDeleted
}) => {
  return (
    <>
      <NewUserDialog
        isOpen={newUserDialogOpen}
        onClose={onNewUserDialogClose}
        onUserCreated={onUserCreated}
      />

      <EditUserDialog
        isOpen={editUserDialogOpen}
        onClose={onEditUserDialogClose}
        onUserUpdated={onUserUpdated}
        user={selectedUser}
      />

      <DeleteUserDialog
        isOpen={deleteUserDialogOpen}
        onClose={onDeleteUserDialogClose}
        onUserDeleted={onUserDeleted}
        user={selectedUser}
      />

      <UserProfileDialog
        isOpen={userProfileDialogOpen}
        onClose={onUserProfileDialogClose}
        user={selectedUser}
      />
    </>
  );
};
