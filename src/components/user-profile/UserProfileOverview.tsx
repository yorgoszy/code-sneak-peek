
import { useState } from "react";
import { UserProfileStats } from "./UserProfileStats";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { UserCreditsWidget } from "./UserCreditsWidget";

interface UserProfileOverviewProps {
  userProfile: any;
  stats: any;
  setActiveTab?: (tab: string) => void;
}

export const UserProfileOverview = ({
  userProfile,
  stats,
  setActiveTab
}: UserProfileOverviewProps) => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* User Credits (shown only if there is a balance/history) */}
      {userProfile?.id && <UserCreditsWidget userId={userProfile.id} />}

      {/* General Stats Overview */}
      <UserProfileStats user={userProfile} stats={stats} setActiveTab={setActiveTab} />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </div>
  );
};
