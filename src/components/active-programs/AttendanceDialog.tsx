
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, XCircle, Clock, BarChart3, Timer, Zap } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions, type AssignmentAttendance } from "@/hooks/useWorkoutCompletions";
import { useWorkoutStatistics } from "@/hooks/useWorkoutStatistics";

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
  const { statistics, loading: statsLoading } = useWorkoutStatistics(assignment.id);

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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}ώ ${mins}λ`;
    }
    return `${mins}λ`;
  };

  const getTrainingTypeLabel = (type: string) => {
    const labels: {[key: string]: string} = {
      speed: 'Speed',
      speedEndurance: 'Speed Endurance',
      speedStrength: 'Speed/Strength',
      strengthSpeed: 'Strength/Speed',
      strengthEndurance: 'Strength Endurance',
      accelerativeStrength: 'Accelerative Strength',
      maxStrength: 'Max Strength',
      hypertrophy: 'Hypertrophy'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto rounded-none">
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

          {/* Στατιστικά Προπόνησης */}
          {!statsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#00ffba]" />
                    Όγκος
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#00ffba]">
                    {statistics.totalVolume.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">kg συνολικά</p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-500" />
                    Χρόνος
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatTime(statistics.totalTimeMinutes)}
                  </p>
                  <p className="text-sm text-gray-600">συνολικά</p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Ένταση
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-500">
                    {statistics.averageIntensity}
                  </p>
                  <p className="text-sm text-gray-600">μέση ένταση</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Κατανομή Τύπων Προπόνησης */}
          {!statsLoading && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Κατανομή Τύπων Προπόνησης</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(statistics.trainingTypeBreakdown)
                    .filter(([_, percentage]) => percentage > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([type, percentage]) => (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-none">
                        <p className="text-lg font-bold text-[#00ffba]">{percentage}%</p>
                        <p className="text-xs text-gray-600 break-words">
                          {getTrainingTypeLabel(type)}
                        </p>
                      </div>
                    ))
                  }
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
                          {completion.actual_duration_minutes && (
                            <p className="text-xs text-blue-600">
                              Διάρκεια: {formatTime(completion.actual_duration_minutes)}
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
