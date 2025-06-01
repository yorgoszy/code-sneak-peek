
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard } from "lucide-react";

interface UserProfileStatsProps {
  user: any;
  stats: {
    athletesCount: number;
    programsCount: number;
    testsCount: number;
    paymentsCount: number;
  };
}

export const UserProfileStats = ({ user, stats }: UserProfileStatsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {user.role === 'trainer' && (
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.athletesCount}</p>
              <p className="text-sm text-gray-600">Αθλητές</p>
            </div>
          )}
          <div className="text-center">
            <Dumbbell className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.programsCount}</p>
            <p className="text-sm text-gray-600">
              {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα' : 'Ανατεθέντα Προγράμματα'}
            </p>
          </div>
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{stats.testsCount}</p>
            <p className="text-sm text-gray-600">Τεστ</p>
          </div>
          <div className="text-center">
            <CreditCard className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.paymentsCount}</p>
            <p className="text-sm text-gray-600">Πληρωμές</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
