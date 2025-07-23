import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Check, X } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { el } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

export const GymBookingCard: React.FC<GymBookingCardProps> = ({ 
  booking, 
  isAdmin = false,
  onRefresh 
}) => {
  const bookingDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`);
  const isPastBooking = isPast(bookingDateTime);

  const getDateLabel = () => {
    if (isToday(bookingDateTime)) return 'Σήμερα';
    if (isTomorrow(bookingDateTime)) return 'Αύριο';
    return format(bookingDateTime, 'EEEE, d MMMM yyyy', { locale: el });
  };

  const getStatusBadge = () => {
    if (booking.status === 'pending') {
      return <Badge variant="outline" className="rounded-none bg-yellow-50 text-yellow-700 border-yellow-200">Εκκρεμεί</Badge>;
    }
    if (booking.status === 'cancelled') {
      return <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200">Ακυρώθηκε</Badge>;
    }
    if (isPastBooking) {
      return <Badge variant="secondary" className="rounded-none">Ολοκληρωμένη</Badge>;
    }
    if (booking.status === 'confirmed') {
      return <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200">Εγκεκριμένη</Badge>;
    }
    return <Badge variant="outline" className="rounded-none">Προγραμματισμένη</Badge>;
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

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#00ffba]" />
                <span className="font-medium">{booking.section?.name || 'Gym Visit'}</span>
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

            {isAdmin && booking.app_users && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span>{booking.app_users.name}</span>
                <span className="text-gray-400">({booking.app_users.email})</span>
              </div>
            )}

            {booking.notes && (
              <p className="text-sm text-gray-500 mb-2">
                {booking.notes}
              </p>
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
                  Ακύρωση
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};