import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Euro, ShoppingCart } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  price: number;
}

interface BuyConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onConfirm: () => Promise<void>;
}

export const BuyConfirmDialog: React.FC<BuyConfirmDialogProps> = ({
  isOpen,
  onClose,
  course,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#cb8954]" />
            Επιβεβαίωση Αγοράς
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Θέλετε να αγοράσετε το μάθημα:</p>
            <p className="font-semibold text-foreground">{course.title}</p>
            <p className="flex items-center gap-1 text-[#cb8954] font-bold text-lg">
              <Euro className="w-4 h-4" />
              {course.price}€
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none" disabled={loading}>
            Ακύρωση
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-[#cb8954] hover:bg-[#cb8954]/90 rounded-none"
            disabled={loading}
          >
            {loading ? 'Αγορά...' : 'Επιβεβαίωση Αγοράς'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
