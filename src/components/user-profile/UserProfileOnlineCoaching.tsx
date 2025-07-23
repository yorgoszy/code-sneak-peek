import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Lock, ExternalLink, Play, Users, Clock, MapPin, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { BookingCalendar } from "@/components/booking/BookingCalendar";

interface UserProfileOnlineCoachingProps {
  userProfile: any;
}

interface UserAvailability {
  type: string;
  has_videocall?: boolean;
  videocall_subscription?: string;
  single_videocall_sessions?: number;
  videocall_packages_available?: number;
}

interface VideocallBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  section?: {
    name: string;
    description?: string;
  };
}

export const UserProfileOnlineCoaching: React.FC<UserProfileOnlineCoachingProps> = ({ 
  userProfile 
}) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<UserAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [videocallBookings, setVideocallBookings] = useState<VideocallBooking[]>([]);
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);

  const handleBookingCreate = async (sectionId: string, date: string, time: string, type: string) => {
    try {
      const { data, error } = await supabase
        .from('booking_sessions')
        .insert({
          user_id: userProfile.id,
          section_id: sectionId,
          booking_date: date,
          booking_time: time,
          booking_type: type,
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      // Record the videocall usage
      await supabase.rpc('record_videocall', {
        p_user_id: userProfile.id,
        p_created_by: null,
        p_videocall_type: 'booked',
        p_notes: `Videocall booking for ${date} at ${time}`
      });

      toast.success('Το ραντεβού δημιουργήθηκε επιτυχώς!');
      fetchVideocallBookings();
      fetchAvailability();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Σφάλμα κατά τη δημιουργία του ραντεβού');
    }
  };

  const handleBookingClose = () => {
    setBookingCalendarOpen(false);
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchAvailability();
      fetchVideocallBookings();
    }
  }, [userProfile]);

  const fetchAvailability = async () => {
    if (!userProfile?.id) return;

    try {
      const { data } = await supabase.rpc('get_user_available_bookings', {
        user_uuid: userProfile.id
      });

      setAvailability(data as unknown as UserAvailability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideocallBookings = async () => {
    if (!userProfile?.id) return;

    try {
      const { data } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description)
        `)
        .eq('user_id', userProfile.id)
        .eq('booking_type', 'videocall')
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      setVideocallBookings(data || []);
    } catch (error) {
      console.error('Error fetching videocall bookings:', error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { data: canCancel } = await supabase.rpc('can_cancel_booking', {
        booking_id: bookingId
      });

      if (!canCancel) {
        toast.error('Δεν μπορείς να ακυρώσεις το ραντεβού εντός 12 ωρών');
        return;
      }

      const { error } = await supabase
        .from('booking_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Το ραντεβού ακυρώθηκε επιτυχώς');
      fetchVideocallBookings();
      fetchAvailability();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Σφάλμα κατά την ακύρωση του ραντεβού');
    }
  };

  const getTimeRemainingForCancellation = (bookingDate: string, bookingTime: string) => {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Έληξε';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} μέρα${days > 1 ? 'ες' : ''} ${hours} ώρα${hours !== 1 ? 'ες' : ''}`;
    } else {
      return `${hours} ώρα${hours !== 1 ? 'ες' : ''}`;
    }
  };

  const canCancelBooking = (bookingDate: string, bookingTime: string) => {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 12;
  };

  const handleJoinMeeting = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  };

  const handleStartInstantMeeting = () => {
    const room = roomName || `coaching-${Date.now()}`;
    const jitsiUrl = `https://meet.jit.si/${room}`;
    window.open(jitsiUrl, '_blank');
    toast.success('Άνοιξε νέο παράθυρο για το meeting');
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const hasVideocallAccess = availability?.has_videocall && (
    (availability?.videocall_packages_available || 0) > 0 || 
    (availability?.single_videocall_sessions || 0) > 0 ||
    availability?.videocall_subscription
  );

  if (!hasVideocallAccess) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Coaching</h2>
          <p className="text-gray-600">Χρειάζεσαι συνδρομή Videocall Coaching για πρόσβαση</p>
        </div>

        <Card className="rounded-none border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-800">Περιορισμένη Πρόσβαση</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              Για να έχεις πρόσβαση στο Online Coaching, χρειάζεσαι ενεργή συνδρομή "Videocall Coaching".
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-700">
                <Video className="w-4 h-4" />
                <span className="text-sm">Videocall συνεδρίες (ανάλογα με πακέτο)</span>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <Users className="w-4 h-4" />
                <span className="text-sm">Προσωπική καθοδήγηση από προπονητή</span>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Προγραμματισμός συνεδριών</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/dashboard/user-profile/shop'}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Αγόρασε Videocall Coaching - €39.99/μήνα
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard/user-profile/shop'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none"
              >
                Αγόρασε 1 Συνεδρία - €29.99
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Coaching</h2>
        <p className="text-gray-600">Συνδέσου με τον προπονητή σου μέσω βιντεοκλήσης</p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200">
            {availability.videocall_subscription 
              ? `${availability.videocall_subscription} - Απεριόριστες συνεδρίες`
              : availability.single_videocall_sessions && availability.single_videocall_sessions > 0
                ? `${availability.single_videocall_sessions} συνεδρία${availability.single_videocall_sessions > 1 ? 'ες' : ''} διαθέσιμη${availability.single_videocall_sessions > 1 ? 'ες' : ''}`
                : 'Videocall διαθέσιμο'
            }
          </Badge>
          {(availability.videocall_packages_available > 0 || availability.single_videocall_sessions > 0) && (
            <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-700 border-blue-200">
              + Videocall διαθέσιμο ({(availability.videocall_packages_available || 0) + (availability.single_videocall_sessions || 0)} sessions)
            </Badge>
          )}
        </div>
      </div>

      {/* Booking Calendar for Videocall */}
      <BookingCalendar
        onBookingCreate={handleBookingCreate}
        onClose={handleBookingClose}
        bookingType="videocall"
        availability={availability}
      />

      {/* Upcoming Videocall Bookings */}
      {videocallBookings.length > 0 && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Επερχόμενα Videocall Ραντεβού
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videocallBookings.map((booking) => {
                const timeRemaining = getTimeRemainingForCancellation(booking.booking_date, booking.booking_time);
                
                return (
                  <div key={booking.id} className="border border-gray-200 rounded-none p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#00ffba] text-black rounded-none">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {format(new Date(booking.booking_date), 'dd/MM/yyyy')} στις {booking.booking_time}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.section?.name || 'Videocall Session'}
                          </div>
                        </div>
                      </div>
                       <div className="flex items-center space-x-2">
                         <Badge variant="outline" className="text-xs rounded-none">
                           {booking.status}
                         </Badge>
                         <span className="text-xs text-gray-500">
                           Απομένουν: {timeRemaining}
                         </span>
                         {canCancelBooking(booking.booking_date, booking.booking_time) && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => cancelBooking(booking.id)}
                             className="rounded-none"
                           >
                             <X className="w-3 h-3 mr-1" />
                             Ακύρωση
                           </Button>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Οδηγίες Χρήσης</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-600">
            <p>• Χρησιμοποιούμε την πλατφόρμα Jitsi Meet για τις βιντεοκλήσεις</p>
            <p>• Δεν χρειάζεται εγκατάσταση - λειτουργεί απευθείας από τον browser</p>
            <p>• Για καλύτερη ποιότητα, χρησιμοποίησε Chrome ή Firefox</p>
            <p>• Βεβαιώσου ότι έχεις ενεργοποιήσει την κάμερα και το μικρόφωνο</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};