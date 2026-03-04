import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { matchesSearchTerm } from "@/lib/utils";
import { addMonths, format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Club {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url: string | null;
}

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface NewFederationSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  federationId: string;
  onSuccess: () => void;
}

export const NewFederationSubscriptionDialog: React.FC<NewFederationSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  federationId,
  onSuccess
}) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open && federationId) {
      setSelectedClub(null);
      setSelectedTypeId('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setSearchTerm('');
      fetchData();
    }
  }, [open, federationId]);

  const fetchData = async () => {
    try {
      // Fetch federation's linked clubs via junction table
      const { data: clubLinks, error: linksError } = await supabase
        .from('federation_clubs')
        .select('coach_id')
        .eq('federation_id', federationId);

      if (linksError) throw linksError;

      const clubIds = (clubLinks || []).map(l => l.coach_id);

      if (clubIds.length > 0) {
        const { data: clubsData, error: clubsError } = await supabase
          .from('app_users')
          .select('id, name, email, avatar_url, photo_url')
          .in('id', clubIds)
          .order('name');

        if (clubsError) throw clubsError;
        setClubs(clubsData || []);
      } else {
        setClubs([]);
      }

      // Fetch federation's subscription types
      const { data: typesData, error: typesError } = await supabase
        .from('subscription_types')
        .select('id, name, price, duration_months')
        .eq('coach_id', federationId)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;
      setSubscriptionTypes(typesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    }
  };

  const generateReceiptNumber = async () => {
    const { data, error } = await supabase
      .from('coach_receipts')
      .select('receipt_number')
      .eq('coach_id', federationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return 'ΑΠ-0001';

    const lastNumber = data[0].receipt_number;
    const numberPart = parseInt(lastNumber.split('-')[1]) || 0;
    return `ΑΠ-${String(numberPart + 1).padStart(4, '0')}`;
  };

  const handleSave = async () => {
    if (!selectedClub || !selectedTypeId || !startDate) {
      toast.error('Συμπληρώστε όλα τα πεδία');
      return;
    }

    setLoading(true);
    try {
      const selectedType = subscriptionTypes.find(t => t.id === selectedTypeId);
      if (!selectedType) throw new Error('Invalid subscription type');

      const endDate = format(
        addMonths(new Date(startDate), selectedType.duration_months),
        'yyyy-MM-dd'
      );

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('coach_subscriptions')
        .insert({
          user_id: selectedClub.id,
          subscription_type_id: selectedTypeId,
          coach_id: federationId,
          start_date: startDate,
          end_date: endDate,
          status: 'active'
        } as any)
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      const receiptNumber = await generateReceiptNumber();
      await supabase
        .from('coach_receipts')
        .insert({
          coach_id: federationId,
          user_id: selectedClub.id,
          subscription_id: subscriptionData.id,
          receipt_number: receiptNumber,
          amount: selectedType.price,
          receipt_type: 'subscription',
          subscription_type_id: selectedTypeId,
          notes: `Νέα συνδρομή: ${selectedType.name}`
        } as any);

      toast.success('Η συνδρομή δημιουργήθηκε');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Σφάλμα δημιουργίας συνδρομής');
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = clubs.filter(c =>
    matchesSearchTerm(c.name, searchTerm) ||
    matchesSearchTerm(c.email, searchTerm)
  );

  const selectedType = subscriptionTypes.find(t => t.id === selectedTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Νέα Συνδρομή</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Club Selection */}
          <div className="space-y-2">
            <Label>Σωματείο</Label>
            {selectedClub ? (
              <div className="flex items-center gap-3 p-3 border border-border bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedClub.photo_url || selectedClub.avatar_url || undefined} />
                  <AvatarFallback>{selectedClub.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedClub.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClub.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClub(null)}
                  className="rounded-none"
                >
                  Αλλαγή
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Αναζήτηση σωματείου..."
                    className="pl-10 rounded-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border">
                  {searchTerm.trim().length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      Πληκτρολογήστε για αναζήτηση...
                    </div>
                  ) : filteredClubs.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      Δεν βρέθηκαν σωματεία
                    </div>
                  ) : (
                    filteredClubs.map(club => (
                      <div
                        key={club.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        onClick={() => setSelectedClub(club)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={club.photo_url || club.avatar_url || undefined} />
                          <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{club.name}</p>
                          <p className="text-xs text-muted-foreground">{club.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Ημερομηνία Έναρξης</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-none"
            />
          </div>

          {/* Subscription Type */}
          <div className="space-y-2">
            <Label>Τύπος Συνδρομής</Label>
            {subscriptionTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Δεν έχετε δημιουργήσει τύπους συνδρομών. Πηγαίνετε στο tab "Τύποι" για να δημιουργήσετε.
              </p>
            ) : (
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε τύπο" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.price}€ / {type.duration_months} {type.duration_months === 1 ? 'μήνας' : 'μήνες'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Summary */}
          {selectedClub && selectedType && startDate && (
            <div className="p-3 bg-muted/50 border border-border space-y-1">
              <p className="text-sm font-medium">Περίληψη</p>
              <p className="text-sm">Σωματείο: {selectedClub.name}</p>
              <p className="text-sm">Τύπος: {selectedType.name}</p>
              <p className="text-sm">Ποσό: {selectedType.price}€</p>
              <p className="text-sm">
                Διάρκεια: {startDate} έως {format(addMonths(new Date(startDate), selectedType.duration_months), 'yyyy-MM-dd')}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
            Ακύρωση
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !selectedClub || !selectedTypeId}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            {loading ? 'Αποθήκευση...' : 'Δημιουργία'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
