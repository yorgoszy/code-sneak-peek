
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { WorkoutStatsCards } from "./WorkoutStatsCards";
import { useWorkoutStats } from "./hooks/useWorkoutStats";
import { Activity, Calendar, FileText, CreditCard } from "lucide-react";

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
  const { stats: workoutStats, loading: workoutStatsLoading } = useWorkoutStats(userProfile.id);
  
  return (
    <div className="space-y-6">
      {/* User Header */}
      <UserProfileHeader user={userProfile} />
      
      {/* General Stats Overview */}
      <UserProfileStats user={userProfile} stats={stats} />

      {/* Workout Stats για τον τρέχοντα μήνα */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Στατιστικά Προπονήσεων - {new Date().toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}</h3>
        {workoutStatsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Φόρτωση στατιστικών...</p>
          </div>
        ) : (
          <WorkoutStatsCards stats={workoutStats} />
        )}
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Programs */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Πρόσφατα Προγράμματα</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length > 0 ? (
              <div className="space-y-3">
                {programs.slice(0, 3).map((program) => (
                  <div key={program.id} className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-medium text-sm">{program.name}</h4>
                    <p className="text-xs text-gray-600">{program.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Δεν υπάρχουν προγράμματα</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Πρόσφατα Τεστ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.length > 0 ? (
              <div className="space-y-3">
                {tests.slice(0, 3).map((test) => (
                  <div key={test.id} className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-medium text-sm">{test.test_type}</h4>
                    <p className="text-xs text-gray-600">
                      {new Date(test.created_at).toLocaleDateString('el-GR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Δεν υπάρχουν τεστ</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Στοιχεία Λογαριασμού</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-sm">{userProfile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Ρόλος</label>
              <p className="text-sm capitalize">{userProfile.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Δημιουργήθηκε</label>
              <p className="text-sm">
                {new Date(userProfile.created_at).toLocaleDateString('el-GR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Τελευταία Ενημέρωση</label>
              <p className="text-sm">
                {new Date(userProfile.updated_at).toLocaleDateString('el-GR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
