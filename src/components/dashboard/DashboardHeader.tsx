
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  isAdmin: boolean;
  userProfile: any;
  userEmail?: string;
  onSignOut: () => void;
}

export const DashboardHeader = ({ isAdmin, userProfile, userEmail, onSignOut }: DashboardHeaderProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Καλώς ήρθατε, {isAdmin ? 'Admin User!' : userProfile?.name || userEmail}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {userProfile?.name || userEmail}
            {isAdmin && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
          </span>
          <Button 
            variant="outline" 
            className="rounded-none"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Αποσύνδεση
          </Button>
        </div>
      </div>
    </nav>
  );
};
