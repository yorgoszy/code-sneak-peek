
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar as CalendarIcon } from "lucide-react";
import { ProgramPreviewDialog } from "@/components/programs/ProgramPreviewDialog";

interface ProgramCalendarProps {
  programs: any[];
}

export const ProgramCalendar = ({ programs }: ProgramCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [previewProgram, setPreviewProgram] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Δημιουργία map με ημερομηνίες που έχουν προγράμματα
  const programDates = useMemo(() => {
    const dates = new Map<string, any[]>();
    
    programs.forEach(assignment => {
      if (!assignment.start_date || !assignment.end_date || !assignment.programs) return;
      
      const startDate = new Date(assignment.start_date);
      const endDate = new Date(assignment.end_date);
      const program = assignment.programs;
      
      // Για κάθε εβδομάδα του προγράμματος
      program.program_weeks?.forEach((week: any) => {
        week.program_days?.forEach((day: any) => {
          // Υπολογισμός της πραγματικής ημερομηνίας της προπόνησης
          const weekStartDate = new Date(startDate);
          weekStartDate.setDate(startDate.getDate() + ((week.week_number - 1) * 7) + (day.day_number - 1));
          
          // Ελέγχει αν η ημερομηνία είναι εντός του προγράμματος
          if (weekStartDate >= startDate && weekStartDate <= endDate) {
            const dateKey = weekStartDate.toISOString().split('T')[0];
            
            if (!dates.has(dateKey)) {
              dates.set(dateKey, []);
            }
            
            dates.get(dateKey)?.push({
              assignment,
              program,
              week,
              day,
              workoutDate: weekStartDate
            });
          }
        });
      });
    });
    
    return dates;
  }, [programs]);

  // Προγράμματα για την επιλεγμένη ημερομηνία
  const selectedDatePrograms = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return programDates.get(dateKey) || [];
  }, [selectedDate, programDates]);

  const handlePreviewProgram = (program: any) => {
    setPreviewProgram(program);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewProgram(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('el-GR');
  };

  const isComingSoon = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    return start > now;
  };

  // Modifier για το calendar - δείχνει ποιες ημέρες έχουν προγράμματα
  const modifiers = {
    hasPrograms: Array.from(programDates.keys()).map(dateStr => new Date(dateStr))
  };

  const modifiersStyles = {
    hasPrograms: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '50%'
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Ημερολόγιο Προγραμμάτων
            </CardTitle>
            <p className="text-sm text-gray-600">
              Οι ημέρες με μπλε χρώμα έχουν προγραμματισμένες προπονήσεις
            </p>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-none border"
            />
          </CardContent>
        </Card>

        {/* Προγράμματα επιλεγμένης ημέρας */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>
              Προγράμματα για {selectedDate ? formatDate(selectedDate) : 'σήμερα'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDatePrograms.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Δεν υπάρχουν προγραμματισμένες προπονήσεις για αυτή την ημέρα</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDatePrograms.map((item, index) => {
                  const { assignment, program, week, day } = item;
                  const comingSoon = isComingSoon(assignment.start_date);
                  
                  return (
                    <div key={index} className="border p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{program.name}</h4>
                            {comingSoon && (
                              <Badge variant="secondary" className="rounded-none">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Εβδομάδα {week.week_number}: {week.name}</p>
                            <p>Ημέρα {day.day_number}: {day.name}</p>
                            <p>Blocks: {day.program_blocks?.length || 0}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handlePreviewProgram(program)}
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          title="Προβολή Προγράμματος"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {day.program_blocks && day.program_blocks.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Προπόνηση της ημέρας:</h5>
                          {day.program_blocks.map((block: any) => (
                            <div key={block.id} className="bg-gray-50 p-2 text-xs">
                              <p className="font-medium">{block.name}</p>
                              <p>{block.program_exercises?.length || 0} ασκήσεις</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProgramPreviewDialog
        program={previewProgram}
        isOpen={previewOpen}
        onOpenChange={handlePreviewClose}
      />
    </>
  );
};
