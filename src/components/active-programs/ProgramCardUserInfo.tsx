
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardUserInfoProps {
  assignment: EnrichedAssignment;
}

export const ProgramCardUserInfo: React.FC<ProgramCardUserInfoProps> = ({ assignment }) => {
  const userName = assignment.app_users?.name || 'Άγνωστος χρήστης';
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const photoUrl = assignment.app_users?.photo_url || assignment.app_users?.avatar_url;

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <Avatar className="w-6 h-6 flex-shrink-0 rounded-full">
        <AvatarImage 
          src={photoUrl || undefined} 
          alt={userName}
          className="object-cover rounded-full"
        />
        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs rounded-full">
          {getUserInitials(userName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold text-gray-900 truncate">
          {assignment.programs?.name || 'Άγνωστο'}
        </h3>
        <p className="text-xs text-gray-600 truncate">
          {userName.split(' ')[0]}
        </p>
      </div>
    </div>
  );
};
