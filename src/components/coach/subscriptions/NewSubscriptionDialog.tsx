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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Athlete {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface NewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  onSuccess: () => void;
}

export const NewSubscriptionDialog: React.FC<NewSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  coachId,
  onSuccess
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open && coachId) {
      fetchData();
    }
  }, [open, coachId]);

  const fetchData = async () => {
    try {
      // Fetch coach's athletes from coach_users table
      const { data: athletesData, error: athletesError } = await supabase
        .from('coach_users')
        .select('id, name, email, avatar_url')
        .eq('coach_id', coachId)
        .order('name');

      if (athletesError) throw athletesError;
      setAthletes(athletesData || []);

      // Fetch coach's subscription types
      const { data: typesData, error: typesError } = await supabase
        .from('subscription_types')
        .select('id, name, price, duration_months')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;
      setSubscriptionTypes(typesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    }
  };

  const handleSave = async () => {
    if (!selectedAthlete || !selectedTypeId || !startDate) {
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

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedAthlete.id,
          subscription_type_id: selectedTypeId,
          coach_id: coachId,
          start_date: startDate,
          end_date: endDate,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Η συνδρομή δημιουργήθηκε');
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setSelectedAthlete(null);
      setSelectedTypeId('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Σφάλμα δημιουργίας συνδρομής');
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(a => 
    matchesSearchTerm(a.name, searchTerm) || 
    matchesSearchTerm(a.email, searchTerm)
  );

  const selectedType = subscriptionTypes.find(t => t.id === selectedTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Νέα Συνδρομή</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Athlete Selection */}
          <div className="space-y-2">
            <Label>Αθλητής</Label>
            {selectedAthlete ? (
              <div className="flex items-center gap-3 p-3 border border-border bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedAthlete.avatar_url || undefined} />
                  <AvatarFallback>{selectedAthlete.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedAthlete.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAthlete.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedAthlete(null)}
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
                    placeholder="Αναζήτηση αθλητή..."
                    className="pl-10 rounded-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border">
                  {searchTerm.trim().length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      Πληκτρολογήστε για αναζήτηση...
                    </div>
                  ) : filteredAthletes.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      Δεν βρέθηκαν αθλητές
                    </div>
                  ) : (
                    filteredAthletes.map(athlete => (
                      <div
                        key={athlete.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        onClick={() => setSelectedAthlete(athlete)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={athlete.avatar_url || undefined} />
                          <AvatarFallback>{athlete.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.email}</p>
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
          {selectedAthlete && selectedType && startDate && (
            <div className="p-3 bg-muted/50 border border-border space-y-1">
              <p className="text-sm font-medium">Περίληψη</p>
              <p className="text-sm">Αθλητής: {selectedAthlete.name}</p>
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
            disabled={loading || !selectedAthlete || !selectedTypeId}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            {loading ? 'Αποθήκευση...' : 'Δημιουργία'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
