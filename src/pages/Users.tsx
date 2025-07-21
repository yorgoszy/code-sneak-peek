import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Search, Filter, Eye } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewUserDialog } from "@/components/NewUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  created_at: string;
}

interface UserWithSubscription extends AppUser {
  subscription_status: 'Ενεργή' | 'Ανενεργή' | 'Παύση';
}

const Users = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const fetchUsers = async () => {
    if (loadingUsers) return; // Prevent multiple simultaneous requests
    
    setLoadingUsers(true);
    try {
      console.log('📊 Fetching users...');
      const { data: usersData, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
        return;
      }

      // Fetch subscription status for each user
      const usersWithSubscription: UserWithSubscription[] = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('end_date, status, is_paused')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let subscriptionStatus: 'Ενεργή' | 'Ανενεργή' | 'Παύση' = 'Ανενεργή';
          
          if (subscription) {
            if (subscription.is_paused) {
              subscriptionStatus = 'Παύση';
            } else if (new Date(subscription.end_date) >= new Date()) {
              subscriptionStatus = 'Ενεργή';
            }
          }

          return {
            ...user,
            subscription_status: subscriptionStatus
          };
        })
      );

      console.log('✅ Users fetched:', usersWithSubscription.length);
      setUsers(usersWithSubscription);
    } catch (error) {
      console.error('💥 Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    console.log('👥 Users page useEffect:', {
      isAdminResult: isAdmin(),
      rolesLoading,
      userProfile: userProfile?.id,
      hasInitialized
    });

    // Only initialize once when roles are loaded and user is admin
    if (!rolesLoading && !hasInitialized) {
      if (isAdmin()) {
        console.log('👑 Admin confirmed, fetching users');
        fetchUsers();
      }
      setHasInitialized(true);
    }
  }, [isAdmin, rolesLoading, hasInitialized]);

  if (loading || rolesLoading) {
    console.log('⏳ Users page loading:', { loading, rolesLoading });
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 Not authenticated on Users page');
    return <Navigate to="/auth" replace />;
  }

  // Only allow admin users to access the users page
  if (!isAdmin()) {
    console.log('🔄 Non-admin trying to access Users page, redirecting to profile');
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleEditUser = (user: AppUser) => {
    console.log('✏️ Edit user:', user.id);
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    console.log('🗑️ Delete user:', user.id);
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleViewUser = (user: AppUser) => {
    console.log('👁️ View user:', user.id);
    setSelectedUser(user);
    setUserProfileDialogOpen(true);
  };

  const handleUserCreated = () => {
    console.log('✅ User created, refreshing list');
    fetchUsers();
  };

  const handleUserUpdated = () => {
    console.log('✅ User updated, refreshing list');
    fetchUsers();
  };

  const handleUserDeleted = () => {
    console.log('✅ User deleted, refreshing list');
    fetchUsers();
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.user_status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatusColor = (status: 'Ενεργή' | 'Ανενεργή' | 'Παύση') => {
    switch (status) {
      case 'Ενεργή':
        return 'bg-green-100 text-green-800';
      case 'Ανενεργή':
        return 'bg-yellow-100 text-yellow-800';
      case 'Παύση':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  console.log('👑 Rendering Users page for admin');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-sm text-gray-600">
                Διαχείριση χρηστών συστήματος
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.name || user?.email}
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
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

        {/* Users Content */}
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  Όλοι οι Χρήστες ({filteredUsers.length})
                </CardTitle>
                <Button 
                  className="rounded-none"
                  onClick={() => setNewUserDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Νέος Χρήστης
                </Button>
              </div>
              
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Αναζήτηση χρηστών..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Φίλτρο ρόλου" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Φίλτρο κατάστασης" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Φόρτωση χρηστών...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                      : "Δεν βρέθηκαν χρήστες"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Όνομα</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ρόλος</TableHead>
                      <TableHead>Τηλέφωνο</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                      <TableHead>Εγγραφή</TableHead>
                      <TableHead>Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.photo_url} alt={user.name} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                            {user.subscription_status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewUserDialog
        isOpen={newUserDialogOpen}
        onClose={() => setNewUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
      
      <EditUserDialog
        isOpen={editUserDialogOpen}
        onClose={() => setEditUserDialogOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
      
      <DeleteUserDialog
        isOpen={deleteUserDialogOpen}
        onClose={() => setDeleteUserDialogOpen(false)}
        onUserDeleted={handleUserDeleted}
        user={selectedUser}
      />

      <UserProfileDialog
        isOpen={userProfileDialogOpen}
        onClose={() => setUserProfileDialogOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default Users;
