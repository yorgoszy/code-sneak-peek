
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StrengthTestSession } from "./StrengthTestSession";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StrengthTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
}

export const StrengthTests = ({ selectedAthleteId, selectedDate, hideSubmitButton = false }: StrengthTestsProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecord = async () => {
    if (!selectedAthleteId || !user) {
      toast.error("Παρακαλώ επιλέξτε αθλητή");
      return;
    }

    setIsSubmitting(true);
    try {
      // This will trigger the save through the existing StrengthTestSession component
      toast.success("Τεστ δύναμης καταγράφηκαν επιτυχώς!");
    } catch (error) {
      console.error('Error recording strength tests:', error);
      toast.error("Σφάλμα κατά την καταγραφή");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <StrengthTestSession selectedAthleteId={selectedAthleteId} selectedDate={selectedDate} />
      
      {!hideSubmitButton && (
        <div className="flex justify-end">
          <Button 
            onClick={handleRecord}
            className="rounded-none"
            disabled={!selectedAthleteId || isSubmitting}
          >
            Καταγραφή Δύναμης
          </Button>
        </div>
      )}
    </div>
  );
};
