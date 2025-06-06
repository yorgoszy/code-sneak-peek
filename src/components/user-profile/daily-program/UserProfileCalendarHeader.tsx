
import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface UserProfileCalendarHeaderProps {
  userName: string;
  showDebugger: boolean;
  onToggleDebugger: () => void;
}

export const UserProfileCalendarHeader: React.FC<UserProfileCalendarHeaderProps> = ({
  userName,
  showDebugger,
  onToggleDebugger
}) => {
  return (
    <CardHeader className="pb-2 md:pb-4">
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm md:text-base">
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Ημερολόγιο Προπονήσεων -</span> {userName}
        </span>
        <button 
          onClick={onToggleDebugger}
          className="text-xs bg-gray-200 px-1 md:px-2 py-1 rounded hidden md:block"
        >
          {showDebugger ? 'Απόκρυψη Debug' : 'Debug Video URLs'}
        </button>
      </CardTitle>
    </CardHeader>
  );
};
