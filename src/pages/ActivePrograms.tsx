
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, User, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // Χρησιμοποιούμε το hook για τα ενεργά προγράμματα από τη βάση
  const { data: activePrograms = [], isLoading, error } = useActivePrograms();

  // Φιλτράρουμε τα προγράμματα για την επιλεγμένη ημερομηνία
  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!selectedDate || !assignment.training_dates) return false;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return assignment.training_dates.includes(selectedDateStr);
  });

  // Υπολογίζουμε τα stats
  const stats = {
    totalPrograms: activePrograms.length,
    activeToday: programsForSelectedDate.length,
    completedToday: 0 // TODO: Υπολογισμός ολοκληρωμένων προπονήσεων
  };

  // Δημιουργούμε μια λίστα με όλες τις ημερομηνίες που έχουν προγράμματα
  const programDates = activePrograms.reduce((dates: string[], assignment) => {
    if (assignment.training_dates) {
      return [...dates, ...assignment.training_dates];
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div>Φόρτωση προγραμμάτων...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Επιστροφή
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
                Ενεργά Προγράμματα
              </h1>
            </div>
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
                  weekStartsOn={0}
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
                  <div className="space-y-2">
                    {programsForSelectedDate.map((assignment) => (
                      <ProgramCard
                        key={assignment.id}
                        assignment={assignment}
                      />
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
          {activePrograms.length > 0 && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-sm">Πληροφορίες Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">
                  Συνολικά ανατεθειμένα προγράμματα: {activePrograms.length}
                </p>
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Εμφάνιση λεπτομερειών</summary>
                  <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(activePrograms, null, 2)}
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
