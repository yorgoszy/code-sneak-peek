import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Gift, Settings, Power, Users, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MagicBoxGameV2 } from './MagicBoxGameV2';

interface MagicBoxCampaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  max_participations_per_user: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignPrizeManagerProps {
  campaign_id: string;
  onBack: () => void;
}

// Prize Manager για τους νέους πίνακες
const CampaignPrizeManager: React.FC<CampaignPrizeManagerProps> = ({ campaign_id, onBack }) => {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prizeToDelete, setPrizeToDelete] = useState<string | null>(null);
  const [subscriptionTypes, setSubscriptionTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    prize_type: 'subscription',
    subscription_type_id: '',
    discount_percentage: 0,
    weight: 1,
    quantity: 1,
    remaining_quantity: 1,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPrizes();
    fetchSubscriptionTypes();
  }, [campaign_id]);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_prizes')
        .select(`
          *,
          subscription_types (
            name,
            description
          )
        `)
        .eq('campaign_id', campaign_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrizes(data || []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prizeData = {
        campaign_id,
        prize_type: formData.prize_type,
        subscription_type_id: formData.prize_type === 'subscription' ? formData.subscription_type_id : null,
        discount_percentage: formData.discount_percentage,
        weight: formData.weight,
        quantity: formData.quantity,
        remaining_quantity: formData.remaining_quantity,
        description: formData.description
      };

      const { error } = await supabase
        .from('campaign_prizes')
        .insert(prizeData);

      if (error) throw error;

      toast({
        title: 'Επιτυχία',
        description: 'Το βραβείο δημιουργήθηκε επιτυχώς'
      });

      setFormData({
        prize_type: 'subscription',
        subscription_type_id: '',
        discount_percentage: 0,
        weight: 1,
        quantity: 1,
        remaining_quantity: 1,
        description: ''
      });
      setShowForm(false);
      fetchPrizes();
    } catch (error) {
      console.error('Error saving prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης βραβείου',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (prizeId: string) => {
    setPrizeToDelete(prizeId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
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

      fetchPrizes();
    } catch (error) {
      console.error('Error deleting prize:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής βραβείου',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setPrizeToDelete(null);
    }
  };

  const getPrizeTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Συνδρομή';
      case 'discount_coupon': return 'Κουπόνι Έκπτωσης';
      case 'try_again': return 'Δοκίμασε Ξανά';
      case 'nothing': return 'Τίποτα';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-none"
        >
          ← Πίσω στα Campaigns
        </Button>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Βραβείο
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Νέο Βραβείο</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="prize_type">Τύπος Βραβείου</Label>
                <Select
                  value={formData.prize_type}
                  onValueChange={(value) => setFormData({ ...formData, prize_type: value })}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε τύπο βραβείου" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Συνδρομή</SelectItem>
                    <SelectItem value="discount_coupon">Κουπόνι Έκπτωσης</SelectItem>
                    <SelectItem value="try_again">Δοκίμασε Ξανά</SelectItem>
                    <SelectItem value="nothing">Τίποτα</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.prize_type === 'subscription' && (
                <div>
                  <Label htmlFor="subscription_type">Τύπος Συνδρομής</Label>
                  <Select
                    value={formData.subscription_type_id}
                    onValueChange={(value) => setFormData({ ...formData, subscription_type_id: value })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε συνδρομή" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.prize_type === 'discount_coupon' && (
                <div>
                  <Label htmlFor="discount_percentage">Ποσοστό Έκπτωσης (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                    className="rounded-none"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="weight">Βάρος (πιθανότητα)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  className="rounded-none"
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="quantity">Ποσότητα</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      quantity: qty,
                      remaining_quantity: qty
                    });
                  }}
                  className="rounded-none"
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Περιγραφή (προαιρετικό)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none"
                  rows={2}
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
                  onClick={() => setShowForm(false)}
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

      <div className="grid gap-4">
        {prizes.map((prize) => (
          <Card key={prize.id} className="rounded-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{getPrizeTypeLabel(prize.prize_type)}</h3>
                  {prize.subscription_types && (
                    <p className="text-sm text-gray-600">{prize.subscription_types.name}</p>
                  )}
                  {prize.discount_percentage > 0 && (
                    <p className="text-sm text-gray-600">Έκπτωση: {prize.discount_percentage}%</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="rounded-none">
                      Βάρος: {prize.weight}
                    </Badge>
                    <Badge variant="outline" className="rounded-none">
                      Διαθέσιμα: {prize.remaining_quantity}/{prize.quantity}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleDeleteClick(prize.id)}
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
            <p className="text-gray-500">Δεν υπάρχουν βραβεία</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Επιβεβαίωση Διαγραφής
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το βραβείο;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-4">
            <AlertDialogCancel className="rounded-none">
              Ακύρωση
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-none bg-destructive hover:bg-destructive/90"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const MagicBoxManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MagicBoxCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MagicBoxCampaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignDeleteDialogOpen, setCampaignDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'admin'>('game');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    max_participations_per_user: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_box_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης campaigns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCampaign) {
        const { error } = await supabase
          .from('magic_box_campaigns')
          .update({
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
            max_participations_per_user: formData.max_participations_per_user,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCampaign.id);

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το campaign ενημερώθηκε επιτυχώς'
        });
      } else {
        const { error } = await supabase
          .from('magic_box_campaigns')
          .insert({
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
            max_participations_per_user: formData.max_participations_per_user
          });

        if (error) throw error;
        
        toast({
          title: 'Επιτυχία',
          description: 'Το campaign δημιουργήθηκε επιτυχώς'
        });
      }

      setFormData({ 
        name: '', 
        description: '', 
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true, 
        max_participations_per_user: 1 
      });
      setEditingCampaign(null);
      setShowForm(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης campaign',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (campaign: MagicBoxCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      start_date: campaign.start_date,
      end_date: campaign.end_date || '',
      is_active: campaign.is_active,
      max_participations_per_user: campaign.max_participations_per_user
    });
    setShowForm(true);
  };

  const handleCampaignDeleteClick = (id: string) => {
    setCampaignToDelete(id);
    setCampaignDeleteDialogOpen(true);
  };

  const handleCampaignDelete = async () => {
    if (!campaignToDelete) return;

    try {
      // Διαγραφή των prizes πρώτα
      await supabase
        .from('campaign_prizes')
        .delete()
        .eq('campaign_id', campaignToDelete);

      // Διαγραφή των participations
      await supabase
        .from('user_campaign_participations')
        .delete()
        .eq('campaign_id', campaignToDelete);

      // Διαγραφή του campaign
      const { error } = await supabase
        .from('magic_box_campaigns')
        .delete()
        .eq('id', campaignToDelete);

      if (error) throw error;
      
      toast({
        title: 'Επιτυχία',
        description: 'Το campaign διαγράφηκε επιτυχώς'
      });
      
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διαγραφής campaign',
        variant: 'destructive'
      });
    } finally {
      setCampaignDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('magic_box_campaigns')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      // Αν ενεργοποιείται, διαγραφή παλιών συμμετοχών για να μπορούν να παίξουν ξανά
      if (isActive) {
        const { error: deleteError } = await supabase
          .from('user_campaign_participations')
          .delete()
          .eq('campaign_id', id);

        if (deleteError) {
          console.error('Error clearing old participations:', deleteError);
        }
      }

      toast({
        title: 'Επιτυχία',
        description: `Campaign ${isActive ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς`
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Σφάλμα κατά την αλλαγή κατάστασης',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true, 
      max_participations_per_user: 1 
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  if (selectedCampaign) {
    return (
      <CampaignPrizeManager 
        campaign_id={selectedCampaign} 
        onBack={() => setSelectedCampaign(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Μαγικά Κουτιά</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('game')}
            variant={activeTab === 'game' ? 'default' : 'outline'}
            className="rounded-none"
          >
            <Gift className="w-4 h-4 mr-2" />
            Παιχνίδι
          </Button>
          <Button
            onClick={() => setActiveTab('admin')}
            variant={activeTab === 'admin' ? 'default' : 'outline'}
            className="rounded-none"
          >
            <Settings className="w-4 h-4 mr-2" />
            Διαχείριση
          </Button>
        </div>
      </div>

      {activeTab === 'game' ? (
        <MagicBoxGameV2 />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Διαχείριση Campaigns</h3>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Νέο Campaign
            </Button>
          </div>

      {showForm && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>
              {editingCampaign ? 'Επεξεργασία Campaign' : 'Νέο Campaign'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Όνομα</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Ημερομηνία Έναρξης</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="rounded-none"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Ημερομηνία Λήξης (προαιρετικό)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="rounded-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_participations">Μέγιστες Συμμετοχές ανά Χρήστη</Label>
                <Input
                  id="max_participations"
                  type="number"
                  value={formData.max_participations_per_user}
                  onChange={(e) => setFormData({ ...formData, max_participations_per_user: parseInt(e.target.value) })}
                  className="rounded-none"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ενεργό</Label>
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
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  {campaign.name}
                </div>
                <div className="flex gap-1">
                  {campaign.is_active && (
                    <Badge variant="default" className="bg-[#00ffba] text-black rounded-none">
                      Ενεργό
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
              
              <div className="space-y-1 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Έναρξη: {format(new Date(campaign.start_date), 'dd/MM/yyyy')}
                </div>
                {campaign.end_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Λήξη: {format(new Date(campaign.end_date), 'dd/MM/yyyy')}
                  </div>
                )}
                <div>
                  Μέγιστες συμμετοχές: {campaign.max_participations_per_user}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => setSelectedCampaign(campaign.id)}
                  size="sm"
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Βραβεία
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await supabase.functions.invoke('create-magic-boxes', {
                        body: { campaign_id: campaign.id }
                      });
                      toast({ title: 'Επιτυχία', description: 'Μαγικά κουτιά δημιουργήθηκαν!' });
                    } catch (error) {
                      toast({ title: 'Σφάλμα', description: 'Αποτυχία δημιουργίας', variant: 'destructive' });
                    }
                  }}
                  size="sm"
                  variant="secondary"
                  className="rounded-none"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Κουτιά
                </Button>
                <Button
                  onClick={() => handleToggleStatus(campaign.id, !campaign.is_active)}
                  size="sm"
                  variant={campaign.is_active ? "outline" : "default"}
                  className="rounded-none"
                >
                  <Power className="w-4 h-4 mr-1" />
                  {campaign.is_active ? 'Απενεργ.' : 'Ενεργ.'}
                </Button>
                <Button
                  onClick={() => handleEdit(campaign)}
                  size="sm"
                  variant="outline"
                  className="rounded-none"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Επεξ.
                </Button>
                <Button
                  onClick={() => handleCampaignDeleteClick(campaign.id)}
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

      {!loading && campaigns.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν campaigns</p>
          </CardContent>
        </Card>
      )}

          <AlertDialog open={campaignDeleteDialogOpen} onOpenChange={setCampaignDeleteDialogOpen}>
            <AlertDialogContent className="rounded-none max-w-md mx-auto">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center">
                  Επιβεβαίωση Διαγραφής
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το campaign;
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex justify-center gap-4">
                <AlertDialogCancel className="rounded-none">
                  Ακύρωση
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCampaignDelete}
                  className="rounded-none bg-destructive hover:bg-destructive/90"
                >
                  Διαγραφή
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};