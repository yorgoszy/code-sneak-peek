import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { OneRMRecord } from "./OneRMManagement";

interface UserOneRMCardProps {
  userName: string;
  userAvatar?: string;
  exerciseName: string;
  weight: number;
  recordedDate: string;
  notes?: string;
}

export const UserOneRMCard = ({ userName, userAvatar, exerciseName, weight, recordedDate, notes }: UserOneRMCardProps) => {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="rounded-none w-[200px] flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate">{userName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-none">
          <p className="font-medium text-gray-900 text-sm text-center mb-2">
            {exerciseName}
          </p>
          <p className="text-3xl font-bold text-[#00ffba] mb-1">{weight} kg</p>
          <p className="text-xs text-gray-500">
            {format(new Date(recordedDate), 'd MMM yyyy', { locale: el })}
          </p>
          {notes && (
            <p className="text-xs text-gray-500 mt-2 italic text-center">{notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
