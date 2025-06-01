
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProfileHeader } from "./user-profile/UserProfileHeader";
import { UserProfileStats } from "./user-profile/UserProfileStats";
import { UserProfileTabs } from "./user-profile/UserProfileTabs";
import { useUserProfileData } from "./user-profile/hooks/useUserProfileData";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserProfileDialog = ({ isOpen, onClose, user }: UserProfileDialogProps) => {
  const { stats, programs, tests, payments, refetchData } = useUserProfileData(user, isOpen);

  const handleTestDeleted = () => {
    refetchData();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Προφίλ Χρήστη</DialogTitle>
          <DialogDescription>
            Στοιχεία και δραστηριότητες του χρήστη
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <UserProfileHeader user={user} />
          <UserProfileStats user={user} stats={stats} />
          <UserProfileTabs 
            user={user}
            programs={programs}
            tests={tests}
            payments={payments}
            onTestDeleted={handleTestDeleted}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
