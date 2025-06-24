import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Calendar, DollarSign, User, Plus, Edit2, Check, X, Search, ChevronDown } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  created_at: string;
  subscription_types: SubscriptionType;
  app_users: {
    name: string;
    email: string;
    subscription_status: string;
    user_status: string;
  };
}

export const SubscriptionManagement: React.FC = () => {
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState('');
  const [notes, setNotes] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [usersTableSearchTerm, setUsersTableSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, users]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading subscription data...');
      
      // Φόρτωση τύπων συνδρομών
      const { data: types, error: typesError } = await supabase
        .from('subscription_types')
        .select('*')
        .order('price');

      if (typesError) {
        console.error('Error loading subscription types:', typesError);
        throw typesError;
      }
      console.log('✅ Subscription types loaded:', types?.length);
      setSubscriptionTypes(types || []);

      // Φόρτωση συνδρομών χρηστών
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users (name, email, subscription_status, role, user_status)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Error loading user subscriptions:', subscriptionsError);
        throw subscriptionsError;
      }
      console.log('✅ User subscriptions loaded:', subscriptions?.length);
      setUserSubscriptions(subscriptions || []);

      // Φόρτωση όλων των χρηστών
      const { data: allUsers, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, subscription_status, role, user_status')
        .order('name');

      if (usersError) {
        console.error('Error loading users:', usersError);
        throw usersError;
      }
      console.log('✅ Users loaded:', allUsers?.length);
      setUsers(allUsers || []);
      setFilteredUsers(allUsers || []);

      console.log('✅ All data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!selectedUser || !selectedSubscriptionType) {
      toast.error('Επιλέξτε χρήστη και τύπο συνδρομής');
      return;
    }

    try {
      const subscriptionType = subscriptionTypes.find(t => t.id === selectedSubscriptionType);
      if (!subscriptionType) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + subscriptionType.duration_days);

      // Δημιουργία νέας συνδρομής
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUser,
          subscription_type_id: selectedSubscriptionType,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          notes: notes
        });

      if (subscriptionError) throw subscriptionError;

      // Ενημέρωση status χρήστη
      const { error: userError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', selectedUser);

      if (userError) throw userError;

      toast.success('Η συνδρομή δημιουργήθηκε επιτυχώς!');
      setIsDialogOpen(false);
      setSelectedUser('');
      setSelectedSubscriptionType('');
      setNotes('');
      setUserSearchTerm('');
      setShowUserDropdown(false);
      await loadData();

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Σφάλμα κατά τη δημιουργία της συνδρομής');
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user.id);
    setUserSearchTerm(`${user.name} (${user.email})`);
    setShowUserDropdown(false);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserSearchTerm(value);
    setShowUserDropdown(true);
    
    // Clear selection if user is typing
    if (selectedUser && value !== users.find(u => u.id === selectedUser)?.name + ` (${users.find(u => u.id === selectedUser)?.email})`) {
      setSelectedUser('');
    }
  };

  const activateUserSubscription = async (userId: string) => {
    try {
      console.log('🔄 Ενεργοποίηση συνδρομής για χρήστη:', userId);
      
      // Βρες την πιο πρόσφατη συνδρομή του χρήστη
      const userSubscription = userSubscriptions
        .filter(sub => sub.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      console.log('📋 User subscription found:', userSubscription?.id);

      // Πρώτα ενημέρωσε τη συνδρομή σε active (αν υπάρχει)
      if (userSubscription) {
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('id', userSubscription.id);

        if (subscriptionError) {
          console.error('❌ Subscription update error:', subscriptionError);
          throw subscriptionError;
        }
        console.log('✅ Subscription updated to active');
      }

      // Στη συνέχεια ενημέρωσε ΜΟΝΟ το subscription_status του χρήστη σε active
      const { error: userError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      if (userError) {
        console.error('❌ User update error:', userError);
        throw userError;
      }
      console.log('✅ User subscription_status updated to active');

      toast.success('Η συνδρομή ενεργοποιήθηκε επιτυχώς!');
      
      // Άμεση ανανέωση των δεδομένων
      await loadData();

    } catch (error) {
      console.error('❌ Error activating subscription:', error);
      toast.error('Σφάλμα κατά την ενεργοποίηση της συνδρομής');
    }
  };

  const deactivateUserSubscription = async (userId: string) => {
    try {
      console.log('🔄 Απενεργοποίηση συνδρομής για χρήστη:', userId);
      
      // Απενεργοποίηση όλων των ενεργών συνδρομών του χρήστη
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subscriptionError) {
        console.error('❌ Subscription deactivation error:', subscriptionError);
        throw subscriptionError;
      }
      console.log('✅ Subscriptions deactivated');

      // Ενημέρωση ΜΟΝΟ του subscription_status του χρήστη σε inactive
      const { error: userError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'inactive' })
        .eq('id', userId);

      if (userError) {
        console.error('❌ User deactivation error:', userError);
        throw userError;
      }
      console.log('✅ User subscription_status updated to inactive');

      toast.success('Η συνδρομή απενεργοποιήθηκε επιτυχώς!');
      
      // Άμεση ανανέωση των δεδομένων
      await loadData();

    } catch (error) {
      console.error('❌ Error deactivating subscription:', error);
      toast.error('Σφάλμα κατά την απενεργοποίηση της συνδρομής');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      console.log('🔄 Αλλαγή κατάστασης χρήστη:', userId, 'από', currentStatus);
      
      // Βρες αν ο χρήστης έχει ενεργή συνδρομή
      const activeSubscription = userSubscriptions.find(
        sub => sub.user_id === userId && sub.status === 'active'
      );

      let newSubscriptionStatus: string;
      let newUserStatus: string;

      if (currentStatus === 'active') {
        // Απενεργοποίηση χρήστη
        newSubscriptionStatus = 'inactive';
        newUserStatus = 'inactive';
        
        // Απενεργοποίηση όλων των ενεργών συνδρομών του χρήστη
        if (activeSubscription) {
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('status', 'active');

          if (subError) throw subError;
        }
      } else {
        // Ενεργοποίηση χρήστη
        newUserStatus = 'active';
        
        if (activeSubscription) {
          // Αν έχει ενεργή συνδρομή, ενεργοποίηση και της συνδρομής
          newSubscriptionStatus = 'active';
          
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'active' })
            .eq('id', activeSubscription.id);

          if (subError) throw subError;
        } else {
          // Αν δεν έχει συνδρομή, απλά ενεργοποίηση user status
          newSubscriptionStatus = 'inactive';
        }
      }

      // Ενημέρωση κατάστασης χρήστη
      const { error } = await supabase
        .from('app_users')
        .update({ 
          user_status: newUserStatus,
          subscription_status: newSubscriptionStatus 
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Κατάσταση χρήστη ενημερώθηκε επιτυχώς');
      toast.success(`Ο χρήστης ${newUserStatus === 'active' ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`);
      
      // Άμεση ανανέωση των δεδομένων
      await loadData();

    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του χρήστη');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users for table display
  const filteredUsersForTable = users.filter(user => {
    if (usersTableSearchTerm.trim() === '') return true;
    return user.name.toLowerCase().includes(usersTableSearchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(usersTableSearchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Φορτώνω τα δεδομένα συνδρομών...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών RID AI</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
              <Plus className="w-4 h-4 mr-2" />
              Νέα Συνδρομή
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Δημιουργία Νέας Συνδρομής</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Αναζήτηση και Επιλογή Χρήστη</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Πληκτρολογήστε όνομα ή email χρήστη..."
                    value={userSearchTerm}
                    onChange={handleUserInputChange}
                    onFocus={() => setShowUserDropdown(true)}
                    className="pl-10 pr-10 rounded-none"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="mt-1 text-sm text-green-600">
                    ✓ Επιλέχθηκε: {users.find(u => u.id === selectedUser)?.name}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="subscriptionType">Τύπος Συνδρομής</Label>
                <Select value={selectedSubscriptionType} onValueChange={setSelectedSubscriptionType}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - €{type.price} ({type.duration_days} ημέρες)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Σημειώσεις</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Προσθέστε σημειώσεις..."
                  className="rounded-none"
                />
              </div>

              <Button onClick={createSubscription} className="w-full rounded-none">
                Δημιουργία Συνδρομής
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Στατιστικά */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-[#00ffba]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ενεργές Συνδρομές</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userSubscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Συνολικοί Χρήστες</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Μηνιαίος Τζίρος</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{userSubscriptions
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + (s.subscription_types?.price || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Λήγουν Σύντομα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userSubscriptions.filter(s => {
                    const endDate = new Date(s.end_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Λίστα χρηστών με συνδρομές */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Χρήστες & Συνδρομές</span>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Αναζήτηση χρηστών..."
                value={usersTableSearchTerm}
                onChange={(e) => setUsersTableSearchTerm(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Χρήστης</th>
                  <th className="text-left p-2">Συνδρομή</th>
                  <th className="text-left p-2">Κατάσταση</th>
                  <th className="text-left p-2">Λήξη</th>
                  <th className="text-left p-2">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsersForTable.map((user) => {
                  const activeSubscription = userSubscriptions.find(
                    s => s.user_id === user.id && s.status === 'active'
                  );
                  
                  const latestSubscription = userSubscriptions
                    .filter(s => s.user_id === user.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  
                  const isUserActive = user.subscription_status === 'active';
                  
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        {activeSubscription || latestSubscription ? (
                          <div>
                            <div className="font-medium">
                              {(activeSubscription || latestSubscription)?.subscription_types?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              €{(activeSubscription || latestSubscription)?.subscription_types?.price}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Χωρίς συνδρομή</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge className={`rounded-none ${getStatusColor(user.subscription_status)}`}>
                          {user.subscription_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {activeSubscription ? (
                          <span className="text-sm">
                            {new Date(activeSubscription.end_date).toLocaleDateString('el-GR')}
                          </span>
                        ) : latestSubscription ? (
                          <span className="text-sm text-gray-400">
                            {new Date(latestSubscription.end_date).toLocaleDateString('el-GR')} (Ανενεργή)
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {isUserActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deactivateUserSubscription(user.id)}
                              className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Απενεργοποίηση
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => activateUserSubscription(user.id)}
                              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Ενεργοποίηση
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredUsersForTable.length === 0 && usersTableSearchTerm && (
              <div className="text-center py-8 text-gray-500">
                <p>Δεν βρέθηκαν χρήστες που να ταιριάζουν με "{usersTableSearchTerm}"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
