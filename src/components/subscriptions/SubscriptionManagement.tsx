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
import { Crown, Calendar, DollarSign, User, Plus, Edit2, Check, X, Search, ChevronDown, Receipt, Pause, Play, RotateCcw, Trash2 } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
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
  is_paused: boolean;
  paused_at: string | null;
  paused_days_remaining: number | null;
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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSubscription, setEditSubscription] = useState<UserSubscription | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSubscriptionType, setEditSubscriptionType] = useState('');

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

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `SUB-${year}${month}${day}-${timestamp}`;
  };

  const createSubscription = async () => {
    if (!selectedUser || !selectedSubscriptionType) {
      toast.error('Επιλέξτε χρήστη και τύπο συνδρομής');
      return;
    }

    try {
      const subscriptionType = subscriptionTypes.find(t => t.id === selectedSubscriptionType);
      const selectedUserData = users.find(u => u.id === selectedUser);
      
      if (!subscriptionType || !selectedUserData) return;

      const subscriptionStartDate = new Date(startDate);
      const endDate = new Date(subscriptionStartDate);
      endDate.setMonth(subscriptionStartDate.getMonth() + subscriptionType.duration_months);
      endDate.setDate(subscriptionStartDate.getDate() - 1); // Calendar month calculation

      // Δημιουργία νέας συνδρομής
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUser,
          subscription_type_id: selectedSubscriptionType,
          start_date: startDate,
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

      // Αποστολή απόδειξης με email
      try {
        const invoiceNumber = generateInvoiceNumber();
        
        const receiptData = {
          userName: selectedUserData.name,
          userEmail: selectedUserData.email,
          subscriptionType: subscriptionType.name,
          price: subscriptionType.price,
          startDate: startDate,
          endDate: endDate.toISOString().split('T')[0],
          invoiceNumber: invoiceNumber
        };

        console.log('📧 Αποστολή απόδειξης...', receiptData);

        const emailResponse = await supabase.functions.invoke('send-subscription-receipt', {
          body: receiptData
        });

        if (emailResponse.error) {
          console.error('❌ Σφάλμα αποστολής email:', emailResponse.error);
          toast.error('Η συνδρομή δημιουργήθηκε αλλά η απόδειξη δεν στάλθηκε');
        } else {
          console.log('✅ Email στάλθηκε επιτυχώς');
          toast.success('Η συνδρομή δημιουργήθηκε και η απόδειξη στάλθηκε επιτυχώς!');
        }
      } catch (emailError) {
        console.error('❌ Σφάλμα email service:', emailError);
        toast.error('Η συνδρομή δημιουργήθηκε αλλά η απόδειξη δεν στάλθηκε');
      }

      setIsDialogOpen(false);
      setSelectedUser('');
      setSelectedSubscriptionType('');
      setNotes('');
      setUserSearchTerm('');
      setShowUserDropdown(false);
      setStartDate(new Date().toISOString().split('T')[0]);
      setIssueDate(new Date().toISOString().split('T')[0]);
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
    setShowUserDropdown(value.length > 0); // Show only when typing
    
    // Clear selection if user is typing
    if (selectedUser && value !== users.find(u => u.id === selectedUser)?.name + ` (${users.find(u => u.id === selectedUser)?.email})`) {
      setSelectedUser('');
    }
  };

  const handleChevronClick = () => {
    setShowUserDropdown(!showUserDropdown);
    if (!showUserDropdown) {
      // Show all users when clicking chevron
      setFilteredUsers(users);
    }
  };

  const handleInputFocus = () => {
    if (userSearchTerm.length > 0) {
      setShowUserDropdown(true);
    }
  };

  const pauseSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('pause_subscription', {
        subscription_id: subscriptionId
      });

      if (error) throw error;

      toast.success('Η συνδρομή τέθηκε σε παύση επιτυχώς');
      await loadData();
    } catch (error: any) {
      toast.error('Σφάλμα κατά την παύση: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('resume_subscription', {
        subscription_id: subscriptionId
      });

      if (error) throw error;

      toast.success('Η συνδρομή συνεχίστηκε επιτυχώς');
      await loadData();
    } catch (error: any) {
      toast.error('Σφάλμα κατά τη συνέχιση: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renewSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      
      // Βρες την τρέχουσα συνδρομή για να πάρεις την ημερομηνία λήξης
      const currentSubscription = userSubscriptions.find(s => s.id === subscriptionId);
      if (!currentSubscription) {
        throw new Error('Η συνδρομή δεν βρέθηκε');
      }

      // Υπολόγισε την ημερομηνία έναρξης της νέας συνδρομής (επόμενη μέρα της λήξης)
      const currentEndDate = new Date(currentSubscription.end_date);
      const newStartDate = new Date(currentEndDate);
      newStartDate.setDate(currentEndDate.getDate() + 1);

      // Use the database function to create renewal properly
      const { data: newSubscriptionId, error: renewError } = await supabase.rpc('renew_subscription', {
        original_subscription_id: subscriptionId
      });

      if (renewError) throw renewError;

      toast.success('Η συνδρομή ανανεώθηκε επιτυχώς');
      await loadData();
    } catch (error: any) {
      toast.error('Σφάλμα κατά την ανανέωση: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συνδρομή;')) {
      return;
    }

    try {
      setLoading(true);
      
      // Διαγραφή συνδρομής
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Η συνδρομή διαγράφηκε επιτυχώς');
      await loadData();
    } catch (error: any) {
      toast.error('Σφάλμα κατά τη διαγραφή: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (subscription: UserSubscription) => {
    setEditSubscription(subscription);
    setEditStartDate(subscription.start_date);
    setEditEndDate(subscription.end_date);
    setEditSubscriptionType(subscription.subscription_types.id);
    setIsEditDialogOpen(true);
  };

  const updateSubscription = async () => {
    if (!editSubscription) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          start_date: editStartDate,
          end_date: editEndDate,
          subscription_type_id: editSubscriptionType
        })
        .eq('id', editSubscription.id);

      if (error) throw error;

      toast.success('Η συνδρομή ενημερώθηκε επιτυχώς');
      setIsEditDialogOpen(false);
      setEditSubscription(null);
      await loadData();
    } catch (error: any) {
      toast.error('Σφάλμα κατά την ενημέρωση: ' + error.message);
    } finally {
      setLoading(false);
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
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatus = (user: any, activeSubscription: any) => {
    if (!activeSubscription) return 'inactive';
    if (activeSubscription.is_paused) return 'paused';
    
    const today = new Date();
    const endDate = new Date(activeSubscription.end_date);
    
    if (endDate < today) return 'expired';
    return 'active';
  };

  // Filter users for table display and sort by subscription priority
  const filteredUsersForTable = users.filter(user => {
    if (usersTableSearchTerm.trim() === '') return true;
    return user.name.toLowerCase().includes(usersTableSearchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(usersTableSearchTerm.toLowerCase());
  }).sort((a, b) => {
    // Get active subscriptions for both users
    const aActiveSubscription = userSubscriptions.find(s => s.user_id === a.id && s.status === 'active');
    const bActiveSubscription = userSubscriptions.find(s => s.user_id === b.id && s.status === 'active');

    const aStatus = getSubscriptionStatus(a, aActiveSubscription);
    const bStatus = getSubscriptionStatus(b, bActiveSubscription);

    // Priority order: active -> expired -> paused -> inactive
    const statusPriority: Record<string, number> = {
      'active': 1,
      'expired': 2,
      'paused': 3,
      'inactive': 4
    };

    const aPriority = statusPriority[aStatus] || 4;
    const bPriority = statusPriority[bStatus] || 4;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Among same status level, sort by end date (earliest first) for active/paused
    if ((aStatus === 'active' || aStatus === 'paused') && (bStatus === 'active' || bStatus === 'paused')) {
      if (aActiveSubscription && bActiveSubscription) {
        const aEndDate = new Date(aActiveSubscription.end_date);
        const bEndDate = new Date(bActiveSubscription.end_date);
        return aEndDate.getTime() - bEndDate.getTime();
      }
    }

    // Fallback: sort by name
    return a.name.localeCompare(b.name);
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
        <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Συνδρομών</h2>
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
              <h4 className="font-semibold">Στοιχεία Συνδρομής</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">Πελάτης *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Πληκτρολογήστε όνομα ή email χρήστη..."
                    value={userSearchTerm}
                    onChange={handleUserInputChange}
                    onFocus={handleInputFocus}
                    className="pl-10 pr-10 rounded-none"
                  />
                  <ChevronDown 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer hover:text-gray-600" 
                    onClick={handleChevronClick}
                  />
                  
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Έκδοση *</label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Έναρξης *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Λήξης</label>
                  <Input
                    type="date"
                    value={selectedSubscriptionType ? (() => {
                      const startDateObj = new Date(startDate);
                      const endDateObj = new Date(startDateObj);
                      const durationMonths = subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.duration_months || 0;
                      endDateObj.setMonth(startDateObj.getMonth() + durationMonths);
                      endDateObj.setDate(startDateObj.getDate() - 1);
                      return endDateObj.toISOString().split('T')[0];
                    })() : ''}
                    disabled
                    className="rounded-none bg-gray-50"
                  />
                </div>
              </div>
              
              <h4 className="font-semibold">ΤΥΠΟΣ Συνδρομής</h4>
              <div>
                <label className="block text-sm font-medium mb-2">Περιγραφή *</label>
                <Select value={selectedSubscriptionType} onValueChange={setSelectedSubscriptionType}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - €{type.price} ({type.duration_months} μήνες)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSubscriptionType && (
                  <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ποσότητα</label>
                      <Input
                        type="number"
                        value="1"
                        disabled
                        className="rounded-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Τιμή μονάδας (€)</label>
                      <Input
                        value={(() => {
                          const totalPrice = subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0;
                          const netPrice = totalPrice / 1.13; // Αποφορολόγηση από 13% ΦΠΑ
                          return netPrice.toFixed(2);
                        })()}
                        disabled
                        className="rounded-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ΦΠΑ (%)</label>
                      <Input
                        value="13"
                        disabled
                        className="rounded-none bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 border-l-4 border-[#00ffba] space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Αξία Συνδρομής:</span>
                      <span>€{(() => {
                        const totalPrice = subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0;
                        const netPrice = totalPrice / 1.13;
                        return netPrice.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">ΦΠΑ:</span>
                      <span>€{(() => {
                        const totalPrice = subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0;
                        const netPrice = totalPrice / 1.13;
                        const vatAmount = totalPrice - netPrice;
                        return vatAmount.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="border-t-2 border-[#00ffba] pt-2">
                      <div className="flex justify-between text-xl font-bold text-[#00ffba]">
                        <span>Σύνολο:</span>
                        <span>€{(subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Σημειώσεις</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Προσθέστε σημειώσεις..."
                  className="rounded-none"
                />
              </div>

              <Button onClick={createSubscription} className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none">
                <Receipt className="h-4 w-4 mr-2" />
                Έκδοση & Αποστολή Συνδρομής
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Subscription Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Επεξεργασία Συνδρομής</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editSubscription && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Χρήστης</label>
                    <Input
                      value={editSubscription.app_users.name}
                      disabled
                      className="rounded-none bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Τύπος Συνδρομής</label>
                    <Select value={editSubscriptionType} onValueChange={setEditSubscriptionType}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - €{type.price} ({type.duration_months} μήνες)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ημερομηνία Έναρξης</label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ημερομηνία Λήξης</label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={updateSubscription}
                      className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Ενημέρωση
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="flex-1 rounded-none"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Ακύρωση
                    </Button>
                  </div>
                </>
              )}
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
                          <div className={`font-medium ${getSubscriptionStatus(user, activeSubscription) === 'expired' ? 'text-red-600' : ''}`}>
                            {user.name}
                          </div>
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
                         {(() => {
                           const subscriptionStatus = getSubscriptionStatus(user, activeSubscription);
                           return (
                             <Badge className={`rounded-none ${getStatusColor(subscriptionStatus)}`}>
                               {subscriptionStatus === 'paused' ? 'Παύση' : 
                                subscriptionStatus === 'expired' ? 'Λήξη' :
                                subscriptionStatus === 'active' ? 'Ενεργή' : 'Ανενεργή'}
                             </Badge>
                           );
                         })()}
                       </td>
                       <td className="p-2">
                         {activeSubscription ? (
                           <div>
                             <span className="text-sm">
                               {new Date(activeSubscription.end_date).toLocaleDateString('el-GR')}
                             </span>
                             {activeSubscription.is_paused && (
                               <div className="text-xs text-orange-600">
                                 {activeSubscription.paused_days_remaining} ημέρες σε αναμονή
                               </div>
                             )}
                           </div>
                         ) : latestSubscription ? (
                           <span className="text-sm text-gray-400">
                             {new Date(latestSubscription.end_date).toLocaleDateString('el-GR')} (Ανενεργή)
                           </span>
                         ) : (
                           <span className="text-gray-400">-</span>
                         )}
                       </td>
                       <td className="p-2">
                         <div className="flex gap-1">
                           {activeSubscription ? (
                             <>
                               {/* Pause/Resume Button */}
                               {activeSubscription.is_paused ? (
                                 <Button
                                   size="sm"
                                   onClick={() => resumeSubscription(activeSubscription.id)}
                                   className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                                   title="Συνέχιση συνδρομής"
                                 >
                                   <Play className="w-3 h-3" />
                                 </Button>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => pauseSubscription(activeSubscription.id)}
                                   className="rounded-none border-orange-300 text-orange-600 hover:bg-orange-50"
                                   title="Παύση συνδρομής"
                                 >
                                   <Pause className="w-3 h-3" />
                                 </Button>
                               )}
                               
                                {/* Renewal Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => renewSubscription(activeSubscription.id)}
                                  className="rounded-none border-blue-300 text-blue-600 hover:bg-blue-50"
                                  title="Ανανέωση συνδρομής"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>

                                {/* Edit Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(activeSubscription)}
                                  className="rounded-none border-gray-300 text-gray-600 hover:bg-gray-50"
                                  title="Επεξεργασία συνδρομής"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>

                                {/* Delete Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteSubscription(activeSubscription.id)}
                                  className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                                  title="Διαγραφή συνδρομής"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                             </>
                            ) : latestSubscription ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => renewSubscription(latestSubscription.id)}
                                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                                  title="Ανανέωση συνδρομής"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(latestSubscription)}
                                  className="rounded-none border-gray-300 text-gray-600 hover:bg-gray-50"
                                  title="Επεξεργασία συνδρομής"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteSubscription(latestSubscription.id)}
                                  className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                                  title="Διαγραφή συνδρομής"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">Χωρίς ενέργειες</span>
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
