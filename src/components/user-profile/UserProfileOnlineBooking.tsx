import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Clock, Users, MapPin, X, ShoppingCart } from "lucide-react";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useUserBookings } from "@/hooks/useUserBookings";
import { format } from "date-fns";
import { toast } from "sonner";
import { UserWaitingLists } from "./bookings/UserWaitingLists";
import { WeeklyBookingCalendar } from "./bookings/WeeklyBookingCalendar";
import { SectionBookingCalendar } from "./bookings/SectionBookingCalendar";
import { useBookingSections } from "@/hooks/useBookingSections";
import { useNavigate } from "react-router-dom";

interface UserProfileOnlineBookingProps {
  userProfile: any;
  visits?: any[];
}

export const UserProfileOnlineBooking: React.FC<UserProfileOnlineBookingProps> = ({ 
  userProfile,
  visits = []
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [showNoVisitsDialog, setShowNoVisitsDialog] = useState(false);
  const { availability, bookings, loading, createBooking, cancelBooking } = useUserBookings();
  const { sections } = useBookingSections();
  const navigate = useNavigate();

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
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowNoVisitsDialog(false);
                    navigate(`/dashboard/user-profile/${userProfile?.id}?tab=shop`);
                  }}
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Αγόρασε επίσκεψη
                </Button>
                
                <Button 
                  onClick={() => setShowNoVisitsDialog(false)}
                  variant="outline"
                  className="w-full rounded-none"
                >
                  Κλείσε
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="px-4 md:px-0">
        <p className="text-sm md:text-base text-gray-600 text-left">Κλείσε online τα ραντεβού σου για προπονήσεις και συνεδρίες</p>
        
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


      {/* All Section Booking Calendars - Show all sections except videocalls, only allow booking if user has access */}
      <div className="px-4 md:px-0 space-y-6">
        {sections
          .filter(section => !section.name.toLowerCase().includes('βιντεοκλήσεις') && !section.name.toLowerCase().includes('videocall'))
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
                maxCapacity={section.max_capacity}
                allSectionBookings={bookings}
              />
            );
          })
        }
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

      {/* Ιστορικό Επισκέψεων */}
      <div className="px-4 md:px-0">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Ιστορικό Επισκέψεων</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length > 0 ? (
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div key={visit.id} className="border border-gray-200 rounded-none p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                        </span>
                        <Clock className="h-4 w-4 text-gray-500 ml-4" />
                        <span className="text-sm text-gray-600">
                          {visit.visit_time}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-none text-xs ${
                        visit.visit_type === 'auto' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {visit.visit_type === 'auto' ? 'Αυτόματη' : 'Χειροκίνητη'}
                      </span>
                    </div>
                    
                    {visit.location && (
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{visit.location}</span>
                      </div>
                    )}
                    
                    {visit.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{visit.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Δημιουργήθηκε: {new Date(visit.created_at).toLocaleString('el-GR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Δεν υπάρχουν επισκέψεις</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Πακέτα Επισκέψεων */}
      <div className="px-4 md:px-0">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Πακέτα Επισκέψεων</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-gray-500">
              <p>Σύντομα θα εμφανίζονται εδώ τα πακέτα επισκέψεων</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};