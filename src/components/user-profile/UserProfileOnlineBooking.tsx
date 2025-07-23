import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Video, X } from "lucide-react";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useUserBookings } from "@/hooks/useUserBookings";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileOnlineBookingProps {
  userProfile: any;
}

export const UserProfileOnlineBooking: React.FC<UserProfileOnlineBookingProps> = ({ 
  userProfile 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [videocallData, setVideocallData] = useState<{used: number, total: number, remaining: number} | null>(null);
  const { availability, bookings, loading, createBooking, cancelBooking } = useUserBookings();

  useEffect(() => {
    const fetchVideocallData = async () => {
      if (!userProfile?.id) return;
      
      try {
        // Φόρτωση ενεργών videocall packages
        const { data: videocallPackages, error } = await supabase
          .from('videocall_packages')
          .select('total_videocalls, remaining_videocalls, status')
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .order('purchase_date', { ascending: false });

        if (error) {
          console.error('Error fetching videocall packages:', error);
          setVideocallData(null);
          return;
        }

        // Βρες το πιο πρόσφατο ενεργό πακέτο
        const activePackage = videocallPackages?.[0];
        
        if (!activePackage) {
          setVideocallData(null);
          return;
        }

        // Υπολογισμός χρησιμοποιημένων βιντεοκλήσεων
        const usedVideocalls = activePackage.total_videocalls - activePackage.remaining_videocalls;

        setVideocallData({
          used: usedVideocalls,
          total: activePackage.total_videocalls,
          remaining: activePackage.remaining_videocalls
        });

      } catch (error) {
        console.error('Error fetching videocall data:', error);
        setVideocallData(null);
      }
    };

    fetchVideocallData();
  }, [userProfile?.id]);

  const handleBookingTypeClick = (type: string, requiresPurchase?: boolean) => {
    if (requiresPurchase) {
      // Navigate to shop
      window.location.href = `/dashboard/user-profile/${userProfile.id}/shop`;
      return;
    }
    
    console.log('🔍 Debug videocall booking:', {
      type,
      has_videocall: availability?.has_videocall,
      videocall_packages_available: availability?.videocall_packages_available,
      single_videocall_sessions: availability?.single_videocall_sessions,
      full_availability: availability
    });
    
    if (type === 'videocall') {
      const hasVideocallAccess = availability?.has_videocall;
      const hasAvailableSessions = (availability?.videocall_packages_available || 0) > 0 || (availability?.single_videocall_sessions || 0) > 0;
      
      if (!hasVideocallAccess || !hasAvailableSessions) {
        toast.error('Δεν έχεις διαθέσιμες βιντεοκλήσεις');
        return;
      }
    }
    
    setSelectedBookingType(type);
    setShowCalendar(true);
  };

  const handleCreateBooking = async (sectionId: string, date: string, time: string, type: string) => {
    try {
      await createBooking(sectionId, date, time, type);
      toast.success('Το ραντεβού δημιουργήθηκε επιτυχώς!');
      
      // Αν είναι videocall booking, ενημέρωσε τα local στατιστικά
      if (type === 'videocall' && videocallData) {
        setVideocallData({
          ...videocallData,
          used: videocallData.used + 1,
          remaining: videocallData.remaining - 1
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Σφάλμα κατά τη δημιουργία του ραντεβού');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast.success('Το ραντεβού ακυρώθηκε επιτυχώς');
    } catch (error: any) {
      toast.error(error.message || 'Δεν μπορείς να ακυρώσεις το ραντεβού (λιγότερο από 12 ώρες)');
    }
  };

  // Helper function to calculate time remaining for cancellation
  const getTimeRemainingForCancellation = (bookingDate: string, bookingTime: string) => {
    const bookingDateTime = new Date(`${bookingDate} ${bookingTime}`);
    const cancellationDeadline = new Date(bookingDateTime.getTime() - 12 * 60 * 60 * 1000); // 12 hours before
    const now = new Date();
    
    if (now >= cancellationDeadline) {
      return null; // Cannot cancel anymore
    }
    
    const timeDiff = cancellationDeadline.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} μέρες, ${hours} ώρες`;
    } else {
      return `${hours} ώρες`;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  if (showCalendar) {
    return (
      <BookingCalendar
        onBookingCreate={handleCreateBooking}
        onClose={() => setShowCalendar(false)}
        bookingType={selectedBookingType}
        availability={availability}
      />
    );
  }

  // Booking options based on user's availability
  const bookingOptions = [
    {
      id: 'gym_visit',
      title: 'Επισκέψεις Γυμναστηρίου',
      description: availability?.type === 'none' 
        ? 'Χρειάζεται αγορά πακέτου για κρατήσεις'
        : 'Κλείσε το ραντεβού σου για προπόνηση',
      icon: MapPin,
      color: 'bg-blue-100 text-blue-600',
      available: availability && (
        (availability.type === 'hypergym' && availability.available_monthly > 0) ||
        (availability.type === 'visit_packages' && availability.available_visits > 0)
      ),
      requiresPurchase: availability?.type === 'none',
      availableVisits: availability?.type === 'visit_packages' ? availability.available_visits : 0,
      totalVisits: availability?.type === 'visit_packages' ? availability.total_visits : 0
    },
    {
      id: 'videocall',
      title: 'Videocall Συνεδρίες',
      description: (availability?.has_videocall && (availability?.videocall_packages_available > 0 || availability?.single_videocall_sessions > 0))
        ? 'Online συνεδρίες με τον προπονητή σου'
        : 'Χρειάζεται αγορά πακέτου βιντεοκλήσεων',
      icon: Video,
      color: 'bg-green-100 text-green-600',
      available: availability?.has_videocall && (availability?.videocall_packages_available > 0 || availability?.single_videocall_sessions > 0),
      requiresPurchase: !availability?.has_videocall || (availability?.videocall_packages_available === 0 && availability?.single_videocall_sessions === 0),
      remainingVideocalls: (availability?.videocall_packages_available || 0) + (availability?.single_videocall_sessions || 0)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Booking</h2>
        <p className="text-gray-600">Κλείσε online τα ραντεβού σου για προπονήσεις και συνεδρίες</p>
        
        
        {availability && availability.type !== 'none' && (
          <div className="mt-4 flex justify-center">
            {availability.type === 'hypergym' && (
              <Badge variant="outline" className="rounded-none">
                Hypergym: {availability.available_monthly}/{availability.total_monthly} διαθέσιμες αυτό το μήνα
              </Badge>
            )}
            {availability.type === 'visit_packages' && (
              <Badge variant="outline" className="rounded-none">
                Επισκέψεις: {availability.available_visits} διαθέσιμες
              </Badge>
            )}
            {availability.type === 'videocall' && (
              <Badge variant="outline" className="rounded-none">
                Videocall Coaching ενεργή
              </Badge>
            )}
            {availability.type === 'single_videocall' && (
              <Badge variant="outline" className="rounded-none">
                {availability.single_videocall_sessions} videocall sessions διαθέσιμες
              </Badge>
            )}
            {availability?.has_videocall && availability.type !== 'videocall' && availability.type !== 'single_videocall' && (
              <Badge variant="outline" className="rounded-none bg-green-50 text-green-700 border-green-200">
                + Videocall διαθέσιμο ({(availability.videocall_packages_available || 0) + (availability.single_videocall_sessions || 0)} sessions)
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookingOptions.map((option) => (
          <Card key={option.id} className="rounded-none hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 ${option.color} rounded-none mx-auto mb-4`}>
                <option.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">{option.title}</CardTitle>
              <p className="text-gray-600">{option.description}</p>
              {!option.available && (
                <Badge variant="secondary" className="rounded-none">
                  Σύντομα Διαθέσιμο
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="text-center">
              <Button 
                disabled={!option.available && !option.requiresPurchase}
                onClick={() => handleBookingTypeClick(option.id, option.requiresPurchase)}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none disabled:bg-gray-300 disabled:text-gray-500"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {option.requiresPurchase ? 'Αγόρασε Πακέτο' : 
                 option.available ? 
                   (option.id === 'gym_visit' && option.availableVisits > 0 ? 
                     `${option.availableVisits} Διαθέσιμες Επισκέψεις` : 
                     option.id === 'videocall' && option.remainingVideocalls > 0 ?
                     `${option.remainingVideocalls} Διαθέσιμες Κλήσεις` :
                     'Κλείσε Ραντεβού') : 
                   'Σύντομα'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Bookings Section */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Τα Επόμενα Ραντεβού Σου
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Δεν έχεις επερχόμενα ραντεβού</h3>
              <p>Κλείσε ένα ραντεβού από τις παραπάνω επιλογές</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const timeRemaining = getTimeRemainingForCancellation(booking.booking_date, booking.booking_time);
                const canCancel = timeRemaining !== null;
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-none">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-[#00ffba] text-black rounded-none">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{booking.section?.name}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(booking.booking_date), 'dd/MM/yyyy')} στις {booking.booking_time}
                        </p>
                        {canCancel ? (
                          <p className="text-xs text-green-600">
                            Μπορείς να ακυρώσεις για άλλες {timeRemaining}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">
                            Δεν μπορείς να ακυρώσεις (λιγότερο από 12 ώρες)
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canCancel}
                      onClick={() => handleCancelBooking(booking.id)}
                      className="rounded-none disabled:opacity-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Ακύρωση
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Hours Info */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Διαθέσιμες Ώρες
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-600">
            <p>• Δευτέρα - Παρασκευή: 08:00 - 20:00</p>
            <p>• <del>Σαββατοκύριακα: κλειστά</del></p>
            <p>• Μπορείς να ακυρώσεις ή να αναβάλεις το ραντεβού σου έως 12 ώρες πριν</p>
            <p>• Για επείγουσες αλλαγές επικοινώνησε τηλεφωνικά</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};