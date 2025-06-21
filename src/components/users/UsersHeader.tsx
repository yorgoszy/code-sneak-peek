
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface UsersHeaderProps {
  userProfile: any;
  user: any;
  onSignOut: () => void;
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({
  userProfile,
  user,
  onSignOut
}) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-xs md:text-sm text-gray-600">
            Διαχείριση χρηστών συστήματος
          </p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-xs md:text-sm text-gray-600">
            {userProfile?.name || user?.email}
            <span className="ml-1 md:ml-2 px-1 md:px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
          </span>
          <Button 
            variant="outline" 
            className="rounded-none text-xs md:text-sm px-2 md:px-4"
            onClick={onSignOut}
          >
            <LogOut className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
            Αποσύνδεση
          </Button>
        </div>
      </div>
    </nav>
  );
};
