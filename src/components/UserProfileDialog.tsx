
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserProfileDialog = ({ isOpen, onClose, user }: UserProfileDialogProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && user) {
      navigate(`/dashboard/user-profile/${user.id}`);
      onClose();
    }
  }, [isOpen, user, navigate, onClose]);

  return null;
};
