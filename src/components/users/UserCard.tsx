
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Eye } from "lucide-react";
import { formatDate, getRoleColor, getStatusColor } from "./utils";
import type { AppUser } from "./types";

interface UserCardProps {
  user: AppUser;
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  onView: (user: AppUser) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onView
}) => {
  return (
    <div className="border border-gray-200 rounded-none p-3 space-y-3">
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.photo_url} alt={user.name} />
          <AvatarFallback className="text-xs">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{user.name}</div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Ρόλος:</span>
          <div className="mt-1">
            <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>
        <div>
          <span className="text-gray-500">Κατάσταση:</span>
          <div className="mt-1">
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(user.user_status)}`}>
              {user.user_status}
            </span>
          </div>
        </div>
        <div>
          <span className="text-gray-500">Τηλέφωνο:</span>
          <div className="mt-1 text-xs">{user.phone || '-'}</div>
        </div>
        <div>
          <span className="text-gray-500">Εγγραφή:</span>
          <div className="mt-1 text-xs">{formatDate(user.created_at)}</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-none flex-1 text-xs"
          onClick={() => onView(user)}
        >
          <Eye className="h-3 w-3 mr-1" />
          Προβολή
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-none flex-1 text-xs"
          onClick={() => onEdit(user)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Επεξεργασία
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-none text-red-600 hover:text-red-700 text-xs px-2"
          onClick={() => onDelete(user)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
