import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { OneRMRecord } from "./OneRMManagement";

interface UserOneRMCardProps {
  userName: string;
  userAvatar?: string;
  exercises: {
    exerciseName: string;
    weight: number;
    recordedDate: string;
    notes?: string;
  }[];
}

export const UserOneRMCard = ({ userName, userAvatar, exercises }: UserOneRMCardProps) => {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Φιλτράρω τα exercises που έχουν "Αυτόματη καταγραφή" ή "Αυτόματη ενημέρωση" από Force/Velocity
  const filteredExercises = exercises.filter(exercise => {
    if (!exercise.notes) return true;
    const lowerNotes = exercise.notes.toLowerCase();
    return !(
      (lowerNotes.includes('αυτόματη καταγραφή') || lowerNotes.includes('αυτόματη ενημέρωση')) &&
      lowerNotes.includes('force/velocity')
    );
  });

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-lg">{userName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredExercises.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Δεν υπάρχουν καταγραφές 1RM</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredExercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-none min-w-[140px]"
              >
                <p className="font-medium text-gray-900 text-sm text-center mb-1">
                  {exercise.exerciseName}
                </p>
                <p className="text-2xl font-bold text-[#00ffba] mb-1">{exercise.weight} kg</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(exercise.recordedDate), 'd MMM yyyy', { locale: el })}
                </p>
                {exercise.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic text-center">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
