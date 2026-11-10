import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { normalizeSectionSchedule } from './sectionAssignmentSchedule';

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

const dayShortLabels: Record<string, string> = {
  monday: 'Δευ',
  tuesday: 'Τρί',
  wednesday: 'Τετ',
  thursday: 'Πέμ',
  friday: 'Παρ',
  saturday: 'Σάβ',
  sunday: 'Κυρ'
};

const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type SelectedSchedule = Record<string, string[]>;

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
  const [selectedSchedule, setSelectedSchedule] = useState<SelectedSchedule>({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSections();
      setSubscriptionEndDate(null);
      loadUserSubscription();
      setSelectedSection(currentSectionId || 'none');
      setSelectedSchedule({});
    }
  }, [isOpen, currentSectionId, userId]);

  useEffect(() => {
    if (!isOpen || selectedSection === 'none') {
      setSelectedSchedule({});
      return;
    }

    if (selectedSection !== currentSectionId) {
      setSelectedSchedule({});
      return;
    }

    let cancelled = false;
    const loadExistingSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const { data: profile, error: profileError } = await supabase.from('app_users')
          .select('section_schedule').eq('id', userId).single();
        if (profileError) throw profileError;
        if (cancelled) return;
        if (profile.section_schedule !== null) {
          const section = sections.find(s => s.id === selectedSection);
          setSelectedSchedule(normalizeSectionSchedule(profile.section_schedule, section?.available_hours));
          return;
        }
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('booking_sessions')
          .select('booking_date, booking_time')
          .eq('user_id', userId)
          .eq('section_id', selectedSection)
          .is('coach_id', null)
          .gte('booking_date', today)
          .in('booking_type', ['gym_visit', 'gym'])
          .in('status', ['confirmed', 'completed']);

        if (error) throw error;

        const schedule: SelectedSchedule = {};
        (data || []).forEach(booking => {
          const date = new Date(`${booking.booking_date}T12:00:00`);
          const dayName = dayNameMap[date.getDay()];
          const bookingTime = String(booking.booking_time).substring(0, 5);
          if (!schedule[dayName]) schedule[dayName] = [];
          if (!schedule[dayName].includes(bookingTime)) schedule[dayName].push(bookingTime);
        });
        Object.values(schedule).forEach(times => times.sort());
        if (!cancelled) setSelectedSchedule(schedule);
      } catch (error) {
        console.error('Error loading existing booking schedule:', error);
        if (!cancelled) setSelectedSchedule({});
      } finally {
        if (!cancelled) setLoadingSchedule(false);
      }
    };

    loadExistingSchedule();
    return () => { cancelled = true; };
  }, [isOpen, selectedSection, currentSectionId, userId, sections]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('id, name, max_capacity, is_active, available_hours')
        .eq('is_active', true)
        .is('coach_id', null)
        .eq('booking_type', 'gym_visit')
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
      const { data: userSub, error } = await supabase
        .from('user_subscriptions')
        .select('end_date')
        .eq('user_id', userId)
        .is('coach_id', null)
        .eq('status', 'active')
        .or('is_paused.is.null,is_paused.eq.false')
        .gte('end_date', format(new Date(), 'yyyy-MM-dd'))
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

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

  const handleAssign = async () => {
    if (selectedSection !== 'none' && !subscriptionEndDate) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Ο χρήστης δεν έχει ενεργή συνδρομή. Δεν μπορεί να ανατεθεί τμήμα."
      });
      return;
    }

    const hasSelectedSlot = Object.values(selectedSchedule).some(times => times.length > 0);
    if (selectedSection !== 'none' && !hasSelectedSlot) {
      toast({
        variant: "destructive",
        title: "Επιλέξτε ημέρα και ώρα",
        description: "Χρειάζεται τουλάχιστον μία ώρα σε μία ημέρα."
      });
      return;
    }

    setLoading(true);
    try {
      const { data: count, error } = await supabase.rpc('save_admin_section_assignment', {
        p_user_id: userId,
        p_section_id: selectedSection === 'none' ? null : selectedSection,
        p_schedule: selectedSection === 'none' ? {} : selectedSchedule
      });
      if (error) throw error;
      toast({
        title: "Επιτυχία",
        description: selectedSection === 'none'
          ? "Η ανάθεση αφαιρέθηκε. Οι ολοκληρωμένες επισκέψεις διατηρήθηκαν."
          : `Αποθηκεύτηκαν όλες οι επιλογές. Δημιουργήθηκαν ${count || 0} κρατήσεις έως ${subscriptionEndDate ? format(parseISO(subscriptionEndDate), 'dd/MM/yyyy') : ''}.`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning section:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: error && typeof error === 'object' && 'message' in error ? String(error.message) : "Σφάλμα ανάθεσης τμήματος"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSectionData = sections.find(s => s.id === selectedSection);
  const sectionDays = React.useMemo(() => {
    const availableHours = (selectedSectionData?.available_hours || {}) as Record<string, string[]>;
    return orderedDays
      .filter(day => Array.isArray(availableHours[day]) && availableHours[day].length > 0)
      .map(day => ({
        day,
        times: availableHours[day].map(time => String(time).substring(0, 5)).sort()
      }));
  }, [selectedSectionData]);

  const toggleDay = (day: string, times: string[]) => {
    setSelectedSchedule(previous => {
      if ((previous[day] || []).length > 0) {
        const next = { ...previous };
        delete next[day];
        return next;
      }
      return { ...previous, [day]: times };
    });
  };

  const toggleTime = (day: string, time: string) => {
    setSelectedSchedule(previous => {
      const dayTimes = previous[day] || [];
      const nextTimes = dayTimes.includes(time)
        ? dayTimes.filter(value => value !== time)
        : [...dayTimes, time].sort();
      const next = { ...previous };
      if (nextTimes.length === 0) delete next[day];
      else next[day] = nextTimes;
      return next;
    });
  };

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
            <Select disabled={loading} value={selectedSection} onValueChange={setSelectedSection}>
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

          {selectedSection !== 'none' && sectionDays.length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm">Ημέρες και ώρες προσέλευσης</Label>
              <div className="max-h-56 overflow-y-auto border divide-y divide-border/60">
                {loadingSchedule ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Φόρτωση επιλογών...
                  </div>
                ) : sectionDays.map(({ day, times }) => {
                  const selectedTimes = selectedSchedule[day] || [];
                  const dayActive = selectedTimes.length > 0;
                  return (
                    <div key={day} className="flex items-center gap-1.5 flex-wrap px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggleDay(day, times)}
                        className={`shrink-0 px-1.5 py-0.5 text-xs font-medium rounded-none border transition-colors ${
                          dayActive
                            ? 'bg-[#00ffba] text-black border-[#00ffba]'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {dayShortLabels[day]}
                      </button>
                      {times.map(time => {
                        const active = selectedTimes.includes(time);
                        return (
                          <button
                            key={`${day}-${time}`}
                            type="button"
                            onClick={() => toggleTime(day, time)}
                            className={`px-1 py-0.5 text-[11px] leading-none rounded-none border transition-colors ${
                              active
                                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                                : 'bg-background text-foreground border-border hover:bg-muted'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Πατήστε την ημέρα για όλες τις ώρες ή επιλέξτε μεμονωμένες ώρες.
              </p>
            </div>
          )}

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
                Θα δημιουργηθούν κρατήσεις μόνο για τις επιλεγμένες ημέρες και ώρες μέχρι τη λήξη της συνδρομής
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
              disabled={loading || loadingSchedule || (selectedSection !== 'none' && !subscriptionEndDate)}
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
