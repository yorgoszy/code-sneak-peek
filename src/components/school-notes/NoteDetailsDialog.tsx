import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

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

interface Exercise {
  name: string;
  description: string;
  duration: string;
  skill: string;
}

interface NoteDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: SchoolNote | null;
  categoryLabel: string;
}

export const NoteDetailsDialog: React.FC<NoteDetailsDialogProps> = ({
  isOpen,
  onClose,
  note,
  categoryLabel
}) => {
  const { t } = useTranslation();
  
  if (!note) return null;

  let aiData: { summary?: string; exercises?: Exercise[] } = {};
  try {
    if (note.ai_summary) {
      aiData = JSON.parse(note.ai_summary);
    }
  } catch (e) {
    // If parsing fails, treat ai_summary as plain text
    aiData = { summary: note.ai_summary };
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("schoolNotes.noteDetails")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("schoolNotes.parent")} {note.app_users?.name || t("schoolNotes.unknown")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("schoolNotes.subject")} {categoryLabel}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: el })}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">{t("schoolNotes.noteContent")}</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {note.content}
            </p>
          </div>

          {aiData.summary && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">{t("schoolNotes.aiSummary")}</h4>
              <p className="text-sm text-blue-800">
                {aiData.summary}
              </p>
            </div>
          )}

          {aiData.exercises && aiData.exercises.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-[#00ffba] mb-3 flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                {t("schoolNotes.suggestedExercises")}
              </h4>
              <div className="space-y-3">
                {aiData.exercises.map((exercise, index) => (
                  <Card key={index} className="rounded-none bg-gradient-to-r from-[#00ffba]/10 to-transparent border-l-4 border-[#00ffba]">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h5 className="text-sm font-semibold text-gray-900">
                          {exercise.name}
                        </h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-none">
                          {exercise.duration}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#00ffba] font-medium">{t("schoolNotes.skill")}</span>
                        <span className="text-gray-600">{exercise.skill}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
