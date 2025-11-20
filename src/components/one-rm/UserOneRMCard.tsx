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

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-base">{userName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        {exercises.length === 0 ? (
          <div className="text-center py-2 text-gray-500">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs">Δεν υπάρχουν καταγραφές 1RM</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded-none min-w-[120px]"
              >
                <p className="font-medium text-gray-900 text-xs text-center mb-0.5">
                  {exercise.exerciseName}
                </p>
                <p className="text-lg font-bold text-[#cb8954] mb-0.5">{exercise.weight} kg</p>
                <p className="text-[10px] text-gray-500">
                  {format(new Date(exercise.recordedDate), 'd MMM yyyy', { locale: el })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
