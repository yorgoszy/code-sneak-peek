
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { useState } from "react";
import { Key } from "lucide-react";

interface UserProfileHeaderProps {
  user: any;
}

export const UserProfileHeader = ({ user }: UserProfileHeaderProps) => {
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  // Ελέγχουμε αν ο τρέχων χρήστης είναι ο ίδιος με το προφίλ που βλέπουμε
  const isOwnProfile = currentUser?.id && user?.auth_user_id === currentUser.id;
  
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
    <>
      <Card className="rounded-none">
        <CardHeader className="pb-3 md:pb-6">
          <div className={`flex items-center justify-between ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
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
            
            {/* Κουμπί αλλαγής κωδικού - μόνο για το δικό του προφίλ */}
            {isOwnProfile && (
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setIsPasswordDialogOpen(true)}
                className="rounded-none flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                {!isMobile && "Αλλαγή Κωδικού"}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </>
  );
};
