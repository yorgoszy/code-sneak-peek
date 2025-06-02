
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, AlertTriangle } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

interface DaySelectorProps {
  assignment: EnrichedAssignment;
  isOpen: boolean;
  onClose: () => void;
  onSelectDay: (weekIndex: number, dayIndex: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  onSelectDay 
}) => {
  const [completions, setCompletions] = useState<any[]>([]);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment.id) {
      fetchCompletions();
    }
  }, [isOpen, assignment.id]);

  const fetchCompletions = async () => {
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'completed'
    );
  };

  const isWorkoutMissed = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'missed'
    );
  };

  const handleDaySelect = (weekIndex: number, dayIndex: number) => {
    onSelectDay(weekIndex, dayIndex);
    onClose();
  };

  const getAvailableDays = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());

    const availableDays: Array<{
      weekIndex: number;
      dayIndex: number;
      week: any;
      day: any;
      status: 'available' | 'completed' | 'missed';
      isPreviousWeek: boolean;
    }> = [];

    assignment.programs?.program_weeks?.forEach((week, weekIndex) => {
      week.program_days?.forEach((day, dayIndex) => {
        const isCompleted = isWorkoutCompleted(week.week_number, day.day_number);
        const isMissed = isWorkoutMissed(week.week_number, day.day_number);
        
        // Υπολογισμός αν είναι από προηγούμενη εβδομάδα
        const isPreviousWeek = weekIndex === 0; // Απλουστευμένη λογική - μπορεί να χρειαστεί βελτίωση

        // Προσθήκη ημέρας αν:
        // 1. Δεν έχει ολοκληρωθεί
        // 2. Έχει χαθεί (missed) και μπορεί να γίνει makeup
        if (!isCompleted) {
          availableDays.push({
            weekIndex,
            dayIndex,
            week,
            day,
            status: isMissed ? 'missed' : 'available',
            isPreviousWeek
          });
        }
      });
    });

    return availableDays;
  };

  const availableDays = getAvailableDays();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-none">
        <DialogHeader>
          <DialogTitle>Επιλογή Ημέρας Προπόνησης</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Επιλέξτε την ημέρα που θέλετε να ξεκινήσετε την προπόνηση:
          </p>

          {availableDays.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Όλες οι προπονήσεις έχουν ολοκληρωθεί!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {availableDays.map((item) => (
                <Button
                  key={`${item.weekIndex}-${item.dayIndex}`}
                  variant="outline"
                  className="rounded-none p-4 h-auto justify-between"
                  onClick={() => handleDaySelect(item.weekIndex, item.dayIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        {item.week.name} - {item.day.name}
                      </span>
                    </div>
                    
                    {item.status === 'missed' && (
                      <Badge variant="destructive" className="rounded-none">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Χαμένη
                      </Badge>
                    )}
                    
                    {item.isPreviousWeek && (
                      <Badge variant="secondary" className="rounded-none">
                        Προηγούμενη Εβδομάδα
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {item.status === 'missed' 
                      ? 'Makeup προπόνηση' 
                      : 'Κανονική προπόνηση'
                    }
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
