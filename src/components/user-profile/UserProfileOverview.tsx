
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
      {/* User Header */}
      <UserProfileHeader user={userProfile} />
      
      {/* General Stats Overview */}
      <UserProfileStats user={userProfile} stats={stats} setActiveTab={setActiveTab} />

      {/* Workout Stats Tabs Section */}
      <WorkoutStatsTabsSection userId={userProfile.id} />
      
      {/* Recent Activity */}
      <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Recent Programs */}
        <Card className="rounded-none">
          <CardHeader className={isMobile ? "pb-3" : ""}>
            <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-base' : ''}`}>
              <Activity className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span>Πρόσφατα Προγράμματα</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "pt-0" : ""}>
            {programs.length > 0 ? (
              <div className="space-y-3">
                {programs.slice(0, 3).map((program) => (
                  <div key={program.id} className="border-l-4 border-blue-500 pl-3">
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{program.name}</h4>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>{program.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Δεν υπάρχουν προγράμματα</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="rounded-none">
          <CardHeader className={isMobile ? "pb-3" : ""}>
            <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-base' : ''}`}>
              <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span>Πρόσφατα Τεστ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "pt-0" : ""}>
            {tests.length > 0 ? (
              <div className="space-y-3">
                {tests.slice(0, 3).map((test) => (
                  <div key={test.id} className="border-l-4 border-green-500 pl-3">
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{test.test_type}</h4>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {new Date(test.created_at).toLocaleDateString('el-GR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>Δεν υπάρχουν τεστ</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="rounded-none">
        <CardHeader className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row items-center justify-between'} ${isMobile ? "pb-3" : ""}`}>
          <CardTitle className={isMobile ? 'text-base' : ''}>Στοιχεία Λογαριασμού</CardTitle>
          <Button
            onClick={() => setIsPasswordDialogOpen(true)}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
          >
            <Key className="w-4 h-4 mr-2" />
            Αλλαγή Κωδικού
          </Button>
        </CardHeader>
        <CardContent className={isMobile ? "pt-0" : ""}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <label className={`font-medium text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>Email</label>
              <p className={`${isMobile ? 'text-sm' : 'text-sm'} break-all`}>{userProfile.email}</p>
            </div>
            <div>
              <label className={`font-medium text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>Ρόλος</label>
              <p className={`capitalize ${isMobile ? 'text-sm' : 'text-sm'}`}>{userProfile.role}</p>
            </div>
            <div>
              <label className={`font-medium text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>Δημιουργήθηκε</label>
              <p className={isMobile ? 'text-sm' : 'text-sm'}>
                {new Date(userProfile.created_at).toLocaleDateString('el-GR')}
              </p>
            </div>
            <div>
              <label className={`font-medium text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>Τελευταία Ενημέρωση</label>
              <p className={isMobile ? 'text-sm' : 'text-sm'}>
                {new Date(userProfile.updated_at).toLocaleDateString('el-GR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
