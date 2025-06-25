
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDayContent } from './CalendarDayContent';

interface TrainingDateCalendarProps {
  calendarDate: Date;
  onCalendarDateChange: (date: Date) => void;
  onDateSelect: (date: Date | undefined) => void;
  isDateDisabled: (date: Date) => boolean;
  isDateSelected: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
  onRemoveDate: (dateString: string, event: React.MouseEvent) => void;
}

export const TrainingDateCalendar: React.FC<TrainingDateCalendarProps> = ({
  calendarDate,
  onCalendarDateChange,
  onDateSelect,
  isDateDisabled,
  isDateSelected,
  isToday,
  onRemoveDate
}) => {
  // ΔΙΟΡΘΩΣΗ: Βελτιωμένη συνάρτηση για τη διαχείριση της αφαίρεσης ημερομηνίας
  const handleRemoveDate = (date: Date, event: React.MouseEvent) => {
    console.log('🗓️ [TrainingDateCalendar] handleRemoveDate called:', {
      date: date,
      dateDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    });
    
    // Δημιουργούμε καθαρή ημερομηνία και τη μετατρέπουμε σε string
    const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const year = cleanDate.getFullYear();
    const month = String(cleanDate.getMonth() + 1).padStart(2, '0');
    const day = String(cleanDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('🗓️ [TrainingDateCalendar] Formatted date for removal:', {
      original: date,
      clean: cleanDate,
      formatted: formattedDate
    });
    
    onRemoveDate(formattedDate, event);
  };

  const renderDayContent = (date: Date) => {
    const isSelected = isDateSelected(date);
    const isTodayDate = isToday(date);
    
    console.log('🗓️ [TrainingDateCalendar] renderDayContent:', {
      date: date,
      dateDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      isSelected: isSelected,
      isToday: isTodayDate
    });
    
    return (
      <CalendarDayContent
        date={date}
        isSelected={isSelected}
        isToday={isTodayDate}
        onRemoveDate={handleRemoveDate}
      />
    );
  };

  // ΔΙΟΡΘΩΣΗ: Προσθήκη logging για debugging
  const handleDateSelect = (date: Date | undefined) => {
    console.log('🗓️ [TrainingDateCalendar] Date selected in calendar:', {
      date: date,
      dateDebug: date ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` : 'undefined'
    });
    onDateSelect(date);
  };

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={handleDateSelect}
      onMonthChange={onCalendarDateChange}
      className="rounded-none border pointer-events-auto"
      weekStartsOn={1}
      disabled={isDateDisabled}
      components={{
        DayContent: ({ date }) => renderDayContent(date)
      }}
      modifiers={{
        selected: isDateSelected,
        today: isToday,
        selectedToday: (date) => isDateSelected(date) && isToday(date),
        disabled: isDateDisabled
      }}
      modifiersClassNames={{
        selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90",
        today: "bg-gray-200 text-black",
        selectedToday: "bg-[#00cc94] text-black hover:bg-[#00cc94]/90",
        disabled: "text-gray-300 opacity-50 cursor-not-allowed"
      }}
    />
  );
};
