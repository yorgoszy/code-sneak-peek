import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Plus, Trash2, Search, Calendar, Minus, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { matchesSearchTerm } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface VideocallSession {
  id: string;
  user_id: string;
  videocall_date: string;
  videocall_time: string;
  videocall_type: string;
  notes?: string;
  created_at: string;
  app_users: {
    name: string;
    email: string;
  };
}

interface VideocallPackage {
  id: string;
  user_id: string;
  total_videocalls: number;
  remaining_videocalls: number;
  status: string;
  purchase_date: string;
  expiry_date?: string;
  app_users: {
    name: string;
    email: string;
  };
}

export const VideocallManagement: React.FC = () => {
  const [videocalls, setVideocalls] = useState<VideocallSession[]>([]);
  const [videocallPackages, setVideocallPackages] = useState<VideocallPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [videocallCount, setVideocallCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'packages' | 'manual' | 'history'>('packages');
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  const [packageVideocalls, setPackageVideocalls] = useState<string>('');
  const [packageExpiryDate, setPackageExpiryDate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  // View/Edit dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<VideocallPackage | null>(null);
  const [packageHistory, setPackageHistory] = useState<VideocallSession[]>([]);
  
  // Edit form states
  const [editPackageVideocalls, setEditPackageVideocalls] = useState<string>('');
  const [editSelectedUserId, setEditSelectedUserId] = useState<string>('');
  const [editPackageExpiryDate, setEditPackageExpiryDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Φόρτωση βιντεοκλήσεων
      const { data: videocallsData, error: videocallsError } = await supabase
        .from('user_videocalls')
        .select(`
          id,
          user_id,
          videocall_date,
          videocall_time,
          videocall_type,
          notes,
          created_at,
          app_users (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (videocallsError) throw videocallsError;
      setVideocalls(videocallsData || []);

      // Φόρτωση videocall packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('videocall_packages')
        .select(`
          id,
          user_id,
          total_videocalls,
          remaining_videocalls,
          status,
          purchase_date,
          expiry_date,
          app_users (name, email)
        `)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setVideocallPackages(packagesData || []);

      // Φόρτωση χρηστών
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email')
        .neq('role', 'admin')
        .order('name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const recordManualVideocall = async () => {
    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε χρήστη');
      return;
    }

    setSaving(true);
    try {
      // Καταγραφή πολλαπλών βιντεοκλήσεων
      for (let i = 0; i < videocallCount; i++) {
        const { error } = await supabase.rpc('record_videocall', {
          p_user_id: selectedUserId,
          p_videocall_type: 'manual',
          p_notes: notes || null
        });

        if (error) throw error;
      }

      toast.success(`${videocallCount === 1 ? 'Η βιντεοκλήση προστέθηκε' : `${videocallCount} βιντεοκλήσεις προστέθηκαν`} επιτυχώς!`);
      resetForm();
      fetchData();
      
    } catch (error) {
      console.error('Error recording videocall:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  const addVideocallPackage = async () => {
    if (!selectedUserId || !packageVideocalls) {
      toast.error('Παρακαλώ επιλέξτε χρήστη και αριθμό βιντεοκλήσεων');
      return;
    }

    try {
      // Βρίσκουμε/δημιουργούμε subscription type για videocall packages
      let { data: videocallSubscriptionType, error: subscriptionTypeError } = await supabase
        .from('subscription_types')
        .select('id')
        .eq('name', 'Πακέτο Βιντεοκλήσεων')
        .eq('subscription_mode', 'visit_based')
        .maybeSingle();

      if (subscriptionTypeError) throw subscriptionTypeError;

      // Αν δεν υπάρχει, δημιουργούμε το subscription type
      if (!videocallSubscriptionType) {
        const { data: newSubscriptionType, error: createTypeError } = await supabase
          .from('subscription_types')
          .insert({
            name: 'Πακέτο Βιντεοκλήσεων',
            description: 'Πακέτο βιντεοκλήσεων coaching',
            price: 0,
            duration_months: 12, // 1 χρόνος διάρκεια
            subscription_mode: 'visit_based',
            visit_count: parseInt(packageVideocalls),
            is_active: true
          })
          .select('id')
          .single();

        if (createTypeError) throw createTypeError;
        videocallSubscriptionType = newSubscriptionType;
      }

      // Δημιουργούμε το videocall package
      const { error } = await supabase
        .from('videocall_packages')
        .insert({
          user_id: selectedUserId,
          total_videocalls: parseInt(packageVideocalls),
          remaining_videocalls: parseInt(packageVideocalls),
          expiry_date: packageExpiryDate || null
        });

      if (error) throw error;

      // Δημιουργούμε αυτόματα μια συνδρομή
      const endDate = packageExpiryDate 
        ? packageExpiryDate 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 χρόνος από σήμερα

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUserId,
          subscription_type_id: videocallSubscriptionType.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
          status: 'active',
          notes: `Αυτόματη δημιουργία από πακέτο ${packageVideocalls} βιντεοκλήσεων`
        });

      if (subscriptionError) throw subscriptionError;

      // Ενημερώνουμε το subscription_status του χρήστη
      const { error: userUpdateError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', selectedUserId);

      if (userUpdateError) throw userUpdateError;

      toast.success('Το πακέτο βιντεοκλήσεων και η συνδρομή δημιουργήθηκαν επιτυχώς!');
      
      // Reset form
      setShowAddPackageForm(false);
      setSelectedUserId('');
      setPackageVideocalls('');
      setPackageExpiryDate('');
      setUserSearchTerm('');
      fetchData();
      
    } catch (error) {
      console.error('Error adding videocall package:', error);
      toast.error('Σφάλμα προσθήκης πακέτου βιντεοκλήσεων');
    }
  };

  const addVideocallToPackage = async (packageId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('record_videocall', {
        p_user_id: userId,
        p_videocall_type: 'package',
        p_notes: 'Προσθήκη από πακέτο βιντεοκλήσεων'
      });

      if (error) throw error;

      toast.success('Η βιντεοκλήση προστέθηκε επιτυχώς!');
      fetchData();
      
    } catch (error) {
      console.error('Error adding videocall to package:', error);
      toast.error('Σφάλμα προσθήκης βιντεοκλήσης');
    }
  };

  const deleteVideocallPackage = async (packageId: string) => {
    try {
      const packageToDelete = videocallPackages.find(p => p.id === packageId);
      if (!packageToDelete) throw new Error('Package not found');

      // Πρώτα διαγράφουμε όλες τις σχετικές βιντεοκλήσεις
      const { error: videocallsError } = await supabase
        .from('user_videocalls')
        .delete()
        .eq('user_id', packageToDelete.user_id);

      if (videocallsError) throw videocallsError;

      // Διαγράφουμε τα επερχόμενα videocall bookings του χρήστη
      const { error: bookingsError } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('user_id', packageToDelete.user_id)
        .eq('booking_type', 'videocall')
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0]); // μόνο επερχόμενα

      if (bookingsError) throw bookingsError;

      // Μετά διαγράφουμε το πακέτο
      const { error } = await supabase
        .from('videocall_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      toast.success('Το πακέτο και όλες οι σχετικές βιντεοκλήσεις και ραντεβού διαγράφηκαν επιτυχώς!');
      fetchData();
      
    } catch (error) {
      console.error('Error deleting videocall package:', error);
      toast.error('Σφάλμα διαγραφής πακέτου');
    }
  };

  const removeVideocallFromPackage = async (userId: string) => {
    try {
      // Βρίσκουμε την τελευταία βιντεοκλήση για αυτόν τον χρήστη
      const { data: latestVideocall, error: fetchError } = await supabase
        .from('user_videocalls')
        .select('id, user_id, videocall_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!latestVideocall) {
        toast.error('Δεν βρέθηκε βιντεοκλήση για διαγραφή');
        return;
      }

      // Διαγράφουμε την τελευταία βιντεοκλήση
      const { error } = await supabase
        .from('user_videocalls')
        .delete()
        .eq('id', latestVideocall.id);

      if (error) throw error;

      // Ενημερώνουμε το πακέτο - αυξάνουμε τις διαθέσιμες βιντεοκλήσεις
      const { data: currentPackage, error: fetchPackageError } = await supabase
        .from('videocall_packages')
        .select('remaining_videocalls')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchPackageError) throw fetchPackageError;

      if (!currentPackage) {
        toast.error('Δεν βρέθηκε ενεργό πακέτο για τον χρήστη');
        return;
      }

      const { error: updateError } = await supabase
        .from('videocall_packages')
        .update({ remaining_videocalls: currentPackage.remaining_videocalls + 1 })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) throw updateError;

      toast.success('Η βιντεοκλήση αφαιρέθηκε επιτυχώς από το ιστορικό!');
      fetchData();
      
    } catch (error) {
      console.error('Error removing videocall from package:', error);
      toast.error('Σφάλμα αφαίρεσης βιντεοκλήσης');
    }
  };

  const deleteVideocall = async (videocallId: string) => {
    try {
      // Πρώτα παίρνουμε τη βιντεοκλήση για να ελέγξουμε αν πρέπει να ενημερώσουμε πακέτο
      const { data: videocallData, error: fetchError } = await supabase
        .from('user_videocalls')
        .select('user_id, videocall_type')
        .eq('id', videocallId)
        .single();

      if (fetchError) throw fetchError;

      // Διαγραφή της βιντεοκλήσης
      const { error } = await supabase
        .from('user_videocalls')
        .delete()
        .eq('id', videocallId);

      if (error) throw error;

      // Αν ήταν package videocall, ενημερώνουμε το πακέτο
      if (videocallData.videocall_type === 'package' || videocallData.videocall_type === 'manual') {
        const { data: currentPackage, error: packageError } = await supabase
          .from('videocall_packages')
          .select('remaining_videocalls')
          .eq('user_id', videocallData.user_id)
          .eq('status', 'active')
          .maybeSingle();

        if (!packageError && currentPackage) {
          const { error: updateError } = await supabase
            .from('videocall_packages')
            .update({ remaining_videocalls: currentPackage.remaining_videocalls + 1 })
            .eq('user_id', videocallData.user_id)
            .eq('status', 'active');

          if (updateError) {
            console.error('Error updating package:', updateError);
          }
        }
      }

      toast.success('Η βιντεοκλήση διαγράφηκε επιτυχώς!');
      fetchData();
      
    } catch (error) {
      console.error('Error deleting videocall:', error);
      toast.error('Σφάλμα διαγραφής βιντεοκλήσης');
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setNotes('');
    setUserSearchTerm('');
    setVideocallCount(1);
    setPackageVideocalls('');
    setPackageExpiryDate('');
  };

  const fetchPackageHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_videocalls')
        .select(`
          id,
          user_id,
          videocall_date,
          videocall_time,
          videocall_type,
          notes,
          created_at,
          app_users (name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackageHistory(data || []);
    } catch (error) {
      console.error('Error fetching package history:', error);
      toast.error('Σφάλμα φόρτωσης ιστορικού');
    }
  };

  const handleViewPackage = async (pkg: VideocallPackage) => {
    setSelectedPackage(pkg);
    await fetchPackageHistory(pkg.user_id);
    setViewDialogOpen(true);
  };

  const handleEditPackage = (pkg: VideocallPackage) => {
    setSelectedPackage(pkg);
    setEditPackageVideocalls(pkg.total_videocalls.toString());
    setEditSelectedUserId(pkg.user_id);
    setEditPackageExpiryDate(pkg.expiry_date || '');
    setEditDialogOpen(true);
  };

  const updatePackage = async () => {
    if (!selectedPackage) return;

    try {
      const { error } = await supabase
        .from('videocall_packages')
        .update({
          total_videocalls: parseInt(editPackageVideocalls),
          remaining_videocalls: parseInt(editPackageVideocalls) - (selectedPackage.total_videocalls - selectedPackage.remaining_videocalls),
          user_id: editSelectedUserId,
          expiry_date: editPackageExpiryDate || null
        })
        .eq('id', selectedPackage.id);

      if (error) throw error;

      toast.success('Το πακέτο ενημερώθηκε επιτυχώς!');
      setEditDialogOpen(false);
      fetchData();
      
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Σφάλμα ενημέρωσης πακέτου');
    }
  };

  const filteredVideocalls = videocalls.filter(videocall => {
    const userName = videocall.app_users?.name || '';
    const userEmail = videocall.app_users?.email || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τις βιντεοκλήσεις...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            <span className="text-lg sm:text-xl">Διαχείριση Βιντεοκλήσεων</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setActiveTab('packages')}
              variant={activeTab === 'packages' ? 'default' : 'outline'}
              className="rounded-none flex-1 sm:flex-initial text-sm"
            >
              Πακέτα
            </Button>
            <Button 
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'outline'}
              className="rounded-none flex-1 sm:flex-initial text-sm"
            >
              Ιστορικό
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold">Πακέτα Βιντεοκλήσεων</h3>
              <Button 
                onClick={() => setShowAddPackageForm(!showAddPackageForm)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Νέο Πακέτο
              </Button>
            </div>

            {showAddPackageForm && (
              <Card className="rounded-none border-2 border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4 text-sm sm:text-base">Προσθήκη Νέου Πακέτου</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Input
                        placeholder="Αναζήτηση χρήστη..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full p-2 border rounded-none"
                      >
                        <option value="">Επιλέξτε χρήστη</option>
                        {users
                          .filter(user => 
                            matchesSearchTerm(user.name, userSearchTerm) ||
                            matchesSearchTerm(user.email, userSearchTerm)
                          )
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Αριθμός βιντεοκλήσεων"
                        value={packageVideocalls}
                        onChange={(e) => setPackageVideocalls(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        placeholder="Ημερομηνία λήξης (προαιρετικό)"
                        value={packageExpiryDate}
                        onChange={(e) => setPackageExpiryDate(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={addVideocallPackage}
                      className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      Προσθήκη
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddPackageForm(false);
                        resetForm();
                      }}
                      className="rounded-none"
                    >
                      Ακύρωση
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {videocallPackages.map((pkg) => (
                <Card key={pkg.id} className="rounded-none">
                  <CardContent className="p-4">
                    {/* Mobile & Tablet Layout */}
                    <div className="block lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm md:text-base">{pkg.app_users.name}</h4>
                          <p className="text-xs md:text-sm text-gray-500">{pkg.app_users.email}</p>
                        </div>
                        <Badge 
                          variant={pkg.status === 'active' ? 'default' : 'secondary'}
                          className="rounded-none text-xs"
                        >
                          {pkg.status === 'active' ? 'Ενεργό' : 'Χρησιμοποιημένο'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs md:text-sm">
                        <span className="font-medium">Βιντεοκλήσεις:</span> {pkg.total_videocalls - pkg.remaining_videocalls}/{pkg.total_videocalls}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVideocallFromPackage(pkg.user_id)}
                          disabled={pkg.total_videocalls - pkg.remaining_videocalls === 0}
                          className="rounded-none h-7 w-7 p-0"
                          title="Αφαίρεση χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addVideocallToPackage(pkg.id, pkg.user_id)}
                          disabled={pkg.remaining_videocalls === 0}
                          className="rounded-none h-7 w-7 p-0"
                          title="Προσθήκη χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPackage(pkg)}
                          className="rounded-none h-7 w-7 p-0"
                          title="Προβολή πακέτου"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPackage(pkg)}
                          className="rounded-none h-7 w-7 p-0"
                          title="Επεξεργασία πακέτου"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteVideocallPackage(pkg.id)}
                          className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                          title="Διαγραφή πακέτου"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{pkg.app_users.name}</h4>
                        <p className="text-sm text-gray-500">{pkg.app_users.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">
                            Βιντεοκλήσεις: {pkg.total_videocalls - pkg.remaining_videocalls}/{pkg.total_videocalls}
                          </span>
                          <Badge 
                            variant={pkg.status === 'active' ? 'default' : 'secondary'}
                            className="rounded-none"
                          >
                            {pkg.status === 'active' ? 'Ενεργό' : 'Χρησιμοποιημένο'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVideocallFromPackage(pkg.user_id)}
                          disabled={pkg.total_videocalls - pkg.remaining_videocalls === 0}
                          className="rounded-none"
                          title="Αφαίρεση χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addVideocallToPackage(pkg.id, pkg.user_id)}
                          disabled={pkg.remaining_videocalls === 0}
                          className="rounded-none"
                          title="Προσθήκη χρησιμοποιημένης βιντεοκλήσης"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPackage(pkg)}
                          className="rounded-none"
                          title="Προβολή πακέτου"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPackage(pkg)}
                          className="rounded-none"
                          title="Επεξεργασία πακέτου"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteVideocallPackage(pkg.id)}
                          className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Διαγραφή πακέτου"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}


        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold">Ιστορικό Βιντεοκλήσεων</h3>
              <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredVideocalls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν βιντεοκλήσεις</h3>
                  <p>Δεν υπάρχουν καταχωρημένες βιντεοκλήσεις.</p>
                </div>
              ) : (
                filteredVideocalls.map((videocall) => (
                  <Card key={videocall.id} className="rounded-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Video className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {videocall.app_users?.name}
                            </h3>
                            <p className="text-sm text-gray-500">{videocall.app_users?.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(videocall.videocall_date), 'dd/MM/yyyy', { locale: el })}
                              </div>
                              <Badge className="rounded-none">
                                {videocall.videocall_type === 'manual' ? 'Χειροκίνητη' : 'Πακέτο'}
                              </Badge>
                            </div>
                            {videocall.notes && (
                              <p className="text-sm text-gray-600 mt-1">Σημειώσεις: {videocall.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVideocall(videocall.id)}
                          className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* View Package Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-none">
          <DialogHeader>
            <DialogTitle>
              Ιστορικό Πακέτου - {selectedPackage?.app_users.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Χρήστης:</strong> {selectedPackage?.app_users.name}</p>
                <p><strong>Email:</strong> {selectedPackage?.app_users.email}</p>
              </div>
              <div>
                <p><strong>Συνολικές Βιντεοκλήσεις:</strong> {selectedPackage?.total_videocalls}</p>
                <p><strong>Χρησιμοποιημένες:</strong> {selectedPackage ? selectedPackage.total_videocalls - selectedPackage.remaining_videocalls : 0}</p>
                <p><strong>Κατάσταση:</strong> <Badge className="rounded-none">{selectedPackage?.status === 'active' ? 'Ενεργό' : 'Χρησιμοποιημένο'}</Badge></p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Ιστορικό Βιντεοκλήσεων</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {packageHistory.length === 0 ? (
                  <p className="text-gray-500">Δεν υπάρχουν βιντεοκλήσεις</p>
                ) : (
                  packageHistory.map((videocall) => (
                    <Card key={videocall.id} className="rounded-none">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(videocall.videocall_date), 'dd/MM/yyyy', { locale: el })}</span>
                              <Badge className="rounded-none text-xs">
                                {videocall.videocall_type === 'manual' ? 'Χειροκίνητη' : 'Πακέτο'}
                              </Badge>
                            </div>
                            {videocall.notes && (
                              <p className="text-sm text-gray-600 mt-1">{videocall.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Πακέτου</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Χρήστης</label>
              <select
                value={editSelectedUserId}
                onChange={(e) => setEditSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded-none"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Συνολικές Βιντεοκλήσεις</label>
              <Input
                type="number"
                value={editPackageVideocalls}
                onChange={(e) => setEditPackageVideocalls(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ημερομηνία Λήξης (προαιρετικό)</label>
              <Input
                type="date"
                value={editPackageExpiryDate}
                onChange={(e) => setEditPackageExpiryDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={updatePackage}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Ενημέρωση
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};