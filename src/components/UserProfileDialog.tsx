
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserProfileDialog = ({ isOpen, onClose, user }: UserProfileDialogProps) => {
  const navigate = useNavigate();

  if (!user) return null;

  const handleOpenProfile = () => {
    navigate(`/dashboard/user-profile/${user.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-none">
        <DialogHeader>
          <DialogTitle>Προφίλ Χρήστη</DialogTitle>
          <DialogDescription>
            Ανοίξτε το πλήρες προφίλ του χρήστη σε νέα σελίδα
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-6 border rounded-none">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 capitalize mt-2">Ρόλος: {user.role}</p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleOpenProfile}
              className="flex-1 rounded-none"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Άνοιγμα Προφίλ
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
