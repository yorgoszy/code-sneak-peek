
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

const Users = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
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
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
      } else {
        console.log('✅ Users fetched:', data?.length);
        setUsers(data || []);
      }
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
    console.log('✏️ Edit user:', user.id, user);
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
    setEditUserDialogOpen(false);
    setSelectedUser(null);
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

  console.log('👑 Rendering Users page for admin');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-xs md:text-sm text-gray-600">
                Διαχείριση χρηστών συστήματος
              </p>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-gray-600">
                {userProfile?.name || user?.email}
                <span className="ml-1 md:ml-2 px-1 md:px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>
              </span>
              <Button 
                variant="outline" 
                className="rounded-none text-xs md:text-sm px-2 md:px-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>
        </nav>

        {/* Users Content */}
        <div className="flex-1 p-3 md:p-6">
          <Card className="rounded-none">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                <CardTitle className="text-base md:text-lg font-semibold">
                  Όλοι οι Χρήστες ({filteredUsers.length})
                </CardTitle>
                <Button 
                  className="rounded-none text-xs md:text-sm w-full md:w-auto"
                  onClick={() => setNewUserDialogOpen(true)}
                >
                  <Plus className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                  Νέος Χρήστης
                </Button>
              </div>
              
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
                <div className="relative">
                  <Search className="absolute left-2 md:left-3 top-2 md:top-3 h-3 md:h-4 w-3 md:w-4 text-gray-400" />
                  <Input
                    placeholder="Αναζήτηση χρηστών..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 md:pl-10 text-xs md:text-sm rounded-none"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="rounded-none">
                    <Filter className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
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
                  <SelectTrigger className="rounded-none">
                    <Filter className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
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
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600 text-sm md:text-base">Φόρτωση χρηστών...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600 text-sm md:text-base">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                      : "Δεν βρέθηκαν χρήστες"}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-3">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-none p-3 space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.photo_url} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Ρόλος:</span>
                            <div className="mt-1">
                              <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Κατάσταση:</span>
                            <div className="mt-1">
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(user.user_status)}`}>
                                {user.user_status}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Τηλέφωνο:</span>
                            <div className="mt-1 text-xs">{user.phone || '-'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Εγγραφή:</span>
                            <div className="mt-1 text-xs">{formatDate(user.created_at)}</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none flex-1 text-xs"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Προβολή
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none flex-1 text-xs"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Επεξεργασία
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none text-red-600 hover:text-red-700 text-xs px-2"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop/Tablet View - Table */}
                  <div className="hidden md:block">
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
                              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(user.user_status)}`}>
                                {user.user_status}
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
                  </div>
                </div>
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
        onClose={() => {
          setEditUserDialogOpen(false);
          setSelectedUser(null);
        }}
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
