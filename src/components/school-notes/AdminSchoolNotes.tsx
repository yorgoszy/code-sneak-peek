import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NoteDetailsDialog } from "./NoteDetailsDialog";

interface SchoolNote {
  id: string;
  category: string;
  content: string;
  ai_summary: string | null;
  created_at: string;
  child_age: number | null;
  app_users: {
    name: string;
  } | null;
  children: {
    name: string;
    birth_date: string;
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
  const [selectedNote, setSelectedNote] = useState<SchoolNote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ageFrom, setAgeFrom] = useState<string>("");
  const [ageTo, setAgeTo] = useState<string>("");

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
          parent_id,
          child_id,
          child_age,
          app_users!school_notes_parent_id_fkey (
            name
          ),
          children (
            name,
            birth_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process notes to generate AI summaries if needed
      const notesWithAI = await Promise.all(
        (data || []).map(async (note) => {
          if (!note.ai_summary && note.content && note.parent_id) {
            try {
              // Get children of parent
              const { data: childrenData } = await supabase
                .from('children')
                .select('birth_date')
                .eq('parent_id', note.parent_id)
                .order('birth_date', { ascending: false });

              let childAge = null;
              
              // Use first child's age (or could use average, or ask which child)
              if (childrenData && childrenData.length > 0) {
                const birthDate = new Date(childrenData[0].birth_date);
                const today = new Date();
                childAge = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  childAge--;
                }
              }

              const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-school-note', {
                body: { 
                  noteContent: note.content,
                  category: note.category,
                  childAge
                }
              });

              if (aiError) {
                console.error('AI analysis error:', aiError);
                return note;
              }

              if (aiData) {
                // Update the note with AI summary
                const { error: updateError } = await supabase
                  .from('school_notes')
                  .update({ ai_summary: JSON.stringify(aiData) })
                  .eq('id', note.id);

                if (updateError) {
                  console.error('Error updating AI summary:', updateError);
                  return note;
                }

                return { ...note, ai_summary: JSON.stringify(aiData) };
              }
            } catch (aiError) {
              console.error('Error processing AI for note:', aiError);
            }
          }
          return note;
        })
      );

      setNotes(notesWithAI);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast.error("Σφάλμα κατά τη φόρτωση των σημειώσεων");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    // Category filter
    if (selectedCategory !== "all" && note.category !== selectedCategory) {
      return false;
    }
    
    // Age filter
    if (ageFrom && note.child_age !== null && note.child_age < parseInt(ageFrom)) {
      return false;
    }
    if (ageTo && note.child_age !== null && note.child_age > parseInt(ageTo)) {
      return false;
    }
    
    return true;
  });

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

  const handleNoteClick = (note: SchoolNote) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
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
          <div className="space-y-4">
            {/* Title and Week Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Σχολικές Σημειώσεις - Εβδομαδιαία Προβολή</span>
                <span className="sm:hidden">Σχολικές Σημειώσεις</span>
              </CardTitle>
              
              {/* Week Navigation - Compact on mobile */}
              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousWeek}
                  className="rounded-none h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-none text-xs sm:text-sm flex-1 sm:min-w-[240px] h-8 sm:h-9">
                      <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {format(weekStart, "d MMM", { locale: el })} - {format(weekEnd, "d MMM yyyy", { locale: el })}
                      </span>
                      <span className="sm:hidden">
                        {format(weekStart, "d/M", { locale: el })} - {format(weekEnd, "d/M", { locale: el })}
                      </span>
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
                  className="rounded-none h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleToday}
                  className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
                >
                  Σήμερα
                </Button>
              </div>
            </div>

            {/* Age Filter - Stack on mobile */}
            <Card className="rounded-none bg-gray-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <Label className="text-sm font-medium">Φίλτρο Ηλικίας:</Label>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="age-from" className="text-sm whitespace-nowrap">Από:</Label>
                      <Input
                        id="age-from"
                        type="number"
                        min="0"
                        max="18"
                        value={ageFrom}
                        onChange={(e) => setAgeFrom(e.target.value)}
                        placeholder="0"
                        className="w-16 sm:w-20 rounded-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="age-to" className="text-sm whitespace-nowrap">Έως:</Label>
                      <Input
                        id="age-to"
                        type="number"
                        min="0"
                        max="18"
                        value={ageTo}
                        onChange={(e) => setAgeTo(e.target.value)}
                        placeholder="18"
                        className="w-16 sm:w-20 rounded-none text-sm"
                      />
                    </div>
                    {(ageFrom || ageTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAgeFrom("");
                          setAgeTo("");
                        }}
                        className="text-xs h-8"
                      >
                        Καθαρισμός
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="rounded-none flex-wrap h-auto gap-1 p-1">
              {CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="rounded-none text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat.value} value={cat.value} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {/* Calendar Week View - Single column on mobile, 2 cols on tablet, 7 cols on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3">
                  {notesByDay.map((day, index) => (
                    <Card key={index} className="rounded-none">
                      <CardHeader className="p-2 sm:p-3 bg-gray-50 border-b">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-center">
                          <span className="hidden lg:block">
                            {format(day.date, "EEEE", { locale: el })}
                          </span>
                          <span className="lg:hidden">
                            {format(day.date, "EEE", { locale: el })}
                          </span>
                          <br />
                          <span className="text-xs text-gray-500">
                            {format(day.date, "d MMM", { locale: el })}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 space-y-2 min-h-[150px] sm:min-h-[200px]">
                        {day.notes.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">
                            Δεν υπάρχουν σημειώσεις
                          </p>
                        ) : (
                          day.notes.map((note) => (
                            <Card 
                              key={note.id} 
                              className="rounded-none bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => handleNoteClick(note)}
                            >
                              <CardContent className="p-2 space-y-1">
                                <p className="text-xs text-gray-600 font-medium truncate">
                                  {note.app_users?.name || "Άγνωστος"}
                                </p>
                                {note.children && (
                                  <p className="text-xs text-gray-500 truncate">
                                    Παιδί: {note.children.name} ({note.child_age} ετών)
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {CATEGORIES.find(c => c.value === note.category)?.label}
                                </p>
                                <p className="text-xs text-gray-700 mt-2 line-clamp-2">
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

      {/* Dialog για προβολή σημείωσης */}
      <NoteDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        note={selectedNote}
        categoryLabel={CATEGORIES.find(c => c.value === selectedNote?.category)?.label || ''}
      />
    </div>
  );
};
