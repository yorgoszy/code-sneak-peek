import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SchoolNote {
  id: string;
  category: string;
  content: string;
  ai_summary: string | null;
  created_at: string;
  app_users: {
    name: string;
  } | null;
}

const CATEGORIES = [
  { value: "all", label: "Όλες" },
  { value: "math", label: "Μαθηματικά" },
  { value: "science", label: "Φυσική/Χημεία" },
  { value: "language", label: "Γλώσσα" },
  { value: "history", label: "Ιστορία" },
  { value: "arts", label: "Καλές Τέχνες" },
  { value: "sports", label: "Φυσική Αγωγή" },
  { value: "other", label: "Άλλο" },
];

export const AdminSchoolNotes = () => {
  const [notes, setNotes] = useState<SchoolNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('school_notes')
        .select(`
          id,
          category,
          content,
          ai_summary,
          created_at,
          app_users!school_notes_parent_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast.error("Σφάλμα κατά τη φόρτωση των σημειώσεων");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = selectedCategory === "all" 
    ? notes 
    : notes.filter(note => note.category === selectedCategory);

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group notes by day
  const notesByDay = weekDays.map(day => ({
    date: day,
    notes: filteredNotes.filter(note => 
      isSameDay(new Date(note.created_at), day)
    )
  }));

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setSelectedWeek(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ffba]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Σχολικές Σημειώσεις - Εβδομαδιαία Προβολή
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                className="rounded-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-none min-w-[240px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(weekStart, "d MMM", { locale: el })} - {format(weekEnd, "d MMM yyyy", { locale: el })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setSelectedWeek(date);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="rounded-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleToday}
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
              >
                Σήμερα
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="rounded-none flex-wrap h-auto">
              {CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="rounded-none"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat.value} value={cat.value} className="space-y-4 mt-4">
                {/* Calendar Week View */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {notesByDay.map((day, index) => (
                    <Card key={index} className="rounded-none">
                      <CardHeader className="p-3 bg-gray-50 border-b">
                        <CardTitle className="text-sm font-semibold text-center">
                          {format(day.date, "EEEE", { locale: el })}
                          <br />
                          <span className="text-xs text-gray-500">
                            {format(day.date, "d MMM", { locale: el })}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 space-y-2 min-h-[200px]">
                        {day.notes.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">
                            Δεν υπάρχουν σημειώσεις
                          </p>
                        ) : (
                          day.notes.map((note) => (
                            <Card key={note.id} className="rounded-none bg-blue-50 border-blue-200">
                              <CardContent className="p-2 space-y-1">
                                <p className="text-xs text-gray-600 font-medium">
                                  {note.app_users?.name || "Άγνωστος"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {CATEGORIES.find(c => c.value === note.category)?.label}
                                </p>
                                <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
