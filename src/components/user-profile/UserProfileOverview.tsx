
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { WorkoutStatsTabsSection } from "./WorkoutStatsTabsSection";
import { UserProfileTabs } from "./UserProfileTabs";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { Activity, Calendar, FileText, CreditCard, MapPin, Key } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileOverviewProps {
  userProfile: any;
  stats: any;
  programs: any[];
  tests: any[];
  payments: any[];
  visits: any[];
  setActiveTab?: (tab: string) => void;
}

export const UserProfileOverview = ({
  userProfile,
  stats,
  programs,
  tests,
  payments,
  visits,
  setActiveTab
}: UserProfileOverviewProps) => {
  const isMobile = useIsMobile();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* General Stats Overview */}
      <UserProfileStats user={userProfile} stats={stats} setActiveTab={setActiveTab} />

      {/* Workout Stats Tabs Section */}
      <WorkoutStatsTabsSection userId={userProfile.id} />
      

      {/* Tabs για λεπτομερείς προβολές */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Λεπτομερή Στοιχεία</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserProfileTabs 
            user={userProfile} 
            programs={programs} 
            tests={tests} 
            payments={payments} 
            visits={visits}
          />
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </div>
  );
};
