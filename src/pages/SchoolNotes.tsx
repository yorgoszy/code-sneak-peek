import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "math", label: "Μαθηματικά" },
  { value: "science", label: "Φυσική/Χημεία" },
  { value: "language", label: "Γλώσσα" },
  { value: "history", label: "Ιστορία" },
  { value: "arts", label: "Καλές Τέχνες" },
  { value: "sports", label: "Φυσική Αγωγή" },
  { value: "other", label: "Άλλο" },
];

interface Child {
  id: string;
  name: string;
  birth_date: string;
}

interface SchoolNotesProps {
  userId?: string;
}

export const SchoolNotes = ({ userId }: SchoolNotesProps) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  useEffect(() => {
    fetchChildren();
  }, [user, userId]);

  const fetchChildren = async () => {
    if (!user?.id && !userId) return;

    try {
      let appUserId = userId;
      
      // If no userId prop, get from auth user
      if (!appUserId) {
        const { data: appUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', user!.id)
          .single();

        if (!appUser) return;
        appUserId = appUser.id;
      }

      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', appUserId)
        .order('birth_date', { ascending: false });

      if (error) throw error;
      
      console.log('Loaded children:', data);
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const toggleChild = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() || !category || selectedChildren.length === 0) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία και επιλέξτε τουλάχιστον ένα παιδί");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use provided userId or get from auth
      let appUserId = userId;
      
      if (!appUserId) {
        const { data: appUser, error: userError } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', user?.id)
          .single();

        if (userError || !appUser) {
          throw new Error("Δεν βρέθηκε ο χρήστης");
        }
        appUserId = appUser.id;
      }

      // Create a note for each selected child
      const notePromises = selectedChildren.map(async (childId) => {
        const selectedChildData = children.find(c => c.id === childId);
        if (!selectedChildData) {
          throw new Error("Δεν βρέθηκε το παιδί");
        }

        const childAge = calculateAge(selectedChildData.birth_date);

        const { data, error } = await supabase
          .from('school_notes')
          .insert({
            user_id: appUserId,
            parent_id: appUserId,
            child_id: childId,
            child_age: childAge,
            category,
            content,
          })
          .select()
          .single();

        if (error) throw error;

        // Call AI edge function to process the note
        const { error: aiError } = await supabase.functions.invoke('process-school-note', {
          body: { noteId: data.id, content, category }
        });

        if (aiError) {
          console.error('AI processing error:', aiError);
        }

        return data;
      });

      await Promise.all(notePromises);

      toast.success(`${selectedChildren.length === 1 ? 'Η σημείωση' : 'Οι σημειώσεις'} αποθηκεύτηκαν επιτυχώς!`);
      setContent("");
      setCategory("");
      setSelectedChildren([]);
    } catch (error: any) {
      console.error('Error submitting note:', error);
      toast.error(error.message || "Σφάλμα κατά την αποθήκευση");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full px-2 sm:px-0">
      <Card className="rounded-none">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            Σχολικές Σημειώσεις
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {children.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Επιλογή Παιδιού/Παιδιών</label>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => {
                  const isSelected = selectedChildren.includes(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-none border-2 transition-all text-xs font-medium",
                        isSelected
                          ? "bg-[#00ffba] border-[#00ffba] text-black"
                          : "bg-white border-gray-300 text-gray-700 hover:border-[#00ffba]"
                      )}
                    >
                      {child.name} ({calculateAge(child.birth_date)} ετών)
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Μπορείτε να επιλέξετε ένα ή περισσότερα παιδιά
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Κατηγορία</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-none w-full">
                <SelectValue placeholder="Επιλέξτε κατηγορία..." />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Πρόγραμμα/Σημειώσεις από το Σχολείο
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Γράψτε εδώ το πρόγραμμα ή τις σημειώσεις από το σχολείο του παιδιού σας..."
              className="rounded-none min-h-[150px] sm:min-h-[200px] text-sm sm:text-base"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-none">
            <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-800">
              Ο AI βοηθός θα επεξεργαστεί τη σημείωσή σας και θα τη διαθέσει στον διαχειριστή
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || !category || selectedChildren.length === 0}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full h-10 sm:h-11 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Αποθήκευση...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Αποθήκευση Σημείωσης
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
