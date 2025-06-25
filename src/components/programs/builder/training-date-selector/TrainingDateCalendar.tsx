
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDayContent } from './CalendarDayContent';
import { formatDateToLocalString, createDateFromCalendar } from '@/utils/dateUtils';

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
  const renderDayContent = (date: Date) => {
    const isSelected = isDateSelected(date);
    const isTodayDate = isToday(date);
    
    const handleRemoveDate = (dateString: string, event: React.MouseEvent) => {
      const cleanDate = createDateFromCalendar(date);
      const formattedDate = formatDateToLocalString(cleanDate);
      onRemoveDate(formattedDate, event);
    };
    
    return (
      <CalendarDayContent
        date={date}
        isSelected={isSelected}
        isToday={isTodayDate}
        onRemoveDate={handleRemoveDate}
      />
    );
  };

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={onDateSelect}
      onMonthChange={onCalendarDateChange}
      className="rounded-none border"
      weekStartsOn={1}
      disabled={isDateDisabled}
      components={{
        DayContent: ({ date }) => renderDayContent(date)
      }}
      modifiers={{
        selected: isDateSelected,
        today: isToday
      }}
      modifiersClassNames={{
        selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90",
        today: "bg-gray-300 text-black border-2 border-gray-500"
      }}
    />
  );
};
