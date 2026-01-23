import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Search, Filter, Eye, Mail, Menu, Users as UsersIcon, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { matchesSearchTerm } from "@/lib/utils";
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
import { testPasswordReset } from "@/utils/testPasswordReset";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  avatar_url?: string;
  created_at: string;
  coach_id?: string;
}

interface UserWithSubscription extends AppUser {
  subscription_status: 'Ενεργή' | 'Ανενεργή' | 'Παύση';
}

const Users = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, isCoach, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // New registrations state
  const [newRegistrations, setNewRegistrations] = useState<UserWithSubscription[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithSubscription[]>([]);
  
  // Coach users state (χρήστες που ανήκουν σε coaches)
  const [coachUsers, setCoachUsers] = useState<UserWithSubscription[]>([]);
  const [activeTab, setActiveTab] = useState<string>("admin-users");
  
  // Coaches for filter
  const [coaches, setCoaches] = useState<Pick<AppUser, 'id' | 'name' | 'email' | 'avatar_url' | 'photo_url'>[]>([]);
  const [coachFilter, setCoachFilter] = useState<string>("all");
  
  // Coach role users state (χρήστες με role='coach')
  const [coachRoleUsers, setCoachRoleUsers] = useState<UserWithSubscription[]>([]);

  // Check for tablet size
  useEffect(() => {
    const checkTabletSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTabletSize();
    window.addEventListener('resize', checkTabletSize);
    
    return () => window.removeEventListener('resize', checkTabletSize);
  }, []);

  const fetchUsers = async () => {
    if (loadingUsers) return; // Prevent multiple simultaneous requests
    
    setLoadingUsers(true);
    try {
      console.log('📊 Fetching users...');
      
      // For coaches, only fetch their own users
      if (isCoach() && !isAdmin()) {
        let query = supabase
          .from('app_users')
          .select('*')
          .eq('coach_id', userProfile?.id)
          .neq('role', 'admin')
          .order('created_at', { ascending: false });
        
        const { data: usersData, error } = await query;
        
        if (error) {
          console.error('❌ Error fetching users:', error);
          return;
        }
        
        const usersWithSubscription = await fetchSubscriptionStatuses(usersData || []);
        setUsers(usersWithSubscription);
        setAllUsers(usersWithSubscription);
        return;
      }
      
      // For admins: fetch admin users (with admin coach_id) and coach users separately
      // Admin users - users with admin's coach_id
      const ADMIN_COACH_ID = 'c6d44641-3b95-46bd-8270-e5ed72de25ad';
      const { data: adminUsersData, error: adminError } = await supabase
        .from('app_users')
        .select('*')
        .eq('coach_id', ADMIN_COACH_ID)
        .order('created_at', { ascending: false });
      
      if (adminError) {
        console.error('❌ Error fetching admin users:', adminError);
        return;
      }
      
      // Coach users - users with coach_id that is NOT the admin's coach_id
      const { data: coachUsersData, error: coachError } = await supabase
        .from('app_users')
        .select('*')
        .not('coach_id', 'is', null)
        .neq('coach_id', ADMIN_COACH_ID)
        .order('created_at', { ascending: false });
      
      if (coachError) {
        console.error('❌ Error fetching coach users:', coachError);
        return;
      }
      
      // Fetch coaches (users with role = 'coach') for dropdown filter
      const { data: coachesData, error: coachesError } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url')
        .eq('role', 'coach')
        .order('name', { ascending: true });
      
      if (coachesError) {
        console.error('❌ Error fetching coaches:', coachesError);
      } else {
        setCoaches(coachesData || []);
      }
      
      // Fetch full coach data for the Coaches tab (users with role = 'coach')
      const { data: coachRoleData, error: coachRoleError } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'coach')
        .order('created_at', { ascending: false });
      
      if (coachRoleError) {
        console.error('❌ Error fetching coach role users:', coachRoleError);
      } else {
        const coachRoleWithSubscription = await fetchSubscriptionStatuses(coachRoleData || []);
        setCoachRoleUsers(coachRoleWithSubscription);
        console.log('✅ Coach role users fetched:', coachRoleWithSubscription.length);
      }

      // Fetch subscription status for admin users
      const adminUsersWithSubscription = await fetchSubscriptionStatuses(adminUsersData || []);
      
      // Fetch subscription status for coach users
      const coachUsersWithSubscription = await fetchSubscriptionStatuses(coachUsersData || []);

      console.log('✅ Admin users fetched:', adminUsersWithSubscription.length);
      console.log('✅ Coach users fetched:', coachUsersWithSubscription.length);
      
      // Set coach users
      setCoachUsers(coachUsersWithSubscription);
      
      // Φέρνουμε τους acknowledged χρήστες από τη βάση για τον τρέχοντα admin
      if (!userProfile?.id) {
        setNewRegistrations(adminUsersWithSubscription);
        setAllUsers([]);
        setUsers(adminUsersWithSubscription);
        return;
      }

      const { data: acknowledgedData } = await supabase
        .from('acknowledged_users')
        .select('user_id')
        .eq('admin_user_id', userProfile.id);
      const acknowledgedUserIdsSet = new Set(
        (acknowledgedData || []).map(item => item.user_id)
      );
      
      // Filter new registrations only from admin users
      const newUsers = adminUsersWithSubscription.filter(user => 
        !acknowledgedUserIdsSet.has(user.id)
      );
      const acknowledgedUsers = adminUsersWithSubscription.filter(user => 
        acknowledgedUserIdsSet.has(user.id)
      );
      
      setNewRegistrations(newUsers);
      setAllUsers(acknowledgedUsers);
      setUsers(adminUsersWithSubscription);
      
      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('users-updated'));
      
    } catch (error) {
      console.error('💥 Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Helper function to fetch subscription statuses
  const fetchSubscriptionStatuses = async (usersData: AppUser[]): Promise<UserWithSubscription[]> => {
    // First, get all coach_ids and check which ones are actually coaches
    const coachIds = [...new Set(usersData.filter(u => u.coach_id).map(u => u.coach_id!))];
    
    let coachRoles: Record<string, string> = {};
    if (coachIds.length > 0) {
      const { data: coachData } = await supabase
        .from('app_users')
        .select('id, role')
        .in('id', coachIds);
      
      if (coachData) {
        coachRoles = Object.fromEntries(coachData.map(c => [c.id, c.role]));
      }
    }

    return Promise.all(
      usersData.map(async (user) => {
        let subscription = null;
        
        // Check if user was created by a coach (coach_id points to a user with role='coach')
        const isCoachManaged = user.coach_id && coachRoles[user.coach_id] === 'coach';
        
        if (isCoachManaged) {
          const { data: coachSub } = await supabase
            .from('coach_subscriptions')
            .select('end_date, status, is_paused')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          subscription = coachSub;
        } else {
          // Regular user - use user_subscriptions
          const { data: userSub } = await supabase
            .from('user_subscriptions')
            .select('end_date, status, is_paused')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          subscription = userSub;
        }

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
  };

  const handleAcknowledgeUsers = async () => {
    if (!userProfile?.id) {
      console.error('❌ No user profile found');
      toast.error('Σφάλμα: Δεν βρέθηκε το προφίλ χρήστη');
      return;
    }
    
    const newUserIds = newRegistrations.map(user => user.id);
    
    if (newUserIds.length === 0) {
      toast.error('Δεν υπάρχουν νέοι χρήστες για ενημέρωση');
      return;
    }
    
    console.log('📝 Acknowledging users:', { admin_user_id: userProfile.id, user_ids: newUserIds });
    
    // Αποθηκεύουμε στη βάση με upsert για να αποφύγουμε duplicate errors
    const acknowledgedRecords = newUserIds.map(userId => ({
      admin_user_id: userProfile.id,
      user_id: userId
    }));
    
    const { error } = await supabase
      .from('acknowledged_users')
      .upsert(acknowledgedRecords, {
        onConflict: 'admin_user_id,user_id'
      });
    
    if (error) {
      console.error('❌ Error acknowledging users:', error);
      toast.error(`Σφάλμα κατά την ενημέρωση: ${error.message}`);
      return;
    }
    
    toast.success('Οι χρήστες ενημερώθηκαν επιτυχώς');
    
    // Ανανέωση της λίστας χρηστών
    await fetchUsers();
    
    // Move new registrations to all users
    setAllUsers(prev => [...prev, ...newRegistrations]);
    setNewRegistrations([]);
    
    // Trigger sidebar update
    window.dispatchEvent(new CustomEvent('users-acknowledged'));
    
    toast.success('Νέες εγγραφές ενημερώθηκαν');
  };

  useEffect(() => {
    console.log('👥 Users page useEffect:', {
      isAdminResult: isAdmin(),
      isCoachResult: isCoach(),
      rolesLoading,
      userProfile: userProfile?.id,
      hasInitialized
    });

    // Only initialize once when roles are loaded and user is admin or coach
    if (!rolesLoading && !hasInitialized) {
      if (isAdmin() || isCoach()) {
        console.log('👑 Admin/Coach confirmed, fetching users');
        fetchUsers();
      }
      setHasInitialized(true);
    }
  }, [isAdmin, isCoach, rolesLoading, hasInitialized]);

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

  // Only allow admin and coach users to access the users page
  if (!isAdmin() && !isCoach()) {
    console.log('🔄 Non-admin/non-coach trying to access Users page, redirecting to profile');
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  // Choose appropriate sidebar
  const SidebarComponent = isCoach() ? CoachSidebar : Sidebar;

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

  const handleTestPasswordReset = async (user: AppUser) => {
    console.log('🧪 Testing password reset for:', user.email);
    toast.loading('Δοκιμή αποστολής email reset...', { id: 'password-reset-test' });
    
    try {
      const result = await testPasswordReset(user.email);
      
      if (result.success) {
        toast.success(`✅ Email reset στάλθηκε επιτυχώς στο ${user.email}`, { 
          id: 'password-reset-test' 
        });
      } else {
        toast.error(`❌ Σφάλμα: ${result.error}`, { 
          id: 'password-reset-test' 
        });
      }
    } catch (error: any) {
      toast.error(`💥 Εξαίρεση: ${error.message}`, { 
        id: 'password-reset-test' 
      });
    }
  };

  // Filter users based on search term and filters
  // For coaches, use all users directly (no acknowledged logic)
  const usersToFilter = isCoach() && !isAdmin() ? users : allUsers;
  
  const filteredUsers = usersToFilter.filter(user => {
    const matchesSearch = matchesSearchTerm(user.name, searchTerm) ||
                          matchesSearchTerm(user.email, searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSubscription = subscriptionFilter === "all" || user.subscription_status === subscriptionFilter;
    
    return matchesSearch && matchesRole && matchesSubscription;
  });

  // Filter coach users for the Coach Users tab
  const filteredCoachUsers = coachUsers.filter(user => {
    const matchesSearch = matchesSearchTerm(user.name, searchTerm) ||
                          matchesSearchTerm(user.email, searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSubscription = subscriptionFilter === "all" || user.subscription_status === subscriptionFilter;
    const matchesCoach = coachFilter === "all" || user.coach_id === coachFilter;
    
    return matchesSearch && matchesRole && matchesSubscription && matchesCoach;
  });

  // Filter coach role users for the Coaches tab
  const filteredCoachRoleUsers = coachRoleUsers.filter(user => {
    const matchesSearch = matchesSearchTerm(user.name, searchTerm) ||
                          matchesSearchTerm(user.email, searchTerm);
    const matchesSubscription = subscriptionFilter === "all" || user.subscription_status === subscriptionFilter;
    
    return matchesSearch && matchesSubscription;
  });

  // Helper to get coach info by id
  const getCoachInfo = (coachId: string | undefined) => {
    if (!coachId) return null;
    return coaches.find(c => c.id === coachId);
  };

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
      case 'coach':
        return 'bg-[#00ffba]/20 text-[#00ffba]';
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

  console.log('👑 Rendering Users page for', isCoach() ? 'coach' : 'admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Large screens only */}
        <div className="hidden lg:block">
          <SidebarComponent
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
        
        {/* Mobile/Tablet Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
              <SidebarComponent
                isCollapsed={false}
                setIsCollapsed={() => {}}
              />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile/Tablet header with menu button */}
          {(isMobile || isTablet) && (
            <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-4 shadow-sm lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none"
                    onClick={() => setShowMobileSidebar(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <h1 className="ml-4 text-lg font-semibold text-gray-900">
                    {isCoach() && !isAdmin() ? 'Οι Αθλητές μου' : 'Users'}
                  </h1>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
          
          {/* Desktop Top Navigation */}
          {!(isMobile || isTablet) && (
            <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {isCoach() && !isAdmin() ? 'Οι Αθλητές μου' : 'Users'}
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                    {isCoach() && !isAdmin() ? 'Διαχείριση των αθλητών σας' : 'Διαχείριση χρηστών συστήματος'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="hidden md:flex items-center text-xs lg:text-sm text-gray-600">
                    <span className="truncate max-w-32 lg:max-w-none">
                      {userProfile?.name || user?.email}
                    </span>
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                    {isCoach() && !isAdmin() && <span className="ml-2 px-2 py-1 bg-[#00ffba]/20 text-[#00ffba] text-xs rounded">Coach</span>}
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-none text-xs lg:text-sm px-2 lg:px-4"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Αποσύνδεση</span>
                  </Button>
                </div>
              </div>
            </nav>
          )}

          {/* Users Content */}
        <div className="flex-1 p-2 lg:p-6 space-y-6">
          {/* Tabs for Admin - Coach Users toggle */}
          {isAdmin() && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="rounded-none w-full sm:w-auto">
                <TabsTrigger value="admin-users" className="rounded-none flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Χρήστες ({allUsers.length})
                </TabsTrigger>
                <TabsTrigger value="coaches" className="rounded-none flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Coaches ({coachRoleUsers.length})
                </TabsTrigger>
                <TabsTrigger value="coach-users" className="rounded-none flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Coach Users ({coachUsers.length})
                </TabsTrigger>
              </TabsList>

              {/* Admin Users Tab */}
              <TabsContent value="admin-users" className="space-y-6 mt-4">
                {/* New Registrations Card - Only for admins */}
                {newRegistrations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-base lg:text-lg font-semibold text-[#00ffba]">
                          Νέες Εγγραφές ({newRegistrations.length})
                        </CardTitle>
                        <Button 
                          className="rounded-none text-xs lg:text-sm px-3 lg:px-4 w-full sm:w-auto bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                          onClick={handleAcknowledgeUsers}
                        >
                          Ενημερώθηκα
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {newRegistrations.map((user) => (
                          <Card key={user.id} className="p-4 border border-[#00ffba]/20 bg-[#00ffba]/5">
                            {/* User Info */}
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                                    {user.role}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                    {user.subscription_status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2 justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none p-2"
                                onClick={() => handleTestPasswordReset(user)}
                                title="Αποστολή κωδικού"
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none p-2"
                                onClick={() => handleViewUser(user)}
                                title="Προβολή προφίλ"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none p-2"
                                onClick={() => handleEditUser(user)}
                                title="Επεξεργασία χρήστη"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Τηλέφωνο: {user.phone || '-'}</span>
                                <span>Εγγραφή: {formatDate(user.created_at)}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Admin Users Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-base lg:text-lg font-semibold">
                        Όλοι οι Χρήστες ({allUsers.length})
                      </CardTitle>
                      <Button 
                        className="rounded-none text-xs lg:text-sm px-3 lg:px-4 w-full sm:w-auto"
                        onClick={() => setNewUserDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                        Νέος Χρήστης
                      </Button>
                    </div>
                    
                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Αναζήτηση χρηστών..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="text-sm">
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
                      
                      <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                        <SelectTrigger className="text-sm sm:col-span-2 lg:col-span-1">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Κατάσταση συνδρομής" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλες οι συνδρομές</SelectItem>
                          <SelectItem value="Ενεργή">Ενεργή</SelectItem>
                          <SelectItem value="Ανενεργή">Ανενεργή</SelectItem>
                          <SelectItem value="Παύση">Παύση</SelectItem>
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
                          {searchTerm || roleFilter !== "all" || subscriptionFilter !== "all"
                            ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                            : "Δεν βρέθηκαν χρήστες"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block">
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
                                        <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
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
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleViewUser(user)}
                                        title="Προβολή προφίλ"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleEditUser(user)}
                                        title="Επεξεργασία χρήστη"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none text-blue-600 hover:text-blue-700"
                                        onClick={() => handleTestPasswordReset(user)}
                                        title="Test Password Reset"
                                      >
                                        <Mail className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteUser(user)}
                                        title="Διαγραφή χρήστη"
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

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                          {filteredUsers.map((user) => (
                            <Card key={user.id} className="p-4 border border-gray-200">
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                  <AvatarFallback>
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                                      {user.role}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                      {user.subscription_status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleViewUser(user)}
                                  title="Προβολή προφίλ"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleEditUser(user)}
                                  title="Επεξεργασία χρήστη"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none text-blue-600 hover:text-blue-700 p-2"
                                  onClick={() => handleTestPasswordReset(user)}
                                  title="Test Password Reset"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none text-red-600 hover:text-red-700 p-2"
                                  onClick={() => handleDeleteUser(user)}
                                  title="Διαγραφή χρήστη"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Additional Info on mobile */}
                              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Τηλέφωνο: {user.phone || '-'}</span>
                                  <span>Εγγραφή: {formatDate(user.created_at)}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coaches Tab - Users with role='coach' */}
              <TabsContent value="coaches" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-base lg:text-lg font-semibold">
                        Coaches ({coachRoleUsers.length})
                      </CardTitle>
                    </div>
                    
                    {/* Search and Filters for Coaches */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Αναζήτηση coaches..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      
                      <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                        <SelectTrigger className="text-sm">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Κατάσταση συνδρομής" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλες οι συνδρομές</SelectItem>
                          <SelectItem value="Ενεργή">Ενεργή</SelectItem>
                          <SelectItem value="Ανενεργή">Ανενεργή</SelectItem>
                          <SelectItem value="Παύση">Παύση</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Φόρτωση coaches...</p>
                      </div>
                    ) : filteredCoachRoleUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">
                          {searchTerm || subscriptionFilter !== "all"
                            ? "Δεν βρέθηκαν coaches με τα επιλεγμένα κριτήρια" 
                            : "Δεν υπάρχουν coaches"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Όνομα</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Τηλέφωνο</TableHead>
                                <TableHead>Κατάσταση</TableHead>
                                <TableHead>Εγγραφή</TableHead>
                                <TableHead>Ενέργειες</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCoachRoleUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                        <AvatarFallback>
                                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{user.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{user.phone || '-'}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                      {user.subscription_status}
                                    </span>
                                  </TableCell>
                                  <TableCell>{formatDate(user.created_at)}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleTestPasswordReset(user)}
                                        title="Αποστολή κωδικού"
                                      >
                                        <Mail className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleViewUser(user)}
                                        title="Προβολή προφίλ"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleEditUser(user)}
                                        title="Επεξεργασία"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                          {filteredCoachRoleUsers.map((user) => (
                            <Card key={user.id} className="p-4 border border-[#00ffba]/20">
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                  <AvatarFallback>
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="px-2 py-1 text-xs rounded bg-[#00ffba]/20 text-[#00ffba]">
                                      Coach
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                      {user.subscription_status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleTestPasswordReset(user)}
                                  title="Αποστολή κωδικού"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleViewUser(user)}
                                  title="Προβολή προφίλ"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleEditUser(user)}
                                  title="Επεξεργασία"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Additional Info on mobile */}
                              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Τηλέφωνο: {user.phone || '-'}</span>
                                  <span>Εγγραφή: {formatDate(user.created_at)}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coach Users Tab */}
              <TabsContent value="coach-users" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-base lg:text-lg font-semibold">
                        Χρήστες Coaches ({coachUsers.length})
                      </CardTitle>
                    </div>
                    
                    {/* Search and Filters for Coach Users */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Αναζήτηση χρηστών..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      
                      {/* Coach Filter */}
                      <Select value={coachFilter} onValueChange={setCoachFilter}>
                        <SelectTrigger className="text-sm">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Φίλτρο Coach" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλοι οι Coaches</SelectItem>
                          {coaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={coach.photo_url || coach.avatar_url} alt={coach.name} />
                                  <AvatarFallback className="text-[8px]">
                                    {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{coach.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="text-sm">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Φίλτρο ρόλου" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                          <SelectItem value="athlete">Athlete</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                        <SelectTrigger className="text-sm">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Κατάσταση συνδρομής" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλες οι συνδρομές</SelectItem>
                          <SelectItem value="Ενεργή">Ενεργή</SelectItem>
                          <SelectItem value="Ανενεργή">Ανενεργή</SelectItem>
                          <SelectItem value="Παύση">Παύση</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Φόρτωση χρηστών...</p>
                      </div>
                    ) : filteredCoachUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">
                          {searchTerm || roleFilter !== "all" || subscriptionFilter !== "all"
                            ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                            : "Δεν υπάρχουν χρήστες coaches"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Όνομα</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Ρόλος</TableHead>
                                <TableHead>Coach</TableHead>
                                <TableHead>Κατάσταση</TableHead>
                                <TableHead>Εγγραφή</TableHead>
                                <TableHead>Ενέργειες</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCoachUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
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
                                  <TableCell>
                                    {(() => {
                                      const coach = getCoachInfo(user.coach_id);
                                      if (coach) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarImage src={coach.photo_url || coach.avatar_url} alt={coach.name} />
                                              <AvatarFallback className="text-[8px]">
                                                {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                              <div className="text-xs font-medium truncate">{coach.name}</div>
                                              <div className="text-[10px] text-gray-500 truncate">{coach.email}</div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <span className="px-2 py-1 text-xs rounded bg-[#00ffba]/20 text-[#00ffba]">
                                          Coach User
                                        </span>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                      {user.subscription_status}
                                    </span>
                                  </TableCell>
                                  <TableCell>{formatDate(user.created_at)}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleViewUser(user)}
                                        title="Προβολή προφίλ"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-none"
                                        onClick={() => handleEditUser(user)}
                                        title="Επεξεργασία χρήστη"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                          {filteredCoachUsers.map((user) => (
                            <Card key={user.id} className="p-4 border border-gray-200">
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                  <AvatarFallback>
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                                      {user.role}
                                    </span>
                                    {(() => {
                                      const coach = getCoachInfo(user.coach_id);
                                      if (coach) {
                                        return (
                                          <div className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#00ffba]/10">
                                            <Avatar className="w-4 h-4">
                                              <AvatarImage src={coach.photo_url || coach.avatar_url} alt={coach.name} />
                                              <AvatarFallback className="text-[6px]">
                                                {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-[10px] text-[#00ffba] truncate max-w-[80px]">{coach.name}</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <span className="px-2 py-1 text-xs rounded bg-[#00ffba]/20 text-[#00ffba]">
                                          Coach User
                                        </span>
                                      );
                                    })()}
                                    <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                      {user.subscription_status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 justify-end flex-wrap gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleViewUser(user)}
                                  title="Προβολή προφίλ"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none p-2"
                                  onClick={() => handleEditUser(user)}
                                  title="Επεξεργασία χρήστη"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none text-blue-600 hover:text-blue-700 p-2"
                                  onClick={() => handleTestPasswordReset(user)}
                                  title="Αποστολή κωδικού"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none text-red-600 hover:text-red-700 p-2"
                                  onClick={() => handleDeleteUser(user)}
                                  title="Διαγραφή χρήστη"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Additional Info on mobile */}
                              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Τηλέφωνο: {user.phone || '-'}</span>
                                  <span>Εγγραφή: {formatDate(user.created_at)}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* For coaches (non-admin) - show only their users without tabs */}
          {isCoach() && !isAdmin() && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-base lg:text-lg font-semibold">
                    Οι Αθλητές μου ({allUsers.length})
                  </CardTitle>
                  <Button 
                    className="rounded-none text-xs lg:text-sm px-3 lg:px-4 w-full sm:w-auto"
                    onClick={() => setNewUserDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                    Νέος Αθλητής
                  </Button>
                </div>
                
                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Αναζήτηση χρηστών..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  
                  <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                    <SelectTrigger className="text-sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Κατάσταση συνδρομής" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Όλες οι συνδρομές</SelectItem>
                      <SelectItem value="Ενεργή">Ενεργή</SelectItem>
                      <SelectItem value="Ανενεργή">Ανενεργή</SelectItem>
                      <SelectItem value="Παύση">Παύση</SelectItem>
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
                      {searchTerm || subscriptionFilter !== "all"
                        ? "Δεν βρέθηκαν χρήστες με τα επιλεγμένα κριτήρια" 
                        : "Δεν έχετε αθλητές"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Όνομα</TableHead>
                            <TableHead>Email</TableHead>
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
                                    <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                                    <AvatarFallback>
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{user.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || '-'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                  {user.subscription_status}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none"
                                    onClick={() => handleViewUser(user)}
                                    title="Προβολή προφίλ"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none"
                                    onClick={() => handleEditUser(user)}
                                    title="Επεξεργασία χρήστη"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteUser(user)}
                                    title="Διαγραφή χρήστη"
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

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="p-4 border border-gray-200">
                          {/* User Info */}
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={user.photo_url || user.avatar_url} alt={user.name} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                              <p className="text-xs text-gray-600 truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(user.subscription_status)}`}>
                                  {user.subscription_status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none p-2"
                              onClick={() => handleViewUser(user)}
                              title="Προβολή προφίλ"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none p-2"
                              onClick={() => handleEditUser(user)}
                              title="Επεξεργασία χρήστη"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-none text-red-600 hover:text-red-700 p-2"
                              onClick={() => handleDeleteUser(user)}
                              title="Διαγραφή χρήστη"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Additional Info on mobile */}
                          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Τηλέφωνο: {user.phone || '-'}</span>
                              <span>Εγγραφή: {formatDate(user.created_at)}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
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
