
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Package } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
  is_active: boolean;
}

export const SubscriptionTypeManager: React.FC = () => {
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SubscriptionType | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [features, setFeatures] = useState('');

  useEffect(() => {
    loadSubscriptionTypes();
  }, []);

  const loadSubscriptionTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('*')
        .order('price');

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error loading subscription types:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των τύπων συνδρομών');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationDays('');
    setFeatures('');
    setEditingType(null);
  };

  const openEditDialog = (type: SubscriptionType) => {
    setEditingType(type);
    setName(type.name);
    setDescription(type.description || '');
    setPrice(type.price.toString());
    setDurationDays(type.duration_days.toString());
    setFeatures(JSON.stringify(type.features, null, 2));
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || !durationDays) {
      toast.error('Συμπληρώστε όλα τα απαιτούμενα πεδία');
      return;
    }

    try {
      let parsedFeatures = {};
      if (features.trim()) {
        try {
          parsedFeatures = JSON.parse(features);
        } catch {
          toast.error('Μη έγκυρο JSON format στα χαρακτηριστικά');
          return;
        }
      }

      const typeData = {
        name,
        description,
        price: parseFloat(price),
        duration_days: parseInt(durationDays),
        features: parsedFeatures,
        is_active: true
      };

      if (editingType) {
        // Update existing
        const { error } = await supabase
          .from('subscription_types')
          .update(typeData)
          .eq('id', editingType.id);

        if (error) throw error;
        toast.success('Ο τύπος συνδρομής ενημερώθηκε επιτυχώς!');
      } else {
        // Create new
        const { error } = await supabase
          .from('subscription_types')
          .insert(typeData);

        if (error) throw error;
        toast.success('Ο τύπος συνδρομής δημιουργήθηκε επιτυχώς!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadSubscriptionTypes();
    } catch (error) {
      console.error('Error saving subscription type:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    }
  };

  const toggleActiveStatus = async (type: SubscriptionType) => {
    try {
      const { error } = await supabase
        .from('subscription_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;
      
      toast.success(`Ο τύπος συνδρομής ${!type.is_active ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} επιτυχώς!`);
      loadSubscriptionTypes();
    } catch (error) {
      console.error('Error toggling subscription type:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Φορτώνω τους τύπους συνδρομών...</div>;
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 md:w-5 h-4 md:h-5" />
            <span className="text-lg md:text-xl">Διαχείριση Τύπων Συνδρομών</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Νέος Τύπος
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none max-w-sm md:max-w-md mx-4 md:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">
                  {editingType ? 'Επεξεργασία' : 'Δημιουργία'} Τύπου Συνδρομής
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Όνομα*</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-none"
                    placeholder="π.χ. Premium"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm">Περιγραφή</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-none"
                    placeholder="Περιγραφή του πακέτου..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-sm">Τιμή (€)*</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm">Διάρκεια (ημέρες)*</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="features" className="text-sm">Χαρακτηριστικά (JSON)</Label>
                  <Textarea
                    id="features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    className="rounded-none font-mono text-xs"
                    placeholder='{"ai_access": true, "max_conversations": 100}'
                    rows={3}
                  />
                </div>
                <Button onClick={handleSave} className="w-full rounded-none">
                  {editingType ? 'Ενημέρωση' : 'Δημιουργία'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptionTypes.map((type) => (
            <div key={type.id} className="border rounded-none p-3 md:p-4 hover:bg-gray-50">
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{type.name}</h3>
                  <Badge className={`rounded-none text-xs ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {type.is_active ? 'Ενεργό' : 'Ανενεργό'}
                  </Badge>
                </div>
                
                {type.description && (
                  <p className="text-xs text-gray-600">{type.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><strong>Τιμή:</strong> €{type.price}</div>
                  <div><strong>Διάρκεια:</strong> {type.duration_days} ημέρες</div>
                </div>
                
                {Object.keys(type.features || {}).length > 0 && (
                  <div className="text-xs">
                    <strong>Χαρακτηριστικά:</strong> {Object.keys(type.features).join(', ')}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(type)}
                    className="rounded-none flex-1 text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Επεξεργασία
                  </Button>
                  <Button
                    size="sm"
                    variant={type.is_active ? "destructive" : "default"}
                    onClick={() => toggleActiveStatus(type)}
                    className="rounded-none flex-1 text-xs"
                  >
                    {type.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  </Button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{type.name}</h3>
                    <Badge className={`rounded-none ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {type.is_active ? 'Ενεργό' : 'Ανενεργό'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                  <div className="text-sm space-y-1">
                    <div><strong>Τιμή:</strong> €{type.price}</div>
                    <div><strong>Διάρκεια:</strong> {type.duration_days} ημέρες</div>
                    {Object.keys(type.features || {}).length > 0 && (
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
                    variant={type.is_active ? "destructive" : "default"}
                    onClick={() => toggleActiveStatus(type)}
                    className="rounded-none"
                  >
                    {type.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
