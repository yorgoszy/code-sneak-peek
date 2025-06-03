
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TestResult } from "./types";

interface TestViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestResult | null;
}

export const TestViewDialog = ({ isOpen, onClose, test }: TestViewDialogProps) => {
  if (!test) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle>Προβολή Τεστ</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Τύπος Τεστ</label>
              <Badge variant="outline" className="rounded-none mt-1">
                {test.test_type}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ημερομηνία</label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(test.test_date).toLocaleDateString('el-GR')}
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Αθλητής</label>
            <p className="text-sm text-gray-900 mt-1">{test.user_name}</p>
          </div>
          
          {test.exercise_count !== undefined && (
            <div>
              <label className="text-sm font-medium text-gray-700">Αριθμός Ασκήσεων</label>
              <p className="text-sm text-gray-900 mt-1">{test.exercise_count}</p>
            </div>
          )}
          
          {test.notes && (
            <div>
              <label className="text-sm font-medium text-gray-700">Σημειώσεις</label>
              <p className="text-sm text-gray-900 mt-1">{test.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
