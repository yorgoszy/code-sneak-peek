import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User, ExternalLink } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isWithinInterval, addMinutes } from "date-fns";
import { el } from 'date-fns/locale';

interface VideocallBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  meeting_link?: string;
  user_id: string;
  section?: {
    name: string;
    description?: string;
  };
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface VideocallBookingCardProps {
  booking: VideocallBooking;
  isAdmin?: boolean;
}

export const VideocallBookingCard: React.FC<VideocallBookingCardProps> = ({ 
  booking, 
  isAdmin = false 
}) => {
  const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
  const now = new Date();
  const meetingWindow = {
    start: addMinutes(bookingDateTime, -15), // 15 minutes before
    end: addMinutes(bookingDateTime, 60)     // 60 minutes after
  };
  
  const canJoinMeeting = isWithinInterval(now, meetingWindow);
  const isPastMeeting = isPast(bookingDateTime);

  const getDateLabel = () => {
    if (isToday(bookingDateTime)) return 'Σήμερα';
    if (isTomorrow(bookingDateTime)) return 'Αύριο';
    return format(bookingDateTime, 'EEEE, d MMMM yyyy', { locale: el });
  };

  const getStatusBadge = () => {
    if (isPastMeeting) {
      return <Badge variant="secondary" className="rounded-none">Ολοκληρωμένη</Badge>;
    }
    if (canJoinMeeting) {
      return <Badge className="rounded-none bg-green-500 hover:bg-green-600">Ενεργή</Badge>;
    }
    return <Badge variant="outline" className="rounded-none">Προγραμματισμένη</Badge>;
  };

  const handleJoinMeeting = () => {
    if (booking.meeting_link) {
      window.open(booking.meeting_link, '_blank');
    }
  };

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#00ffba]" />
                <span className="font-medium">{booking.section?.name || 'Videocall Session'}</span>
              </div>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{getDateLabel()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{booking.booking_time}</span>
              </div>
            </div>

            {isAdmin && booking.user && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span>{booking.user.first_name} {booking.user.last_name}</span>
                <span className="text-gray-400">({booking.user.email})</span>
              </div>
            )}

            {booking.notes && (
              <p className="text-sm text-gray-500 mb-2">
                {booking.notes}
              </p>
            )}

            <div className="text-xs text-gray-400">
              Meeting Link: {booking.meeting_link || 'Generating...'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {canJoinMeeting && booking.meeting_link && (
              <Button
                onClick={handleJoinMeeting}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Συμμετοχή
              </Button>
            )}
            
            {!canJoinMeeting && !isPastMeeting && (
              <div className="text-xs text-gray-500 text-center">
                Διαθέσιμη 15' πριν
              </div>
            )}

            {booking.meeting_link && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(booking.meeting_link!)}
                className="rounded-none"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Αντιγραφή Link
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};