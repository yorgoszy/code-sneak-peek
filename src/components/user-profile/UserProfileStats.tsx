
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
      <CardContent className={`${isMobile ? 'pt-4 p-3' : 'pt-6'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
          {user.role === 'trainer' && (
            <div className="text-center">
              <Users className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto text-blue-500 mb-2`} />
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.athletesCount}</p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Αθλητές</p>
            </div>
          )}
          <div className="text-center">
            <Dumbbell className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto text-green-500 mb-2`} />
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.programsCount}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
              {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα' : 'Ανατεθέντα Προγράμματα'}
            </p>
          </div>
          <div className="text-center">
            <Calendar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto text-purple-500 mb-2`} />
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.testsCount}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Τεστ</p>
          </div>
          <div className="text-center">
            <CreditCard className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto text-orange-500 mb-2`} />
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{stats.paymentsCount}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Πληρωμές</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
