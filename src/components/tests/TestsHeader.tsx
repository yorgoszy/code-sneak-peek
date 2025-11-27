
import React from "react";
import { Button } from "@/components/ui/button";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface TestsHeaderProps {
  selectedUserId?: string;
  selectedUserName?: string;
}

export const TestsHeader: React.FC<TestsHeaderProps> = ({ 
  selectedUserId, 
  selectedUserName 
}) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
          <p className="text-sm text-gray-600">
            Διαχείριση τεστ αθλητών
          </p>
        </div>
      </div>
    </nav>
  );
};
