
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions, type AssignmentAttendance } from "@/hooks/useWorkoutCompletions";

interface AttendanceDialogProps {
  assignment: EnrichedAssignment;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceDialog: React.FC<AttendanceDialogProps> = ({ 
  assignment, 
  isOpen, 
  onClose 
}) => {
  const [attendance, setAttendance] = useState<AssignmentAttendance | null>(null);
  const [completions, setCompletions] = useState<any[]>([]);
  const { getAssignmentAttendance, getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment.id) {
      fetchData();
    }
  }, [isOpen, assignment.id]);

  const fetchData = async () => {
    try {
      const [attendanceData, completionsData] = await Promise.all([
        getAssignmentAttendance(assignment.id),
        getWorkoutCompletions(assignment.id)
      ]);
      
      setAttendance(attendanceData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'missed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'makeup':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρωμένο';
      case 'missed':
        return 'Χαμένο';
      case 'makeup':
        return 'Αναπλήρωση';
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Παρουσίες & Στατιστικά - {assignment.programs?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Συνολικά Στατιστικά */}
          {attendance && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Συνολικά Στατιστικά</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{attendance.total_scheduled_workouts}</p>
                    <p className="text-sm text-gray-600">Συνολικές Προπονήσεις</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{attendance.completed_workouts}</p>
                    <p className="text-sm text-gray-600">Ολοκληρωμένες</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{attendance.missed_workouts}</p>
                    <p className="text-sm text-gray-600">Χαμένες</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{attendance.makeup_workouts}</p>
                    <p className="text-sm text-gray-600">Αναπληρώσεις</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ποσοστό Παρουσίας</span>
                    <span className="text-sm font-bold">{attendance.attendance_percentage}%</span>
                  </div>
                  <Progress value={attendance.attendance_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ιστορικό Προπονήσεων */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Ιστορικό Προπονήσεων</CardTitle>
            </CardHeader>
            <CardContent>
              {completions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Δεν έχουν καταγραφεί προπονήσεις ακόμα
                </p>
              ) : (
                <div className="space-y-3">
                  {completions.map((completion) => (
                    <div key={completion.id} className="flex items-center justify-between p-3 border rounded-none">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(completion.status)}
                        <div>
                          <p className="font-medium">
                            Εβδομάδα {completion.week_number}, Ημέρα {completion.day_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            Προγραμματισμένη: {formatDate(completion.scheduled_date)}
                          </p>
                          {completion.completed_date !== completion.scheduled_date && (
                            <p className="text-sm text-gray-600">
                              Ολοκληρώθηκε: {formatDate(completion.completed_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-none">
                        {getStatusText(completion.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
