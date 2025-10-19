import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { value: "math", label: "Μαθηματικά" },
  { value: "science", label: "Φυσική/Χημεία" },
  { value: "language", label: "Γλώσσα" },
  { value: "history", label: "Ιστορία" },
  { value: "arts", label: "Καλές Τέχνες" },
  { value: "sports", label: "Φυσική Αγωγή" },
  { value: "other", label: "Άλλο" },
];

export const SchoolNotes = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !category) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user from app_users
      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userError || !appUser) {
        throw new Error("Δεν βρέθηκε ο χρήστης");
      }

      // For now, we'll use the same user_id for both parent and child
      // In a real scenario, you'd select the child from a list
      const { data, error } = await supabase
        .from('school_notes')
        .insert({
          user_id: appUser.id,
          parent_id: appUser.id,
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
        // Don't block the user if AI fails
      }

      toast.success("Η σημείωση αποθηκεύτηκε επιτυχώς!");
      setContent("");
      setCategory("");
    } catch (error: any) {
      console.error('Error submitting note:', error);
      toast.error(error.message || "Σφάλμα κατά την αποθήκευση");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Σχολικές Σημειώσεις
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Κατηγορία</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε κατηγορία..." />
              </SelectTrigger>
              <SelectContent>
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
              className="rounded-none min-h-[200px]"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-none">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Ο AI βοηθός θα επεξεργαστεί τη σημείωσή σας και θα τη διαθέσει στον διαχειριστή
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || !category}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black w-full"
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
