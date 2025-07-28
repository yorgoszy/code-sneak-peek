import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Gift, Percent, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface SubscriptionPrize {
  id: string;
  subscription_type_id: string;
  quantity: number;
  discount_percentage: number;
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
  const [subscriptionPrizes, setSubscriptionPrizes] = useState<SubscriptionPrize[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<SelectedSubscription[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionPrizes();
    fetchSubscriptionTypes();
  }, [magicBoxId]);

  const fetchSubscriptionPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_box_subscription_prizes')
        .select(`
          *,
          subscription_types (
            id,
            name,
            description,
            price
          )
        `)
        .eq('magic_box_id', magicBoxId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptionPrizes((data || []) as SubscriptionPrize[]);
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
        .from('magic_box_subscription_prizes')
        .delete()
        .eq('magic_box_id', magicBoxId);

      if (deleteError) throw deleteError;

      // Προσθήκη νέων συνδρομών
      const subscriptionData = selectedSubscriptions.map(item => ({
        magic_box_id: magicBoxId,
        subscription_type_id: item.subscription_type_id,
        quantity: item.quantity,
        discount_percentage: item.discount_percentage
      }));

      const { error: insertError } = await supabase
        .from('magic_box_subscription_prizes')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή τη συνδρομή;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('magic_box_subscription_prizes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Επιτυχία',
        description: 'Η συνδρομή διαγράφηκε επιτυχώς'
      });
      
      fetchSubscriptionPrizes();
    } catch (error) {
      console.error('Error deleting subscription prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής συνδρομής',
        variant: 'destructive'
      });
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subscriptionPrizes.map((prize) => (
          <Card key={prize.id} className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Συνδρομή
                </div>
                <Badge variant="secondary" className="rounded-none">
                  x{prize.quantity}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prize.subscription_types && (
                <div className="mb-2">
                  <p className="font-medium">{prize.subscription_types.name}</p>
                  <p className="text-sm text-gray-600">{prize.subscription_types.description}</p>
                  <p className="text-sm font-medium">€{prize.subscription_types.price}</p>
                </div>
              )}
              
              {prize.discount_percentage > 0 && (
                <div className="mb-4">
                  <Badge className="bg-[#00ffba] text-black rounded-none">
                    {prize.discount_percentage}% έκπτωση
                  </Badge>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleDelete(prize.id)}
                  size="sm"
                  variant="destructive"
                  className="rounded-none"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && subscriptionPrizes.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν συνδρομές σε αυτό το μαγικό κουτί</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};