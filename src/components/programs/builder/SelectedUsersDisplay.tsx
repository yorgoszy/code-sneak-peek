
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, X } from "lucide-react";
import type { User as UserType } from '../types';

interface SelectedUsersDisplayProps {
  selectedUsers: UserType[];
  onClearAll: () => void;
  onRemoveUser: (userId: string, event: React.MouseEvent) => void;
}

export const SelectedUsersDisplay: React.FC<SelectedUsersDisplayProps> = ({
  selectedUsers,
  onClearAll,
  onRemoveUser
}) => {
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Επιλεγμένοι ({selectedUsers.length})
          </span>
          {selectedUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="rounded-none text-xs h-6 px-2"
            >
              Καθαρισμός
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedUsers.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            Δεν έχουν επιλεγεί χρήστες
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-[#00ffba]/10 border border-[#00ffba]/20 p-2 rounded hover:bg-[#00ffba]/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    {user.role && (
                      <Badge variant="outline" className="mt-1 text-xs rounded-none h-4 px-1">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => onRemoveUser(user.id, e)}
                  className="rounded-none p-1 h-auto text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  title="Αφαίρεση από την επιλογή"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
