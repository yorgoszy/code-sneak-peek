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
import { matchesSearchTerm } from "@/lib/utils";
import { Crown, Calendar, DollarSign, User, Plus, Edit2, Check, X, Search, ChevronDown, Receipt, Pause, Play, RotateCcw, Trash2, UserCheck, CreditCard, Users } from "lucide-react";
import { ReceiptConfirmDialog } from './ReceiptConfirmDialog';
import { SubscriptionDeleteDialog } from './SubscriptionDeleteDialog';
import { SectionAssignmentDialog } from './SectionAssignmentDialog';
import { format } from 'date-fns';

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
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [selectedUserForSection, setSelectedUserForSection] = useState<{id: string, name: string, sectionId: string | null} | null>(null);
  const [durationMultiplier, setDurationMultiplier] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        matchesSearchTerm(user.name, userSearchTerm) ||
        matchesSearchTerm(user.email, userSearchTerm)
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
        .select('*');

      if (typesError) {
        console.error('Error loading subscription types:', typesError);
        throw typesError;
      }
      console.log('✅ Subscription types loaded:', types?.length);
      
      const typedSubscriptionTypes = (types || []).map(type => ({
        ...type,
        subscription_mode: (type.subscription_mode || 'time_based') as 'time_based' | 'visit_based'
      })) as SubscriptionType[];
      
      // Προτεραιότητα ταξινόμησης
      const priorityOrder = [
        'hyperkids',
        'hypergym',
        'hyperathletes',
        'hypergym 25%',
        '12 hypergym',
        '3 hyperathletes',
        '12 hyperathletes'
      ];
      
      // Ταξινόμηση με custom σειρά
      const sortedTypes = typedSubscriptionTypes.sort((a, b) => {
        const aIndex = priorityOrder.findIndex(name => 
          a.name.toLowerCase().includes(name.toLowerCase())
        );
        const bIndex = priorityOrder.findIndex(name => 
          b.name.toLowerCase().includes(name.toLowerCase())
        );
        
        // Αν και τα δύο είναι στη λίστα προτεραιότητας
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // Αν μόνο το a είναι στη λίστα προτεραιότητας
        if (aIndex !== -1) return -1;
        // Αν μόνο το b είναι στη λίστα προτεραιότητας
        if (bIndex !== -1) return 1;
        // Αν κανένα δεν είναι στη λίστα, ταξινόμηση με τιμή
        return a.price - b.price;
      });
      
      setSubscriptionTypes(sortedTypes);

      // Ενημέρωση ληγμένων συνδρομών πρώτα
      await supabase.rpc('check_and_update_expired_subscriptions');

      // Φόρτωση συνδρομών χρηστών: ενεργές + ληγμένες του τελευταίου μήνα
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Φόρτωση ενεργών συνδρομών
      const { data: activeSubscriptions, error: activeError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users!user_subscriptions_user_id_fkey (name, email, subscription_status, role, user_status)
        `)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (activeError) {
        console.error('Error loading active subscriptions:', activeError);
        throw activeError;
      }
      console.log('✅ Active subscriptions loaded:', activeSubscriptions?.length);

      // Φόρτωση ληγμένων του τελευταίου μήνα
      const { data: expiredSubscriptions, error: expiredError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users!user_subscriptions_user_id_fkey (name, email, subscription_status, role, user_status)
        `)
        .eq('status', 'expired')
        .gte('end_date', thirtyDaysAgoStr)
        .order('end_date', { ascending: true });

      if (expiredError) {
        console.error('Error loading expired subscriptions:', expiredError);
        throw expiredError;
      }
      console.log('✅ Expired subscriptions loaded:', expiredSubscriptions?.length);

      // Συνδυασμός και ταξινόμηση
      const subscriptions = [...(activeSubscriptions || []), ...(expiredSubscriptions || [])].sort((a, b) => 
        new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      );
      const subscriptionsError = null;

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
        .select('id, name, email, subscription_status, role, user_status, section_id, booking_sections(id, name)')
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

  const getMyDataSettings = () => {
    const enabled = localStorage.getItem('mydata_enabled') === 'true';
    const autoSendRaw = localStorage.getItem('mydata_auto_send');

    return {
      aadeUserId: localStorage.getItem('mydata_aade_user_id') || '',
      subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
      vatNumber: localStorage.getItem('mydata_vat_number') || '',
      environment: 'production' as const,
      enabled,
      // Αν δεν έχει αποθηκευτεί ακόμα ρύθμιση auto-send, το θεωρούμε true όταν το MyData είναι ενεργό
      autoSend: autoSendRaw === null ? enabled : autoSendRaw === 'true'
    };
  };

  const sendReceiptToMyData = async (receiptNumber: string, receiptId: string, netPrice: number, vatAmount: number, totalPrice: number) => {
    const settings = getMyDataSettings();
    
    if (!settings.enabled || !settings.autoSend) {
      console.log('⏭️ MyData auto-send is disabled');
      return;
    }

    const useStoredCredentials = !settings.aadeUserId || !settings.subscriptionKey;

    try {
      // Extract series and number from receipt number (e.g., "ΑΠΥ-0060" -> series="ΑΠΥ", aa=60)
      const extractSeriesFromReceiptNumber = (rn: string): string => {
        const match = rn.match(/^([A-ZΑ-Ω]+)/i);
        return match ? match[1] : 'A';
      };
      const extractNumberFromReceiptNumber = (rn: string): number => {
        const match = rn.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : Math.floor(Math.random() * 100000);
      };

      const myDataReceipt = {
        issuer: {
          vatNumber: settings.vatNumber,
          country: "GR",
          branch: 0
        },
        invoiceHeader: {
          series: extractSeriesFromReceiptNumber(receiptNumber),
          aa: extractNumberFromReceiptNumber(receiptNumber),
          issueDate: new Date().toISOString().split('T')[0],
          invoiceType: "11.1",
          currency: "EUR"
        },
        invoiceDetails: [{
          lineNumber: 1,
          netValue: netPrice,
          vatCategory: 3, // ΦΠΑ 13%
          vatAmount: vatAmount
        }],
        invoiceSummary: {
          totalNetValue: netPrice,
          totalVatAmount: vatAmount,
          totalWithheldAmount: 0,
          totalFeesAmount: 0,
          totalStampDutyAmount: 0,
          totalOtherTaxesAmount: 0,
          totalDeductionsAmount: 0,
          totalGrossValue: totalPrice
        }
      };

      console.log('🚀 Auto-sending receipt to MyData:', receiptNumber);

      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          aadeUserId: useStoredCredentials ? undefined : settings.aadeUserId,
          subscriptionKey: useStoredCredentials ? undefined : settings.subscriptionKey,
          environment: settings.environment,
          receipt: myDataReceipt,
          useStoredCredentials
        }
      });

      if (error) throw error;

      if (data.success) {
        // Ενημέρωση της απόδειξης με το MARK, UID και QR URL
        await supabase
          .from('receipts')
          .update({
            mydata_status: 'sent',
            mydata_id: data.myDataId,
            invoice_mark: data.invoiceMark,
            invoice_uid: data.invoiceUid,
            qr_url: data.qrUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', receiptId);

        console.log('✅ Receipt auto-sent to MyData. MARK:', data.invoiceMark);
        
        toast({
          title: "MyData Επιτυχία",
          description: `Απόδειξη στάλθηκε στο MyData. ΜΑΡΚ: ${data.invoiceMark}`,
        });
      }
    } catch (error: any) {
      console.error('❌ MyData auto-send error:', error);
      
      // Ενημέρωση κατάστασης σε error
      await supabase
        .from('receipts')
        .update({
          mydata_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId);
    }
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

      const { data: insertedReceipt, error: receiptError } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select()
        .single();

      if (receiptError) throw receiptError;

      console.log('✅ Απόδειξη δημιουργήθηκε επιτυχώς:', receiptNumber);
      
      toast({
        title: "Επιτυχία",
        description: `Η απόδειξη ${receiptNumber} δημιουργήθηκε επιτυχώς`,
      });

      // Auto-send στο MyData αν είναι ενεργοποιημένο
      if (insertedReceipt) {
        await sendReceiptToMyData(receiptNumber, insertedReceipt.id, netPrice, vatAmount, totalPrice);
      }

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
    
    // Υπολογισμός ημερομηνίας λήξης ανάλογα με τον τύπο συνδρομής και τον πολλαπλασιαστή
    if (subscriptionType.subscription_mode === 'visit_based') {
      endDate.setMonth(subscriptionStartDate.getMonth() + ((subscriptionType.visit_expiry_months || 0) * durationMultiplier));
    } else {
      endDate.setMonth(subscriptionStartDate.getMonth() + (subscriptionType.duration_months * durationMultiplier));
    }
    endDate.setDate(subscriptionStartDate.getDate() - 1);

    // Αποθήκευση δεδομένων για μετά την επιλογή απόδειξης
    setPendingSubscriptionData({
      subscriptionType,
      selectedUserData,
      subscriptionStartDate,
      endDate,
      durationMultiplier
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
          start_date: subscriptionStartDate.toISOString().split('T')[0],
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
            purchase_date: subscriptionStartDate.toISOString().split('T')[0],
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
          startDate: subscriptionStartDate.toISOString().split('T')[0],
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
      setShowReceiptDialog(false);
      setPendingSubscriptionData(null);
      setDurationMultiplier(1);
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
      // Βρες τον χρήστη για να δούμε αν έχει ανατεθεί τμήμα
      const user = users.find(u => u.id === userId);
      
      if (user?.section_id) {
        // Αν έχει τμήμα, δημιούργησε booking για σήμερα
        const today = format(new Date(), 'yyyy-MM-dd');
        const currentTime = format(new Date(), 'HH:00:00');
        
        const { error: bookingError } = await supabase
          .from('booking_sessions')
          .insert({
            user_id: userId,
            section_id: user.section_id,
            booking_date: today,
            booking_time: currentTime,
            booking_type: 'gym',
            status: 'completed',
            attendance_status: 'present',
            completed_at: new Date().toISOString(),
            notes: 'Manual attendance from subscription management'
          });

        if (bookingError) throw bookingError;
      }

      // Καταγραφή επίσκεψης (πάντα)
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: userId,
        p_visit_type: 'manual',
        p_notes: user?.section_id 
          ? `Manual visit from subscription management - Section: ${user.booking_sections?.name || 'Unknown'}`
          : 'Manual visit from subscription management'
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: user?.section_id 
          ? `Η παρουσία καταγράφηκε στο τμήμα ${user.booking_sections?.name}`
          : "Η παρουσία καταγράφηκε επιτυχώς!"
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

  const openSectionDialog = (user: any) => {
    setSelectedUserForSection({
      id: user.id,
      name: user.name,
      sectionId: user.section_id
    });
    setSectionDialogOpen(true);
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
    if (!activeSubscription) {
      // Αν δεν υπάρχει ενεργή, έλεγξε την πιο πρόσφατη (από τα φορτωμένα ενεργά/πρόσφατα ληγμένα)
      const subs = userSubscriptions.filter(s => s.user_id === user.id);
      if (subs.length > 0) {
        const latest = subs.slice().sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
        const today = new Date();
        if (latest && new Date(latest.end_date) < today) return 'expired';
      }
      return 'inactive';
    }
    if (activeSubscription.is_paused) return 'paused';
    
    const today = new Date();
    const endDate = new Date(activeSubscription.end_date);
    
    if (endDate < today) return 'expired';
    return 'active';
  };

  // Filter users for table display and sort by subscription priority
  const filteredUsersForTable = users
    .filter(user => {
      const passesSearch = usersTableSearchTerm.trim() === '' ||
        matchesSearchTerm(user.name, usersTableSearchTerm) ||
        matchesSearchTerm(user.email, usersTableSearchTerm);
      if (!passesSearch) return false;

      // Εμφάνιση μόνο χρηστών με ενεργή ή πρόσφατα ληγμένη (<=30 ημέρες) συνδρομή
      const subs = userSubscriptions.filter(s => s.user_id === user.id);
      return subs.length > 0;
    })
    .sort((a, b) => {
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
          <DialogContent className="rounded-none max-w-2xl max-h-[85vh] overflow-y-auto p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Δημιουργία Νέας Συνδρομής</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Στοιχεία Συνδρομής</h4>
              
              <div>
                <label className="block text-xs font-medium mb-1">Πελάτης *</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                  <Input
                    placeholder="Πληκτρολογήστε όνομα ή email χρήστη..."
                    value={userSearchTerm}
                    onChange={handleUserInputChange}
                    onFocus={handleInputFocus}
                    className="pl-7 pr-7 rounded-none h-8 text-sm"
                  />
                  <ChevronDown 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 cursor-pointer hover:text-gray-600" 
                    onClick={handleChevronClick}
                  />
                  
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-48 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="mt-0.5 text-xs text-green-600">
                    ✓ Επιλέχθηκε: {users.find(u => u.id === selectedUser)?.name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Έκδοση *</label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="rounded-none h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Έναρξης *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-none h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Λήξης</label>
                  <Input
                    type="date"
                    value={selectedSubscriptionType ? (() => {
                      const startDateObj = new Date(startDate);
                      const endDateObj = new Date(startDateObj);
                      const subscriptionType = subscriptionTypes.find(t => t.id === selectedSubscriptionType);
                      const durationMonths = subscriptionType?.subscription_mode === 'visit_based' 
                        ? (subscriptionType?.visit_expiry_months || 0) 
                        : (subscriptionType?.duration_months || 0);
                      endDateObj.setMonth(startDateObj.getMonth() + (durationMonths * durationMultiplier));
                      endDateObj.setDate(startDateObj.getDate() - 1);
                      return endDateObj.toISOString().split('T')[0];
                    })() : ''}
                    disabled
                    className="rounded-none bg-gray-50 h-8 text-sm"
                  />
                </div>
              </div>
              
              <h4 className="text-sm font-semibold pt-1">ΤΥΠΟΣ Συνδρομής</h4>
              <div>
                <label className="block text-xs font-medium mb-1">Περιγραφή *</label>
                <Select value={selectedSubscriptionType} onValueChange={(value) => {
                  setSelectedSubscriptionType(value);
                  setDurationMultiplier(1);
                }}>
                  <SelectTrigger className="rounded-none h-8 text-sm">
                    <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-sm">
                        {type.name} - €{type.price} ({type.duration_months} μήνες)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {selectedSubscriptionType && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Ποσότητα</label>
                      <Select value={durationMultiplier.toString()} onValueChange={(value) => setDurationMultiplier(parseInt(value))}>
                        <SelectTrigger className="rounded-none h-7 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()} className="text-sm">
                              x{num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Τιμή μονάδας (€)</label>
                      <Input
                        value={(() => {
                          const totalPrice = subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0;
                          const netPrice = totalPrice / 1.13;
                          return netPrice.toFixed(2);
                        })()}
                        disabled
                        className="rounded-none bg-gray-50 h-7 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">ΦΠΑ (%)</label>
                      <Input
                        value="13"
                        disabled
                        className="rounded-none bg-gray-50 h-7 text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 border-l-4 border-[#00ffba] space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Αξία Συνδρομής:</span>
                      <span>€{(() => {
                        const totalPrice = (subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0) * durationMultiplier;
                        const netPrice = totalPrice / 1.13;
                        return netPrice.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">ΦΠΑ:</span>
                      <span>€{(() => {
                        const totalPrice = (subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0) * durationMultiplier;
                        const netPrice = totalPrice / 1.13;
                        const vatAmount = totalPrice - netPrice;
                        return vatAmount.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="border-t border-[#00ffba] pt-1">
                      <div className="flex justify-between text-base font-bold text-[#00ffba]">
                        <span>Σύνολο:</span>
                        <span>€{((subscriptionTypes.find(t => t.id === selectedSubscriptionType)?.price || 0) * durationMultiplier).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}


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
        <CardContent className="p-2 md:p-6">
          {/* Mobile & Tablet: Card Layout */}
          <div className="block lg:hidden space-y-3">
            {filteredUsersForTable.flatMap((user) => {
              const userSubscriptions_filtered = userSubscriptions.filter(s => s.user_id === user.id);
              const activeSubscriptions = userSubscriptions_filtered.filter(s => s.status === 'active');
              
              // Αν έχει ενεργές συνδρομές, δείξε όλες
              if (activeSubscriptions.length > 0) {
                return activeSubscriptions.map((subscription, index) => {
                  const subscriptionStatus = getSubscriptionStatus(user, subscription);
                  const today = new Date();
                  const endDate = new Date(subscription.end_date);
                  const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <Card key={`${user.id}-${subscription.id}`} className="p-3 rounded-none border">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className={`font-medium text-sm md:text-base ${subscriptionStatus === 'expired' ? 'text-red-600' : ''}`}>
                              {user.name} {activeSubscriptions.length > 1 ? `(${index + 1}/${activeSubscriptions.length})` : ''}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
                          </div>
                          <Badge className={`rounded-none text-xs md:text-sm ${getStatusColor(subscriptionStatus)}`}>
                            {subscriptionStatus === 'paused' ? 'Παύση' : 
                             subscriptionStatus === 'expired' ? 'Λήξη' :
                             subscriptionStatus === 'active' ? 'Ενεργή' : 'Ανενεργή'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                          <div>
                            <span className="font-medium">Συνδρομή:</span>
                            <div className="text-sm md:text-base">{subscription.subscription_types?.name}</div>
                            <div className="text-gray-500">€{subscription.subscription_types?.price}</div>
                          </div>
                          <div>
                            <span className="font-medium">Λήξη:</span>
                            <div className="text-sm md:text-base">{new Date(subscription.end_date).toLocaleDateString('el-GR')}</div>
                            <div className="text-gray-500">
                              {(() => {
                                if (subscription.is_paused && subscription.paused_days_remaining) {
                                  return <span className="text-orange-600 font-medium">{subscription.paused_days_remaining} ημέρες</span>;
                                }
                                
                                if (remainingDays < 0) {
                                  return <span className="text-red-600 font-medium">-{Math.abs(remainingDays)} ημέρες</span>;
                                } else if (remainingDays === 0) {
                                  return <span className="text-orange-600 font-medium">Λήγει σήμερα</span>;
                                } else if (remainingDays <= 7) {
                                  return <span className="text-orange-600 font-medium">{remainingDays} ημέρες</span>;
                                } else {
                                  return <span className="text-green-600">{remainingDays} ημέρες</span>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-xs md:text-sm">
                            <Badge 
                              variant={subscription.is_paid ? "default" : "destructive"}
                              className="rounded-none text-xs"
                            >
                              {subscription.is_paid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </div>
                          <div className="flex gap-1 md:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePaymentStatus(subscription.id, subscription.is_paid)}
                              className={`rounded-none h-7 w-7 md:h-8 md:w-8 p-0 ${subscription.is_paid 
                                ? 'border-[#00ffba] text-[#00ffba]' 
                                : 'border-red-300 text-red-600'}`}
                            >
                              {subscription.is_paid ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <X className="w-3 h-3 md:w-4 md:h-4" />}
                            </Button>

                            {subscription.is_paused ? (
                              <Button
                                size="sm"
                                onClick={() => resumeSubscription(subscription.id)}
                                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Play className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => pauseSubscription(subscription.id)}
                                className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Pause className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() => renewSubscription(subscription.id)}
                              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                            >
                              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>

                            {/* Section Assignment Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSectionDialog(user)}
                              className={`rounded-none h-7 w-7 md:h-8 md:w-8 p-0 ${user.section_id 
                                ? 'border-[#cb8954] text-[#cb8954]' 
                                : 'border-gray-300 text-gray-500'}`}
                              title={user.section_id ? `Τμήμα: ${user.booking_sections?.name}` : "Ανάθεση τμήματος"}
                            >
                              <Users className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>

                            {/* Visit Recording Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recordVisit(user.id)}
                              className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0 border-[#00ffba] text-[#00ffba]"
                              title={user.section_id 
                                ? `Καταγραφή παρουσίας - ${user.booking_sections?.name}`
                                : "Καταγραφή παρουσίας"}
                            >
                              <UserCheck className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(subscription)}
                              className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                            >
                              <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(subscription.id)}
                              className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                });
              }
              
              // Αν δεν έχει ενεργή συνδρομή, δείξε μόνο τον χρήστη
              return (
                <Card key={user.id} className="p-3 rounded-none border opacity-50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm md:text-base">{user.name}</div>
                        <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
                      </div>
                      <Badge variant="secondary" className="rounded-none text-xs md:text-sm">
                        Χωρίς Συνδρομή
                      </Badge>
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.user_status)}
                        className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
                      >
                        <UserCheck className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
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
                                return <span className="text-red-600 font-medium">-{Math.abs(remainingDays)} ημέρες</span>;
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

                            {/* Section Assignment Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSectionDialog(user)}
                              className={`rounded-none ${user.section_id 
                                ? 'border-[#cb8954] text-[#cb8954] hover:bg-[#cb8954]/10' 
                                : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                              title={user.section_id ? `Τμήμα: ${user.booking_sections?.name}` : "Ανάθεση τμήματος"}
                            >
                              <Users className="w-3 h-3" />
                            </Button>

                            {/* Visit Recording Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recordVisit(user.id)}
                              className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                              title={user.section_id 
                                ? `Καταγραφή παρουσίας - ${user.booking_sections?.name}`
                                : "Καταγραφή παρουσίας"}
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
                                  onClick={() => openSectionDialog(user)}
                                  className={`rounded-none ${user.section_id 
                                    ? 'border-[#cb8954] text-[#cb8954] hover:bg-[#cb8954]/10' 
                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                  title={user.section_id ? `Τμήμα: ${user.booking_sections?.name}` : "Ανάθεση τμήματος"}
                                >
                                  <Users className="w-3 h-3" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordVisit(user.id)}
                                  className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                                  title={user.section_id 
                                    ? `Καταγραφή παρουσίας - ${user.booking_sections?.name}`
                                    : "Καταγραφή παρουσίας"}
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
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openSectionDialog(user)}
                                  className={`rounded-none ${user.section_id 
                                    ? 'border-[#cb8954] text-[#cb8954] hover:bg-[#cb8954]/10' 
                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                  title={user.section_id ? `Τμήμα: ${user.booking_sections?.name}` : "Ανάθεση τμήματος"}
                                >
                                  <Users className="w-3 h-3" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordVisit(user.id)}
                                  className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
                                  title={user.section_id 
                                    ? `Καταγραφή παρουσίας - ${user.booking_sections?.name}`
                                    : "Καταγραφή παρουσίας"}
                                >
                                  <UserCheck className="w-3 h-3" />
                                </Button>
                              </>
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

      {/* Section Assignment Dialog */}
      {selectedUserForSection && (
        <SectionAssignmentDialog
          isOpen={sectionDialogOpen}
          onClose={() => {
            setSectionDialogOpen(false);
            setSelectedUserForSection(null);
          }}
          userId={selectedUserForSection.id}
          userName={selectedUserForSection.name}
          currentSectionId={selectedUserForSection.sectionId}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
