
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface DashboardHeaderProps {
  userProfile: any;
  userEmail?: string;
  onSignOut: () => void;
}

export const DashboardHeader = ({ userProfile, userEmail, onSignOut }: DashboardHeaderProps) => {
  const { isAdmin } = useRoleCheck();

  return (
    <nav className="bg-white border-b border-gray-200 px-2 md:px-4 lg:px-6 py-2 md:py-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
            Καλώς ήρθατε, {isAdmin() ? 'Admin User!' : userProfile?.name || userEmail}
          </p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-xs md:text-sm text-gray-600 hidden md:block">
            {userProfile?.name || userEmail}
            {isAdmin() && <span className="ml-2 px-1 md:px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-none text-xs md:text-sm p-1 md:p-2"
            onClick={onSignOut}
          >
            <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Αποσύνδεση</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
