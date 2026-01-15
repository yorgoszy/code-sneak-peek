import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Check, X, Trash2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
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

interface GymBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  user_id: string;
  section?: {
    name: string;
    description?: string;
  };
  app_users?: {
    name: string;
    email: string;
  };
}

interface GymBookingCardProps {
  booking: GymBooking;
  isAdmin?: boolean;
  onRefresh?: () => void;
  isHistoryView?: boolean;
}

export const GymBookingCard: React.FC<GymBookingCardProps> = ({ 
  booking, 
  isAdmin = false,
  onRefresh,
  isHistoryView = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
  const isPastBooking = isPast(bookingDateTime);

  const getDateLabel = () => {
    if (isToday(bookingDateTime)) return 'Σήμερα';
    if (isTomorrow(bookingDateTime)) return 'Αύριο';
    return format(bookingDateTime, 'EEEE, d MMMM yyyy', { locale: el });
  };

  const getStatusBadge = () => {
    // Check attendance status first
    if ((booking as any).attendance_status === 'completed') {
      return <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200 text-xs">Ολοκληρωμένη</Badge>;
    }
    if ((booking as any).attendance_status === 'missed') {
      return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200 text-xs">Απουσία</Badge>;
    }
    
    // Then check regular status
    if (booking.status === 'pending') {
      return <Badge variant="outline" className="rounded-none bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Εκκρεμεί</Badge>;
    }
    if (booking.status === 'cancelled') {
      return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200 text-xs">Ακυρώθηκε</Badge>;
    }
    if (booking.status === 'confirmed') {
      // If past and no attendance status, mark as missed automatically
      if (isPastBooking && !(booking as any).attendance_status) {
        handleMarkMissed();
        return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200 text-xs">Απουσία</Badge>;
      }
      return <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200 text-xs">Εγκεκριμένη</Badge>;
    }
    return <Badge variant="outline" className="rounded-none text-xs">Προγραμματισμένη</Badge>;
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Η κράτηση εγκρίθηκε!');
      onRefresh?.();
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Σφάλμα κατά την έγκριση της κράτησης');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;

      // Return visit to user's available packages
      try {
        const { data: activePackage } = await supabase
          .from('visit_packages')
          .select('*')
          .eq('user_id', booking.user_id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false })
          .limit(1);

        if (activePackage && activePackage.length > 0) {
          await supabase
            .from('visit_packages')
            .update({
              remaining_visits: activePackage[0].remaining_visits + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', activePackage[0].id);
        } else {
          const { data: usedPackage } = await supabase
            .from('visit_packages')
            .select('*')
            .eq('user_id', booking.user_id)
            .eq('status', 'used')
            .eq('remaining_visits', 0)
            .order('purchase_date', { ascending: false })
            .limit(1);

          if (usedPackage && usedPackage.length > 0) {
            await supabase
              .from('visit_packages')
              .update({
                remaining_visits: 1,
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', usedPackage[0].id);
          }
        }
      } catch (packageError) {
        console.error('Error returning visit to package:', packageError);
      }

      toast.success('Η κράτηση ακυρώθηκε και επιστράφηκε στα διαθέσιμα πακέτα');
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Σφάλμα κατά την ακύρωση της κράτησης');
    }
  };

  const handleMarkCompleted = async () => {
    try {
      const { error } = await supabase.rpc('mark_booking_completed', {
        booking_id: booking.id
      });

      if (error) throw error;

      toast.success('Η κράτηση σημειώθηκε ως ολοκληρωμένη!');
      onRefresh?.();
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      toast.error('Σφάλμα κατά τη σήμανση ως ολοκληρωμένη');
    }
  };

  const handleMarkMissed = async () => {
    try {
      const { error } = await supabase.rpc('mark_booking_missed', {
        booking_id: booking.id
      });

      if (error) throw error;

      console.log('Booking marked as missed automatically');
      onRefresh?.();
    } catch (error) {
      console.error('Error marking booking as missed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Η κράτηση διαγράφηκε!');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της κράτησης');
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
                  <MapPin className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{booking.section?.name || 'Gym Visit'}</span>
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
                  <span>{booking.booking_time}</span>
                </div>
                {isAdmin && booking.app_users && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">{booking.app_users.name}</span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {booking.notes}
                </p>
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

              {/* Mark attendance button for confirmed bookings */}
              {isAdmin && booking.status === 'confirmed' && !(booking as any).attendance_status && (
                <Button
                  onClick={handleMarkCompleted}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 px-2"
                  size="sm"
                >
                  <Check className="w-3 h-3 mr-1" />
                  <span className="text-xs">Παρουσία</span>
                </Button>
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
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Η κράτηση θα διαγραφεί οριστικά.
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
