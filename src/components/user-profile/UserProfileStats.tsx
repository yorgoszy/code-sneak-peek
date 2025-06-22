
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Dumbbell, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <Card className="rounded-none">
      <CardContent className={isMobile ? "pt-4" : "pt-6"}>
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
        }`}>
          {user.role === 'trainer' && (
            <div className="text-center">
              <Users className={`mx-auto text-blue-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.athletesCount}</p>
              <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Αθλητές</p>
            </div>
          )}
          <div className="text-center">
            <Dumbbell className={`mx-auto text-green-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.programsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα' : 'Ανατεθέντα Προγράμματα'}
            </p>
          </div>
          <div className="text-center">
            <Calendar className={`mx-auto text-purple-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.testsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Τεστ</p>
          </div>
          <div className="text-center">
            <CreditCard className={`mx-auto text-orange-500 mb-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.paymentsCount}</p>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Πληρωμές</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
