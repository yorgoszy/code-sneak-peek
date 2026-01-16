import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Loader2 } from "lucide-react";
import { format, addDays, isBefore, isEqual, parseISO } from "date-fns";

import type { Json } from "@/integrations/supabase/types";

interface BookingSection {
  id: string;
  name: string;
  max_capacity: number;
  is_active: boolean | null;
  available_hours: Json | null;
}

interface SectionAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentSectionId: string | null;
  onSuccess: () => void;
}

// Map Greek day names to English for available_hours lookup
const dayNameMap: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

export const SectionAssignmentDialog: React.FC<SectionAssignmentDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  currentSectionId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>(currentSectionId || 'none');
  const [loading, setLoading] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSections();
      loadUserSubscription();
      setSelectedSection(currentSectionId || 'none');
    }
  }, [isOpen, currentSectionId, userId]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('id, name, max_capacity, is_active, available_hours')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα φόρτωσης τμημάτων"
      });
    }
  };

  const loadUserSubscription = async () => {
    try {
      // Try coach_subscriptions first
      const { data: coachSub } = await supabase
        .from('coach_subscriptions')
        .select('end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (coachSub?.end_date) {
        setSubscriptionEndDate(coachSub.end_date);
        return;
      }

      // Try user_subscriptions
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userSub?.end_date) {
        setSubscriptionEndDate(userSub.end_date);
      } else {
        setSubscriptionEndDate(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscriptionEndDate(null);
    }
  };

  const createBookingsForSection = async (sectionId: string, endDate: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.available_hours) return;

    const availableHours = section.available_hours as Record<string, string[]>;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDateObj = parseISO(endDate);
    
    const bookingsToCreate: Array<{
      user_id: string;
      section_id: string;
      booking_date: string;
      booking_time: string;
      booking_type: string;
      status: string;
    }> = [];

    // Iterate through each day from today until end date
    let currentDate = new Date(today);
    while (isBefore(currentDate, endDateObj) || isEqual(currentDate, endDateObj)) {
      const dayOfWeek = currentDate.getDay();
      const dayName = dayNameMap[dayOfWeek];
      const hoursForDay = availableHours[dayName] || [];

      // Create a booking for each time slot on this day
      for (const time of hoursForDay) {
        bookingsToCreate.push({
          user_id: userId,
          section_id: sectionId,
          booking_date: format(currentDate, 'yyyy-MM-dd'),
          booking_time: time,
          booking_type: 'gym_visit',
          status: 'confirmed'
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    if (bookingsToCreate.length > 0) {
      // First, delete existing future bookings for this user in any section
      const todayStr = format(today, 'yyyy-MM-dd');
      await supabase
        .from('booking_sessions')
        .delete()
        .eq('user_id', userId)
        .gte('booking_date', todayStr);

      // Insert new bookings
      const { error } = await supabase
        .from('booking_sessions')
        .insert(bookingsToCreate);

      if (error) {
        console.error('Error creating bookings:', error);
        throw error;
      }

      console.log(`Created ${bookingsToCreate.length} bookings until ${endDate}`);
    }
  };

  const deleteUserBookings = async () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    await supabase
      .from('booking_sessions')
      .delete()
      .eq('user_id', userId)
      .gte('booking_date', todayStr);
  };

  const handleAssign = async () => {
    if (selectedSection !== 'none' && !subscriptionEndDate) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Ο χρήστης δεν έχει ενεργή συνδρομή. Δεν μπορεί να ανατεθεί τμήμα."
      });
      return;
    }

    setLoading(true);
    try {
      // Update user's section
      const { error } = await supabase
        .from('app_users')
        .update({ section_id: selectedSection === 'none' ? null : selectedSection })
        .eq('id', userId);

      if (error) throw error;

      // Create or delete bookings based on selection
      if (selectedSection !== 'none' && subscriptionEndDate) {
        await createBookingsForSection(selectedSection, subscriptionEndDate);
        toast({
          title: "Επιτυχία",
          description: `Το τμήμα ανατέθηκε και δημιουργήθηκαν κρατήσεις μέχρι ${format(parseISO(subscriptionEndDate), 'dd/MM/yyyy')}`
        });
      } else {
        await deleteUserBookings();
        toast({
          title: "Επιτυχία",
          description: "Η ανάθεση τμήματος αφαιρέθηκε και διαγράφηκαν οι μελλοντικές κρατήσεις"
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning section:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Σφάλμα ανάθεσης τμήματος"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSectionData = sections.find(s => s.id === selectedSection);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ανάθεση Τμήματος
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Χρήστης</Label>
            <p className="font-medium">{userName}</p>
          </div>

          <div className="space-y-2">
            <Label>Τμήμα</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε τμήμα..." />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="none" className="rounded-none">
                  Χωρίς τμήμα
                </SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id} className="rounded-none">
                    {section.name} (max: {section.max_capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subscription info */}
          <div className="p-3 bg-muted rounded-none border">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              {subscriptionEndDate ? (
                <span>
                  Ενεργή συνδρομή έως: <strong>{format(parseISO(subscriptionEndDate), 'dd/MM/yyyy')}</strong>
                </span>
              ) : (
                <span className="text-destructive">Δεν υπάρχει ενεργή συνδρομή</span>
              )}
            </div>
            {selectedSection !== 'none' && subscriptionEndDate && selectedSectionData?.available_hours && (
              <p className="text-xs text-muted-foreground mt-2">
                Θα δημιουργηθούν κρατήσεις για όλες τις ημέρες του τμήματος μέχρι τη λήξη της συνδρομής
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleAssign}
              disabled={loading || (selectedSection !== 'none' && !subscriptionEndDate)}
              className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Αποθήκευση...
                </>
              ) : (
                'Αποθήκευση'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
