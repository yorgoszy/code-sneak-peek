
export interface TrainingDateSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  programWeeks?: number;
  weekStructure?: Array<{
    id: string;
    name?: string;
    week_number: number;
    program_days?: Array<{
      id: string;
      name?: string;
      day_number: number;
    }>;
  }>;
}

export interface ProgramRequirementsProps {
  programWeeks: number;
  daysPerWeek: number;
  totalRequiredDays: number;
  weekStructure?: Array<{
    id: string;
    name?: string;
    week_number: number;
    program_days?: Array<{
      id: string;
      name?: string;
      day_number: number;
    }>;
  }>;
}

export interface SelectionProgressProps {
  selectedDatesLength: number;
  totalRequiredDays: number;
  onClearAll: () => void;
}

export interface UseTrainingDateLogicProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  totalRequiredDays: number;
  weekStructure?: Array<{
    id: string;
    name?: string;
    week_number: number;
    program_days?: Array<{
      id: string;
      name?: string;
      day_number: number;
    }>;
  }>;
}

export interface CalendarDayContentProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  onRemoveDate: (date: Date, event: React.MouseEvent) => void;
}
