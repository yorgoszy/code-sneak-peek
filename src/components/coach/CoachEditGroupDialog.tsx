import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users } from "lucide-react";
import { matchesSearchTerm } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  created_at: string;
  photo_url?: string;
  avatar_url?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

interface CoachEditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
  group: Group | null;
  coachId: string;
}

export const CoachEditGroupDialog = ({ 
  isOpen, 
  onClose, 
  onGroupUpdated, 
  group,
  coachId 
}: CoachEditGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      fetchUsers();
      fetchCurrentMembers();
    }
  }, [group, isOpen]);

  const fetchUsers = async () => {
    if (!coachId) return;
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('coach_id', coachId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCurrentMembers = async () => {
    if (!group) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);

      if (error) {
        console.error('Error fetching current members:', error);
      } else {
        const memberIds = data?.map(member => member.user_id) || [];
        setSelectedUsers(memberIds);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleUpdate = async () => {
    if (!groupName.trim() || !group) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα ομάδας",
      });
      return;
    }

    setLoading(true);
    try {
      const { error: groupError } = await supabase
        .from('groups')
        .update({
          name: groupName,
          description: groupDescription,
        })
        .eq('id', group.id);

      if (groupError) {
        console.error('Error updating group:', groupError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η ενημέρωση της ομάδας",
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id);

      if (deleteError) {
        console.error('Error removing old members:', deleteError);
      }

      if (selectedUsers.length > 0) {
        const memberInserts = selectedUsers.map(userId => ({
          group_id: group.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (membersError) {
          console.error('Error adding members:', membersError);
          toast({
            variant: "destructive",
            title: "Σφάλμα",
            description: "Η ομάδα ενημερώθηκε αλλά υπήρξε πρόβλημα με τα μέλη",
          });
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Η ομάδα ενημερώθηκε επιτυχώς",
      });

      onGroupUpdated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά την ενημέρωση της ομάδας",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    matchesSearchTerm(user.name, searchTerm) ||
    matchesSearchTerm(user.email, searchTerm)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[630px] rounded-none">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Ομάδας</DialogTitle>
          <DialogDescription>
            Επεξεργαστείτε τις πληροφορίες της ομάδας και τα μέλη της
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Όνομα Ομάδας</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Εισάγετε το όνομα της ομάδας"
              required
              className="rounded-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="groupDescription">
              Περιγραφή (προαιρετικό) - {selectedUsers.length} μέλη
            </Label>
            <Input
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Εισάγετε περιγραφή της ομάδας"
              className="rounded-none"
            />
          </div>

          <div className="space-y-4">
            <Label>Μέλη Ομάδας</Label>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση αθλητών..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Φόρτωση αθλητών...</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Αθλητής</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photo_url || user.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="md:hidden text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="bg-primary/10 p-4 rounded-none">
                <p className="text-sm text-primary">
                  <Users className="inline h-4 w-4 mr-1" />
                  Επιλεγμένοι αθλητές: {selectedUsers.length}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-none"
            >
              {loading ? "Ενημέρωση..." : "Ενημέρωση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
