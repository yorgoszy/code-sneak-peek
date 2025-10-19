
import { useState } from "react";
import { UserProfileStats } from "./UserProfileStats";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { UserProfileHeader } from "./UserProfileHeader";

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
      {/* User Profile Header with Action Buttons */}
      <UserProfileHeader user={userProfile} setActiveTab={setActiveTab} />
      
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
