
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Play } from "lucide-react";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { AttendanceDialog } from "@/components/active-programs/AttendanceDialog";
import { format } from "date-fns";

interface UserProfileProgramsProps {
  user: any;
  programs: any[];
}

export const UserProfilePrograms = ({ user, programs }: UserProfileProgramsProps) => {
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const handlePreviewProgram = (program: any) => {
    // Βρίσκουμε το assignment για αυτό το πρόγραμμα
    const assignment = program.program_assignments?.[0];
    if (assignment) {
      setSelectedProgram(assignment);
      
      // Παίρνουμε την πρώτη διαθέσιμη ημερομηνία προπόνησης
      const trainingDates = assignment.training_dates || [];
      if (trainingDates.length > 0) {
        setSelectedDate(new Date(trainingDates[0]));
        setDayProgramDialogOpen(true);
      }
    }
  };

  const handleDialogClose = () => {
    setDayProgramDialogOpen(false);
    setSelectedProgram(null);
    setSelectedDate(null);
  };

  const handleViewAttendance = (assignment: any) => {
    setSelectedAssignment(assignment);
    setAttendanceOpen(true);
  };

  const handleAttendanceClose = () => {
    setAttendanceOpen(false);
    setSelectedAssignment(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {(user.role === 'trainer' || user.role === 'admin') ? 'Προγράμματα Προπόνησης' : 'Ανατεθέντα Προγράμματα'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Δεν βρέθηκαν προγράμματα
            </p>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <div key={program.id} className="border p-3 rounded-none">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{program.name}</h4>
                      <p className="text-sm text-gray-600">{program.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Δημιουργήθηκε: {formatDate(program.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-none">{program.status}</Badge>
                      <Button
                        onClick={() => handlePreviewProgram(program)}
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        title="Προβολή Προγράμματος"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {program.program_assignments && program.program_assignments.length > 0 && (
                        <Button
                          onClick={() => handleViewAttendance(program.program_assignments[0])}
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          title="Προβολή Παρουσιών"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={handleDialogClose}
        program={selectedProgram}
        selectedDate={selectedDate}
        workoutStatus="not_started"
      />

      {selectedAssignment && (
        <AttendanceDialog
          assignment={selectedAssignment}
          isOpen={attendanceOpen}
          onClose={handleAttendanceClose}
        />
      )}
    </>
  );
};
