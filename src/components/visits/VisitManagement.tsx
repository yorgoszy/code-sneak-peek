import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Clock, User, Plus, Search, QrCode, Edit, Eye, Trash2, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/qr/QRScanner";
import { UserQRCode } from "@/components/qr/UserQRCode";
import { matchesSearchTerm } from "@/lib/utils";

interface Visit {
  id: string;
  user_id: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  notes?: string;
  created_at: string;
  app_users: {
    name: string;
    email: string;
  };
}

interface VisitPackage {
  id: string;
  user_id: string;
  total_visits: number;
  remaining_visits: number;
  status: string;
  purchase_date: string;
  expiry_date?: string;
  app_users: {
    name: string;
    email: string;
  };
}

export const VisitManagement: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitPackages, setVisitPackages] = useState<VisitPackage[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookingSections, setBookingSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'packages' | 'manual' | 'scanner' | 'history'>('packages');
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  const [packageVisits, setPackageVisits] = useState<string>('');
  const [packageExpiryDate, setPackageExpiryDate] = useState<string>('');
  const [packagePrice, setPackagePrice] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedUserForQR, setSelectedUserForQR] = useState<any>(null);
  const [showEditPackageForm, setShowEditPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<VisitPackage | null>(null);
  const [showViewVisitsModal, setShowViewVisitsModal] = useState(false);
  const [selectedPackageVisits, setSelectedPackageVisits] = useState<Visit[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch visits, packages, users, and booking sections in parallel
      const [visitsResult, packagesResult, usersResult, sectionsResult] = await Promise.all([
        supabase
          .from('user_visits')
          .select(`
            id,
            user_id,
            visit_date,
            visit_time,
            visit_type,
            notes,
            created_at,
            app_users!fk_user_visits_user_id (name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('visit_packages')
          .select(`
            id,
            user_id,
            total_visits,
            remaining_visits,
            status,
            purchase_date,
            expiry_date,
            app_users!fk_visit_packages_user_id (name, email)
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('app_users')
          .select('*')
          .order('name'),
        
        supabase
          .from('booking_sections')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      const [
        visitsError,
        packagesError,
        usersError,
        sectionsError
      ] = [
        visitsResult.error,
        packagesResult.error,
        usersResult.error,
        sectionsResult.error
      ];

      if (visitsError) throw visitsError;
      if (packagesError) throw packagesError;
      if (usersError) throw usersError;
      if (sectionsError) throw sectionsError;

      setVisits(visitsResult.data || []);
      setVisitPackages(packagesResult.data || []);
      setUsers(usersResult.data || []);
      setBookingSections(sectionsResult.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα φόρτωσης δεδομένων"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordManualVisit = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη"
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: selectedUser,
        p_visit_type: 'manual',
        p_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η παρουσία καταγράφηκε επιτυχώς!"
      });
      setSelectedUser('');
      setNotes('');
      fetchData();
      
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα καταγραφής παρουσίας"
      });
    }
  };

  const addVisitPackage = async () => {
    if (!selectedUser || !packageVisits) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη και αριθμό επισκέψεων"
      });
      return;
    }

    try {
      // Βρίσκουμε/δημιουργούμε subscription type για visit packages
      let { data: visitSubscriptionType, error: subscriptionTypeError } = await supabase
        .from('subscription_types')
        .select('id')
        .eq('name', 'Πακέτο Επισκέψεων')
        .eq('subscription_mode', 'visit_based')
        .maybeSingle();

      if (subscriptionTypeError) throw subscriptionTypeError;

      // Αν δεν υπάρχει, δημιουργούμε το subscription type
      if (!visitSubscriptionType) {
        const { data: newSubscriptionType, error: createTypeError } = await supabase
          .from('subscription_types')
          .insert({
            name: 'Πακέτο Επισκέψεων',
            description: 'Πακέτο επισκέψεων γυμναστηρίου',
            price: packagePrice ? parseFloat(packagePrice) : 0,
            duration_months: 12, // 1 χρόνος διάρκεια
            subscription_mode: 'visit_based',
            visit_count: parseInt(packageVisits),
            is_active: true,
            allowed_sections: selectedSections.length > 0 ? selectedSections : null
          })
          .select('id')
          .single();

        if (createTypeError) throw createTypeError;
        visitSubscriptionType = newSubscriptionType;
      }

      // Δημιουργούμε το visit package
      const { error } = await supabase
        .from('visit_packages')
        .insert({
          user_id: selectedUser,
          total_visits: parseInt(packageVisits),
          remaining_visits: parseInt(packageVisits),
          expiry_date: packageExpiryDate || null,
          price: packagePrice ? parseFloat(packagePrice) : null,
          allowed_sections: selectedSections.length > 0 ? selectedSections : null
        });

      if (error) throw error;

      // Δημιουργούμε αυτόματα μια συνδρομή
      const endDate = packageExpiryDate 
        ? packageExpiryDate 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 χρόνος από σήμερα

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUser,
          subscription_type_id: visitSubscriptionType.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
          status: 'active',
          notes: `Αυτόματη δημιουργία από πακέτο ${packageVisits} επισκέψεων`
        });

      if (subscriptionError) throw subscriptionError;

      // Ενημερώνουμε το subscription_status του χρήστη
      const { error: userUpdateError } = await supabase
        .from('app_users')
        .update({ subscription_status: 'active' })
        .eq('id', selectedUser);

      if (userUpdateError) throw userUpdateError;

      toast({
        title: "Επιτυχία",
        description: "Το πακέτο επισκέψεων και η συνδρομή δημιουργήθηκαν επιτυχώς!"
      });
      
      // Reset form
      setShowAddPackageForm(false);
      setSelectedUser('');
      setPackageVisits('');
      setPackageExpiryDate('');
      setPackagePrice('');
      setSelectedSections([]);
      setSearchTerm('');
      fetchData();
      
    } catch (error) {
      console.error('Error adding visit package:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα προσθήκης πακέτου επισκέψεων"
      });
    }
  };

  const deleteVisit = async (visitId: string) => {
    try {
      // First get the visit to check if we need to update package
      const { data: visitData, error: fetchError } = await supabase
        .from('user_visits')
        .select('user_id, visit_type')
        .eq('id', visitId)
        .single();

      if (fetchError) {
        console.error('Error fetching visit data:', fetchError);
        throw fetchError;
      }

      // Delete the visit
      const { error } = await supabase
        .from('user_visits')
        .delete()
        .eq('id', visitId);

      if (error) {
        console.error('Error deleting visit:', error);
        throw error;
      }

      // If it was a package visit, update the package remaining visits
      if (visitData.visit_type === 'package' || visitData.visit_type === 'qr_scan' || visitData.visit_type === 'manual') {
        const { data: currentPackage, error: packageError } = await supabase
          .from('visit_packages')
          .select('remaining_visits')
          .eq('user_id', visitData.user_id)
          .eq('status', 'active')
          .maybeSingle();

        if (!packageError && currentPackage) {
          const { error: updateError } = await supabase
            .from('visit_packages')
            .update({ remaining_visits: currentPackage.remaining_visits + 1 })
            .eq('user_id', visitData.user_id)
            .eq('status', 'active');

          if (updateError) {
            console.error('Error updating package:', updateError);
          }
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Η επίσκεψη διαγράφηκε επιτυχώς!"
      });
      
      fetchData();
      
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα διαγραφής επίσκεψης"
      });
    }
  };

  const deletePackage = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('visit_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το πακέτο επισκέψεων διαγράφηκε επιτυχώς!"
      });
      
      fetchData();
      
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα διαγραφής πακέτου"
      });
    }
  };

  const editPackage = (pkg: VisitPackage) => {
    setEditingPackage(pkg);
    setPackageVisits(pkg.total_visits.toString());
    setPackageExpiryDate(pkg.expiry_date || '');
    setShowEditPackageForm(true);
  };

  const updatePackage = async () => {
    if (!editingPackage || !packageVisits) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_packages')
        .update({
          total_visits: parseInt(packageVisits),
          expiry_date: packageExpiryDate || null
        })
        .eq('id', editingPackage.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το πακέτο επισκέψεων ενημερώθηκε επιτυχώς!"
      });
      
      setShowEditPackageForm(false);
      setEditingPackage(null);
      setPackageVisits('');
      setPackageExpiryDate('');
      fetchData();
      
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα ενημέρωσης πακέτου"
      });
    }
  };

  const viewPackageVisits = async (pkg: VisitPackage) => {
    try {
      // Get visits that belong to this specific package by date range and visit type
      const { data: visitsData, error } = await supabase
        .from('user_visits')
        .select(`
          id,
          user_id,
          visit_date,
          visit_time,
          visit_type,
          notes,
          created_at,
          app_users!fk_user_visits_user_id (name, email)
        `)
        .eq('user_id', pkg.user_id)
        .gte('created_at', pkg.purchase_date)
        .in('visit_type', ['package', 'qr_scan', 'manual'])
        .order('created_at', { ascending: false })
        .limit(pkg.total_visits - pkg.remaining_visits); // Only show used visits

      if (error) throw error;

      setSelectedPackageVisits(visitsData || []);
      setShowViewVisitsModal(true);
      
    } catch (error) {
      console.error('Error fetching package visits:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα φόρτωσης επισκέψεων"
      });
    }
  };

  const addVisitToPackage = async (packageId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('record_visit', {
        p_user_id: userId,
        p_visit_type: 'package',
        p_notes: 'Προσθήκη από πακέτο επισκέψεων'
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η επίσκεψη προστέθηκε επιτυχώς!"
      });
      
      fetchData();
      
    } catch (error) {
      console.error('Error adding visit to package:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα προσθήκης επίσκεψης"
      });
    }
  };

  const removeVisitFromPackage = async (userId: string) => {
    try {
      // Find the latest visit for this user
      const { data: latestVisit, error: fetchError } = await supabase
        .from('user_visits')
        .select('id, user_id, visit_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching latest visit:', fetchError);
        throw fetchError;
      }

      if (!latestVisit) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν βρέθηκε επίσκεψη για διαγραφή"
        });
        return;
      }

      // Delete the latest visit from the history
      const { error } = await supabase
        .from('user_visits')
        .delete()
        .eq('id', latestVisit.id);

      if (error) {
        console.error('Error deleting visit:', error);
        throw error;
      }

      // Update package visits - manually increment remaining visits
      const { data: currentPackage, error: fetchPackageError } = await supabase
        .from('visit_packages')
        .select('remaining_visits')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchPackageError) {
        console.error('Error fetching package:', fetchPackageError);
        throw fetchPackageError;
      }

      if (!currentPackage) {
        console.log('No active package found for user');
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν βρέθηκε ενεργό πακέτο για τον χρήστη"
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('visit_packages')
        .update({ remaining_visits: currentPackage.remaining_visits + 1 })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error updating package:', updateError);
        throw updateError;
      }

      toast({
        title: "Επιτυχία",
        description: "Η επίσκεψη αφαιρέθηκε επιτυχώς από το ιστορικό!"
      });
      
      fetchData();
      
    } catch (error) {
      console.error('Error removing visit from package:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα αφαίρεσης επίσκεψης"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    matchesSearchTerm(user.name, searchTerm) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVisits = visits.filter(visit =>
    matchesSearchTerm(visit.app_users.name, searchTerm)
  );

  if (loading) {
    return <div className="p-6 text-center">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab('packages')}
          variant={activeTab === 'packages' ? 'default' : 'outline'}
          className="rounded-none text-xs sm:text-sm"
        >
          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Πακέτα Επισκέψεων</span>
          <span className="sm:hidden">Πακέτα</span>
        </Button>
        <Button
          onClick={() => setActiveTab('manual')}
          variant={activeTab === 'manual' ? 'default' : 'outline'}
          className="rounded-none text-xs sm:text-sm"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Χειροκίνητη Καταγραφή</span>
          <span className="sm:hidden">Χειροκίνητη</span>
        </Button>
        <Button
          onClick={() => setActiveTab('scanner')}
          variant={activeTab === 'scanner' ? 'default' : 'outline'}
          className="rounded-none text-xs sm:text-sm"
        >
          <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">QR Scanner</span>
          <span className="sm:hidden">Scanner</span>
        </Button>
        <Button
          onClick={() => setActiveTab('history')}
          variant={activeTab === 'history' ? 'default' : 'outline'}
          className="rounded-none text-xs sm:text-sm"
        >
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Ιστορικό</span>
          <span className="sm:hidden">Ιστορικό</span>
        </Button>
      </div>

      {/* QR Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <QRScanner onScanSuccess={fetchData} />
          
          {/* Users with QR Codes */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>QR Codes Χρηστών</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-none"
                />
                
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-none">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Button
                        onClick={() => setSelectedUserForQR(user)}
                        size="sm"
                        className="rounded-none"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Modal */}
          {selectedUserForQR && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-none max-w-sm w-full mx-4">
                <UserQRCode user={selectedUserForQR} />
                <Button
                  onClick={() => setSelectedUserForQR(null)}
                  className="w-full mt-4 rounded-none"
                  variant="outline"
                >
                  Κλείσιμο
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Recording Tab */}
      {activeTab === 'manual' && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Χειροκίνητη Καταγραφή Παρουσίας</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Επιλογή Χρήστη</label>
              <Input
                placeholder="Αναζήτηση χρήστη..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none mb-2"
              />
              <div className="max-h-40 overflow-y-auto border rounded-none">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedUser === user.id ? 'bg-[#00ffba]/10 border-l-4 border-[#00ffba]' : ''
                    }`}
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Σημειώσεις (Προαιρετικό)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Προσθέστε σημειώσεις για την παρουσία..."
                className="rounded-none"
              />
            </div>
            
            <Button
              onClick={recordManualVisit}
              disabled={!selectedUser}
              className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Καταγραφή Παρουσίας
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visit Packages Tab */}
      {activeTab === 'packages' && (
        <Card className="rounded-none">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">Πακέτα Επισκέψεων</CardTitle>
            <Button
              onClick={() => setShowAddPackageForm(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Προσθήκη Πακέτου
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-4">
              {visitPackages.map((pkg) => {
                const usedVisits = pkg.total_visits - pkg.remaining_visits;
                return (
                  <div key={pkg.id} className="border rounded-none p-3 sm:p-4">
                    {/* Mobile & Tablet Layout */}
                    <div className="block lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm md:text-base">{pkg.app_users.name}</h4>
                          <p className="text-xs md:text-sm text-gray-600">{pkg.app_users.email}</p>
                        </div>
                        <Badge 
                          variant={pkg.status === 'active' ? 'default' : 'secondary'}
                          className="rounded-none text-xs"
                        >
                          {pkg.status === 'active' ? 'Ενεργό' : 
                           pkg.status === 'used' ? 'Εξαντλημένο' : 'Λήξη'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                        <div>
                          <span className="font-medium text-[#00ffba]">
                            {usedVisits}/{pkg.total_visits} επισκέψεις
                          </span>
                        </div>
                        <div>
                          <span>Υπόλοιπο: {pkg.remaining_visits}</span>
                        </div>
                        <div>
                          <span>Αγορά: {new Date(pkg.purchase_date).toLocaleDateString('el-GR')}</span>
                        </div>
                        {pkg.expiry_date && (
                          <div>
                            <span className="text-orange-600">
                              Λήξη: {new Date(pkg.expiry_date).toLocaleDateString('el-GR')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Visit Control Section Mobile */}
                      <div className="flex items-center justify-center gap-2 bg-gray-50 p-2 rounded-none">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none w-7 h-7 p-0"
                          onClick={() => removeVisitFromPackage(pkg.user_id)}
                          disabled={usedVisits === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-xs md:text-sm font-medium px-2">
                          {usedVisits}/{pkg.total_visits}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none w-7 h-7 p-0"
                          onClick={() => addVisitToPackage(pkg.id, pkg.user_id)}
                          disabled={pkg.remaining_visits === 0}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Action Buttons Mobile */}
                      <div className="flex items-center justify-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none h-7 w-7 p-0"
                          onClick={() => viewPackageVisits(pkg)}
                          title="Προβολή επισκέψεων"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none h-7 w-7 p-0"
                          onClick={() => editPackage(pkg)}
                          title="Επεξεργασία πακέτου"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => deletePackage(pkg.id)}
                          title="Διαγραφή πακέτου"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{pkg.app_users.name}</h4>
                        <p className="text-sm text-gray-600">{pkg.app_users.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="font-medium text-[#00ffba]">
                            {usedVisits}/{pkg.total_visits} επισκέψεις
                          </span>
                          <span>Υπόλοιπο: {pkg.remaining_visits}</span>
                          <span>Αγορά: {new Date(pkg.purchase_date).toLocaleDateString('el-GR')}</span>
                        </div>
                        {pkg.expiry_date && (
                          <p className="text-sm text-orange-600">
                            Λήξη: {new Date(pkg.expiry_date).toLocaleDateString('el-GR')}
                          </p>
                        )}
                      </div>
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                           <Badge 
                             variant={pkg.status === 'active' ? 'default' : 'secondary'}
                             className="rounded-none"
                           >
                             {pkg.status === 'active' ? 'Ενεργό' : 
                              pkg.status === 'used' ? 'Εξαντλημένο' : 'Λήξη'}
                           </Badge>
                         </div>
                         
                         {/* Visit Control Section */}
                         <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-none">
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-none w-8 h-8 p-0"
                             onClick={() => removeVisitFromPackage(pkg.user_id)}
                             disabled={usedVisits === 0}
                           >
                             <Minus className="h-3 w-3" />
                           </Button>
                           
                           <span className="text-sm font-medium px-2">
                             {usedVisits}/{pkg.total_visits} επισκέψεις
                           </span>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-none w-8 h-8 p-0"
                             onClick={() => addVisitToPackage(pkg.id, pkg.user_id)}
                             disabled={pkg.remaining_visits === 0}
                           >
                             <Plus className="h-3 w-3" />
                           </Button>
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex items-center gap-1">
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-none p-1"
                             onClick={() => viewPackageVisits(pkg)}
                             title="Προβολή επισκέψεων"
                           >
                             <Eye className="h-3 w-3" />
                           </Button>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-none p-1"
                             onClick={() => editPackage(pkg)}
                             title="Επεξεργασία πακέτου"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             className="rounded-none p-1 text-red-600 hover:bg-red-50"
                             onClick={() => deletePackage(pkg.id)}
                             title="Διαγραφή πακέτου"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                    </div>
                  </div>
                );
              })}
              {visitPackages.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Δεν υπάρχουν πακέτα επισκέψεων
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Package Form Modal */}
      {showAddPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-none max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Προσθήκη Πακέτου Επισκέψεων</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Επιλογή Χρήστη</label>
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-none mb-2"
                />
                <div className="max-h-40 overflow-y-auto border rounded-none">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedUser === user.id ? 'bg-[#00ffba]/10 border-l-4 border-[#00ffba]' : ''
                      }`}
                    >
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Αριθμός Επισκέψεων</label>
                <Input
                  type="number"
                  placeholder="π.χ. 10"
                  value={packageVisits}
                  onChange={(e) => setPackageVisits(e.target.value)}
                  className="rounded-none"
                />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Ποσό (€)</label>
                 <Input
                   type="number"
                   placeholder="π.χ. 50 (μπορεί να είναι 0)"
                   value={packagePrice}
                   onChange={(e) => setPackagePrice(e.target.value)}
                   className="rounded-none"
                   min="0"
                   step="0.01"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Ημερομηνία Λήξης (Προαιρετικό)</label>
                 <Input
                   type="date"
                   value={packageExpiryDate}
                   onChange={(e) => setPackageExpiryDate(e.target.value)}
                   className="rounded-none"
                 />
               </div>

              <div>
                <label className="block text-sm font-medium mb-2">Τμήματα Πρόσβασης</label>
                <div className="border rounded-none p-3 max-h-32 overflow-y-auto space-y-2">
                  {bookingSections.map((section) => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSections([...selectedSections, section.id]);
                          } else {
                            setSelectedSections(selectedSections.filter(id => id !== section.id));
                          }
                        }}
                      />
                      <label htmlFor={section.id} className="text-sm cursor-pointer flex-1">
                        {section.name}
                        {section.description && (
                          <span className="text-gray-500 ml-2">({section.description})</span>
                        )}
                      </label>
                    </div>
                  ))}
                  {selectedSections.length === 0 && (
                    <p className="text-sm text-gray-500">Αν δεν επιλέξεις τμήματα, θα έχει πρόσβαση σε όλα</p>
                  )}
                </div>
              </div>
              
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowAddPackageForm(false);
                    setSelectedUser('');
                    setPackageVisits('');
                    setPackageExpiryDate('');
                    setPackagePrice('');
                    setSelectedSections([]);
                    setSearchTerm('');
                  }}
                  variant="outline"
                  className="flex-1 rounded-none"
                >
                  Ακύρωση
                </Button>
                <Button
                  onClick={addVisitPackage}
                  disabled={!selectedUser || !packageVisits}
                  className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  Προσθήκη
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visit History Tab */}
      {activeTab === 'history' && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Ιστορικό Παρουσιών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Αναζήτηση χρήστη..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none"
              />
              
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="border rounded-none overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 text-sm font-medium border-b">
                    <div>Χρήστης</div>
                    <div>Ημερομηνία</div>
                    <div>Ώρα</div>
                    <div>Τύπος</div>
                    <div>Σημειώσεις</div>
                    <div>Ενέργειες</div>
                  </div>
                  {filteredVisits.map((visit) => (
                    <div key={visit.id} className="grid grid-cols-6 gap-4 p-3 border-b last:border-b-0 items-center">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{visit.app_users.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(`${visit.visit_date}T${visit.visit_time}`).toLocaleString('el-GR', {
                          timeZone: 'Europe/Athens',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <Badge 
                          variant={visit.visit_type === 'qr_scan' ? 'default' : 'outline'}
                          className="rounded-none text-xs"
                        >
                          {visit.visit_type === 'qr_scan' ? 'QR Scan' : 'Χειροκίνητη'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {visit.notes || '-'}
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                          onClick={() => deleteVisit(visit.id)}
                        >
                          Διαγραφή
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredVisits.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      Δεν υπάρχουν παρουσίες
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-3">
                {filteredVisits.map((visit) => (
                  <div key={visit.id} className="border rounded-none p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2 text-base md:text-lg">
                          <User className="h-4 w-4 md:h-5 md:w-5" />
                          {visit.app_users.name}
                        </h4>
                        <Badge 
                          variant={visit.visit_type === 'qr_scan' ? 'default' : 'outline'}
                          className="rounded-none text-xs md:text-sm"
                        >
                          {visit.visit_type === 'qr_scan' ? 'QR Scan' : 'Χειροκίνητη'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base text-gray-600">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 flex-shrink-0" />
                          {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          {new Date(`${visit.visit_date}T${visit.visit_time}`).toLocaleString('el-GR', {
                            timeZone: 'Europe/Athens',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {visit.notes && (
                        <p className="text-sm md:text-base text-gray-600 bg-gray-50 p-2 rounded-none">
                          {visit.notes}
                        </p>
                      )}
                      
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none text-red-600 hover:bg-red-50 w-full sm:w-auto text-sm md:text-base"
                          onClick={() => deleteVisit(visit.id)}
                        >
                          Διαγραφή
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredVisits.length === 0 && (
                  <p className="text-center text-gray-500 py-8 text-base md:text-lg">
                    Δεν υπάρχουν παρουσίες
                  </p>
                )}
              </div>
            </div>
          </CardContent>
         </Card>
       )}

       {/* Edit Package Form Modal */}
       {showEditPackageForm && editingPackage && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-none max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold mb-4">Επεξεργασία Πακέτου Επισκέψεων</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium mb-2">Χρήστης</label>
                 <Input
                   value={editingPackage.app_users.name}
                   disabled
                   className="rounded-none bg-gray-100"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Αριθμός Επισκέψεων</label>
                 <Input
                   type="number"
                   placeholder="π.χ. 10"
                   value={packageVisits}
                   onChange={(e) => setPackageVisits(e.target.value)}
                   className="rounded-none"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-2">Ημερομηνία Λήξης (Προαιρετικό)</label>
                 <Input
                   type="date"
                   value={packageExpiryDate}
                   onChange={(e) => setPackageExpiryDate(e.target.value)}
                   className="rounded-none"
                 />
               </div>
               
               <div className="flex gap-2">
                 <Button
                   onClick={() => {
                     setShowEditPackageForm(false);
                     setEditingPackage(null);
                     setPackageVisits('');
                     setPackageExpiryDate('');
                   }}
                   variant="outline"
                   className="flex-1 rounded-none"
                 >
                   Ακύρωση
                 </Button>
                 <Button
                   onClick={updatePackage}
                   disabled={!packageVisits}
                   className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                 >
                   Ενημέρωση
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* View Package Visits Modal */}
       {showViewVisitsModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-none max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">Επισκέψεις Πακέτου</h3>
               <Button
                 onClick={() => {
                   setShowViewVisitsModal(false);
                   setSelectedPackageVisits([]);
                 }}
                 variant="outline"
                 size="sm"
                 className="rounded-none"
               >
                 Κλείσιμο
               </Button>
             </div>
             
             <div className="space-y-3 overflow-y-auto max-h-96">
               {selectedPackageVisits.map((visit) => (
                 <div key={visit.id} className="border rounded-none p-3">
                   <div className="flex justify-between items-start">
                     <div className="flex-1">
                       <h4 className="font-medium flex items-center gap-2">
                         <User className="h-4 w-4" />
                         {visit.app_users.name}
                       </h4>
                       <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                         <span className="flex items-center gap-1">
                           <CalendarDays className="h-3 w-3" />
                           {new Date(visit.visit_date).toLocaleDateString('el-GR')}
                         </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(`${visit.visit_date}T${visit.visit_time}`).toLocaleString('el-GR', {
                              timeZone: 'Europe/Athens',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                       </div>
                       {visit.notes && (
                         <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge 
                         variant={visit.visit_type === 'qr_scan' ? 'default' : 'outline'}
                         className="rounded-none"
                       >
                         {visit.visit_type === 'qr_scan' ? 'QR Scan' : 
                          visit.visit_type === 'package' ? 'Πακέτο' : 'Χειροκίνητη'}
                       </Badge>
                       <Button
                         variant="outline"
                         size="sm"
                         className="rounded-none text-red-600 hover:bg-red-50 p-1"
                         onClick={() => deleteVisit(visit.id)}
                         title="Διαγραφή επίσκεψης"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                   </div>
                 </div>
               ))}
               {selectedPackageVisits.length === 0 && (
                 <p className="text-center text-gray-500 py-8">
                   Δεν υπάρχουν επισκέψεις για αυτό το πακέτο
                 </p>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };
