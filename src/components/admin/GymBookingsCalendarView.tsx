import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Camera, Ban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AttendanceDetailsDialog } from "./AttendanceDetailsDialog";
import { QRScannerAttendance } from "./QRScannerAttendance";
import { toast } from "sonner";

interface GymBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  user_id: string;
  section_id: string;
  section?: {
    name: string;
    description?: string;
    max_capacity: number;
  };
  app_users?: {
    name: string;
    email: string;
  };
}

interface BookingSection {
  id: string;
  name: string;
  description?: string;
  max_capacity: number;
  available_hours: any;
}

const AVAILABLE_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

interface SectionUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  section_id: string;
}

interface ClosedDay {
  id: string;
  closed_date: string;
  reason: string | null;
}

export const GymBookingsCalendarView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [weekBookings, setWeekBookings] = useState<{ [key: string]: GymBooking[] }>({});
  const [sectionBookingCounts, setSectionBookingCounts] = useState<{ [sectionId: string]: number }>({});
  const [sectionUsers, setSectionUsers] = useState<{ [sectionId: string]: SectionUser[] }>({});
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAllSections, setShowAllSections] = useState(false);
  
  // Dialog states
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<{
    sectionName: string;
    date: string;
    time: string;
    attendees: GymBooking[];
    sectionId?: string;
  } | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSections();
    fetchSectionUsers();
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      fetchWeekBookings();
      fetchClosedDays();
    }
  }, [currentWeek, sections]);

  // Fetch closed days for current week
  const fetchClosedDays = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('closed_days')
        .select('*')
        .gte('closed_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('closed_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      setClosedDays(data || []);
    } catch (error) {
      console.error('Error fetching closed days:', error);
    }
  };

  // Check if a date is closed
  const isDateClosed = (dateStr: string): boolean => {
    return closedDays.some(cd => cd.closed_date === dateStr);
  };

  // Toggle closed day
  const toggleClosedDay = async (dateStr: string) => {
    const existingClosed = closedDays.find(cd => cd.closed_date === dateStr);
    
    try {
      if (existingClosed) {
        // Remove closed day
        const { error } = await supabase
          .from('closed_days')
          .delete()
          .eq('id', existingClosed.id);
        
        if (error) throw error;
        setClosedDays(prev => prev.filter(cd => cd.id !== existingClosed.id));
        toast.success('Η ημέρα επαναφέρθηκε');
      } else {
        // Add closed day
        const { data, error } = await supabase
          .from('closed_days')
          .insert({
            closed_date: dateStr,
            reason: 'Κλειστά'
          })
          .select()
          .single();
        
        if (error) throw error;
        setClosedDays(prev => [...prev, data]);
        toast.success('Η ημέρα σημειώθηκε ως κλειστή');
      }
    } catch (error) {
      console.error('Error toggling closed day:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  // Fetch users who are assigned to sections with active subscriptions
  const fetchSectionUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, section_id')
        .not('section_id', 'is', null)
        .eq('subscription_status', 'active');

      if (error) throw error;

      // Group users by section_id
      const grouped: { [sectionId: string]: SectionUser[] } = {};
      (data || []).forEach(user => {
        if (user.section_id) {
          if (!grouped[user.section_id]) {
            grouped[user.section_id] = [];
          }
          grouped[user.section_id].push(user as SectionUser);
        }
      });

      setSectionUsers(grouped);
    } catch (error) {
      console.error('Error fetching section users:', error);
    }
  };

  // Set selected day to today's weekday on mount
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Convert Sunday (0) to 6, and Monday (1) to 0, etc.
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    setSelectedDayIndex(adjustedDay);
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Filter out videocall sections
      const gymSections = (data || []).filter(section => 
        !section.name.toLowerCase().includes('videocall') && 
        !section.name.toLowerCase().includes('online') &&
        !section.name.toLowerCase().includes('βιντεοκλήσεις') &&
        !section.name.toLowerCase().includes('βιντεοκληση')
      );
      
      setSections(gymSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekBookings = async () => {
    if (sections.length === 0) return;

    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      // Fetch bookings for ALL sections, not just selected ones
      const allSectionIds = sections.map(s => s.id);
      
      const { data: existingBookings, error } = await supabase
        .from('booking_sessions')
        .select(`
          *,
          section:booking_sections(name, description, max_capacity),
          app_users(name, email, avatar_url)
        `)
        .in('section_id', allSectionIds)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .in('booking_type', ['gym_visit', 'gym'])
        .in('status', ['confirmed', 'completed'])
        .order('booking_time', { ascending: true });

      if (error) throw error;

      // Group bookings by date
      const groupedBookings: { [key: string]: GymBooking[] } = {};
      // Count bookings per section
      const sectionCounts: { [sectionId: string]: number } = {};
      
      (existingBookings || []).forEach(booking => {
        if (!groupedBookings[booking.booking_date]) {
          groupedBookings[booking.booking_date] = [];
        }
        groupedBookings[booking.booking_date].push(booking);
        
        // Count per section
        sectionCounts[booking.section_id] = (sectionCounts[booking.section_id] || 0) + 1;
      });

      setWeekBookings(groupedBookings);
      setSectionBookingCounts(sectionCounts);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getLoadingBarColor = (bookingsCount: number, capacity: number) => {
    const percentage = (bookingsCount / capacity) * 100;
    if (percentage === 0) return 'bg-gray-200';
    if (percentage <= 50) return 'bg-[#00ffba]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getBookingsForDateAndTime = (date: string, time: string) => {
    const dayBookings = weekBookings[date] || [];
    return dayBookings.filter(booking => {
      const bookingTime = booking.booking_time.length > 5 
        ? booking.booking_time.substring(0, 5) 
        : booking.booking_time;
      return bookingTime === time;
    });
  };

  const getBookingCounts = (date: string, time: string) => {
    return getBookingsForDateAndTime(date, time).length;
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const selectAllSections = () => {
    setSelectedSections(sections.map(s => s.id));
  };

  const previousWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const openAttendanceDialog = (sectionName: string, date: string, time: string, bookings: GymBooking[], sectionId?: string) => {
    setSelectedSlotInfo({
      sectionName,
      date,
      time,
      attendees: bookings,
      sectionId
    });
    setAttendanceDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const dayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

  // Get combined capacity and available hours from all selected sections
  const getSelectedSectionsData = () => {
    const selectedSectionsObjs = sections.filter(s => selectedSections.includes(s.id));
    const totalCapacity = selectedSectionsObjs.reduce((sum, s) => sum + s.max_capacity, 0);
    
    // Combine available hours from all selected sections
    const combinedHours: { [day: string]: string[] } = {};
    selectedSectionsObjs.forEach(section => {
      Object.entries(section.available_hours || {}).forEach(([day, hours]) => {
        if (!combinedHours[day]) {
          combinedHours[day] = [];
        }
        (hours as string[]).forEach(hour => {
          if (!combinedHours[day].includes(hour)) {
            combinedHours[day].push(hour);
          }
        });
      });
    });
    
    // Sort hours
    Object.keys(combinedHours).forEach(day => {
      combinedHours[day].sort();
    });
    
    return { totalCapacity, combinedHours };
  };

  const { totalCapacity, combinedHours } = getSelectedSectionsData();

  // Get all unique time slots
  const getAllTimes = () => {
    const allTimes = new Set<string>();
    sections.forEach(section => {
      Object.values(section.available_hours || {}).forEach((hours: any) => {
        (hours as string[]).forEach(h => allTimes.add(h));
      });
    });
    return Array.from(allTimes).sort();
  };

  const sortedTimes = getAllTimes();

  // Visible sections for mobile
  const visibleSections = isMobile && !showAllSections ? sections.slice(0, 4) : sections;
  const hasMoreSections = isMobile && sections.length > 4;

  // Render Mobile View
  if (isMobile) {
    const selectedDay = weekDays[selectedDayIndex];
    const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
    const dayOfWeek = selectedDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return (
      <div className="space-y-3">

        {/* Week Navigation - Compact */}
        <div className="flex items-center justify-between px-1">
          <Button onClick={previousWeek} variant="ghost" size="sm" className="rounded-none h-8 px-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className={cn(
            "text-xs font-semibold",
            {
              "text-[#00ffba]": (() => {
                const now = new Date();
                const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
                const displayWeekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
                return format(currentWeekStart, 'yyyy-MM-dd') === format(displayWeekStart, 'yyyy-MM-dd');
              })()
            }
          )}>
            {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM')}
          </span>
          <Button onClick={nextWeek} variant="ghost" size="sm" className="rounded-none h-8 px-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Selector - Horizontal Scroll */}
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-2">
            {weekDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = weekBookings[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isSelected = index === selectedDayIndex;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-12 py-2 px-1 border rounded-none transition-all",
                    isSelected 
                      ? "border-[#00ffba] bg-[#00ffba]/20" 
                      : hasBookings 
                        ? "border-gray-300 bg-white"
                        : "border-gray-200 bg-gray-50",
                    isToday && !isSelected && "ring-1 ring-[#00ffba]"
                  )}
                >
                  <div className={cn(
                    "text-[10px] font-medium",
                    isSelected ? "text-gray-900" : "text-gray-600"
                  )}>
                    {dayNames[index]}
                  </div>
                  <div className={cn(
                    "text-xs font-bold",
                    isSelected ? "text-gray-900" : "text-gray-700"
                  )}>
                    {format(day, 'dd')}
                  </div>
                  {hasBookings && (
                    <div className="w-1.5 h-1.5 bg-[#00ffba] rounded-full mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Time Slots for Selected Day */}
        <div className="space-y-2">
          {sortedTimes.map((time) => {
            // Get sections that have this time slot on this day
            const sectionsForSlot = sections.filter(s => {
              const sectionHours = s.available_hours?.[dayOfWeek] || [];
              return sectionHours.includes(time);
            });

            if (sectionsForSlot.length === 0) return null;

            const dayBookings = weekBookings[selectedDateStr] || [];

            return (
              <div key={time} className="border border-gray-200 rounded-none bg-white">
                {/* Time Header */}
                <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">{time}</span>
                </div>

                {/* Sections Grid */}
                <div className="p-2 grid grid-cols-2 gap-2">
                  {sectionsForSlot.map((section) => {
                    const isSelected = selectedSections.includes(section.id);
                    
                    // Get users assigned to this section
                    const assignedUsers = sectionUsers[section.id] || [];
                    const currentBookings = assignedUsers.length;
                    const capacity = section.max_capacity;

                    return (
                      <div 
                        key={section.id} 
                        className={cn(
                          "p-2 rounded-none transition-all cursor-pointer",
                          isSelected 
                            ? 'bg-[#00ffba]/20 border border-[#00ffba]' 
                            : currentBookings > 0
                              ? 'bg-gray-50 border border-gray-300'
                              : 'bg-gray-50 border border-gray-200'
                        )}
                        onClick={() => {
                          if (currentBookings > 0) {
                            openAttendanceDialog(section.name, selectedDateStr, time, [], section.id);
                          }
                        }}
                      >
                        <div className={cn(
                          "text-[10px] font-medium truncate mb-1",
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        )}>
                          {section.name}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-none overflow-hidden">
                            <div
                              className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`}
                              style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] flex-shrink-0 text-gray-600 font-medium">
                            {currentBookings}/{capacity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop/Tablet View
  return (
    <>
    <div className="max-w-full mx-auto space-y-4 overflow-x-auto">

      {/* Week Navigation with QR Scanner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={previousWeek} variant="outline" size="sm" className="rounded-none">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Προηγ.
          </Button>
          <Button 
            onClick={() => setQrScannerOpen(true)} 
            variant="outline" 
            size="sm" 
            className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
          >
            <Camera className="w-4 h-4 mr-1" />
            QR Scan
          </Button>
        </div>
        <h3 className={cn(
          "text-sm font-semibold",
          {
            "text-[#00ffba]": (() => {
              const now = new Date();
              const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
              const displayWeekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
              return format(currentWeekStart, 'yyyy-MM-dd') === format(displayWeekStart, 'yyyy-MM-dd');
            })()
          }
        )}>
          {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM/yyyy')}
        </h3>
        <Button onClick={nextWeek} variant="outline" size="sm" className="rounded-none">
          Επόμ.
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Weekly Grid - Organized by Time Rows */}
      {sections.length > 0 && (
        <div className="space-y-1">
          {/* Header Row with Days and Close Buttons */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-xs font-medium text-gray-500 p-1"></div>
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = weekBookings[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              const isClosed = isDateClosed(dateStr);
              
              return (
                <div 
                  key={dateStr} 
                  className={cn(
                    "text-center p-1 border rounded-none",
                    isClosed 
                      ? "bg-red-100 border-red-300" 
                      : hasBookings 
                        ? "bg-[#00ffba]/20 border-gray-200"
                        : "bg-gray-50 border-gray-200"
                  )}
                >
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleClosedDay(dateStr)}
                    className={cn(
                      "w-full h-5 px-1 rounded-none text-[9px] mb-0.5",
                      isClosed 
                        ? "bg-red-500 text-white hover:bg-red-600" 
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    )}
                  >
                    {isClosed ? (
                      <>
                        <X className="w-3 h-3 mr-0.5" />
                        Άνοιγμα
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3 mr-0.5" />
                        Κλειστά
                      </>
                    )}
                  </Button>
                  <div className={cn(
                    "font-medium text-xs",
                    isClosed && "text-red-600"
                  )}>
                    {dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div className={cn(
                    "text-xs",
                    isClosed ? "text-red-500" : "text-gray-500"
                  )}>
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          {sortedTimes.map((time) => {
            return (
              <div key={time} className="grid grid-cols-8 gap-1">
                {/* Time Label */}
                <div className="bg-gray-50 border border-gray-200 rounded-none p-1 flex items-center justify-center">
                  <span className="text-xs font-medium">{time}</span>
                </div>

                {/* Day Cells */}
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  
                  // Get ALL sections that have this time slot on this day
                  const sectionsForSlot = sections.filter(s => {
                    const sectionHours = s.available_hours?.[dayOfWeek] || [];
                    return sectionHours.includes(time);
                  });

                  if (sectionsForSlot.length === 0) {
                    return (
                      <div key={dateStr} className="bg-gray-100 border border-gray-200 rounded-none p-1" />
                    );
                  }

                  const dayBookings = weekBookings[dateStr] || [];

                  return (
                    <div key={dateStr} className="border border-gray-200 rounded-none bg-white p-1 space-y-1">
                      {sectionsForSlot.map((section) => {
                        const isSelected = selectedSections.includes(section.id);
                        
                        // Get users assigned to this section
                        const assignedUsers = sectionUsers[section.id] || [];
                        const currentBookings = assignedUsers.length;
                        const capacity = section.max_capacity;

                        const isHovered = hoveredSection === section.id;

                        return (
                          <div 
                            key={section.id} 
                            className={`space-y-0.5 p-1 rounded-none transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-[#00ffba]/20 border border-[#00ffba]' 
                                : isHovered
                                  ? 'bg-[#cb8954]/20 border border-[#cb8954]'
                                  : currentBookings > 0 
                                    ? 'bg-white border border-gray-300 hover:bg-gray-50'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                            onClick={() => {
                              if (currentBookings > 0) {
                                openAttendanceDialog(section.name, dateStr, time, [], section.id);
                              } else {
                                toggleSection(section.id);
                              }
                            }}
                          >
                            {/* Section Name */}
                            <div className={`text-[9px] font-medium truncate ${
                              isSelected || isHovered ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {section.name}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-none overflow-hidden">
                                <div
                                  className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`}
                                  style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-[9px] flex-shrink-0 text-gray-600">
                                {currentBookings}/{capacity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Attendance Details Dialog */}
    <AttendanceDetailsDialog
      isOpen={attendanceDialogOpen}
      onClose={() => setAttendanceDialogOpen(false)}
      sectionName={selectedSlotInfo?.sectionName || ''}
      date={selectedSlotInfo?.date || ''}
      time={selectedSlotInfo?.time || ''}
      sectionId={selectedSlotInfo?.sectionId}
    />

    {/* QR Scanner Dialog */}
    <QRScannerAttendance
      isOpen={qrScannerOpen}
      onClose={() => setQrScannerOpen(false)}
      onSuccess={fetchWeekBookings}
    />
    </>
  );
};
