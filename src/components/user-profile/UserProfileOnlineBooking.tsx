import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Video, X } from "lucide-react";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useUserBookings } from "@/hooks/useUserBookings";
import { format } from "date-fns";
import { toast } from "sonner";

interface UserProfileOnlineBookingProps {
  userProfile: any;
}

export const UserProfileOnlineBooking: React.FC<UserProfileOnlineBookingProps> = ({ 
  userProfile 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const { availability, bookings, loading, createBooking, cancelBooking } = useUserBookings();

  const handleBookingTypeClick = (type: string) => {
    if (type === 'videocall') {
      toast.info('Οι videocall συνεδρίες θα είναι σύντομα διαθέσιμες');
      return;
    }
    
    setSelectedBookingType(type);
    setShowCalendar(true);
  };

  const handleCreateBooking = async (sectionId: string, date: string, time: string, type: string) => {
    try {
      await createBooking(sectionId, date, time, type);
      toast.success('Το ραντεβού δημιουργήθηκε επιτυχώς!');
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
      requiresPurchase: availability?.type === 'none'
    },
    {
      id: 'videocall',
      title: 'Videocall Συνεδρίες',
      description: 'Online συνεδρίες με τον προπονητή σου',
      icon: Video,
      color: 'bg-green-100 text-green-600',
      available: false,
      requiresPurchase: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Online Booking</h2>
        <p className="text-gray-600">Κλείσε online τα ραντεβού σου για προπονήσεις και συνεδρίες</p>
        {availability && (
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
            {availability.type === 'none' && (
              <Badge variant="destructive" className="rounded-none">
                Δεν έχεις ενεργό πακέτο - <a href="/dashboard/user-profile/shop" className="underline">Αγόρασε πακέτο</a>
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
                disabled={!option.available}
                onClick={() => handleBookingTypeClick(option.id)}
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none disabled:bg-gray-300 disabled:text-gray-500"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {option.requiresPurchase ? 'Αγόρασε Πακέτο' : option.available ? 'Κλείσε Ραντεβού' : 'Σύντομα'}
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
              {bookings.map((booking) => (
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
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    className="rounded-none"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ακύρωση
                  </Button>
                </div>
              ))}
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