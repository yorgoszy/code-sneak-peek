
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CalendarDayContentProps } from './types';

export const CalendarDayContent: React.FC<CalendarDayContentProps> = ({
  date,
  isSelected,
  isToday,
  onRemoveDate
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    console.log('🗓️ [CalendarDayContent] Remove button clicked:', {
      date: date,
      dateDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    });
    
    e.preventDefault();
    e.stopPropagation();
    onRemoveDate(date, e);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
      {isSelected && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
          onClick={handleRemove}
        >
          <X className="h-2 w-2" />
        </Button>
      )}
    </div>
  );
};
