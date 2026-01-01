import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Users, Search, Eye, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
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

const CoachGroupsPage = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { userProfile, isCoach, isAdmin, loading: roleLoading } = useRoleCheck();
  const [searchParams] = useSearchParams();
  const coachIdParam = searchParams.get('coachId');
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
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

  // Determine effective coach ID
  const effectiveCoachId = isAdmin() && coachIdParam ? coachIdParam : userProfile?.id;

  const fetchUsers = async () => {
    if (!effectiveCoachId) return;
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('coach_id', effectiveCoachId)
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
    if (!effectiveCoachId) return;
    
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .or(`created_by.eq.${effectiveCoachId},coach_id.eq.${effectiveCoachId}`)
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

  // Tablet detection
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  useEffect(() => {
    if (effectiveCoachId) {
      fetchUsers();
      fetchGroups();
    }
  }, [effectiveCoachId]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα ομάδας και επιλέξτε τουλάχιστον έναν χρήστη",
      });
      return;
    }

    if (!effectiveCoachId) {
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
          created_by: effectiveCoachId,
          coach_id: effectiveCoachId
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

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isCoach() && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
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
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CoachSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          contextCoachId={coachIdParam || undefined}
        />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {(isMobile || isTablet) && showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed top-0 left-0 h-full">
            <CoachSidebar 
              isCollapsed={false} 
              setIsCollapsed={() => {}}
              contextCoachId={coachIdParam || undefined}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet Header */}
        {(isMobile || isTablet) && (
          <div className="lg:hidden bg-background border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Ομάδες</h1>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Top Navigation */}
        <nav className="hidden lg:block bg-background border-b border-border px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ομάδες</h1>
              <p className="text-sm text-muted-foreground">
                Διαχείριση ομάδων αθλητών
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {userProfile?.name || user?.email}
              </span>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>
        </nav>

        {/* Groups Content */}
        <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-hidden">
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
                          <TableHead className="hidden lg:table-cell">Κατάσταση</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={(checked) => handleUserSelect(u.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={u.photo_url || u.avatar_url || ''} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{u.name}</div>
                                  <div className="md:hidden text-xs text-muted-foreground">{u.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className={`px-2 py-1 text-xs rounded-none ${
                                u.user_status === 'active' ? 'bg-green-100 text-green-800' :
                                u.user_status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {u.user_status}
                              </span>
                            </TableCell>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none">
          <DialogHeader>
            <DialogTitle>Νέα Ομάδα</DialogTitle>
            <DialogDescription>
              Δημιουργήστε μια νέα ομάδα αθλητών
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
              <Label htmlFor="groupDescription">Περιγραφή (προαιρετικό)</Label>
              <Input
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Εισάγετε περιγραφή της ομάδας"
                className="rounded-none"
              />
            </div>

            <div className="bg-muted p-3 rounded-none">
              <p className="text-sm text-muted-foreground">
                Επιλεγμένοι αθλητές: {selectedUsers.length}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewGroupDialogOpen(false)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={creating}
                className="rounded-none"
              >
                {creating ? "Δημιουργία..." : "Δημιουργία"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Group Dialog */}
      <ViewGroupDialog
        isOpen={viewGroupDialogOpen}
        onClose={() => setViewGroupDialogOpen(false)}
        group={selectedGroup}
      />

      {/* Edit Group Dialog */}
      <CoachEditGroupDialog
        isOpen={editGroupDialogOpen}
        onClose={() => setEditGroupDialogOpen(false)}
        onGroupUpdated={fetchGroups}
        group={selectedGroup}
        coachId={effectiveCoachId || ''}
      />

      {/* Delete Group Dialog */}
      <DeleteGroupDialog
        isOpen={deleteGroupDialogOpen}
        onClose={() => setDeleteGroupDialogOpen(false)}
        onGroupDeleted={fetchGroups}
        group={selectedGroup}
      />
    </div>
  );
};

export default CoachGroupsPage;

