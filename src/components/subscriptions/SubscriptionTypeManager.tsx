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
import { Plus, Edit2, Trash2, Search, Calendar, MapPin, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesSearchTerm } from "@/lib/utils";

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
  available_in_shop?: boolean;
}

export const SubscriptionTypeManager: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [filteredSubscriptionTypes, setFilteredSubscriptionTypes] = useState<SubscriptionType[]>([]);
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
  const [subscriptionMode, setSubscriptionMode] = useState<'time_based' | 'visit_based'>('time_based');
  const [visitCount, setVisitCount] = useState('');
  const [visitExpiryMonths, setVisitExpiryMonths] = useState('');

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadSubscriptionTypes();
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
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, features, is_active, subscription_mode, visit_count, visit_expiry_months, available_in_shop')
        .order('price');

      if (error) {
        console.error('❌ Error loading subscription types:', error);
        throw error;
      }
      
      console.log('✅ Loaded subscription types:', data);
      const typedData = (data || []).map(item => ({
        ...item,
        subscription_mode: (item.subscription_mode || 'time_based') as 'time_based' | 'visit_based',
        available_in_shop: item.available_in_shop || false
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationMonths('');
    setFeatures('');
    setSubscriptionMode('time_based');
    setVisitCount('');
    setVisitExpiryMonths('');
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
    if (subscriptionMode === 'visit_based' && (!visitCount || !visitExpiryMonths)) {
      toast.error('Ο αριθμός επισκέψεων και η διάρκεια λήξης είναι απαραίτητα για συνδρομές επισκέψεων');
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
      if (!numericVisitExpiryMonths || numericVisitExpiryMonths <= 0) {
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
        visit_count: subscriptionMode === 'visit_based' ? numericVisitCount : null,
        visit_expiry_months: subscriptionMode === 'visit_based' ? numericVisitExpiryMonths : null
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Διαχείριση Τύπων Συνδρομών</span>
          </div>
          <Button 
            onClick={openCreateDialog}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέος Τύπος
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
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

        <div className="space-y-4">
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
            filteredSubscriptionTypes.map((type) => (
              <div key={type.id} className="border rounded-none p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{type.name}</h3>
                      <Badge className={`rounded-none ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {type.is_active ? 'Ενεργό' : 'Ανενεργό'}
                      </Badge>
                    </div>
                    {type.description && (
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    )}
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <strong>Τιμή:</strong> €{type.price}
                        {type.subscription_mode === 'visit_based' ? (
                          <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            Επισκέψεις
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none bg-green-50 text-green-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            Χρονική
                          </Badge>
                        )}
                      </div>
                      {type.subscription_mode === 'visit_based' ? (
                        <>
                          <div><strong>Επισκέψεις:</strong> {type.visit_count} επισκέψεις</div>
                          <div><strong>Λήξη σε:</strong> {type.visit_expiry_months} μήνες</div>
                        </>
                      ) : (
                        <div><strong>Διάρκεια:</strong> {type.duration_months} μήνες</div>
                      )}
                      {type.features && Object.keys(type.features).length > 0 && (
                        <div><strong>Χαρακτηριστικά:</strong> {Object.keys(type.features).join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(type)}
                      className="rounded-none"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(type)}
                      className="rounded-none border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={type.is_active ? "destructive" : "default"}
                      onClick={() => toggleActiveStatus(type)}
                      className="rounded-none"
                    >
                      {type.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
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
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open && !saving) {
          closeDialog();
        }
      }}>
        <DialogContent className="rounded-none max-w-md">
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
                onValueChange={(value: 'time_based' | 'visit_based') => setSubscriptionMode(value)}
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
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="visitCount">Αριθμός Επισκέψεων*</Label>
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

            {subscriptionMode === 'visit_based' && (
              <div>
                <Label htmlFor="visitExpiryMonths">Διάρκεια Λήξης (μήνες)*</Label>
                <Input
                  id="visitExpiryMonths"
                  type="number"
                  min="1"
                  value={visitExpiryMonths}
                  onChange={(e) => setVisitExpiryMonths(e.target.value)}
                  className="rounded-none"
                  placeholder="Σε πόσους μήνες λήγουν οι επισκέψεις"
                  disabled={saving}
                />
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
            <div className="flex gap-2">
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
                className="rounded-none"
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
