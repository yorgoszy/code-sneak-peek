import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Gift, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Prize {
  id: string;
  subscription_type_id: string | null;
  quantity: number;
  discount_percentage: number;
  prize_type: 'subscription' | 'discount_coupon';
  subscription_types?: SubscriptionType | null;
}

interface MagicBoxPrizeManagerProps {
  magicBoxId: string;
  onBack: () => void;
}

export const MagicBoxPrizeManager: React.FC<MagicBoxPrizeManagerProps> = ({
  magicBoxId,
  onBack
}) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [formData, setFormData] = useState({
    prize_type: 'subscription' as 'subscription' | 'discount_coupon',
    subscription_type_id: '',
    quantity: 1,
    discount_percentage: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPrizes();
    fetchSubscriptionTypes();
  }, [magicBoxId]);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_box_prizes')
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
      setPrizes((data || []) as Prize[]);
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης δώρων',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prizeData = {
        magic_box_id: magicBoxId,
        prize_type: formData.prize_type,
        quantity: formData.quantity,
        discount_percentage: formData.discount_percentage,
        subscription_type_id: formData.prize_type === 'subscription' ? formData.subscription_type_id : null
      };

      if (editingPrize) {
        const { error } = await supabase
          .from('magic_box_prizes')
          .update(prizeData)
          .eq('id', editingPrize.id);

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το δώρο ενημερώθηκε επιτυχώς'
        });
      } else {
        const { error } = await supabase
          .from('magic_box_prizes')
          .insert(prizeData);

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το δώρο δημιουργήθηκε επιτυχώς'
        });
      }

      resetForm();
      fetchPrizes();
    } catch (error) {
      console.error('Error saving prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης δώρου',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setFormData({
      prize_type: prize.prize_type,
      subscription_type_id: prize.subscription_type_id || '',
      quantity: prize.quantity,
      discount_percentage: prize.discount_percentage
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το δώρο;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('magic_box_prizes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Επιτυχία',
        description: 'Το δώρο διαγράφηκε επιτυχώς'
      });
      
      fetchPrizes();
    } catch (error) {
      console.error('Error deleting prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής δώρου',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      prize_type: 'subscription',
      subscription_type_id: '',
      quantity: 1,
      discount_percentage: 0
    });
    setEditingPrize(null);
    setShowForm(false);
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
        <h2 className="text-2xl font-bold">Δώρα Μαγικού Κουτιού</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Δώρο
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>
              {editingPrize ? 'Επεξεργασία Δώρου' : 'Νέο Δώρο'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="prize_type">Τύπος Δώρου</Label>
                <Select
                  value={formData.prize_type}
                  onValueChange={(value: 'subscription' | 'discount_coupon') => 
                    setFormData({ ...formData, prize_type: value })
                  }
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Συνδρομή</SelectItem>
                    <SelectItem value="discount_coupon">Κουπόνι Έκπτωσης</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.prize_type === 'subscription' && (
                <div>
                  <Label htmlFor="subscription_type_id">Τύπος Συνδρομής</Label>
                  <Select
                    value={formData.subscription_type_id}
                    onValueChange={(value) => 
                      setFormData({ ...formData, subscription_type_id: value })
                    }
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε τύπο συνδρομής" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - €{type.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="quantity">Ποσότητα</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="rounded-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discount_percentage">Ποσοστό Έκπτωσης (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                  className="rounded-none"
                />
              </div>

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
        {prizes.map((prize) => (
          <Card key={prize.id} className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {prize.prize_type === 'subscription' ? (
                    <Gift className="w-5 h-5" />
                  ) : (
                    <Percent className="w-5 h-5" />
                  )}
                  {prize.prize_type === 'subscription' ? 'Συνδρομή' : 'Κουπόνι'}
                </div>
                <Badge variant="secondary" className="rounded-none">
                  x{prize.quantity}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prize.prize_type === 'subscription' && prize.subscription_types && (
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
                  onClick={() => handleEdit(prize)}
                  size="sm"
                  variant="outline"
                  className="rounded-none"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Επεξ.
                </Button>
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

      {!loading && prizes.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν δώρα σε αυτό το μαγικό κουτί</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};