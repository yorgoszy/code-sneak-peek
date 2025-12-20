
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { ActiveProgramsActions } from './ActiveProgramsActions';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardHeaderProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCardHeader: React.FC<ProgramCardHeaderProps> = ({ assignment, onRefresh }) => {
  const userName = assignment.app_users?.name || 'Άγνωστος χρήστης';
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="flex justify-between items-start">
      <div className="flex items-start gap-3 flex-1">
        <Avatar className="w-12 h-12">
          <AvatarImage 
            src={assignment.app_users?.photo_url} 
            alt={userName}
          />
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {getUserInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1 flex-1">
          <CardTitle className="text-lg">
            {assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
          </CardTitle>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{userName}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge 
          variant={getStatusBadgeVariant(assignment.status)} 
          className="rounded-none"
        >
          {assignment.status === 'active' ? 'Ενεργό' : assignment.status}
        </Badge>
        <ActiveProgramsActions 
          assignment={assignment} 
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};
