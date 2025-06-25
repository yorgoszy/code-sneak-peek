
export interface WeekStructure {
  weekNumber: number;
  daysInWeek: number;
  totalDaysBeforeWeek: number;
}

export interface TrainingDateSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  programWeeks?: number;
  weekStructure?: WeekStructure[];
}

export interface CalendarDayContentProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  onRemoveDate: (dateString: string, event: React.MouseEvent) => void;
}

export interface ProgramRequirementsProps {
  programWeeks: number;
  daysPerWeek: number;
  totalRequiredDays: number;
  weekStructure?: WeekStructure[];
}

export interface SelectionProgressProps {
  selectedDatesLength: number;
  totalRequiredDays: number;
  onClearAll: () => void;
}
