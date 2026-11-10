import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { format } from "date-fns";

interface SectionUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AttendanceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  date: string;
  time: string;
  users: SectionUser[];
}

export const AttendanceDetailsDialog: React.FC<AttendanceDetailsDialogProps> = ({
  isOpen,
  onClose,
  sectionName,
  date,
  time,
  users
}) => {

  const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00ffba]" />
            Μέλη Τμήματος
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Header */}
          <div className="bg-gray-50 p-3 border border-gray-200 rounded-none">
            <div className="text-sm font-medium text-gray-900">{sectionName}</div>
            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
              <span>{formattedDate}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
              <Badge variant="outline" className="rounded-none text-xs">
                {users.length} {users.length === 1 ? 'μέλος' : 'μέλη'}
              </Badge>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {users.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Δεν υπάρχουν μέλη για αυτή την ώρα
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
