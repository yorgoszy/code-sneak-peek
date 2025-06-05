
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);

  useEffect(() => {
    // Ελέγχουμε αν υπάρχει pending assignment από το ProgramBuilder
    const pendingAssignment = localStorage.getItem('pendingAssignment');
    if (pendingAssignment) {
      try {
        const assignmentData = JSON.parse(pendingAssignment);
        console.log('Received assignment data:', assignmentData);
        
        // Προσθέτουμε το νέο πρόγραμμα στη λίστα
        setAssignedPrograms(prev => [...prev, {
          id: Date.now(), // Προσωρινό ID
          program: assignmentData.program,
          trainingDates: assignmentData.trainingDates,
          userId: assignmentData.selectedUserId,
          assignedAt: new Date()
        }]);
        
        // Καθαρίζουμε το localStorage
        localStorage.removeItem('pendingAssignment');
      } catch (error) {
        console.error('Error parsing assignment data:', error);
      }
    }
  }, []);

  // Φιλτράρουμε τα προγράμματα για την επιλεγμένη ημερομηνία
  const programsForSelectedDate = assignedPrograms.filter(assignment => {
    if (!selectedDate || !assignment.trainingDates) return false;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return assignment.trainingDates.some((dateStr: string) => {
      // Αν είναι Date object, μετατρέπουμε σε string
      if (typeof dateStr === 'object') {
        return format(new Date(dateStr), 'yyyy-MM-dd') === selectedDateStr;
      }
      return dateStr === selectedDateStr;
    });
  });

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
            Ενεργά Προγράμματα
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1 rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Ημερολόγιο Προπονήσεων</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-none w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                  month: "space-y-4 w-full flex-1",
                  table: "w-full h-full border-collapse space-y-1",
                  head_row: "",
                  row: "w-full mt-2",
                }}
              />
              
              {selectedDate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-none">
                  <p className="text-sm text-gray-600">
                    Επιλεγμένη ημερομηνία: {selectedDate.toLocaleDateString('el-GR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Προγράμματα: {programsForSelectedDate.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programs for Selected Date */}
          <Card className="lg:col-span-2 rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">
                Προγράμματα για {selectedDate?.toLocaleDateString('el-GR')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {programsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {programsForSelectedDate.map((assignment) => (
                    <Card key={assignment.id} className="rounded-none border-l-4 border-l-[#00ffba]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{assignment.program.name}</h3>
                            
                            {assignment.program.description && (
                              <p className="text-sm text-gray-600">{assignment.program.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Αθλητής ID: {assignment.userId}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Εβδομάδες: {assignment.program.weeks?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba]">
                            Ενεργό
                          </Badge>
                        </div>
                        
                        {assignment.program.weeks && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500">
                              Σύνολο ημερών: {assignment.program.weeks.reduce((total: number, week: any) => total + (week.days?.length || 0), 0)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Δεν υπάρχουν προγράμματα για αυτή την ημερομηνία</p>
                  <p className="text-sm mt-2">Επιλέξτε άλλη ημερομηνία ή δημιουργήστε νέα ανάθεση από το ProgramBuilder</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
