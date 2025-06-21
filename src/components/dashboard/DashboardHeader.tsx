
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  userProfile: any;
  userEmail?: string;
  onSignOut: () => void;
}

export const DashboardHeader = ({ userProfile, userEmail, onSignOut }: DashboardHeaderProps) => {
  const { isAdmin } = useRoleCheck();
  const isMobile = useIsMobile();

  return (
    <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
      <div className="flex justify-between items-center">
        <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
          <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
            Dashboard
          </h1>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
            Καλώς ήρθατε, {isAdmin() ? 'Admin User!' : userProfile?.name || userEmail}
          </p>
        </div>
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
          {!isMobile && (
            <span className="text-sm text-gray-600">
              {userProfile?.name || userEmail}
              {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
            </span>
          )}
          <Button 
            variant="outline" 
            className={`rounded-none ${isMobile ? 'text-xs px-2' : ''}`}
            onClick={onSignOut}
          >
            <LogOut className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? 'Exit' : 'Αποσύνδεση'}
          </Button>
        </div>
      </div>
    </nav>
  );
};
