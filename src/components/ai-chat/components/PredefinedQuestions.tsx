
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, Target, Activity } from "lucide-react";

interface PredefinedQuestion {
  id: string;
  question: string;
  icon: React.ElementType;
  category: string;
}

const predefinedQuestions: PredefinedQuestion[] = [
  {
    id: 'todays-exercises',
    question: 'Τι ασκήσεις έχω σήμερα;',
    icon: Dumbbell,
    category: 'Προπόνηση'
  },
  {
    id: 'weekly-program',
    question: 'Ποιο είναι το εβδομαδιαίο μου πρόγραμμα;',
    icon: Calendar,
    category: 'Προπόνηση'
  },
  {
    id: 'recent-tests',
    question: 'Ποια είναι τα τελευταία μου αποτελέσματα τεστ;',
    icon: Activity,
    category: 'Τεστ'
  },
  {
    id: 'progress-analysis',
    question: 'Πώς πάει η πρόοδός μου;',
    icon: Target,
    category: 'Ανάλυση'
  }
];

interface PredefinedQuestionsProps {
  onQuestionClick: (question: string) => void;
  showQuestions: boolean;
  messagesLength: number;
}

export const PredefinedQuestions: React.FC<PredefinedQuestionsProps> = ({
  onQuestionClick,
  showQuestions,
  messagesLength
}) => {
  if (!showQuestions || messagesLength !== 1) {
    return null;
  }

  const groupedQuestions = predefinedQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, PredefinedQuestion[]>);

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Γρήγορες Ερωτήσεις:</h4>
      <div className="space-y-3">
        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <div key={category}>
            <p className="text-xs font-medium text-gray-500 mb-2">{category}</p>
            <div className="grid grid-cols-1 gap-2">
              {questions.map((q) => (
                <Button
                  key={q.id}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 text-left rounded-none hover:bg-[#00ffba]/10 hover:border-[#00ffba]"
                  onClick={() => onQuestionClick(q.question)}
                >
                  <q.icon className="w-4 h-4 mr-2 text-[#00ffba]" />
                  <span className="text-sm">{q.question}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
