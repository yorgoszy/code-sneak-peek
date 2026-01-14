import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Search, Calendar, MapPin, ShoppingCart, Video, Dumbbell, UserCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesSearchTerm } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: any;
  is_active: boolean;
  subscription_mode: 'time_based' | 'visit_based' | 'videocall' | 'program';
  visit_count?: number;
  visit_expiry_months?: number;
  available_in_shop?: boolean;
  single_purchase?: boolean;
  allowed_sections?: string[];
  program_id?: string;
  coach_shop_only?: boolean;
}

interface BookingSection {
  id: string;
  name: string;
  description?: string;
}

interface DraftProgram {
  id: string;
  name: string;
  description?: string;
  weeks_count?: number;
  days_per_week?: number;
}

export const SubscriptionTypeManager: React.FC = () => {
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [filteredSubscriptionTypes, setFilteredSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [bookingSections, setBookingSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SubscriptionType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<SubscriptionType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [features, setFeatures] = useState('');
  const [subscriptionMode, setSubscriptionMode] = useState<'time_based' | 'visit_based' | 'videocall' | 'program'>('time_based');
  const [visitCount, setVisitCount] = useState('');
  const [visitExpiryMonths, setVisitExpiryMonths] = useState('');
  const [singlePurchase, setSinglePurchase] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [draftPrograms, setDraftPrograms] = useState<DraftProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadSubscriptionTypes();
      loadBookingSections();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading, isAdmin]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSubscriptionTypes(subscriptionTypes);
    } else {
      const filtered = subscriptionTypes.filter(type =>
        matchesSearchTerm(type.name, searchTerm) ||
        (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSubscriptionTypes(filtered);
    }
  }, [searchTerm, subscriptionTypes]);

  const checkUserRole = async () => {
    try {
      console.log('🔍 Checking user role...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      console.log('👤 Authenticated user:', user.id);

      // Check if user is admin in app_users table
      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error checking user role:', error);
        setIsAdmin(false);
      } else {
        console.log('✅ User role:', appUser?.role);
        setIsAdmin(appUser?.role === 'admin');
      }
    } catch (error) {
      console.error('💥 Error in checkUserRole:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadSubscriptionTypes = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading subscription types...');
      // Only load subscription types without coach_id (admin/global types)
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, features, is_active, subscription_mode, visit_count, visit_expiry_months, available_in_shop, single_purchase, allowed_sections, coach_shop_only')
        .is('coach_id', null)
        .order('price');

      if (error) {
        console.error('❌ Error loading subscription types:', error);
        throw error;
      }
      
      console.log('✅ Loaded subscription types:', data);
      const typedData = (data || []).map(item => ({
        ...item,
        subscription_mode: (item.subscription_mode || 'time_based') as 'time_based' | 'visit_based' | 'videocall' | 'program',
        available_in_shop: item.available_in_shop || false,
        single_purchase: item.single_purchase || false,
        coach_shop_only: item.coach_shop_only || false
      })) as SubscriptionType[];
      setSubscriptionTypes(typedData);
      setFilteredSubscriptionTypes(typedData);
    } catch (error) {
      console.error('💥 Error loading subscription types:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των τύπων συνδρομών');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingSections = async () => {
    try {
      console.log('🔄 Loading booking sections...');
      const { data, error } = await supabase
        .from('booking_sections')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error loading booking sections:', error);
        throw error;
      }
      
      console.log('✅ Loaded booking sections:', data);
      setBookingSections(data || []);
    } catch (error) {
      console.error('💥 Error loading booking sections:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των τμημάτων');
    }
  };

  const loadDraftPrograms = async () => {
    try {
      console.log('🔄 Loading draft programs...');
      
      // Απλό query για προγράμματα πρώτα
      const { data: programs, error } = await supabase
        .from('programs')
        .select('id, name, description')
        .order('name');

      if (error) {
        console.error('❌ Error loading programs:', error);
        throw error;
      }

      console.log('📊 Raw programs data:', programs);

      // Φόρτωση assignments ξεχωριστά
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('program_id');

      if (assignmentsError) {
        console.error('❌ Error loading assignments:', assignmentsError);
        throw assignmentsError;
      }

      const assignedProgramIds = new Set(assignments?.map(a => a.program_id) || []);
      
      // Filter για draft προγράμματα (χωρίς assignments)
      const unassignedPrograms = (programs || [])
        .filter(program => !assignedProgramIds.has(program.id));

      // Τώρα φόρτωση weeks/days για κάθε unassigned πρόγραμμα ξεχωριστά
      const draftPrograms = await Promise.all(
        unassignedPrograms.map(async (program) => {
          try {
            // Πρώτα φόρτωση των εβδομάδων
            const { data: weeks, error: weeksError } = await supabase
              .from('program_weeks')
              .select('id, week_number')
              .eq('program_id', program.id);

            if (weeksError) {
              console.warn(`⚠️ Error loading weeks for program ${program.name}:`, weeksError);
              console.log('📊 Full error details:', JSON.stringify(weeksError, null, 2));
              return {
                id: program.id,
                name: program.name,
                description: program.description,
                weeks_count: 0,
                days_per_week: 0
              };
            }

            console.log(`📊 Raw weeks data for program ${program.name}:`, weeks);

            const weeksCount = weeks?.length || 0;
            let maxDaysPerWeek = 0;
            
            if (weeks && weeks.length > 0) {
              // Για κάθε εβδομάδα, φόρτωση των ημερών ξεχωριστά
              for (const week of weeks) {
                const { data: days, error: daysError } = await supabase
                  .from('program_days')
                  .select('id, day_number')
                  .eq('week_id', week.id);

                if (daysError) {
                  console.warn(`⚠️ Error loading days for week ${week.week_number}:`, daysError);
                  continue;
                }

                const daysCount = days?.length || 0;
                console.log(`  📅 Week ${week.week_number}: ${daysCount} days`, days);
                
                if (daysCount > maxDaysPerWeek) {
                  maxDaysPerWeek = daysCount;
                }
              }
            }
            
            console.log(`📈 Program "${program.name}": ${weeksCount} weeks, ${maxDaysPerWeek} max days/week`);
            
            return {
              id: program.id,
              name: program.name,
              description: program.description,
              weeks_count: weeksCount,
              days_per_week: maxDaysPerWeek
            };
          } catch (error) {
            console.warn(`⚠️ Error processing program ${program.name}:`, error);
            return {
              id: program.id,
              name: program.name,
              description: program.description,
              weeks_count: 0,
              days_per_week: 0
            };
          }
        })
      );
      
      console.log('✅ Loaded draft programs with stats:', draftPrograms);
      setDraftPrograms(draftPrograms);
    } catch (error) {
      console.error('💥 Error loading draft programs:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προγραμμάτων');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationMonths('');
    setFeatures('');
    setSubscriptionMode('time_based');
    setVisitCount('');
    setVisitExpiryMonths('');
    setSinglePurchase(false);
    setSelectedSections([]);
    setSelectedProgram('');
    setEditingType(null);
  };

  const openCreateDialog = () => {
    console.log('📝 Opening create dialog');
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: SubscriptionType) => {
    console.log('✏️ Opening edit dialog for:', type);
    setEditingType(type);
    setName(type.name);
    setDescription(type.description || '');
    setPrice(type.price.toString());
    setDurationMonths(type.duration_months.toString());
    setFeatures(type.features ? JSON.stringify(type.features, null, 2) : '{}');
    setSubscriptionMode(type.subscription_mode || 'time_based');
    setVisitCount(type.visit_count?.toString() || '');
    setVisitExpiryMonths(type.visit_expiry_months?.toString() || '');
    setSinglePurchase(type.single_purchase || false);
    setSelectedSections(type.allowed_sections || []);
    setSelectedProgram(type.program_id || '');
    
    // Φόρτωση προγραμμάτων αν ο τύπος είναι program
    if (type.subscription_mode === 'program') {
      loadDraftPrograms();
    }
    
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    if (!name.trim() || !price) {
      toast.error('Συμπληρώστε όλα τα απαιτούμενα πεδία (Όνομα, Τιμή)');
      return;
    }

    // Validation για time_based subscriptions
    if (subscriptionMode === 'time_based' && !durationMonths) {
      toast.error('Η διάρκεια είναι απαραίτητη για χρονικές συνδρομές');
      return;
    }

    // Validation για visit_based subscriptions
    if (subscriptionMode === 'visit_based' && !visitCount) {
      toast.error('Ο αριθμός επισκέψεων είναι απαραίτητος για συνδρομές επισκέψεων');
      return;
    }

    // Validation για videocall subscriptions
    if (subscriptionMode === 'videocall' && !visitCount) {
      toast.error('Ο αριθμός κλήσεων είναι απαραίτητος για videocall συνδρομές');
      return;
    }

    // Validation για program subscriptions
    if (subscriptionMode === 'program' && !selectedProgram) {
      toast.error('Η επιλογή προγράμματος είναι απαραίτητη για συνδρομές προγράμματος');
      return;
    }

    const numericPrice = parseFloat(price);
    const numericDuration = durationMonths ? parseInt(durationMonths) : 0;
    const numericVisitCount = visitCount ? parseInt(visitCount) : null;
    const numericVisitExpiryMonths = visitExpiryMonths ? parseInt(visitExpiryMonths) : null;

    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Η τιμή πρέπει να είναι θετικός αριθμός');
      return;
    }

    if (subscriptionMode === 'time_based' && (isNaN(numericDuration) || numericDuration <= 0)) {
      toast.error('Η διάρκεια πρέπει να είναι θετικός αριθμός');
      return;
    }

    if (subscriptionMode === 'visit_based') {
      if (!numericVisitCount || numericVisitCount <= 0) {
        toast.error('Ο αριθμός επισκέψεων πρέπει να είναι θετικός αριθμός');
        return;
      }
      if (numericVisitExpiryMonths && numericVisitExpiryMonths <= 0) {
        toast.error('Η διάρκεια λήξης πρέπει να είναι θετικός αριθμός');
        return;
      }
    }

    if (subscriptionMode === 'videocall') {
      if (!numericVisitCount || numericVisitCount <= 0) {
        toast.error('Ο αριθμός κλήσεων πρέπει να είναι θετικός αριθμός');
        return;
      }
      if (numericVisitExpiryMonths && numericVisitExpiryMonths <= 0) {
        toast.error('Η διάρκεια λήξης πρέπει να είναι θετικός αριθμός');
        return;
      }
    }

    setSaving(true);
    try {
      let parsedFeatures = {};
      if (features.trim()) {
        try {
          parsedFeatures = JSON.parse(features);
        } catch (jsonError) {
          console.error('❌ Invalid JSON in features:', jsonError);
          toast.error('Μη έγκυρο JSON format στα χαρακτηριστικά');
          setSaving(false);
          return;
        }
      }

      const typeData = {
        name: name.trim(),
        description: description.trim() || null,
        price: numericPrice,
        duration_months: numericDuration,
        features: parsedFeatures,
        is_active: true,
        subscription_mode: subscriptionMode,
        visit_count: (subscriptionMode === 'visit_based' || subscriptionMode === 'videocall') ? numericVisitCount : null,
        visit_expiry_months: (subscriptionMode === 'visit_based' || subscriptionMode === 'videocall') ? numericVisitExpiryMonths : null,
        single_purchase: singlePurchase,
        allowed_sections: selectedSections.length > 0 ? selectedSections : null,
        program_id: subscriptionMode === 'program' ? selectedProgram : null
      };

      console.log('💾 Saving subscription type:', typeData);

      if (editingType) {
        // Update existing
        console.log('✏️ Updating subscription type:', editingType.id);
        const { error } = await supabase
          .from('subscription_types')
          .update(typeData)
          .eq('id', editingType.id);

        if (error) {
          console.error('❌ Error updating subscription type:', error);
          throw error;
        }
        
        console.log('✅ Subscription type updated successfully');
        toast.success('Ο τύπος συνδρομής ενημερώθηκε επιτυχώς!');
      } else {
        // Create new
        console.log('➕ Creating new subscription type');
        const { error } = await supabase
          .from('subscription_types')
          .insert(typeData);

        if (error) {
          console.error('❌ Error creating subscription type:', error);
          throw error;
        }
        
        console.log('✅ Subscription type created successfully');
        toast.success('Ο τύπος συνδρομής δημιουργήθηκε επιτυχώς!');
      }

      closeDialog();
      await loadSubscriptionTypes();
    } catch (error) {
      console.error('💥 Error saving subscription type:', error);
      toast.error('Σφάλμα κατά την αποθήκευση: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (type: SubscriptionType) => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    try {
      console.log('🔄 Toggling active status for:', type.name, 'Current:', type.is_active);
      
      const { error } = await supabase
        .from('subscription_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) {
        console.error('❌ Error toggling subscription type:', error);
        throw error;
      }
      
      console.log('✅ Active status toggled successfully');
      toast.success(`Ο τύπος συνδρομής ${!type.is_active ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`);
      await loadSubscriptionTypes();
    } catch (error) {
      console.error('💥 Error toggling subscription type:', error);
      toast.error('Σφάλμα κατά την ενημέρωση: ' + (error as Error).message);
    }
  };

  const toggleAvailableInShop = async (type: SubscriptionType) => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    try {
      console.log('🔄 Toggling shop availability for:', type.name, 'Current:', type.available_in_shop);
      
      const { error } = await supabase
        .from('subscription_types')
        .update({ available_in_shop: !type.available_in_shop } as any)
        .eq('id', type.id);

      if (error) {
        console.error('❌ Error toggling shop availability:', error);
        throw error;
      }
      
      console.log('✅ Shop availability toggled successfully');
      toast.success(`Ο τύπος συνδρομής ${!type.available_in_shop ? 'προστέθηκε στο' : 'αφαιρέθηκε από το'} shop επιτυχώς!`);
      await loadSubscriptionTypes();
    } catch (error) {
      console.error('💥 Error toggling shop availability:', error);
      toast.error('Σφάλμα κατά την ενημέρωση: ' + (error as Error).message);
    }
  };

  const toggleCoachShopOnly = async (type: SubscriptionType) => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    try {
      console.log('🔄 Toggling coach shop only for:', type.name, 'Current:', type.coach_shop_only);
      
      const { error } = await supabase
        .from('subscription_types')
        .update({ coach_shop_only: !type.coach_shop_only } as any)
        .eq('id', type.id);

      if (error) {
        console.error('❌ Error toggling coach shop only:', error);
        throw error;
      }
      
      console.log('✅ Coach shop only toggled successfully');
      toast.success(`Ο τύπος συνδρομής ${!type.coach_shop_only ? 'ορίστηκε μόνο για Coach Shop' : 'διαθέσιμος σε όλα τα shops'}!`);
      await loadSubscriptionTypes();
    } catch (error) {
      console.error('💥 Error toggling coach shop only:', error);
      toast.error('Σφάλμα κατά την ενημέρωση: ' + (error as Error).message);
    }
  };

  const handleDeleteClick = (type: SubscriptionType) => {
    console.log('🗑️ Opening delete confirmation for:', type.name);
    setTypeToDelete(type);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin || !typeToDelete) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    try {
      console.log('🗑️ Deleting subscription type:', typeToDelete.name);
      
      const { error } = await supabase
        .from('subscription_types')
        .delete()
        .eq('id', typeToDelete.id);

      if (error) {
        console.error('❌ Error deleting subscription type:', error);
        throw error;
      }
      
      console.log('✅ Subscription type deleted successfully');
      toast.success('Ο τύπος συνδρομής διαγράφηκε επιτυχώς!');
      
      setTypeToDelete(null);
      setDeleteConfirmOpen(false);
      await loadSubscriptionTypes();
    } catch (error) {
      console.error('💥 Error deleting subscription type:', error);
      toast.error('Σφάλμα κατά τη διαγραφή: ' + (error as Error).message);
    }
  };

  const handleDeleteCancel = () => {
    setTypeToDelete(null);
    setDeleteConfirmOpen(false);
  };

  if (roleLoading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Ελέγχουμε τα δικαιώματα...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-600">
            <p>Δεν έχετε δικαιώματα διαχειριστή για να δείτε αυτή τη σελίδα.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τους τύπους συνδρομών...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <span className={`${isMobile ? 'text-lg' : 'text-xl'}`}>
              {isMobile ? 'Τύποι Συνδρομών' : 'Διαχείριση Τύπων Συνδρομών'}
            </span>
          </div>
          <Button 
            onClick={openCreateDialog}
            className={`bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none ${isMobile ? 'w-full' : ''}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέος Τύπος
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? "p-3" : "p-6"}>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Αναζήτηση τύπων συνδρομών..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>
        </div>

        {filteredSubscriptionTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <p>Δεν βρέθηκαν τύποι συνδρομών που να ταιριάζουν με "{searchTerm}"</p>
            ) : subscriptionTypes.length === 0 ? (
              <>
                <p>Δεν υπάρχουν τύποι συνδρομών</p>
                <p className="text-sm">Κάντε κλικ στο κουμπί "Νέος Τύπος" για να δημιουργήσετε έναν</p>
              </>
            ) : null}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            {!isMobile && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-none">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Όνομα</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Τύπος</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Τιμή</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Λεπτομέρειες</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Κατάσταση</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptionTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div>
                            <div className="font-semibold">{type.name}</div>
                            {type.description && (
                              <div className="text-sm text-gray-600">{type.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          {type.subscription_mode === 'visit_based' ? (
                            <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              Επισκέψεις
                            </Badge>
                          ) : type.subscription_mode === 'videocall' ? (
                            <Badge variant="outline" className="rounded-none bg-purple-50 text-purple-600">
                              <Video className="w-3 h-3 mr-1" />
                              Videocall
                            </Badge>
                          ) : type.subscription_mode === 'program' ? (
                            <Badge variant="outline" className="rounded-none bg-orange-50 text-orange-600">
                              <Dumbbell className="w-3 h-3 mr-1" />
                              Πρόγραμμα
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-none bg-green-50 text-green-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              Χρονική
                            </Badge>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 font-semibold">€{type.price}</td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="text-sm space-y-1">
                            {type.subscription_mode === 'visit_based' ? (
                              <>
                                <div>{type.visit_count} επισκέψεις</div>
                                <div>{type.visit_expiry_months} μήνες λήξη</div>
                              </>
                            ) : type.subscription_mode === 'videocall' ? (
                              <>
                                <div>{type.visit_count} κλήσεις</div>
                                <div>{type.visit_expiry_months} μήνες λήξη</div>
                              </>
                            ) : type.subscription_mode === 'program' ? (
                              <div>{type.program_id ? draftPrograms.find(p => p.id === type.program_id)?.name || 'Άγνωστο' : 'Δεν έχει οριστεί'}</div>
                            ) : (
                              <div>{type.duration_months} μήνες</div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <Badge className={`rounded-none ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {type.is_active ? 'Ενεργό' : 'Ανενεργό'}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(type)}
                              className="rounded-none p-2"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(type)}
                              className="rounded-none border-red-300 text-red-600 hover:bg-red-50 p-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAvailableInShop(type)}
                              className={`rounded-none p-2 ${
                                type.available_in_shop 
                                  ? 'bg-[#00ffba] text-white border-white hover:bg-[#00ffba]/90' 
                                  : 'text-gray-400 hover:text-gray-600 border-gray-300'
                              }`}
                              title="Διαθέσιμο στο Shop"
                            >
                              <ShoppingCart className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCoachShopOnly(type)}
                              className={`rounded-none p-2 ${
                                type.coach_shop_only 
                                  ? 'bg-[#cb8954] text-white border-white hover:bg-[#cb8954]/90' 
                                  : 'text-gray-400 hover:text-gray-600 border-gray-300'
                              }`}
                              title="Μόνο για Coach Shop"
                            >
                              <UserCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <div className="space-y-3">
                {filteredSubscriptionTypes.map((type) => (
                  <Card key={type.id} className="rounded-none">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{type.name}</h3>
                          {type.description && (
                            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          )}
                        </div>
                        <Badge className={`rounded-none ml-2 ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {type.is_active ? 'Ενεργό' : 'Ανενεργό'}
                        </Badge>
                      </div>

                      {/* Type and Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {type.subscription_mode === 'visit_based' ? (
                            <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              Επισκέψεις
                            </Badge>
                          ) : type.subscription_mode === 'videocall' ? (
                            <Badge variant="outline" className="rounded-none bg-purple-50 text-purple-600">
                              <Video className="w-3 h-3 mr-1" />
                              Videocall
                            </Badge>
                          ) : type.subscription_mode === 'program' ? (
                            <Badge variant="outline" className="rounded-none bg-orange-50 text-orange-600">
                              <Dumbbell className="w-3 h-3 mr-1" />
                              Πρόγραμμα
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-none bg-green-50 text-green-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              Χρονική
                            </Badge>
                          )}
                        </div>
                        <div className="text-xl font-bold text-[#00ffba]">€{type.price}</div>
                      </div>

                      {/* Details */}
                      <div className="text-sm text-gray-600 mb-4">
                        {type.subscription_mode === 'visit_based' ? (
                          <div className="space-y-1">
                            <div><strong>Επισκέψεις:</strong> {type.visit_count}</div>
                            <div><strong>Λήξη σε:</strong> {type.visit_expiry_months} μήνες</div>
                          </div>
                        ) : type.subscription_mode === 'videocall' ? (
                          <div className="space-y-1">
                            <div><strong>Κλήσεις:</strong> {type.visit_count}</div>
                            <div><strong>Λήξη σε:</strong> {type.visit_expiry_months} μήνες</div>
                          </div>
                        ) : type.subscription_mode === 'program' ? (
                          <div><strong>Πρόγραμμα:</strong> {type.program_id ? draftPrograms.find(p => p.id === type.program_id)?.name || 'Άγνωστο' : 'Δεν έχει οριστεί'}</div>
                        ) : (
                          <div><strong>Διάρκεια:</strong> {type.duration_months} μήνες</div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(type)}
                          className="rounded-none flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-2" />
                          Επεξεργασία
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(type)}
                          className="rounded-none border-red-300 text-red-600 hover:bg-red-50 px-3"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAvailableInShop(type)}
                          className={`rounded-none px-3 ${
                            type.available_in_shop 
                              ? 'bg-[#00ffba] text-white border-white hover:bg-[#00ffba]/90' 
                              : 'text-gray-400 hover:text-gray-600 border-gray-300'
                          }`}
                          title="Διαθέσιμο στο Shop"
                        >
                          <ShoppingCart className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCoachShopOnly(type)}
                          className={`rounded-none px-3 ${
                            type.coach_shop_only 
                              ? 'bg-[#cb8954] text-white border-white hover:bg-[#cb8954]/90' 
                              : 'text-gray-400 hover:text-gray-600 border-gray-300'
                          }`}
                          title="Μόνο για Coach Shop"
                        >
                          <UserCircle className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Status Toggle Button */}
                      <Button
                        size="sm"
                        variant={type.is_active ? "destructive" : "default"}
                        onClick={() => toggleActiveStatus(type)}
                        className="rounded-none w-full mt-2"
                      >
                        {type.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open && !saving) {
          closeDialog();
        }
      }}>
        <DialogContent className={`rounded-none max-h-[90vh] overflow-y-auto ${isMobile ? 'max-w-[95vw]' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Επεξεργασία' : 'Δημιουργία'} Τύπου Συνδρομής
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Όνομα*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-none"
                placeholder="π.χ. Premium"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="description">Περιγραφή</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-none"
                placeholder="Περιγραφή του πακέτου..."
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="subscriptionMode">Τύπος Συνδρομής*</Label>
              <Select
                value={subscriptionMode}
                onValueChange={(value: 'time_based' | 'visit_based' | 'videocall' | 'program') => {
                  setSubscriptionMode(value);
                  // Φόρτωση προγραμμάτων όταν επιλέγεται program mode
                  if (value === 'program' && draftPrograms.length === 0) {
                    loadDraftPrograms();
                  }
                }}
                disabled={saving}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_based">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Χρονική Συνδρομή
                    </div>
                  </SelectItem>
                  <SelectItem value="visit_based">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Επισκέψεις
                    </div>
                  </SelectItem>
                  <SelectItem value="videocall">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      VIDEOCALL
                    </div>
                  </SelectItem>
                  <SelectItem value="program">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      Πρόγραμμα
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div>
                <Label htmlFor="price">Τιμή (€)*</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-none"
                  disabled={saving}
                />
              </div>
              {subscriptionMode === 'time_based' ? (
                <div>
                  <Label htmlFor="duration">Διάρκεια (μήνες)*</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="rounded-none"
                    disabled={saving}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="visitCount">
                    {subscriptionMode === 'videocall' ? 'Αριθμός Κλήσεων*' : 'Αριθμός Επισκέψεων*'}
                  </Label>
                  <Input
                    id="visitCount"
                    type="number"
                    min="1"
                    value={visitCount}
                    onChange={(e) => setVisitCount(e.target.value)}
                    className="rounded-none"
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            {(subscriptionMode === 'visit_based' || subscriptionMode === 'videocall') && (
              <div>
                <Label htmlFor="visitExpiryMonths">Διάρκεια Λήξης (μήνες)</Label>
                <Input
                  id="visitExpiryMonths"
                  type="number"
                  min="1"
                  value={visitExpiryMonths}
                  onChange={(e) => setVisitExpiryMonths(e.target.value)}
                  className="rounded-none"
                  placeholder={subscriptionMode === 'videocall' ? "Προαιρετικό - Αφήστε κενό για αόριστη διάρκεια" : "Προαιρετικό - Αφήστε κενό για αόριστη διάρκεια"}
                  disabled={saving}
                />
              </div>
            )}

            {subscriptionMode === 'program' && (
              <div>
                <Label htmlFor="programSelect">Επιλογή Προγράμματος*</Label>
                <Select
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                  disabled={saving}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε πρόγραμμα" />
                  </SelectTrigger>
                   <SelectContent>
                     {draftPrograms.map((program) => (
                       <SelectItem key={program.id} value={program.id}>
                         <div>
                           <div className="font-medium">{program.name}</div>
                           <div className="text-xs text-gray-500 flex items-center gap-2">
                             {program.description && (
                               <span>{program.description}</span>
                             )}
                             <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">
                               {program.weeks_count || 0} εβδομάδες · {program.days_per_week || 0} ημέρες/εβδομάδα
                             </span>
                           </div>
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-gray-500 mt-1">
                   Εμφανίζονται μόνο τα draft προγράμματα (χωρίς αναθέσεις)
                 </p>
              </div>
            )}
            <div>
              <Label htmlFor="features">Χαρακτηριστικά (JSON)</Label>
              <Textarea
                id="features"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="rounded-none font-mono text-xs"
                placeholder='{"ai_access": true, "max_conversations": 100}'
                rows={4}
                disabled={saving}
              />
            </div>
            
            {/* Booking Sections Selection */}
            <div>
              <Label htmlFor="bookingSections">Τμήματα (προαιρετικό)</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-none p-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="allSections"
                    type="checkbox"
                    checked={selectedSections.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSections([]);
                      }
                    }}
                    className="h-4 w-4 text-[#00ffba] focus:ring-[#00ffba] border-gray-300 rounded"
                    disabled={saving}
                  />
                  <Label htmlFor="allSections" className="text-sm font-medium">
                    Όλα τα τμήματα (προεπιλογή)
                  </Label>
                </div>
                {bookingSections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <input
                      id={`section-${section.id}`}
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections([...selectedSections, section.id]);
                        } else {
                          setSelectedSections(selectedSections.filter(id => id !== section.id));
                        }
                      }}
                      className="h-4 w-4 text-[#00ffba] focus:ring-[#00ffba] border-gray-300 rounded"
                      disabled={saving}
                    />
                    <Label htmlFor={`section-${section.id}`} className="text-sm">
                      {section.name}
                      {section.description && (
                        <span className="text-gray-500 ml-1">- {section.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Αν δεν επιλέξετε κανένα τμήμα, η συνδρομή θα ισχύει για όλα τα τμήματα
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="singlePurchase"
                type="checkbox"
                checked={singlePurchase}
                onChange={(e) => setSinglePurchase(e.target.checked)}
                className="h-4 w-4 text-[#00ffba] focus:ring-[#00ffba] border-gray-300 rounded"
                disabled={saving}
              />
              <Label htmlFor="singlePurchase" className="text-sm">
                Μονή Αγορά (π.χ. videocall session)
              </Label>
            </div>
            
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <Button 
                onClick={handleSave} 
                className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Αποθήκευση...
                  </>
                ) : (
                  editingType ? 'Ενημέρωση' : 'Δημιουργία'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={closeDialog}
                className={`rounded-none ${isMobile ? '' : 'flex-1'}`}
                disabled={saving}
              >
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Διαγραφή Τύπου Συνδρομής"
        description={`Είστε σίγουροι ότι θέλετε να διαγράψετε τον τύπο συνδρομής "${typeToDelete?.name}"; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.`}
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
      />
    </Card>
  );
};
