import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Σχολικές Σημειώσεις - Admin View
          </CardTitle>
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
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Δεν υπάρχουν σημειώσεις σε αυτή την κατηγορία
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <Card key={note.id} className="rounded-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {note.app_users?.name || "Άγνωστος Γονέας"}
                          </CardTitle>
                          <span className="text-sm text-gray-500">
                            {new Date(note.created_at).toLocaleDateString('el-GR')}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {note.ai_summary && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-none">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              AI Περίληψη:
                            </p>
                            <p className="text-sm text-blue-800">
                              {note.ai_summary}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium mb-1">Πλήρες Κείμενο:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
