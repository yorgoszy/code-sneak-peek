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
import { useToast } from "@/hooks/use-toast";
import { Crown, Calendar, DollarSign, User, Plus, Edit2, Check, X, Search, ChevronDown, Receipt, Pause, Play, RotateCcw, Trash2, UserCheck, CreditCard } from "lucide-react";
import { ReceiptConfirmDialog } from './ReceiptConfirmDialog';
import { SubscriptionDeleteDialog } from './SubscriptionDeleteDialog';

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: any;
  is_active: boolean;
  subscription_mode: 'time_based' | 'visit_based';
  visit_count?: number;
  visit_expiry_months?: number;
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
  is_paid: boolean;
  subscription_types: SubscriptionType;
  app_users: {
    name: string;
    email: string;
    subscription_status: string;
    user_status: string;
  };
}

export const SubscriptionManagement: React.FC = () => {
  const { toast } = useToast();
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
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [pendingSubscriptionData, setPendingSubscriptionData] = useState<any>(null);
  const [monthlyChanges, setMonthlyChanges] = useState({
    activeSubscriptions: 0,
    totalUsers: 0,
    monthlyRevenue: 0
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);

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
      
      const typedSubscriptionTypes = (types || []).map(type => ({
        ...type,
        subscription_mode: (type.subscription_mode || 'time_based') as 'time_based' | 'visit_based'
      })) as SubscriptionType[];
      
      setSubscriptionTypes(typedSubscriptionTypes);

      // Ενημέρωση ληγμένων συνδρομών πρώτα
      await supabase.rpc('check_and_update_expired_subscriptions');

      // Φόρτωση συνδρομών χρηστών (μόνο ενεργές και σε παύση)
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users (name, email, subscription_status, role, user_status)
        `)
        .in('status', ['active'])
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Error loading user subscriptions:', subscriptionsError);
        throw subscriptionsError;
      }
      console.log('✅ User subscriptions loaded:', subscriptions?.length);
      
      const typedSubscriptions = (subscriptions || []).map(sub => ({
        ...sub,
        subscription_types: {
          ...sub.subscription_types,
          subscription_mode: (sub.subscription_types.subscription_mode || 'time_based') as 'time_based' | 'visit_based'
        }
      })) as UserSubscription[];
      
      setUserSubscriptions(typedSubscriptions);

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

      // Υπολογισμός μηνιαίων αλλαγών
      await calculateMonthlyChanges(typedSubscriptions, allUsers || []);

      console.log('✅ All data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη φόρτωση των δεδομένων"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyChanges = async (currentSubscriptions: UserSubscription[], currentUsers: any[]) => {
    try {
      // Ημερομηνίες για τον προηγούμενο μήνα
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      // Φόρτωση δεδομένων προηγούμενου μήνα
      const { data: lastMonthSubscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*)
        `)
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('status', 'active');

      const { data: lastMonthUsers } = await supabase
        .from('app_users')
        .select('id')
        .lte('created_at', lastMonthEnd.toISOString());

      // Υπολογισμός τρεχόντων στατιστικών - χρήστες με συνδρομή αυτό τον μήνα
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const currentUsersWithSubscription = new Set(
        currentSubscriptions
          .filter(s => {
            const startDate = new Date(s.start_date);
            const endDate = new Date(s.end_date);
            const isActiveInCurrentMonth = 
              (startDate.getFullYear() < currentYear || 
               (startDate.getFullYear() === currentYear && startDate.getMonth() <= currentMonth)) &&
              (endDate.getFullYear() > currentYear || 
               (endDate.getFullYear() === currentYear && endDate.getMonth() >= currentMonth)) &&
              s.status === 'active';
            return isActiveInCurrentMonth;
          })
          .map(s => s.user_id)
      ).size;
      const currentTotalUsers = currentUsers.length;
      const currentMonthlyRevenue = currentSubscriptions
        .filter(s => s.status === 'active' && !s.is_paused)
        .reduce((sum, s) => sum + (s.subscription_types?.price || 0), 0);

      // Υπολογισμός προηγούμενου μήνα - χρήστες με συνδρομή
      const lastMonthUsersWithSubscription = new Set(
        (lastMonthSubscriptions || [])
          .filter(s => {
            const startDate = new Date(s.start_date);
            const endDate = new Date(s.end_date);
            const isActiveInLastMonth = 
              (startDate.getFullYear() < lastMonth.getFullYear() || 
               (startDate.getFullYear() === lastMonth.getFullYear() && startDate.getMonth() <= lastMonth.getMonth())) &&
              (endDate.getFullYear() > lastMonth.getFullYear() || 
               (endDate.getFullYear() === lastMonth.getFullYear() && endDate.getMonth() >= lastMonth.getMonth()));
            return isActiveInLastMonth;
          })
          .map(s => s.user_id)
      ).size;
      const lastMonthTotalUsers = lastMonthUsers?.length || 0;
      const lastMonthRevenue = (lastMonthSubscriptions || [])
        .filter(s => !s.is_paused)
        .reduce((sum, s) => sum + (s.subscription_types?.price || 0), 0);

      // Υπολογισμός διαφορών
      setMonthlyChanges({
        activeSubscriptions: currentUsersWithSubscription - lastMonthUsersWithSubscription,
        totalUsers: currentTotalUsers - lastMonthTotalUsers,
        monthlyRevenue: currentMonthlyRevenue - lastMonthRevenue
      });

    } catch (error) {
      console.error('Error calculating monthly changes:', error);
      setMonthlyChanges({ activeSubscriptions: 0, totalUsers: 0, monthlyRevenue: 0 });
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

  const generateReceiptNumber = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('receipt_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating receipt number:', error);
      return 'ΑΠΥ-0001';
    }

    if (!data || data.length === 0) {
      return 'ΑΠΥ-0001';
    }

    const lastNumber = data[0].receipt_number;
    const numberPart = parseInt(lastNumber.split('-')[1]);
    return `ΑΠΥ-${String(numberPart + 1).padStart(4, '0')}`;
  };

  const createReceiptForSubscription = async (userData: any, subscriptionType: SubscriptionType, startDate: string, endDate: Date) => {
    try {
      const receiptNumber = await generateReceiptNumber();
      const totalPrice = subscriptionType.price;
      const netPrice = totalPrice / 1.13;
      const vatAmount = totalPrice - netPrice;

      const receiptData = {
        receipt_number: receiptNumber,
        customer_name: userData.name,
        customer_email: userData.email,
        user_id: userData.id,
        items: [{
          id: "1",
          description: subscriptionType.name,
          quantity: 1,
          unitPrice: netPrice,
          total: totalPrice,
          vatRate: 13
        }],
        subtotal: netPrice,
        vat: vatAmount,
        total: totalPrice,
        issue_date: new Date().toISOString().split('T')[0],
        mydata_status: 'pending'
      };

      const { error: receiptError } = await supabase
        .from('receipts')
        .insert([receiptData]);

      if (receiptError) throw receiptError;

      console.log('✅ Απόδειξη δημιουργήθηκε επιτυχώς:', receiptNumber);
      
      toast({
        title: "Επιτυχία",
        description: `Η απόδειξη ${receiptNumber} δημιουργήθηκε επιτυχώς`,
      });

    } catch (error) {
      console.error('❌ Σφάλμα δημιουργίας απόδειξης:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία απόδειξης",
      });
    }
  };

  const createSubscription = async () => {
    if (!selectedUser || !selectedSubscriptionType) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Επιλέξτε χρήστη και τύπο συνδρομής"
      });
      return;
    }

    const subscriptionType = subscriptionTypes.find(t => t.id === selectedSubscriptionType);
    const selectedUserData = users.find(u => u.id === selectedUser);
    
    if (!subscriptionType || !selectedUserData) return;

    const subscriptionStartDate = new Date(startDate);
    const endDate = new Date(subscriptionStartDate);
    
    // Υπολογισμός ημερομηνίας λήξης ανάλογα με τον τύπο συνδρομής
    if (subscriptionType.subscription_mode === 'visit_based') {
      endDate.setMonth(subscriptionStartDate.getMonth() + (subscriptionType.visit_expiry_months || 0));
    } else {
      endDate.setMonth(subscriptionStartDate.getMonth() + subscriptionType.duration_months);
    }
    endDate.setDate(subscriptionStartDate.getDate() - 1);

    // Αποθήκευση δεδομένων για μετά την επιλογή απόδειξης
    setPendingSubscriptionData({
      subscriptionType,
      selectedUserData,
      subscriptionStartDate,
      endDate
    });

    // Εμφάνιση dialog για απόδειξη
    setShowReceiptDialog(true);
  };


  const handleCreateSubscription = async (createReceipt: boolean) => {
    if (!pendingSubscriptionData) return;

    const { subscriptionType, selectedUserData, subscriptionStartDate, endDate } = pendingSubscriptionData;

    try {
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

      // Δημιουργία visit package αν είναι visit-based subscription
      if (subscriptionType.subscription_mode === 'visit_based' && subscriptionType.visit_count) {
        const visitEndDate = new Date(subscriptionStartDate);
        visitEndDate.setMonth(subscriptionStartDate.getMonth() + (subscriptionType.visit_expiry_months || 0));
        
        const { error: visitPackageError } = await supabase
          .from('visit_packages')
          .insert({
            user_id: selectedUser,
            total_visits: subscriptionType.visit_count,
            remaining_visits: subscriptionType.visit_count,
            purchase_date: startDate,
            expiry_date: visitEndDate.toISOString().split('T')[0],
            price: subscriptionType.price
          });

        if (visitPackageError) throw visitPackageError;
      }

      // Δημιουργία απόδειξης αν επιλέχθηκε
      if (createReceipt) {
        await createReceiptForSubscription(selectedUserData, subscriptionType, startDate, endDate);
      }

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
          toast({
            variant: "destructive",
            title: "Σφάλμα",
            description: "Η συνδρομή δημιουργήθηκε αλλά η απόδειξη δεν στάλθηκε"
          });
        } else {
          console.log('✅ Email στάλθηκε επιτυχώς');
          toast({
            title: "Επιτυχία",
            description: "Η συνδρομή δημιουργήθηκε και η απόδειξη στάλθηκε επιτυχώς!"
          });
        }
      } catch (emailError) {
        console.error('❌ Σφάλμα email service:', emailError);
        toast({
          variant: "destructive", 
          title: "Σφάλμα",
          description: "Η συνδρομή δημιουργήθηκε αλλά η απόδειξη δεν στάλθηκε"
        });
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
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία της συνδρομής"
      });
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

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή τέθηκε σε παύση επιτυχώς"
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την παύση: " + error.message
      });
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

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή συνεχίστηκε επιτυχώς"
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα", 
        description: "Σφάλμα κατά τη συνέχιση: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (subscriptionId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_paid: !currentStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: !currentStatus ? "Η συνδρομή σημειώθηκε ως πληρωμένη" : "Η συνδρομή σημειώθηκε ως μη πληρωμένη"
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ενημέρωση της κατάστασης πληρωμής: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const recordVisit = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: userId,
        p_visit_type: 'manual',
        p_notes: 'Manual visit from subscription management'
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η παρουσία καταγράφηκε επιτυχώς!"
      });
      
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα καταγραφής παρουσίας"
      });
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

      const userData = users.find(u => u.id === currentSubscription.user_id);
      if (!userData) {
        throw new Error('Ο χρήστης δεν βρέθηκε');
      }

      // Υπολόγισε την ημερομηνία έναρξης της νέας συνδρομής (επόμενη μέρα της λήξης)
      const currentEndDate = new Date(currentSubscription.end_date);
      const newStartDate = new Date(currentEndDate);
      newStartDate.setDate(currentEndDate.getDate() + 1);
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newStartDate.getMonth() + currentSubscription.subscription_types.duration_months);
      newEndDate.setDate(newStartDate.getDate() - 1);

      // Αποθήκευση δεδομένων για τη διαδικασία ανανέωσης
      setPendingSubscriptionData({
        subscriptionId,
        userData,
        subscriptionType: currentSubscription.subscription_types,
        newStartDate: newStartDate.toISOString().split('T')[0],
        newEndDate,
        isRenewal: true
      });

      // Εμφάνιση dialog για απόδειξη
      setShowReceiptDialog(true);
      setLoading(false); // Επαναφορά loading state

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ανανέωση: " + error.message
      });
      setLoading(false);
    }
  };

  const handleRenewSubscription = async (createReceipt: boolean) => {
    if (!pendingSubscriptionData || !pendingSubscriptionData.isRenewal) return;

    const { subscriptionId, userData, subscriptionType, newStartDate, newEndDate } = pendingSubscriptionData;

    try {
      // Use the database function to create renewal properly
      const { data: newSubscriptionId, error: renewError } = await supabase.rpc('renew_subscription', {
        original_subscription_id: subscriptionId
      });

      if (renewError) throw renewError;

      // Δημιουργία απόδειξης αν επιλέχθηκε
      if (createReceipt) {
        await createReceiptForSubscription(userData, subscriptionType, newStartDate, newEndDate);
      }

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή ανανεώθηκε επιτυχώς"
      });
      
      setShowReceiptDialog(false);
      setPendingSubscriptionData(null);
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ανανέωση: " + error.message
      });
      setShowReceiptDialog(false);
      setPendingSubscriptionData(null);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (subscriptionId: string) => {
    setSubscriptionToDelete(subscriptionId);
    setDeleteDialogOpen(true);
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      setLoading(true);
      
      // Διαγραφή συνδρομής
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionToDelete);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή διαγράφηκε επιτυχώς"
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή: " + error.message
      });
    } finally {
      setLoading(false);
      setSubscriptionToDelete(null);
    }
  };

  const moveToHistory = async () => {
    if (!subscriptionToDelete) return;

    try {
      setLoading(true);
      
      // Μεταφορά στο ιστορικό (αλλαγή status και archived_at)
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired',
          archived_at: new Date().toISOString()
        })
        .eq('id', subscriptionToDelete);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή μεταφέρθηκε στο ιστορικό επιτυχώς"
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη μεταφορά: " + error.message
      });
    } finally {
      setLoading(false);
      setSubscriptionToDelete(null);
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

      toast({
        title: "Επιτυχία",
        description: "Η συνδρομή ενημερώθηκε επιτυχώς"
      });
      setIsEditDialogOpen(false);
      setEditSubscription(null);
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Σφάλμα", 
        description: "Σφάλμα κατά την ενημέρωση: " + error.message
      });
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
      toast({
        title: "Επιτυχία",
        description: `Ο χρήστης ${newUserStatus === 'active' ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`
      });
      
      // Άμεση ανανέωση των δεδομένων
      await loadData();

    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ενημέρωση του χρήστη"
      });
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

    // Priority order: expired -> active -> paused -> inactive
    const statusPriority: Record<string, number> = {
      'expired': 1,
      'active': 2,
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
          <DialogContent className="rounded-none max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="rounded-none max-w-4xl max-h-[90vh] overflow-y-auto">
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

        {/* Receipt Creation Dialog */}
        <ReceiptConfirmDialog
          isOpen={showReceiptDialog}
          onClose={() => {
            setShowReceiptDialog(false);
            setPendingSubscriptionData(null);
          }}
          onConfirm={(createReceipt) => {
            if (pendingSubscriptionData?.isRenewal) {
              handleRenewSubscription(createReceipt);
            } else {
              handleCreateSubscription(createReceipt);
            }
          }}
        />

        {/* Subscription Delete Dialog */}
        <SubscriptionDeleteDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSubscriptionToDelete(null);
          }}
          onDelete={deleteSubscription}
          onMoveToHistory={moveToHistory}
        />
      </div>

      {/* Στατιστικά */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-[#00ffba]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Χρήστες με Συνδρομή</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    
                    const usersWithActiveSubscription = new Set(
                      userSubscriptions
                        .filter(s => {
                          const startDate = new Date(s.start_date);
                          const endDate = new Date(s.end_date);
                          const isActiveInCurrentMonth = 
                            (startDate.getFullYear() < currentYear || 
                             (startDate.getFullYear() === currentYear && startDate.getMonth() <= currentMonth)) &&
                            (endDate.getFullYear() > currentYear || 
                             (endDate.getFullYear() === currentYear && endDate.getMonth() >= currentMonth)) &&
                            s.status === 'active';
                          return isActiveInCurrentMonth;
                        })
                        .map(s => s.user_id)
                    );
                    return usersWithActiveSubscription.size;
                  })()}
                </p>
                <p className="text-xs text-gray-500">
                  {monthlyChanges.activeSubscriptions > 0 ? '+' : ''}{monthlyChanges.activeSubscriptions} από προηγούμενο μήνα
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
                <p className="text-xs text-gray-500">
                  {monthlyChanges.totalUsers > 0 ? '+' : ''}{monthlyChanges.totalUsers} από προηγούμενο μήνα
                </p>
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
                    .filter(s => s.status === 'active' && !s.is_paused)
                    .reduce((sum, s) => sum + (s.subscription_types?.price || 0), 0)
                    .toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {monthlyChanges.monthlyRevenue > 0 ? '+' : ''}€{monthlyChanges.monthlyRevenue.toFixed(2)} από προηγούμενο μήνα
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
                    return s.status === 'active' && !s.is_paused && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
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
                  <th className="text-left p-2">Υπόλοιπες Μέρες</th>
                  <th className="text-left p-2">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsersForTable.flatMap((user) => {
                  const userSubscriptions_filtered = userSubscriptions.filter(s => s.user_id === user.id);
                  const activeSubscriptions = userSubscriptions_filtered.filter(s => s.status === 'active');
                  
                  // Αν έχει ενεργές συνδρομές, δείξε όλες
                  if (activeSubscriptions.length > 0) {
                    return activeSubscriptions.map((subscription, index) => (
                      <tr key={`${user.id}-${subscription.id}`} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className={`font-medium ${getSubscriptionStatus(user, subscription) === 'expired' ? 'text-red-600' : ''}`}>
                              {user.name} {activeSubscriptions.length > 1 ? `(${index + 1}/${activeSubscriptions.length})` : ''}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {subscription.subscription_types?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              €{subscription.subscription_types?.price}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          {(() => {
                            const subscriptionStatus = getSubscriptionStatus(user, subscription);
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
                          <div>
                            <span className="text-sm">
                              {new Date(subscription.end_date).toLocaleDateString('el-GR')}
                            </span>
                            {subscription.is_paused && (
                              <div className="text-xs text-orange-600">
                                {subscription.paused_days_remaining} ημέρες σε αναμονή
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {(() => {
                              // Εάν η συνδρομή είναι σε παύση, δείξε τις ημέρες παύσης
                              if (subscription.is_paused && subscription.paused_days_remaining) {
                                return <span className="text-orange-600 font-medium">{subscription.paused_days_remaining} ημέρες</span>;
                              }
                              
                              const today = new Date();
                              const endDate = new Date(subscription.end_date);
                              const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                              
                              if (remainingDays < 0) {
                                return <span className="text-red-600 font-medium">Έληξε</span>;
                              } else if (remainingDays === 0) {
                                return <span className="text-orange-600 font-medium">Λήγει σήμερα</span>;
                              } else if (remainingDays <= 7) {
                                return <span className="text-orange-600 font-medium">{remainingDays} ημέρες</span>;
                              } else {
                                return <span className="text-green-600">{remainingDays} ημέρες</span>;
                              }
                            })()}
                          </div>
                        </td>
                         <td className="p-2">
                          <div className="flex gap-1">
                            {/* Payment Status Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePaymentStatus(subscription.id, subscription.is_paid)}
                              className={`rounded-none ${subscription.is_paid 
                                ? 'border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10' 
                                : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                              title={subscription.is_paid ? "Σημείωση ως μη πληρωμένη" : "Σημείωση ως πληρωμένη"}
                            >
                              {subscription.is_paid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </Button>

                            {/* Pause/Resume Button */}
                            {subscription.is_paused ? (
                              <Button
                                size="sm"
                                onClick={() => resumeSubscription(subscription.id)}
                                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                                title="Συνέχιση συνδρομής"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => pauseSubscription(subscription.id)}
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
                              onClick={() => renewSubscription(subscription.id)}
                              className="rounded-none border-blue-300 text-blue-600 hover:bg-blue-50"
                              title="Ανανέωση συνδρομής"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(subscription)}
                              className="rounded-none border-gray-300 text-gray-600 hover:bg-gray-50"
                              title="Επεξεργασία συνδρομής"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>

                            {/* Visit Recording Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recordVisit(user.id)}
                              className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                              title="Καταγραφή παρουσίας"
                            >
                              <UserCheck className="w-3 h-3" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(subscription.id)}
                              className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                              title="Διαγραφή συνδρομής"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  }
                  
                  // Αν δεν έχει ενεργές συνδρομές, δείξε την πιο πρόσφατη
                  const latestSubscription = userSubscriptions_filtered
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  
                  return [
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className={`font-medium ${getSubscriptionStatus(user, latestSubscription) === 'expired' ? 'text-red-600' : ''}`}>
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          {latestSubscription ? (
                            <div>
                              <div className="font-medium">
                                {latestSubscription.subscription_types?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                €{latestSubscription.subscription_types?.price}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Χωρίς συνδρομή</span>
                          )}
                        </td>
                        <td className="p-2">
                          {(() => {
                            const subscriptionStatus = getSubscriptionStatus(user, null);
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
                          {latestSubscription ? (
                            <span className="text-sm text-gray-400">
                              {new Date(latestSubscription.end_date).toLocaleDateString('el-GR')} (Ανενεργή)
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="text-gray-400">-</span>
                        </td>
                        <td className="p-2">
                           <div className="flex gap-1">
                             {latestSubscription ? (
                               <>
                                 {/* Payment Status Button */}
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => togglePaymentStatus(latestSubscription.id, latestSubscription.is_paid)}
                                   className={`rounded-none ${latestSubscription.is_paid 
                                     ? 'border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10' 
                                     : 'border-red-300 text-red-600 hover:bg-red-50'}`}
                                   title={latestSubscription.is_paid ? "Σημείωση ως μη πληρωμένη" : "Σημείωση ως πληρωμένη"}
                                 >
                                   {latestSubscription.is_paid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                 </Button>

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
                                  onClick={() => recordVisit(user.id)}
                                  className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                                  title="Καταγραφή παρουσίας"
                                >
                                  <UserCheck className="w-3 h-3" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDeleteDialog(latestSubscription.id)}
                                  className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                                  title="Διαγραφή συνδρομής"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => recordVisit(user.id)}
                                className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                                title="Καταγραφή παρουσίας"
                              >
                                <UserCheck className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ];
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
