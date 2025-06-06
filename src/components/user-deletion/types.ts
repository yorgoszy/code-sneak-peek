
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  created_at: string;
}

export interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: AppUser | null;
}
