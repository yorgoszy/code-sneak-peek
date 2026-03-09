import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface GoogleCalendarBookingButtonProps {
  booking: {
    booking_date: string;
    booking_time: string;
    booking_type: string;
    section_name?: string;
    notes?: string;
  };
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

export const GoogleCalendarBookingButton: React.FC<GoogleCalendarBookingButtonProps> = ({
  booking,
  size = 'sm',
  className = ''
}) => {
  const { isSyncing, syncBookingToCalendar } = useGoogleCalendar();

  return (
    <Button
      onClick={() => syncBookingToCalendar(booking)}
      disabled={isSyncing}
      size={size}
      variant="outline"
      className={`rounded-none text-xs gap-1 ${className}`}
      title="Προσθήκη στο Google Calendar"
    >
      <Calendar className="w-3 h-3" />
      {size !== 'icon' && (isSyncing ? 'Sync...' : 'Google Cal')}
    </Button>
  );
};

interface GoogleCalendarProgramButtonProps {
  assignment: {
    training_dates?: string[];
    programs?: {
      name: string;
      program_weeks?: Array<{
        program_days?: Array<{
          name?: string;
          day_number: number;
        }>;
      }>;
    };
  };
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

export const GoogleCalendarProgramButton: React.FC<GoogleCalendarProgramButtonProps> = ({
  assignment,
  size = 'sm',
  className = ''
}) => {
  const { isSyncing, syncTrainingToCalendar } = useGoogleCalendar();

  const handleSync = () => {
    if (!assignment.training_dates?.length || !assignment.programs) return;

    const programDays = assignment.programs.program_weeks?.[0]?.program_days || [];
    const dayNames = assignment.training_dates.map((_, index) => {
      const dayInWeek = programDays[index % programDays.length];
      return dayInWeek?.name || `Ημέρα ${(index % programDays.length) + 1}`;
    });

    syncTrainingToCalendar({
      dates: assignment.training_dates,
      program_name: assignment.programs.name,
      day_names: dayNames,
    });
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing || !assignment.training_dates?.length}
      size={size}
      variant="outline"
      className={`rounded-none text-xs gap-1 ${className}`}
      title="Sync προπονήσεων στο Google Calendar"
    >
      <Calendar className="w-3 h-3" />
      {size !== 'icon' && (isSyncing ? 'Sync...' : 'Google Cal')}
    </Button>
  );
};
