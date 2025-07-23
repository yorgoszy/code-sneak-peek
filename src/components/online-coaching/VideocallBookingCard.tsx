import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User, ExternalLink, Check, X } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isWithinInterval, addMinutes } from "date-fns";
import { el } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    name: string;
    email: string;
  };
}

interface VideocallBookingCardProps {
  booking: VideocallBooking;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export const VideocallBookingCard: React.FC<VideocallBookingCardProps> = ({ 
  booking, 
  isAdmin = false,
  onRefresh 
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
    if (booking.status === 'pending') {
      return <Badge variant="outline" className="rounded-none bg-orange-50 text-orange-700 border-orange-200">Εκκρεμεί</Badge>;
    }
    if (booking.status === 'rejected') {
      return <Badge variant="destructive" className="rounded-none">Απορρίφθηκε</Badge>;
    }
    if (isPastMeeting) {
      return <Badge variant="secondary" className="rounded-none">Ολοκληρωμένη</Badge>;
    }
    if (canJoinMeeting && booking.status === 'confirmed') {
      return <Badge className="rounded-none bg-green-500 hover:bg-green-600">Ενεργή</Badge>;
    }
    if (booking.status === 'confirmed') {
      return <Badge variant="outline" className="rounded-none">Εγκεκριμένη</Badge>;
    }
    return <Badge variant="outline" className="rounded-none">Προγραμματισμένη</Badge>;
  };

  const handleJoinMeeting = () => {
    if (booking.meeting_link) {
      window.open(booking.meeting_link, '_blank');
    }
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Η βιντεοκλήση εγκρίθηκε επιτυχώς!');
      onRefresh?.();
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Σφάλμα κατά την έγκριση της βιντεοκλήσης');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: 'rejected' })
        .eq('id', booking.id);

      if (error) throw error;

      // Return videocall to user's available packages
      try {
        const { data: activePackage } = await supabase
          .from('videocall_packages')
          .select('*')
          .eq('user_id', booking.user_id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false })
          .limit(1);

        if (activePackage && activePackage.length > 0) {
          await supabase
            .from('videocall_packages')
            .update({
              remaining_videocalls: activePackage[0].remaining_videocalls + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', activePackage[0].id);
        } else {
          const { data: usedPackage } = await supabase
            .from('videocall_packages')
            .select('*')
            .eq('user_id', booking.user_id)
            .eq('status', 'used')
            .eq('remaining_videocalls', 0)
            .order('purchase_date', { ascending: false })
            .limit(1);

          if (usedPackage && usedPackage.length > 0) {
            await supabase
              .from('videocall_packages')
              .update({
                remaining_videocalls: 1,
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', usedPackage[0].id);
          }
        }
      } catch (packageError) {
        console.error('Error returning videocall to package:', packageError);
      }

      toast.success('Η βιντεοκλήση απορρίφθηκε και επιστράφηκε στα διαθέσιμα πακέτα');
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Σφάλμα κατά την απόρριψη της βιντεοκλήσης');
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
                <span>{booking.user.name}</span>
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
            {/* Admin approve/reject buttons for pending bookings */}
            {isAdmin && booking.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-none"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Έγκριση
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="rounded-none"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Απόρριψη
                </Button>
              </div>
            )}

            {canJoinMeeting && booking.meeting_link && booking.status === 'confirmed' && (
              <Button
                onClick={handleJoinMeeting}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Συμμετοχή
              </Button>
            )}
            
            {!canJoinMeeting && !isPastMeeting && booking.status === 'confirmed' && (
              <div className="text-xs text-gray-500 text-center">
                Διαθέσιμη 15' πριν
              </div>
            )}

            {booking.meeting_link && booking.status === 'confirmed' && (
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