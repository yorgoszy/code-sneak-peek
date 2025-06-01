
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UserProfileHeaderProps {
  user: any;
}

export const UserProfileHeader = ({ user }: UserProfileHeaderProps) => {
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
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.photo_url} alt={user.name} />
            <AvatarFallback>
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getRoleColor(user.role)}>
                {user.role}
              </Badge>
              <Badge variant="outline">
                {user.user_status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
