
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfileHeaderProps {
  user: any;
}

export const UserProfileHeader = ({ user }: UserProfileHeaderProps) => {
  const isMobile = useIsMobile();
  
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'athlete':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-purple-100 text-purple-800';
      case 'parent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3 md:pb-6">
        <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
          <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} flex-shrink-0`}>
            <AvatarImage src={user.photo_url} alt={user.name} />
            <AvatarFallback className={isMobile ? 'text-sm' : ''}>
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold truncate ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {user.name}
            </h3>
            <p className={`text-gray-600 truncate ${isMobile ? 'text-sm' : ''}`}>
              {user.email}
            </p>
            <div className={`flex items-center flex-wrap gap-2 ${isMobile ? 'mt-1' : 'mt-2'}`}>
              <Badge className={`${getRoleColor(user.role)} ${isMobile ? 'text-xs' : ''}`}>
                {user.role}
              </Badge>
              <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                {user.user_status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
