import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Video, Calendar, Lock, ExternalLink, Play, Users, Clock, MapPin, X } from "lucide-react";
import { VideocallWaitingLists } from "@/components/user-profile/bookings/VideocallWaitingLists";
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
  allowed_sections?: string[];
}

interface VideocallBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  meeting_link?: string;
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
  const [showNoVideocallDialog, setShowNoVideocallDialog] = useState(false);

  const handleBookingCreate = async (sectionId: string, date: string, time: string, type: string) => {
    console.log('🔍 handleBookingCreate called with:', { sectionId, date, time, type, userProfileId: userProfile?.id });
    
    try {
      if (!userProfile?.id) {
        console.error('❌ No user profile ID available');
        throw new Error('User profile not found');
      }

      console.log('📤 Inserting booking with data:', {
        user_id: userProfile.id,
        section_id: sectionId,
        booking_date: date,
        booking_time: time,
        booking_type: type,
        status: type === 'videocall' ? 'pending' : 'confirmed'
      });

      const { data, error } = await supabase
        .from('booking_sessions')
        .insert({
          user_id: userProfile.id,
          section_id: sectionId,
          booking_date: date,
          booking_time: time,
          booking_type: type,
          status: type === 'videocall' ? 'pending' : 'confirmed'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Booking created successfully:', data);

      // For videocall bookings, charge the package immediately (even for pending)
      if (type === 'videocall') {
        try {
          await supabase.rpc('record_videocall', {
            p_user_id: userProfile.id,
            p_videocall_type: 'booking',
            p_notes: `Booking ID: ${data.id}`
          });
          console.log('✅ Videocall recorded successfully');
        } catch (videocallError) {
          console.error('❌ Error recording videocall:', videocallError);
          // Don't throw error, booking was created successfully
        }
      }

      // Send booking notification
      try {
        if (type === 'videocall') {
          // For videocalls, send pending notification to admin
          await supabase.functions.invoke('send-videocall-notifications', {
            body: {
              type: 'booking_pending',
              bookingId: data.id,
              adminEmail: 'yorgoszy@gmail.com'
            }
          });
        } else {
          // For gym visits, send created notification 
          await supabase.functions.invoke('send-videocall-notifications', {
            body: {
              type: 'booking_created',
              bookingId: data.id,
              userId: userProfile.id
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending booking notification:', notificationError);
        // Don't throw error here - booking is already created
      }
      
      toast.success('Το ραντεβού δημιουργήθηκε επιτυχώς!');
      fetchVideocallBookings();
      fetchAvailability();
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      toast.error(`Σφάλμα κατά τη δημιουργία του ραντεβού: ${error.message || error}`);
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
        .in('status', ['confirmed', 'pending', 'rejected'])
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      setVideocallBookings(data || []);
    } catch (error) {
      console.error('Error fetching videocall bookings:', error);
    }
  };

  const deleteRejectedBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Το απορριφθέν ραντεβού διαγράφηκε επιτυχώς');
      fetchVideocallBookings();
    } catch (error) {
      console.error('Error deleting rejected booking:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του ραντεβού');
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

      // Get booking details before deletion for notification
      const { data: bookingDetails } = await supabase
        .from('booking_sessions')
        .select('status, booking_date, booking_time, booking_type, user_id')
        .eq('id', bookingId)
        .single();

      // Delete the booking
      const { error } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      // Always return videocall to package since it was charged immediately
      try {
        // Find active videocall package and increase remaining_videocalls
        const { data: activePackage } = await supabase
          .from('videocall_packages')
          .select('*')
          .eq('user_id', userProfile.id)
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
          // If no active package, look for 'used' package that can become active again
          const { data: usedPackage } = await supabase
            .from('videocall_packages')
            .select('*')
            .eq('user_id', userProfile.id)
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

        // Also delete the videocall record if it exists
        await supabase
          .from('user_videocalls')
          .delete()
          .ilike('notes', `%Booking ID: ${bookingId}%`);

      } catch (packageError) {
        console.error('Error returning videocall to package:', packageError);
      }

      // Send cancellation notification
      try {
        await supabase.functions.invoke('send-videocall-notifications', {
          body: {
            type: 'booking_cancelled',
            bookingId: bookingId,
            userId: bookingDetails?.user_id,
            bookingDate: bookingDetails?.booking_date,
            bookingTime: bookingDetails?.booking_time
          }
        });
      } catch (notificationError) {
        console.error('Error sending cancellation notification:', notificationError);
        // Don't throw error here - booking is already cancelled
      }

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
      return `${days}μ και ${hours}ω`;
    } else {
      return `${hours}ω`;
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Coaching</h2>
        <p className="text-gray-600">Συνδέσου με τον προπονητή σου μέσω βιντεοκλήσης</p>
        {availability && (
          <div className="mt-4 flex justify-center gap-4">
            <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200">
              {availability.videocall_subscription 
                ? `${availability.videocall_subscription} - Απεριόριστες συνεδρίες`
                : availability.single_videocall_sessions && availability.single_videocall_sessions > 0
                  ? `${availability.single_videocall_sessions} συνεδρία${availability.single_videocall_sessions > 1 ? 'ες' : ''} διαθέσιμη${availability.single_videocall_sessions > 1 ? 'ες' : ''}`
                  : 'Videocall διαθέσιμο'
              }
            </Badge>
            {((availability.videocall_packages_available || 0) > 0 || (availability.single_videocall_sessions || 0) > 0) && (
              <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-700 border-blue-200">
                + Videocall διαθέσιμο ({(availability.videocall_packages_available || 0) + (availability.single_videocall_sessions || 0)} sessions)
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Videocall Sessions Card */}
      <Card className="rounded-none hover:shadow-lg transition-shadow">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-none mx-auto mb-4">
            <Video className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Videocall Συνεδρίες</CardTitle>
          <p className="text-gray-600">Online συνεδρίες με τον προπονητή σου</p>
        </CardHeader>
        
        <CardContent className="text-center">
          <Button 
            onClick={() => {
              const hasVideocalls = ((availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)) > 0;
              if (hasVideocalls) {
                setBookingCalendarOpen(true);
              } else {
                setShowNoVideocallDialog(true);
              }
            }}
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {((availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)) > 0
              ? `${(availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)} Διαθέσιμες Κλήσεις`
              : 'Κλείσε Videocall'
            }
          </Button>
        </CardContent>
      </Card>

      {/* No videocalls dialog */}
      <Dialog open={showNoVideocallDialog} onOpenChange={setShowNoVideocallDialog}>
        <DialogContent className="max-w-md mx-auto rounded-none p-0 border-none [&>button]:hidden">
          <div className="bg-white border border-gray-200 rounded-none" style={{ margin: '0' }}>
            <div className="p-6 text-center">
              <X className="h-6 w-6 text-red-500 mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Δεν έχεις διαθέσιμες βιντεοκλήσεις
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                Για να κλείσεις videocall, χρειάζεται να αγοράσεις μια βιντεοκλήση από τις αγορές
              </p>
              
              <Button 
                onClick={() => setShowNoVideocallDialog(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-none"
              >
                Κλείσε
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Calendar Modal */}
      {bookingCalendarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-none max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <BookingCalendar
              onBookingCreate={handleBookingCreate}
              onClose={handleBookingClose}
              bookingType="videocall"
              availability={availability}
            />
          </div>
        </div>
      )}

      {/* Upcoming Videocall Bookings - First Card */}
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
                  <div key={booking.id} className="border border-gray-200 rounded-none p-2 md:p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-[#00ffba] text-black rounded-none flex-shrink-0">
                          <Video className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs md:text-sm truncate">
                            {format(new Date(booking.booking_date), 'dd/MM/yyyy')} στις {booking.booking_time.slice(0, 5)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {booking.section?.name || 'Videocall Session'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {booking.status !== 'rejected' && (
                          <span className="text-xs text-red-600 font-medium hidden sm:block">
                            Απομένουν: {timeRemaining}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs rounded-none ${
                            booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            booking.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : ''
                          }`}
                        >
                          {booking.status === 'pending' ? 'Εκκρεμεί' :
                           booking.status === 'rejected' ? 'Απορρίφθηκε' :
                           booking.status === 'confirmed' ? 'Εγκεκριμένη' : booking.status}
                        </Badge>
                        {booking.meeting_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Get user name from profile
                              const userName = userProfile?.name || userProfile?.email || 'User';
                              const meetingUrl = `${booking.meeting_link}#userInfo.displayName="${userName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
                              window.open(meetingUrl, '_blank');
                            }}
                            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-2 md:px-3"
                          >
                            <Video className="w-3 h-3" />
                            <span className="hidden md:inline ml-1">Συμμετοχή</span>
                          </Button>
                        )}
                        {booking.status === 'rejected' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRejectedBooking(booking.id)}
                            className="rounded-none px-2 md:px-3"
                          >
                            <X className="w-3 h-3" />
                            <span className="hidden md:inline ml-1">Διαγραφή</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => canCancelBooking(booking.booking_date, booking.booking_time) ? cancelBooking(booking.id) : null}
                            disabled={!canCancelBooking(booking.booking_date, booking.booking_time)}
                            className={`rounded-none px-2 md:px-3 ${
                              !canCancelBooking(booking.booking_date, booking.booking_time) 
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' 
                                : ''
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span className="hidden md:inline ml-1">Ακύρωση</span>
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

      {/* Videocall Waiting Lists Component - Second Card - only show if user has no videocalls available */}
      {((availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)) === 0 && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Λίστα Αναμονής Videocalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideocallWaitingLists userProfile={userProfile} />
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
            <p className="text-red-600 font-medium">• Η ακύρωση των βιντεοκλήσεων επιτρέπεται μέχρι 12 ώρες πριν από την προγραμματισμένη ώρα</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};