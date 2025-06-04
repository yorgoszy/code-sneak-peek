
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AthleteInfoProps {
  user: any;
}

export const AthleteInfo: React.FC<AthleteInfoProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-800/50 border border-gray-600">
      <Avatar className="w-8 h-8">
        <AvatarImage src={user.photo_url} alt={user.name} />
        <AvatarFallback className="text-xs">
          {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
    </div>
  );
};
