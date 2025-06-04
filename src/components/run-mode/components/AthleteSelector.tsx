
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AthleteSelectorProps {
  uniqueUsers: any[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
  uniqueUsers,
  selectedUserId,
  onUserChange
}) => {
  return (
    <Select value={selectedUserId} onValueChange={onUserChange}>
      <SelectTrigger className="h-8 text-xs bg-gray-800 border-gray-600 text-white">
        <SelectValue placeholder="Επιλέξτε αθλητή" />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-600">
        {uniqueUsers.map((user) => (
          <SelectItem 
            key={user.id} 
            value={user.id}
            className="text-white hover:bg-gray-700"
          >
            <div className="flex items-center space-x-2">
              <Avatar className="w-4 h-4">
                <AvatarImage src={user.photo_url} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
