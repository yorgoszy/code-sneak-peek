import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User, ExternalLink, Check, X, Trash2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isWithinInterval, addMinutes, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { el } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  isHistoryView?: boolean;
}

export const VideocallBookingCard: React.FC<VideocallBookingCardProps> = ({ 
  booking, 
  isAdmin = false,
  onRefresh,
  isHistoryView = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
  const now = new Date();
  const meetingWindow = {
    start: addMinutes(bookingDateTime, -15),
    end: addMinutes(bookingDateTime, 60)
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
      return <Badge variant="outline" className="rounded-none bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Εκκρεμεί</Badge>;
    }
    if (booking.status === 'rejected') {
      return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200 text-xs">Απορρίφθηκε</Badge>;
    }
    if (booking.status === 'completed') {
      return (
        <Badge 
          variant="secondary" 
          className={`rounded-none text-xs ${isAdmin ? 'cursor-pointer hover:bg-gray-300' : ''}`}
          onClick={isAdmin ? handleToggleComplete : undefined}
        >
          Ολοκληρωμένη
        </Badge>
      );
    }
    if (canJoinMeeting && booking.status === 'confirmed') {
      return <Badge className="rounded-none bg-[#00ffba] text-black text-xs">Ενεργή</Badge>;
    }
    if (booking.status === 'confirmed') {
      return (
        <Badge 
          variant="outline" 
          className={`rounded-none bg-green-50 text-green-700 border-green-200 text-xs ${isAdmin ? 'cursor-pointer hover:bg-green-100' : ''}`}
          onClick={isAdmin ? handleToggleComplete : undefined}
        >
          Εγκεκριμένη
        </Badge>
      );
    }
    return <Badge variant="outline" className="rounded-none text-xs">Προγραμματισμένη</Badge>;
  };

  const getTimeRemaining = () => {
    if (isAdmin) {
      if (isPastMeeting || (booking.status !== 'confirmed' && booking.status !== 'pending')) return null;
    } else {
      if (isPastMeeting || booking.status !== 'confirmed') return null;
    }
    
    const now = new Date();
    const days = differenceInDays(bookingDateTime, now);
    const hours = differenceInHours(bookingDateTime, now) % 24;
    const minutes = differenceInMinutes(bookingDateTime, now) % 60;
    
    if (days > 0) {
      return `${days}μ και ${hours}ω`;
    } else if (hours > 0) {
      return `${hours}ω και ${minutes} λεπτά`;
    } else if (minutes > 0) {
      return `${minutes} λεπτά`;
    } else {
      return 'Τώρα!';
    }
  };

  const handleJoinMeeting = () => {
    if (booking.meeting_link) {
      const adminName = 'Admin';
      const meetingUrl = `${booking.meeting_link}#userInfo.displayName="${adminName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
      window.open(meetingUrl, '_blank');
    }
  };

  const handleApprove = async () => {
    try {
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

      try {
        await supabase.functions.invoke('send-videocall-notifications', {
          body: {
            type: 'booking_approved',
            bookingId: booking.id
          }
        });
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }

      toast.success('Η βιντεοκλήση εγκρίθηκε και δημιουργήθηκε το meeting link!');
      onRefresh?.();
      window.dispatchEvent(new CustomEvent('videocall-status-changed'));
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

      try {
        await supabase.functions.invoke('send-videocall-notifications', {
          body: {
            type: 'booking_rejected',
            bookingId: booking.id
          }
        });
      } catch (notificationError) {
        console.error('Error sending rejection notification:', notificationError);
      }

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
      window.dispatchEvent(new CustomEvent('videocall-status-changed'));
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
      
      booking.status = newStatus;
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling completion status:', error);
      toast.error('Σφάλμα κατά την αλλαγή κατάστασης');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Η βιντεοκλήση διαγράφηκε!');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της βιντεοκλήσης');
    }
  };

  return (
    <>
      <Card className="rounded-none hover:shadow-md transition-shadow">
        <CardContent className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{booking.section?.name || 'Videocall Session'}</span>
                </div>
                {getStatusBadge()}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{getDateLabel()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{booking.booking_time?.slice(0, 5)}</span>
                </div>
                {isAdmin && booking.user && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">{booking.user.name}</span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {booking.notes}
                </p>
              )}

              {booking.meeting_link && !isHistoryView && (
                <div className="text-xs text-gray-400 bg-gray-50 p-1 mt-1 border">
                  <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-[#00ffba] hover:underline break-all truncate block">
                    {booking.meeting_link}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Admin approve/reject buttons for pending bookings */}
              {isAdmin && booking.status === 'pending' && (
                <>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-none h-7 px-2"
                    size="sm"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    className="rounded-none h-7 px-2"
                    size="sm"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}

              {/* Meeting controls for confirmed bookings */}
              {booking.status === 'confirmed' && booking.meeting_link && !isHistoryView && (
                <div className="flex flex-col items-center gap-1">
                  <Button
                    onClick={handleJoinMeeting}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 px-2"
                    size="sm"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    <span className="text-xs">Συμμετοχή</span>
                  </Button>
                  {getTimeRemaining() && (
                    <div className="text-xs text-gray-500">
                      {getTimeRemaining()}
                    </div>
                  )}
                </div>
              )}

              {/* Time remaining for admin panel */}
              {isAdmin && booking.status !== 'rejected' && booking.status !== 'completed' && getTimeRemaining() && !booking.meeting_link && !isHistoryView && (
                <div className="text-xs text-gray-500">
                  {getTimeRemaining()}
                </div>
              )}

              {/* Delete button for history view */}
              {isAdmin && isHistoryView && (
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded-none h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Η βιντεοκλήση θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
