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
    <div className="space-y-2">
      {exercises.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="text-center py-2 text-gray-500">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-gray-300" />
              <p className="text-sm">{userName} - Δεν υπάρχουν καταγραφές 1RM</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        exercises.map((exercise, index) => (
          <Card key={index} className="rounded-none hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-[#00ffba] text-black text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{userName}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {exercise.exerciseName}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[#00ffba]">{exercise.weight} kg</p>
                </div>

                <div className="text-right flex-shrink-0 min-w-[90px]">
                  <p className="text-xs text-gray-500">
                    {format(new Date(exercise.recordedDate), 'd MMM yyyy', { locale: el })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
