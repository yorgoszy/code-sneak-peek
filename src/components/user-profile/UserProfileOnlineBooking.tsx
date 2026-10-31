import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock, MapPin, X, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useUserBookings } from "@/hooks/useUserBookings";
import { format } from "date-fns";
import { toast } from "sonner";
import { UserWaitingLists } from "./bookings/UserWaitingLists";
import { WeeklyBookingCalendar } from "./bookings/WeeklyBookingCalendar";
import { SectionBookingCalendar } from "./bookings/SectionBookingCalendar";
import { useBookingSections } from "@/hooks/useBookingSections";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

interface UserProfileOnlineBookingProps {
  userProfile: any;
  visits?: any[];
}

export const UserProfileOnlineBooking: React.FC<UserProfileOnlineBookingProps> = ({ 
  userProfile
}) => {
  const { t } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [showNoVisitsDialog, setShowNoVisitsDialog] = useState(false);
  const { availability, bookings, loading, createBooking, cancelBooking } = useUserBookings();
  const { sections } = useBookingSections(undefined, availability?.allowed_sections);
  const navigate = useNavigate();
  const { syncBookingToCalendar } = useGoogleCalendar();

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
      const sectionInfo = sections.find(s => s.id === sectionId);
      
      toast.success(t('onlineBooking.bookingCreated'), {
        action: {
          label: '📅 Google Calendar',
          onClick: () => syncBookingToCalendar({
            booking_date: date,
            booking_time: time,
            booking_type: type,
            section_name: sectionInfo?.name,
          }),
        },
      });
    } catch (error: any) {
      toast.error(error.message || t('onlineBooking.bookingError'));
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast.success(t('onlineBooking.bookingCancelled'));
    } catch (error: any) {
      toast.error(error.message || t('onlineBooking.cannotCancel'));
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
      return `${days} ${t('onlineBooking.days')}, ${hours} ${t('onlineBooking.hours')}`;
    } else {
      return `${hours} ${t('onlineBooking.hours')}`;
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('onlineBooking.loading')}</div>;
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
      title: t('onlineBooking.mainGym'),
      description: availability?.type === 'none' 
        ? t('onlineBooking.requiresPurchase')
        : t('onlineBooking.bookYourSession'),
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
                {t('onlineBooking.noVisitsAvailable')}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                {t('onlineBooking.needToPurchase')}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowNoVisitsDialog(false);
                    navigate(`/dashboard/user-profile/${userProfile?.id}?tab=shop`);
                  }}
                  className="w-full bg-[#cb8954] hover:bg-[#cb8954]/90 text-white rounded-none"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('onlineBooking.buyVisit')}
                </Button>
                
                <Button 
                  onClick={() => setShowNoVisitsDialog(false)}
                  variant="outline"
                  className="w-full rounded-none"
                >
                  {t('onlineBooking.close')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="px-4 md:px-0">
        <p className="text-sm md:text-base text-gray-600 text-left">{t('onlineBooking.bookOnlineDescription')}</p>
        
        {availability && availability.type !== 'none' && (
          <div className="mt-4 flex justify-center">
            {availability.type === 'hypergym' && (
              <Badge variant="outline" className="rounded-none text-xs md:text-sm">
                {t('onlineBooking.visitsMonthly', { available: availability.available_monthly, total: availability.total_monthly })}
              </Badge>
            )}
            {availability.type === 'visit_packages' && (
              <Badge variant="outline" className="rounded-none text-xs md:text-sm">
                {t('onlineBooking.visitsAvailable', { available: availability.available_visits })}
              </Badge>
            )}
          </div>
        )}
      </div>


      {/* Section dropdown - pick a section to open its booking calendar */}
      <div className="px-4 md:px-0 space-y-3">
        {(() => {
          const bookableSections = sections.filter(section =>
            !section.name.toLowerCase().includes('βιντεοκλήσεις') &&
            !section.name.toLowerCase().includes('videocall')
          );
          const selectedSection = bookableSections.find(s => s.id === selectedSectionId);

          return (
            <>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="w-full rounded-none">
                  <SelectValue placeholder={t('onlineBooking.selectSection', 'Επιλέξτε τμήμα...')} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {bookableSections.map(section => (
                    <SelectItem key={section.id} value={section.id} className="rounded-none">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSection && (
                <SectionBookingCalendar
                  key={selectedSection.id}
                  userId={userProfile?.id}
                  sectionId={selectedSection.id}
                  sectionName={selectedSection.name}
                  availableHours={selectedSection.available_hours}
                  bookings={bookings.filter(booking => booking.section_id === selectedSection.id)}
                  onCancelBooking={handleCancelBooking}
                  onCreateBooking={handleCreateBooking}
                  availability={availability}
                  maxCapacity={selectedSection.max_capacity}
                  allSectionBookings={bookings}
                />
              )}
            </>
          );
        })()}
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
              {t('onlineBooking.availableHours')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 text-gray-600 text-sm md:text-base">
              <p>• {t('onlineBooking.mondayFriday')}</p>
              <p>• {t('onlineBooking.weekends')}</p>
              <p>• {t('onlineBooking.emergencyContact')}</p>
              <p className="text-red-600">• {t('onlineBooking.cancellationPolicy')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};