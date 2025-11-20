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
      <CardHeader className="pb-2 pt-3 md:pb-1 md:pt-2">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="w-8 h-8 md:w-7 md:h-7 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-base md:text-sm">{userName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3 md:pt-1 md:pb-2">
        {exercises.length === 0 ? (
          <div className="text-center py-4 md:py-1 text-gray-500">
            <TrendingUp className="h-8 w-8 md:h-5 md:w-5 mx-auto mb-2 md:mb-1 text-gray-300" />
            <p className="text-sm md:text-[10px]">Δεν υπάρχουν καταγραφές 1RM</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-1">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-3 md:p-1.5 bg-gray-50 border border-gray-200 rounded-none min-w-[100px]"
              >
                <p className="font-medium text-gray-900 text-xs md:text-[10px] text-center mb-1 md:mb-0.5">
                  {exercise.exerciseName}
                </p>
                <p className="text-xl md:text-base font-bold text-[#cb8954] mb-1 md:mb-0.5">{exercise.weight} kg</p>
                <p className="text-xs md:text-[10px] text-gray-500 tracking-wide">
                  {format(new Date(exercise.recordedDate), 'dd/MM/yy')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
