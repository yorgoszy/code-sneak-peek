import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, X } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { useBookingSections } from "@/hooks/useBookingSections";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  onBookingCreate: (sectionId: string, date: string, time: string, type: string) => Promise<void>;
  onClose: () => void;
  bookingType: string;
  availability: any;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onBookingCreate,
  onClose,
  bookingType,
  availability
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fullSlots, setFullSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { sections, getTimeSlotStatus } = useBookingSections(bookingType);

  // Set default section when sections load
  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  // Update available slots when date or section changes
  useEffect(() => {
    if (selectedDate && selectedSection) {
      updateAvailableSlots();
    }
  }, [selectedDate, selectedSection]);

  const updateAvailableSlots = async () => {
    if (!selectedDate || !selectedSection) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { available, full } = await getTimeSlotStatus(selectedSection, dateStr, bookingType);
    setAvailableSlots(available);
    setFullSlots(full);
    setSelectedTime(''); // Reset selected time when slots change
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedSection || !selectedTime) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await onBookingCreate(selectedSection, dateStr, selectedTime, bookingType);
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const canBook = () => {
    if (!availability) return false;

    if (bookingType === 'videocall') {
      return availability.has_videocall && 
        ((availability.single_videocall_sessions || 0) > 0 || (availability.videocall_packages_available || 0) > 0);
    }

    if (availability.type === 'hypergym') {
      return availability.available_monthly > 0;
    } else if (availability.type === 'visit_packages') {
      return availability.available_visits > 0;
    }
    
    return false;
  };

  if (!canBook()) {
    return (
      <Card className="rounded-none max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Δεν έχεις διαθέσιμες επισκέψεις</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {bookingType === 'videocall' 
              ? 'Για να κλείσεις videocall, χρειάζεται να έχεις διαθέσιμες βιντεοκλήσεις.'
              : 'Για να κλείσεις ραντεβού, χρειάζεται να έχεις ενεργό πακέτο επισκέψεων ή συνδρομή Hypergym.'
            }
          </p>
          <Button onClick={onClose} className="w-full rounded-none">
            Κλείσιμο
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {bookingType === 'videocall' ? 'Κλείσε Videocall' : 'Κλείσε Ραντεβού'}
            </CardTitle>
            <div className="mt-2">
              {bookingType === 'videocall' && availability?.has_videocall && (
                <Badge variant="outline" className="rounded-none">
                  Videocalls: {(availability.videocall_packages_available || 0) + (availability.single_videocall_sessions || 0)} διαθέσιμες
                </Badge>
              )}
              {bookingType !== 'videocall' && availability?.type === 'hypergym' && (
                <Badge variant="outline" className="rounded-none">
                  Hypergym: {availability.available_monthly}/{availability.total_monthly} διαθέσιμες αυτό το μήνα
                </Badge>
              )}
              {bookingType !== 'videocall' && availability?.type === 'visit_packages' && (
                <Badge variant="outline" className="rounded-none">
                  Επισκέψεις: {availability.available_visits} διαθέσιμες
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επίλεξε Ημερομηνία</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < addDays(new Date(), 0)}
              className={cn("w-full pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Section & Time Selection */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επίλεξε Χώρο & Ώρα</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Section Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {bookingType === 'videocall' ? 'Χώρος Videocall' : 'Χώρος Γυμναστηρίου'}
              </label>
               <div className="space-y-2">
                {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={selectedSection === section.id ? "default" : "outline"}
                      className="w-full justify-start rounded-none"
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{section.name}</div>
                        {section.description && (
                          <div className="text-xs text-gray-500">{section.description}</div>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && selectedSection && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Διαθέσιμες Ώρες για {format(selectedDate, 'dd/MM/yyyy')}
                </label>
                {(availableSlots.length > 0 || fullSlots.length > 0) ? (
                  <div className="grid grid-cols-3 gap-2">
                    {/* Available slots */}
                    {availableSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setSelectedTime(time)}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                      </Button>
                    ))}
                    {/* Full slots - grayed out and not clickable */}
                    {fullSlots.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        className="rounded-none opacity-40 cursor-not-allowed"
                        disabled
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                        <span className="ml-1 text-xs">(Πλήρης)</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία
                  </p>
                )}
              </div>
            )}

            {/* Booking Button */}
            <Button
              onClick={handleBookingSubmit}
              disabled={!selectedDate || !selectedSection || !selectedTime || loading}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {loading ? 'Δημιουργία...' : 'Επιβεβαίωση Ραντεβού'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};