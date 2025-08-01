import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Gift, Percent, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CampaignPrize {
  id: string;
  campaign_id: string;
  subscription_type_id: string;
  quantity: number;
  remaining_quantity: number;
  discount_percentage: number;
  prize_type: string;
  weight: number;
  description: string;
  created_at: string;
  updated_at: string;
  subscription_types?: SubscriptionType | null;
}

interface MagicBoxPrizeManagerProps {
  magicBoxId: string;
  onBack: () => void;
}

interface SelectedSubscription {
  subscription_type_id: string;
  quantity: number;
  discount_percentage: number;
}

export const MagicBoxPrizeManager: React.FC<MagicBoxPrizeManagerProps> = ({
  magicBoxId,
  onBack
}) => {
  const [subscriptionPrizes, setSubscriptionPrizes] = useState<CampaignPrize[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<SelectedSubscription[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prizeToDelete, setPrizeToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionPrizes();
    fetchSubscriptionTypes();
  }, [magicBoxId]);

  const fetchSubscriptionPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_prizes')
        .select(`
          *,
          subscription_types (
            id,
            name,
            description,
            price
          )
        `)
        .eq('campaign_id', magicBoxId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptionPrizes((data as any) || []);
    } catch (error) {
      console.error('Error fetching subscription prizes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης συνδρομών',
        variant: 'destructive'
      });
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSelectedSubscription = () => {
    setSelectedSubscriptions([
      ...selectedSubscriptions,
      {
        subscription_type_id: '',
        quantity: 1,
        discount_percentage: 0
      }
    ]);
  };

  const updateSelectedSubscription = (index: number, field: keyof SelectedSubscription, value: string | number) => {
    const updated = [...selectedSubscriptions];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSubscriptions(updated);
  };

  const removeSelectedSubscription = (index: number) => {
    setSelectedSubscriptions(selectedSubscriptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubscriptions.length === 0) {
      toast({
        title: 'Σφάλμα',
        description: 'Προσθέστε τουλάχιστον μία συνδρομή',
        variant: 'destructive'
      });
      return;
    }

    const invalidItems = selectedSubscriptions.some(
      item => !item.subscription_type_id || item.quantity < 1
    );

    if (invalidItems) {
      toast({
        title: 'Σφάλμα',
        description: 'Συμπληρώστε όλα τα απαιτούμενα πεδία',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Διαγραφή παλιών συνδρομών του μαγικού κουτιού
      const { error: deleteError } = await supabase
        .from('campaign_prizes')
        .delete()
        .eq('campaign_id', magicBoxId);

      if (deleteError) throw deleteError;

      // Προσθήκη νέων συνδρομών
      const subscriptionData = selectedSubscriptions.map(item => ({
        campaign_id: magicBoxId,
        subscription_type_id: item.subscription_type_id,
        quantity: item.quantity,
        remaining_quantity: item.quantity,
        discount_percentage: item.discount_percentage,
        prize_type: 'subscription',
        weight: item.quantity,
        description: ''
      }));

      const { error: insertError } = await supabase
        .from('campaign_prizes')
        .insert(subscriptionData);

      if (insertError) throw insertError;
      
      toast({
        title: 'Επιτυχία',
        description: 'Οι συνδρομές αποθηκεύτηκαν επιτυχώς'
      });

      setSelectedSubscriptions([]);
      setShowForm(false);
      fetchSubscriptionPrizes();
    } catch (error) {
      console.error('Error saving subscription prizes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης συνδρομών',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPrizeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!prizeToDelete) return;

    try {
      const { error } = await supabase
        .from('campaign_prizes')
        .delete()
        .eq('id', prizeToDelete);

      if (error) throw error;
      
      toast({
        title: 'Επιτυχία',
        description: 'Το βραβείο διαγράφηκε επιτυχώς'
      });
      
      fetchSubscriptionPrizes();
    } catch (error) {
      console.error('Error deleting subscription prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής βραβείου',
        variant: 'destructive'
      });
    } finally {
      setPrizeToDelete(null);
    }
  };

  const resetForm = () => {
    setSelectedSubscriptions([]);
    setShowForm(false);
  };

  const getSubscriptionTypeName = (id: string) => {
    const type = subscriptionTypes.find(t => t.id === id);
    return type ? `${type.name} - €${type.price}` : '';
  };

  // Calculate probability for each prize
  const calculateProbability = (prizeWeight: number) => {
    const totalWeight = subscriptionPrizes.reduce((sum, prize) => sum + prize.weight, 0);
    if (totalWeight === 0) return 0;
    return (prizeWeight / totalWeight) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-none"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Πίσω
        </Button>
        <h2 className="text-2xl font-bold">Συνδρομές Μαγικού Κουτιού</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Επιλογή Συνδρομών
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Επιλογή Συνδρομών για Κλήρωση</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                {selectedSubscriptions.map((item, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Συνδρομή #{index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeSelectedSubscription(index)}
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Τύπος Συνδρομής</Label>
                        <select
                          value={item.subscription_type_id}
                          onChange={(e) => updateSelectedSubscription(index, 'subscription_type_id', e.target.value)}
                          className="w-full p-2 border rounded-none"
                          required
                        >
                          <option value="">Επιλέξτε συνδρομή</option>
                          {subscriptionTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name} - €{type.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label>Ποσότητα</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateSelectedSubscription(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="rounded-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Έκπτωση (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_percentage}
                          onChange={(e) => updateSelectedSubscription(index, 'discount_percentage', parseInt(e.target.value) || 0)}
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={addSelectedSubscription}
                variant="outline"
                className="rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Προσθήκη Συνδρομής
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="rounded-none"
                >
                  Ακύρωση
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {subscriptionPrizes.map((prize) => {
          const probability = calculateProbability(prize.weight);
          return (
            <Card key={prize.id} className="rounded-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Prize Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Gift className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                    
                    {prize.subscription_types && (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {prize.subscription_types.name}
                        </span>
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          €{prize.subscription_types.price}
                        </span>
                      </div>
                    )}
                    
                    <Badge variant="secondary" className="rounded-none text-xs flex-shrink-0">
                      x{prize.quantity}
                    </Badge>
                    
                    {prize.discount_percentage > 0 && (
                      <Badge className="bg-[#00ffba] text-black rounded-none text-xs flex-shrink-0">
                        -{prize.discount_percentage}%
                      </Badge>
                    )}
                  </div>

                  {/* Probability Bar */}
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1">
                      <Progress 
                        value={probability} 
                        className="h-2 bg-gray-200" 
                      />
                    </div>
                    <span className="text-xs text-gray-600 min-w-[35px] text-right">
                      {probability.toFixed(1)}%
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      onClick={() => {/* TODO: Implement edit functionality */}}
                      size="sm"
                      variant="outline"
                      className="rounded-none h-7 w-7 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(prize.id)}
                      size="sm"
                      variant="destructive"
                      className="rounded-none h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && subscriptionPrizes.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν συνδρομές σε αυτό το μαγικό κουτί</p>
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        description="Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το βραβείο;"
        confirmText="Διαγραφή"
      />
    </div>
  );
};