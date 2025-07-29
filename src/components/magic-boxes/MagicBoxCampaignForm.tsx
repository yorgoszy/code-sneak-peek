import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MagicBoxCampaignFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingCampaign?: any;
}

export const MagicBoxCampaignForm: React.FC<MagicBoxCampaignFormProps> = ({
  onSuccess,
  onCancel,
  editingCampaign
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    max_participations_per_user: 1,
    distribution_type: 'all', // 'all', 'selected', 'single'
    auto_distribute: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    if (editingCampaign) {
      setFormData({
        name: editingCampaign.name,
        description: editingCampaign.description,
        start_date: editingCampaign.start_date,
        end_date: editingCampaign.end_date || '',
        is_active: editingCampaign.is_active,
        max_participations_per_user: editingCampaign.max_participations_per_user,
        distribution_type: 'all',
        auto_distribute: true
      });
    }
  }, [editingCampaign]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, subscription_status')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let campaignData;
      
      if (editingCampaign) {
        // Update existing campaign
        const { data, error } = await supabase
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
          .eq('id', editingCampaign.id)
          .select()
          .single();

        if (error) throw error;
        campaignData = data;

        toast({
          title: 'Επιτυχία',
          description: 'Η καμπάνια ενημερώθηκε επιτυχώς'
        });
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from('magic_box_campaigns')
          .insert({
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
            max_participations_per_user: formData.max_participations_per_user
          })
          .select()
          .single();

        if (error) throw error;
        campaignData = data;

        toast({
          title: 'Επιτυχία',
          description: 'Η καμπάνια δημιουργήθηκε επιτυχώς'
        });

        // Auto-distribute magic boxes if enabled
        if (formData.auto_distribute && !editingCampaign) {
          await distributeMagicBoxes(campaignData.id);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία αποθήκευσης καμπάνιας',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const distributeMagicBoxes = async (campaignId: string) => {
    try {
      let targetUsers = [];
      
      if (formData.distribution_type === 'all') {
        targetUsers = users.map(user => user.id);
      } else if (formData.distribution_type === 'selected') {
        targetUsers = selectedUsers;
      }

      if (targetUsers.length === 0) {
        toast({
          title: 'Προειδοποίηση',
          description: 'Δεν επιλέχθηκαν χρήστες για διανομή magic boxes'
        });
        return;
      }

      // Create magic boxes for selected users
      const magicBoxes = targetUsers.map(userId => ({
        user_id: userId,
        campaign_id: campaignId,
        is_opened: false,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_magic_boxes')
        .insert(magicBoxes);

      if (insertError) throw insertError;

      toast({
        title: 'Επιτυχία',
        description: `Διανεμήθηκαν ${targetUsers.length} magic boxes στους χρήστες`
      });
    } catch (error) {
      console.error('Error distributing magic boxes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία διανομής magic boxes',
        variant: 'destructive'
      });
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#00ffba]" />
          {editingCampaign ? 'Επεξεργασία Καμπάνιας' : 'Νέα Καμπάνια Magic Box'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Όνομα Καμπάνιας</Label>
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

            <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ενεργή Καμπάνια</Label>
              </div>
            </div>
          </div>

          {/* Distribution Settings - Only for new campaigns */}
          {!editingCampaign && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Διανομή Magic Boxes
              </h3>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_distribute"
                  checked={formData.auto_distribute}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_distribute: checked })}
                />
                <Label htmlFor="auto_distribute">Αυτόματη διανομή μετά τη δημιουργία</Label>
              </div>

              {formData.auto_distribute && (
                <div className="space-y-4">
                  <div>
                    <Label>Τύπος Διανομής</Label>
                    <Select
                      value={formData.distribution_type}
                      onValueChange={(value) => setFormData({ ...formData, distribution_type: value })}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
                        <SelectItem value="selected">Επιλεγμένοι χρήστες</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.distribution_type === 'selected' && (
                    <div className="space-y-2">
                      <Label>Επιλογή Χρηστών ({selectedUsers.length} επιλεγμένοι)</Label>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-none p-4">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 py-2">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="rounded"
                            />
                            <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span>{user.name || user.email}</span>
                                <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'} className="rounded-none text-xs">
                                  {user.subscription_status || 'inactive'}
                                </Badge>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-6 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {loading ? 'Αποθήκευση...' : (editingCampaign ? 'Ενημέρωση' : 'Δημιουργία')}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="rounded-none"
            >
              Ακύρωση
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};