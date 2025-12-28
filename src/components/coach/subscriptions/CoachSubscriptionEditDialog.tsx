import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface CoachSubscription {
  id: string;
  coach_user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean;
  notes: string | null;
  subscription_types?: {
    id: string;
    name: string;
    price: number;
  } | null;
  coach_users?: {
    name: string;
    email: string;
  } | null;
}

interface CoachSubscriptionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: CoachSubscription | null;
  subscriptionTypes: SubscriptionType[];
  onSuccess: () => void;
}

export const CoachSubscriptionEditDialog: React.FC<CoachSubscriptionEditDialogProps> = ({
  isOpen,
  onClose,
  subscription,
  subscriptionTypes,
  onSuccess
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription) {
      setStartDate(subscription.start_date);
      setEndDate(subscription.end_date);
      setSelectedTypeId(subscription.subscription_types?.id || '');
    }
  }, [subscription]);

  const handleUpdate = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_subscriptions')
        .update({
          start_date: startDate,
          end_date: endDate,
          subscription_type_id: selectedTypeId
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success("Η συνδρομή ενημερώθηκε επιτυχώς");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error("Σφάλμα κατά την ενημέρωση: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Συνδρομής</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Αθλητής</label>
            <Input
              value={subscription.coach_users?.name || ''}
              disabled
              className="rounded-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Τύπος Συνδρομής</label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subscriptionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} - €{type.price} ({type.duration_months} μήνες)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ημερομηνία Έναρξης</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ημερομηνία Λήξης</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Check className="w-4 h-4 mr-2" />
              Ενημέρωση
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-none"
            >
              <X className="w-4 h-4 mr-2" />
              Ακύρωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
