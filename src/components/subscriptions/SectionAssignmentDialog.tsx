import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

interface BookingSection {
  id: string;
  name: string;
  max_capacity: number;
  is_active: boolean;
}

interface SectionAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentSectionId: string | null;
  onSuccess: () => void;
}

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
  const [selectedSection, setSelectedSection] = useState<string>(currentSectionId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSections();
      setSelectedSection(currentSectionId || '');
    }
  }, [isOpen, currentSectionId]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_sections')
        .select('id, name, max_capacity, is_active')
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

  const handleAssign = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ section_id: selectedSection || null })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: selectedSection 
          ? "Το τμήμα ανατέθηκε επιτυχώς" 
          : "Η ανάθεση τμήματος αφαιρέθηκε"
      });

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
                <SelectItem value="" className="rounded-none">
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
              disabled={loading}
              className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
            >
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
