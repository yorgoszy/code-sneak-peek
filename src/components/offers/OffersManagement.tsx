import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { OfferCreationDialog } from "./OfferCreationDialog";
import { OfferEditDialog } from "./OfferEditDialog";
import { OfferPreviewDialog } from "./OfferPreviewDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export const OffersManagement: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<any>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadOffers();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading, isAdmin]);

  const checkUserRole = async () => {
    try {
      console.log('🔍 [OffersManagement] Checking user role...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ [OffersManagement] No authenticated user found');
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      console.log('👤 [OffersManagement] Authenticated user ID:', user.id);
      console.log('👤 [OffersManagement] User email:', user.email);

      // Check if user is admin in app_users table
      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('id, auth_user_id, email, role')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('❌ [OffersManagement] Error checking user role:', error);
        console.error('❌ [OffersManagement] Error details:', JSON.stringify(error));
        setIsAdmin(false);
      } else {
        console.log('✅ [OffersManagement] Found app_user:', appUser);
        console.log('✅ [OffersManagement] User role:', appUser?.role);
        console.log('✅ [OffersManagement] Is admin?', appUser?.role === 'admin');
        setIsAdmin(appUser?.role === 'admin');
      }
    } catch (error) {
      console.error('💥 [OffersManagement] Error in checkUserRole:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading offers...');
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          subscription_types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading offers:', error);
        throw error;
      }
      
      console.log('✅ Loaded offers:', data);
      setOffers(data || []);
    } catch (error) {
      console.error('💥 Error loading offers:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προσφορών');
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (offer: any) => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }

    try {
      console.log('🔄 Toggling active status for offer:', offer.name, 'Current:', offer.is_active);
      
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);

      if (error) {
        console.error('❌ Error toggling offer:', error);
        throw error;
      }
      
      console.log('✅ Offer status toggled successfully');
      toast.success(`Η προσφορά ${!offer.is_active ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`);
      await loadOffers();
    } catch (error) {
      console.error('💥 Error toggling offer:', error);
      toast.error('Σφάλμα κατά την ενημέρωση: ' + (error as Error).message);
    }
  };

  const handleDeleteClick = (offer: any) => {
    if (!isAdmin) {
      toast.error('Δεν έχετε δικαιώματα διαχειριστή');
      return;
    }
    setOfferToDelete(offer);
    setIsDeleteDialogOpen(true);
  };

  const deleteOffer = async () => {
    if (!offerToDelete) return;

    try {
      console.log('🗑️ Deleting offer:', offerToDelete.name);
      
      // Πρώτα ελέγχουμε αν υπάρχουν πληρωμές που αναφέρονται σε αυτή την προσφορά
      const { data: relatedPayments, error: checkError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('offer_id', offerToDelete.id);

      if (checkError) {
        console.error('❌ Error checking related payments:', checkError);
        throw checkError;
      }

      // Αν υπάρχουν πληρωμές, ενημερώνουμε τα offer_id σε null αντί να μπλοκάρουμε τη διαγραφή
      if (relatedPayments && relatedPayments.length > 0) {
        console.log('📝 Updating payments to remove offer reference before deletion');
        
        const { error: updateError } = await supabase
          .from('payments')
          .update({ offer_id: null })
          .eq('offer_id', offerToDelete.id);

        if (updateError) {
          console.error('❌ Error updating payments:', updateError);
          throw updateError;
        }

        console.log('✅ Successfully updated payments to remove offer reference');
      }
      
      // Τώρα μπορούμε να διαγράψουμε την προσφορά
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerToDelete.id);

      if (error) {
        console.error('❌ Error deleting offer:', error);
        throw error;
      }
      
      console.log('✅ Offer deleted successfully');
      toast.success('Η προσφορά διαγράφηκε επιτυχώς!');
      await loadOffers();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('💥 Error deleting offer:', error);
      toast.error('Σφάλμα κατά τη διαγραφή: ' + (error as Error).message);
    }
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
            <p className="mt-2 text-gray-600">Φορτώνω τις προσφορές...</p>
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
            <span>Διαχείριση Ενεργών Προσφορών</span>
          </div>
          <Button 
            onClick={() => setIsOfferDialogOpen(true)}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέα Προσφορά
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Δεν υπάρχουν προσφορές</p>
            <p className="text-sm">Κάντε κλικ στο κουμπί "Νέα Προσφορά" για να δημιουργήσετε μία</p>
          </div>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="border rounded-none p-3 bg-gradient-to-r from-blue-50 to-purple-50 h-16">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{offer.name}</h4>
                        <Badge className={`rounded-none text-xs px-1 py-0 ${offer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {offer.is_active ? 'Ενεργή' : 'Ανενεργή'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="truncate">{offer.subscription_types?.name}</span>
                        <span>€{offer.discounted_price}</span>
                        <span className="hidden sm:inline">
                          {new Date(offer.start_date).toLocaleDateString('el-GR')} - {new Date(offer.end_date).toLocaleDateString('el-GR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setIsPreviewDialogOpen(true);
                      }}
                      className="rounded-none border-blue-300 text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setIsEditDialogOpen(true);
                      }}
                      className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10 h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(offer)}
                      className="rounded-none border-red-300 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={offer.is_active ? "destructive" : "default"}
                      onClick={() => toggleActiveStatus(offer)}
                      className="rounded-none text-xs px-2 h-8"
                    >
                      {offer.is_active ? 'Απενεργ.' : 'Ενεργ.'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Offer Creation Dialog */}
      <OfferCreationDialog
        isOpen={isOfferDialogOpen}
        onClose={() => setIsOfferDialogOpen(false)}
        onSuccess={() => {
          loadOffers();
          setIsOfferDialogOpen(false);
        }}
      />

      {/* Offer Edit Dialog */}
      <OfferEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          loadOffers();
          setIsEditDialogOpen(false);
        }}
        offer={selectedOffer}
      />

      {/* Offer Preview Dialog */}
      <OfferPreviewDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        offer={selectedOffer}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteOffer}
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε την προσφορά;"
        confirmText="Διαγραφή"
      />
    </Card>
  );
};