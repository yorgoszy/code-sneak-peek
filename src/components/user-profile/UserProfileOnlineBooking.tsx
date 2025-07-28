import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Clock, Users, MapPin, X } from "lucide-react";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useUserBookings } from "@/hooks/useUserBookings";
import { format } from "date-fns";
import { toast } from "sonner";
import { UserWaitingLists } from "./bookings/UserWaitingLists";
import { WeeklyBookingCalendar } from "./bookings/WeeklyBookingCalendar";
import { SectionBookingCalendar } from "./bookings/SectionBookingCalendar";
import { useBookingSections } from "@/hooks/useBookingSections";

interface UserProfileOnlineBookingProps {
  userProfile: any;
}

export const UserProfileOnlineBooking: React.FC<UserProfileOnlineBookingProps> = ({ 
  userProfile 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [showNoVisitsDialog, setShowNoVisitsDialog] = useState(false);
  const { availability, bookings, loading, createBooking, cancelBooking } = useUserBookings();
  const { sections } = useBookingSections();

  useEffect(() => {
    if (userProfile?.id) {
      // Any additional setup can go here
    }
  }, [userProfile]);

  const handleBookingTypeClick = (type: string, requiresPurchase?: boolean) => {
    if (requiresPurchase) {
      // Show no visits dialog instead of navigating to shop
      setShowNoVisitsDialog(true);
      return;
    }
    
    setSelectedBookingType(type);
    setShowCalendar(true);
  };

  const handleCreateBooking = async (sectionId: string, date: string, time: string, type: string) => {
    try {
      const bookingData = await createBooking(sectionId, date, time, type);
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

  // Booking options - only gym visits
  const bookingOptions = [
    {
      id: 'gym_visit',
      title: 'Κύριο Γυμναστήριο',
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
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* No visits dialog */}
      <Dialog open={showNoVisitsDialog} onOpenChange={setShowNoVisitsDialog}>
        <DialogContent className="max-w-md mx-auto rounded-none p-0 border-none [&>button]:hidden">
          <div className="bg-white border border-gray-200 rounded-none" style={{ margin: '0' }}>
            <div className="p-4 md:p-6 text-center">
              <X className="h-6 w-6 text-red-500 mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Δεν έχεις διαθέσιμες επισκέψεις
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                Για να κλείσεις ραντεβού, χρειάζεται να αγοράσεις επισκέψεις από τις αγορές
              </p>
              
              <Button 
                onClick={() => setShowNoVisitsDialog(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-none"
              >
                Κλείσε
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="text-center px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Online Booking</h2>
        <p className="text-sm md:text-base text-gray-600">Κλείσε online τα ραντεβού σου για προπονήσεις και συνεδρίες</p>
        
        {availability && availability.type !== 'none' && (
          <div className="mt-4 flex justify-center">
            {availability.type === 'hypergym' && (
              <Badge variant="outline" className="rounded-none text-xs md:text-sm">
                Επισκέψεις: {availability.available_monthly}/{availability.total_monthly} διαθέσιμες αυτό το μήνα
              </Badge>
            )}
            {availability.type === 'visit_packages' && (
              <Badge variant="outline" className="rounded-none text-xs md:text-sm">
                Επισκέψεις: {availability.available_visits} διαθέσιμες
              </Badge>
            )}
          </div>
        )}
      </div>


      {/* All Section Booking Calendars - Show sections user has access to */}
      <div className="px-4 md:px-0 space-y-6">
        {sections
          .filter(section => {
            // Show sections user has access to based on their subscription/packages
            const hasAccess = availability?.allowed_sections && availability.allowed_sections.includes(section.id);
            return hasAccess;
          })
          .map(section => {
            const sectionBookings = bookings.filter(booking => 
              booking.section_id === section.id
            );
            
            return (
              <SectionBookingCalendar
                key={section.id}
                sectionId={section.id}
                sectionName={section.name}
                availableHours={section.available_hours}
                bookings={sectionBookings}
                onCancelBooking={handleCancelBooking}
                onCreateBooking={handleCreateBooking}
                availability={availability}
              />
            );
          })
        }
        
        {/* Show message if user has no access to any sections */}
        {sections.filter(section => {
          const hasAccess = availability?.allowed_sections && availability.allowed_sections.includes(section.id);
          return hasAccess;
        }).length === 0 && (
          <Card className="rounded-none">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                Δεν έχεις πρόσβαση σε κάποιο τμήμα. Επικοινώνησε με τη διοίκηση για περισσότερες πληροφορίες.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Waiting Lists Section */}
      <div className="px-4 md:px-0">
        <UserWaitingLists />
      </div>

      {/* Available Hours Info */}
      <div className="px-4 md:px-0">
        <Card className="rounded-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center text-base md:text-lg">
              <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Διαθέσιμες Ώρες
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 text-gray-600 text-sm md:text-base">
              <p>• Δευτέρα - Παρασκευή: 08:00 - 20:00</p>
              <p>• Σαββατοκύριακα: κλειστά</p>
              <p>• Για επείγουσες αλλαγές επικοινώνησε τηλεφωνικά</p>
              <p className="text-red-600">• Μπορείς να ακυρώσεις ή να αναβάλεις το ραντεβού σου έως 12 ώρες πριν</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};