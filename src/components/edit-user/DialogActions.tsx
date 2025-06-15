
import { Button } from "@/components/ui/button";

interface DialogActionsProps {
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const DialogActions = ({ loading, onClose, onSubmit }: DialogActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="rounded-none"
        disabled={loading}
      >
        Ακύρωση
      </Button>
      <Button 
        onClick={onSubmit}
        disabled={loading}
        className="rounded-none"
      >
        {loading ? "Ενημέρωση..." : "Ενημέρωση"}
      </Button>
    </div>
  );
};
