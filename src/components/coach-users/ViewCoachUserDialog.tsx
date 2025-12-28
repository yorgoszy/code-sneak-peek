import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Users } from "lucide-react";

interface CoachUser {
  id: string;
  coach_id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  avatar_url?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ViewCoachUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CoachUser;
}

export const ViewCoachUserDialog = ({
  open,
  onOpenChange,
  user,
}: ViewCoachUserDialogProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return '-';
    return gender === 'male' ? 'Άνδρας' : 'Γυναίκα';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Προφίλ Αθλητή</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <Badge 
                variant="outline" 
                className={`rounded-none text-xs ${
                  user.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {user.status === 'active' ? 'Ενεργός' : 'Ανενεργός'}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{user.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{user.phone || '-'}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{user.birth_date ? formatDate(user.birth_date) : '-'}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{getGenderLabel(user.gender)}</span>
            </div>
          </div>

          {/* Notes */}
          {user.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">Σημειώσεις</p>
              <p className="text-sm text-gray-700">{user.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t text-xs text-gray-400">
            <p>Εγγραφή: {formatDate(user.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
