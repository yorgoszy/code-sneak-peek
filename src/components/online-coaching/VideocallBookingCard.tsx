import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User, ExternalLink, Check, X } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isWithinInterval, addMinutes, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
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
      return <Badge variant="outline" className="rounded-none bg-yellow-50 text-yellow-700 border-yellow-200">Εκκρεμεί</Badge>;
    }
    if (booking.status === 'rejected') {
      return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200">Απορρίφθηκε</Badge>;
    }
    if (booking.status === 'completed') {
      return (
        <Badge 
          variant="secondary" 
          className={`rounded-none ${isAdmin ? 'cursor-pointer hover:bg-gray-300' : ''}`}
          onClick={isAdmin ? handleToggleComplete : undefined}
        >
          Ολοκληρωμένη
        </Badge>
      );
    }
    if (canJoinMeeting && booking.status === 'confirmed') {
      return <Badge className="rounded-none bg-[#00ffba] text-black">Ενεργή</Badge>;
    }
    if (booking.status === 'confirmed') {
      return (
        <Badge 
          variant="outline" 
          className={`rounded-none bg-green-50 text-green-700 border-green-200 ${isAdmin ? 'cursor-pointer hover:bg-green-100' : ''}`}
          onClick={isAdmin ? handleToggleComplete : undefined}
        >
          Εγκεκριμένη
        </Badge>
      );
    }
    return <Badge variant="outline" className="rounded-none">Προγραμματισμένη</Badge>;
  };

  const getTimeRemaining = () => {
    if (isPastMeeting || booking.status !== 'confirmed') return null;
    
    const now = new Date();
    const days = differenceInDays(bookingDateTime, now);
    const hours = differenceInHours(bookingDateTime, now) % 24;
    const minutes = differenceInMinutes(bookingDateTime, now) % 60;
    
    if (days > 0) {
      return `${days} ημέρ${days === 1 ? 'α' : 'ες'}, ${hours} ώρ${hours === 1 ? 'α' : 'ες'}`;
    } else if (hours > 0) {
      return `${hours} ώρ${hours === 1 ? 'α' : 'ες'}, ${minutes} λεπτά`;
    } else if (minutes > 0) {
      return `${minutes} λεπτά`;
    } else {
      return 'Τώρα!';
    }
  };

  const handleJoinMeeting = () => {
    if (booking.meeting_link) {
      // Get admin name or fallback to Admin
      const adminName = 'Admin';
      const meetingUrl = `${booking.meeting_link}#userInfo.displayName="${adminName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
      window.open(meetingUrl, '_blank');
    }
  };

  const handleApprove = async () => {
    try {
      // Generate unique meeting link
      const meetingId = `meeting-${booking.id}-${Date.now()}`;
      const meetingLink = `https://meet.jit.si/${meetingId}`;

      const { error } = await supabase
        .from('booking_sessions')
        .update({ 
          status: 'confirmed',
          meeting_link: meetingLink
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Η βιντεοκλήση εγκρίθηκε και δημιουργήθηκε το meeting link!');
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

  const handleToggleComplete = async () => {
    if (!isAdmin || booking.status === 'pending' || booking.status === 'rejected') return;
    
    try {
      const newStatus = booking.status === 'confirmed' ? 'completed' : 'confirmed';
      
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success(
        newStatus === 'completed' 
          ? 'Η βιντεοκλήση σημειώθηκε ως ολοκληρωμένη!'
          : 'Η βιντεοκλήση επαναφέρθηκε σε εγκεκριμένη!'
      );
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling completion status:', error);
      toast.error('Σφάλμα κατά την αλλαγή κατάστασης');
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
                <span>{booking.booking_time?.slice(0, 5)}</span>
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

            {booking.meeting_link && (
              <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded-none border">
                <strong>Meeting Link:</strong> <br />
                <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-[#00ffba] hover:underline break-all">
                  {booking.meeting_link}
                </a>
              </div>
            )}
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

            {/* Meeting controls for confirmed bookings */}
            {booking.status === 'confirmed' && booking.meeting_link && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleJoinMeeting}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  size="sm"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Συμμετοχή
                </Button>
                {getTimeRemaining() && (
                  <div className="text-xs text-gray-500 text-center">
                    Απομένουν: {getTimeRemaining()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};