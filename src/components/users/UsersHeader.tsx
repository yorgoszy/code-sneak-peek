
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface UsersHeaderProps {
  userProfile: any;
  user: any;
  onSignOut: () => void;
}

export const UsersHeader = ({ userProfile, user, onSignOut }: UsersHeaderProps) => {
  const { isAdmin } = useRoleCheck();
  const isMobile = useIsMobile();

  return (
    <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
      <div className="flex justify-between items-center">
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
          {isMobile && <SidebarTrigger />}
          <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
            <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
              Χρήστες
            </h1>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
              Διαχείριση χρηστών του συστήματος
            </p>
          </div>
        </div>
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
          {!isMobile && (
            <span className="text-sm text-gray-600">
              {userProfile?.name || user?.email}
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
