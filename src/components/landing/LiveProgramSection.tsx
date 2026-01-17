import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PublicSection {
  id: string;
  name: string;
  max_capacity: number;
  available_hours: any;
  active_users: number;
}

interface LiveProgramSectionProps {
  translations: {
    [key: string]: string;
  };
}

const LiveProgramSection: React.FC<LiveProgramSectionProps> = ({ translations }) => {
  const [sections, setSections] = useState<PublicSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const currentWeek = new Date();

  useEffect(() => {
    fetchPublicSections();
  }, []);

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    setSelectedDayIndex(adjustedDay);
  }, []);

  const fetchPublicSections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('public-section-counts');
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching public sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLoadingBarColor = (bookingsCount: number, capacity: number) => {
    const percentage = capacity > 0 ? (bookingsCount / capacity) * 100 : 0;
    if (percentage === 0) return 'bg-[#aca097]';
    if (percentage <= 50) return 'bg-[#00ffba]';
    if (percentage <= 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getAllTimes = () => {
    const allTimes = new Set<string>();
    sections.forEach(section => {
      Object.values(section.available_hours || {}).forEach((hours: any) => {
        (hours as string[]).forEach(h => allTimes.add(h));
      });
    });
    return Array.from(allTimes).sort();
  };

  if (loading || sections.length === 0) {
    return null;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const dayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
  const sortedTimes = getAllTimes();

  // Mobile View
  if (isMobile) {
    const selectedDay = weekDays[selectedDayIndex];
    const dayOfWeek = selectedDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
              Live Program
            </h2>
            <div className="w-16 h-1 mx-auto mb-4" style={{ backgroundColor: '#aca097' }}></div>
            <p className="text-sm" style={{ color: '#aca097' }}>
              {format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM')}
            </p>
          </div>

          <div className="flex gap-1 mb-4 justify-center">
            {weekDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isSelected = index === selectedDayIndex;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayIndex(index)}
                  className={cn(
                    "flex-1 min-w-0 py-1.5 px-0.5 border rounded-none transition-all",
                    isSelected ? "border-[#cb8954] bg-[#cb8954]/20" : "border-[#aca097]/30 bg-[#aca097]/10"
                  )}
                >
                  <div className={cn("text-[9px] font-medium", isToday ? "text-[#cb8954]" : "text-[#aca097]")}>
                    {dayNames[index]}
                  </div>
                  <div className={cn("text-[11px] font-bold", isToday ? "text-[#cb8954]" : "text-[#aca097]")}>
                    {format(day, 'dd')}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            {sortedTimes.map((time) => {
              const sectionsForSlot = sections.filter(s => {
                const sectionHours = s.available_hours?.[dayOfWeek] || [];
                return sectionHours.includes(time);
              });

              if (sectionsForSlot.length === 0) return null;

              const now = new Date();
              const slotHour = parseInt(time.split(':')[0], 10);
              const isCurrentSlot = slotHour === now.getHours();

              return (
                <div key={time} className="space-y-1">
                  {sectionsForSlot.map((section) => {
                    const currentBookings = section.active_users;
                    const capacity = section.max_capacity;

                    return (
                      <div key={section.id} className="flex items-center gap-2 px-2 py-1.5 rounded-none bg-[#aca097]/10 border border-[#aca097]/30">
                        <span className={cn("text-[10px] font-semibold w-10 flex-shrink-0", isCurrentSlot ? "text-[#cb8954]" : "text-[#aca097]")}>{time}</span>
                        <span className="text-[10px] font-medium text-[#aca097] truncate flex-1 min-w-0">{section.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0 w-20">
                          <div className="flex-1 h-1.5 bg-black rounded-none overflow-hidden">
                            <div className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`} style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[9px] text-[#aca097] font-medium">{currentBookings}/{capacity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop View
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>Live Program</h2>
          <div className="w-16 h-1 mx-auto mb-4" style={{ backgroundColor: '#aca097' }}></div>
          <p style={{ color: '#aca097' }}>{format(weekStart, 'dd/MM')} - {format(weekDays[6], 'dd/MM')}</p>
        </div>

        <div className="space-y-0.5 overflow-x-auto">
          <div className="grid grid-cols-8 gap-0.5 min-w-0">
            <div className="text-[10px] font-medium text-gray-500 p-1"></div>
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={dateStr} className="text-center p-1 border rounded-none bg-black border-[#aca097]/30">
                  <div className={cn("font-medium text-[10px]", isToday ? "text-[#cb8954]" : "text-[#aca097]")}>{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                  <div className={cn("text-xs font-bold", isToday ? "text-[#cb8954]" : "text-[#aca097]")}>{format(day, 'dd/MM')}</div>
                </div>
              );
            })}
          </div>

          {sortedTimes.map((time) => {
            const now = new Date();
            const slotHour = parseInt(time.split(':')[0], 10);
            const isCurrentSlot = slotHour === now.getHours();

            return (
              <div key={time} className="grid grid-cols-8 gap-0.5 min-w-0">
                <div className="bg-black border border-[#aca097]/30 rounded-none p-1 flex items-center justify-center">
                  <span className={cn("text-[10px] font-medium", isCurrentSlot ? "text-[#cb8954]" : "text-[#aca097]")}>{time}</span>
                </div>

                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const sectionsForSlot = sections.filter(s => (s.available_hours?.[dayOfWeek] || []).includes(time));

                  if (sectionsForSlot.length === 0) {
                    return <div key={dateStr} className="bg-[#aca097]/5 border border-[#aca097]/10 rounded-none p-0.5" />;
                  }

                  return (
                    <div key={dateStr} className="border border-[#aca097]/30 rounded-none bg-[#aca097]/10 p-0.5 space-y-0.5">
                      {sectionsForSlot.map((section) => {
                        const currentBookings = section.active_users;
                        const capacity = section.max_capacity;
                        const isHovered = hoveredSection === section.id;

                        return (
                          <div 
                            key={section.id} 
                            className={cn("space-y-0.5 p-0.5 rounded-none transition-all cursor-pointer", isHovered ? 'bg-[#cb8954]/20 border border-[#cb8954]' : 'bg-[#aca097]/20 border border-[#aca097]/30 hover:bg-[#aca097]/30')}
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                          >
                            <div className={cn("text-[8px] font-medium truncate", isHovered ? 'text-white' : 'text-[#aca097]')}>{section.name}</div>
                            <div className="flex items-center gap-0.5">
                              <div className="flex-1 h-1 bg-black rounded-none overflow-hidden">
                                <div className={`h-full transition-all ${getLoadingBarColor(currentBookings, capacity)}`} style={{ width: `${capacity > 0 ? (currentBookings / capacity) * 100 : 0}%` }} />
                              </div>
                              <span className="text-[8px] flex-shrink-0 text-[#aca097]">{currentBookings}/{capacity}</span>
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
      </div>
    </section>
  );
};

export default LiveProgramSection;