
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Ελέγχουμε αν υπάρχει pending assignment από το ProgramBuilder
    const pendingAssignment = localStorage.getItem('pendingAssignment');
    if (pendingAssignment) {
      try {
        const assignmentData = JSON.parse(pendingAssignment);
        console.log('📨 Λήψη δεδομένων ανάθεσης:', assignmentData);
        
        // Προσθέτουμε το νέο πρόγραμμα στη λίστα
        setAssignedPrograms(prev => {
          // Ελέγχουμε αν το πρόγραμμα υπάρχει ήδη
          const exists = prev.some(p => p.id === assignmentData.id);
          if (!exists) {
            console.log('✅ Προσθήκη νέου προγράμματος στη λίστα');
            return [...prev, assignmentData];
          }
          return prev;
        });
        
        // Καθαρίζουμε το localStorage
        localStorage.removeItem('pendingAssignment');
      } catch (error) {
        console.error('❌ Σφάλμα κατά την ανάγνωση των δεδομένων ανάθεσης:', error);
      }
    }
  }, []);

  // Φιλτράρουμε τα προγράμματα για την επιλεγμένη ημερομηνία
  const programsForSelectedDate = assignedPrograms.filter(assignment => {
    if (!selectedDate || !assignment.trainingDates) return false;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return assignment.trainingDates.includes(selectedDateStr);
  });

  // Υπολογίζουμε τα stats
  const stats = {
    totalPrograms: assignedPrograms.length,
    activeToday: programsForSelectedDate.length,
    completedToday: 0 // TODO: Υπολογισμός ολοκληρωμένων προπονήσεων
  };

  // Δημιουργούμε μια λίστα με όλες τις ημερομηνίες που έχουν προγράμματα
  const programDates = assignedPrograms.reduce((dates: string[], assignment) => {
    if (assignment.trainingDates) {
      return [...dates, ...assignment.trainingDates];
    }
    return dates;
  }, []);

  // Συνάρτηση για να δείξουμε κουκίδες στις ημερομηνίες που έχουν προγράμματα
  const getDayContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const programsCount = programDates.filter(d => d === dateStr).length;
    
    if (programsCount > 0) {
      return (
        <div className="relative">
          <span>{date.getDate()}</span>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
            {Array.from({ length: Math.min(programsCount, 3) }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#00ffba] rounded-full"></div>
            ))}
          </div>
        </div>
      );
    }
    
    return <span>{date.getDate()}</span>;
  };

  console.log('📅 Προγράμματα για την επιλεγμένη ημερομηνία:', programsForSelectedDate);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <ActiveProgramsSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        stats={stats}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
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
                  components={{
                    DayContent: ({ date }) => getDayContent(date)
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
                              <p className="text-xs text-gray-500 mt-1">
                                Ημερομηνίες προπόνησης: {assignment.trainingDates?.length || 0}
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

          {/* Debug Info */}
          {assignedPrograms.length > 0 && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-sm">Πληροφορίες Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">
                  Συνολικά ανατεθειμένα προγράμματα: {assignedPrograms.length}
                </p>
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Εμφάνιση λεπτομερειών</summary>
                  <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(assignedPrograms, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
