
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { WorkoutStatsTabsSection } from "./WorkoutStatsTabsSection";
import { Activity, Calendar, FileText, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileOverviewProps {
  userProfile: any;
  stats: any;
  programs: any[];
  tests: any[];
  payments: any[];
}

export const UserProfileOverview = ({
  userProfile,
  stats,
  programs,
  tests,
  payments
}: UserProfileOverviewProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      {/* User Header */}
      <UserProfileHeader user={userProfile} />
      
      {/* General Stats Overview */}
      <UserProfileStats user={userProfile} stats={stats} />

      {/* Workout Stats Tabs Section */}
      <WorkoutStatsTabsSection userId={userProfile.id} />
      
      {/* Recent Activity */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
        {/* Recent Programs */}
        <Card className="rounded-none">
          <CardHeader className={`${isMobile ? 'p-3' : ''}`}>
            <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-base' : ''}`}>
              <Activity className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span>Πρόσφατα Προγράμματα</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-0' : ''}`}>
            {programs.length > 0 ? (
              <div className={`space-y-${isMobile ? '2' : '3'}`}>
                {programs.slice(0, 3).map((program) => (
                  <div key={program.id} className="border-l-4 border-blue-500 pl-3">
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{program.name}</h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 truncate`}>{program.description}</p>
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
          <CardHeader className={`${isMobile ? 'p-3' : ''}`}>
            <CardTitle className={`flex items-center space-x-2 ${isMobile ? 'text-base' : ''}`}>
              <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span>Πρόσφατα Τεστ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-0' : ''}`}>
            {tests.length > 0 ? (
              <div className={`space-y-${isMobile ? '2' : '3'}`}>
                {tests.slice(0, 3).map((test) => (
                  <div key={test.id} className="border-l-4 border-green-500 pl-3">
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{test.test_type}</h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}>
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
        <CardHeader className={`${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`${isMobile ? 'text-base' : ''}`}>Στοιχεία Λογαριασμού</CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-3 pt-0' : ''}`}>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Email</label>
              <p className={`${isMobile ? 'text-sm' : 'text-sm'} truncate`}>{userProfile.email}</p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Ρόλος</label>
              <p className={`${isMobile ? 'text-sm' : 'text-sm'} capitalize`}>{userProfile.role}</p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Δημιουργήθηκε</label>
              <p className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                {new Date(userProfile.created_at).toLocaleDateString('el-GR')}
              </p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Τελευταία Ενημέρωση</label>
              <p className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
                {new Date(userProfile.updated_at).toLocaleDateString('el-GR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
