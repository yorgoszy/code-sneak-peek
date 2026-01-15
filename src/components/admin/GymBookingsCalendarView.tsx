import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

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

export const GymBookingsCalendarView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [weekBookings, setWeekBookings] = useState<{ [key: string]: GymBooking[] }>({});
  const [sectionBookingCounts, setSectionBookingCounts] = useState<{ [sectionId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  // Don't auto-select sections - start with none selected

  useEffect(() => {
    if (sections.length > 0) {
      fetchWeekBookings();
    }
  }, [currentWeek, sections]);

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
          app_users(name, email)
        `)
        .in('section_id', allSectionIds)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('booking_type', 'gym_visit')
        .eq('status', 'confirmed')
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
        // Allow deselecting all sections
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

  if (loading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

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

  return (
    <div className="max-w-full mx-auto space-y-4 overflow-x-auto">
      {/* Section Selection */}
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Επιλογή Τμημάτων</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const isSelected = selectedSections.includes(section.id);
              return (
                <div
                  key={section.id}
                  className={`px-3 py-1.5 border rounded-none cursor-pointer transition-colors flex items-center gap-1 ${
                    isSelected 
                      ? 'border-[#00ffba] bg-[#00ffba]/10 text-black' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  onClick={() => toggleSection(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#00ffba]" />}
                  <span className="text-xs font-medium">{section.name}</span>
                  <span className="text-xs text-gray-400">({sectionBookingCounts[section.id] || 0})</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={previousWeek} variant="outline" size="sm" className="rounded-none">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Προηγ.
        </Button>
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
          {/* Header Row with Days */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-xs font-medium text-gray-500 p-1"></div>
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = weekBookings[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              
              return (
                <div 
                  key={dateStr} 
                  className={`text-center p-1 border border-gray-200 rounded-none ${
                    hasBookings ? 'bg-[#00ffba]/20' : 'bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-xs">
                    {['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'][day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Get all unique time slots from ALL sections */}
          {(() => {
            // Collect all unique times from ALL sections (not just selected)
            const allTimes = new Set<string>();
            
            sections.forEach(section => {
              Object.values(section.available_hours || {}).forEach((hours: any) => {
                (hours as string[]).forEach(h => allTimes.add(h));
              });
            });

            // Sort times
            const sortedTimes = Array.from(allTimes).sort();

            return sortedTimes.map((time) => {
              return (
                <div key={time} className="grid grid-cols-8 gap-1">
                  {/* Time Label - Only once per time */}
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
                          const slotBookings = dayBookings.filter(booking => {
                            const bookingTime = booking.booking_time.length > 5 
                              ? booking.booking_time.substring(0, 5) 
                              : booking.booking_time;
                            return bookingTime === time && booking.section_id === section.id;
                          });

                          const currentBookings = slotBookings.length;
                          const capacity = section.max_capacity;

                          const isHovered = hoveredSection === section.id;

                          return (
                            <div 
                              key={section.id} 
                              className={`space-y-0.5 p-1 rounded-none transition-all ${
                                isSelected 
                                  ? 'bg-[#00ffba]/20 border border-[#00ffba]' 
                                  : isHovered
                                    ? 'bg-[#cb8954]/20 border border-[#cb8954]'
                                    : 'bg-white border border-gray-200'
                              }`}
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
            });
          })()}
        </div>
      )}
    </div>
  );
};