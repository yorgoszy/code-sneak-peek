import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Check } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  user_id: string;
  section_id: string;
  app_users?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface AttendanceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  date: string;
  time: string;
  attendees: AttendanceRecord[];
}

export const AttendanceDetailsDialog: React.FC<AttendanceDetailsDialogProps> = ({
  isOpen,
  onClose,
  sectionName,
  date,
  time,
  attendees
}) => {
  const formattedDate = format(new Date(date), 'dd/MM/yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00ffba]" />
            Παρουσίες
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
                {attendees.length} άτομα
              </Badge>
            </div>
          </div>

          {/* Attendees List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {attendees.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Δεν υπάρχουν καταγεγραμμένες παρουσίες
              </div>
            ) : (
              attendees.map((attendee) => (
                <div 
                  key={attendee.id} 
                  className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={attendee.app_users?.avatar_url} />
                    <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] text-xs">
                      {attendee.app_users?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {attendee.app_users?.name || 'Άγνωστος'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {attendee.app_users?.email}
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
