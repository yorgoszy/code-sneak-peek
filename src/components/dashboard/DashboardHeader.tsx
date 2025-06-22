
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  userProfile: any;
  userEmail?: string;
  onSignOut: () => void;
  onMobileMenuClick?: () => void;
}

export const DashboardHeader = ({ 
  userProfile, 
  userEmail, 
  onSignOut,
  onMobileMenuClick 
}: DashboardHeaderProps) => {
  const { isAdmin } = useRoleCheck();
  const isMobile = useIsMobile();

  return (
    <nav className="bg-white border-b border-gray-200 px-3 md:px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
          {/* Mobile menu button */}
          {isMobile && onMobileMenuClick && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-none md:hidden"
              onClick={onMobileMenuClick}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
            <p className="text-xs md:text-sm text-gray-600 truncate">
              Καλώς ήρθατε, {isAdmin() ? 'Admin User!' : userProfile?.name || userEmail}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-xs md:text-sm text-gray-600 hidden sm:block truncate">
            {userProfile?.name || userEmail}
            {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
          </span>
          <Button 
            variant="outline" 
            className="rounded-none"
            size={isMobile ? "sm" : "default"}
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-0 md:mr-2" />
            <span className="hidden md:inline">Αποσύνδεση</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
