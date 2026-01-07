import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, Search, Eye } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CoachEditGroupDialog } from "@/components/coach/CoachEditGroupDialog";
import { DeleteGroupDialog } from "@/components/DeleteGroupDialog";
import { ViewGroupDialog } from "@/components/ViewGroupDialog";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";

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

const CoachGroupsContent = () => {
  const { coachId } = useCoachContext();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  // Dialog states
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewGroupDialogOpen, setViewGroupDialogOpen] = useState(false);
  
  const { toast } = useToast();

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

  const fetchGroups = async () => {
    if (!coachId) return;
    
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .or(`created_by.eq.${coachId},coach_id.eq.${coachId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
      } else {
        setGroups(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (coachId) {
      fetchUsers();
      fetchGroups();
    }
  }, [coachId]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα ομάδας και επιλέξτε τουλάχιστον έναν χρήστη",
      });
      return;
    }

    if (!coachId) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν μπορέσαμε να αναγνωρίσουμε το προφίλ σας",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupName,
          description: groupDescription,
          created_by: coachId,
          coach_id: coachId
        }])
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η δημιουργία της ομάδας",
        });
        return;
      }

      const memberInserts = selectedUsers.map(userId => ({
        group_id: groupData.id,
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
          description: "Η ομάδα δημιουργήθηκε αλλά υπήρξε πρόβλημα με την προσθήκη μελών",
        });
      } else {
        toast({
          title: "Επιτυχία",
          description: "Η ομάδα δημιουργήθηκε επιτυχώς",
        });
      }

      setGroupName("");
      setGroupDescription("");
      setSelectedUsers([]);
      setNewGroupDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά τη δημιουργία της ομάδας",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setEditGroupDialogOpen(true);
  };

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroup(group);
    setDeleteGroupDialogOpen(true);
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    setViewGroupDialogOpen(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Existing Groups */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              Υπάρχουσες Ομάδες ({groups.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingGroups ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Φόρτωση ομάδων...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Δεν βρέθηκαν ομάδες</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Όνομα</TableHead>
                    <TableHead className="hidden md:table-cell">Περιγραφή</TableHead>
                    <TableHead className="hidden lg:table-cell">Δημιουργία</TableHead>
                    <TableHead>Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{group.name}</div>
                          <div className="md:hidden text-xs text-muted-foreground mt-1">
                            {group.description && `${group.description} • `}
                            {formatDate(group.created_at)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{group.description || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(group.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1 lg:space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none"
                            onClick={() => handleViewGroup(group)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGroup(group)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Group */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              Δημιουργία Νέας Ομάδας
            </CardTitle>
            <Button 
              className="rounded-none"
              onClick={() => setNewGroupDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέα Ομάδα
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Users */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση αθλητών..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>

            {/* Users List */}
            {loadingUsers ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Φόρτωση αθλητών...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded-none">
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
                            onCheckedChange={(checked) => handleUserSelect(user.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage src={user.photo_url || user.avatar_url || ''} />
                              <AvatarFallback className="rounded-full">
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
              <div className="flex items-center justify-between p-3 bg-muted rounded-none">
                <span className="text-sm">
                  {selectedUsers.length} αθλητές επιλεγμένοι
                </span>
                <Button
                  onClick={() => setNewGroupDialogOpen(true)}
                  className="rounded-none"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Δημιουργία Ομάδας
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Νέα Ομάδα</DialogTitle>
            <DialogDescription>
              Δημιουργήστε μια νέα ομάδα για τους επιλεγμένους αθλητές
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Όνομα Ομάδας</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="π.χ. Ομάδα Α"
                className="rounded-none"
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Περιγραφή (προαιρετικό)</Label>
              <Input
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="π.χ. Αρχάριοι"
                className="rounded-none"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length} αθλητές θα προστεθούν στην ομάδα
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNewGroupDialogOpen(false)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={creating || !groupName.trim() || selectedUsers.length === 0}
                className="rounded-none"
              >
                {creating ? "Δημιουργία..." : "Δημιουργία"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      {selectedGroup && (
        <CoachEditGroupDialog
          group={selectedGroup}
          isOpen={editGroupDialogOpen}
          onClose={() => setEditGroupDialogOpen(false)}
          onGroupUpdated={fetchGroups}
          coachId={coachId || ''}
        />
      )}

      {/* Delete Group Dialog */}
      {selectedGroup && (
        <DeleteGroupDialog
          group={selectedGroup}
          isOpen={deleteGroupDialogOpen}
          onClose={() => setDeleteGroupDialogOpen(false)}
          onGroupDeleted={fetchGroups}
        />
      )}

      {/* View Group Dialog */}
      {selectedGroup && (
        <ViewGroupDialog
          group={selectedGroup}
          isOpen={viewGroupDialogOpen}
          onClose={() => setViewGroupDialogOpen(false)}
        />
      )}
    </div>
  );
};

const CoachGroupsPage = () => {
  return (
    <CoachLayout title="Ομάδες" ContentComponent={CoachGroupsContent} />
  );
};

export default CoachGroupsPage;
