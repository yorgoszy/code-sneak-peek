
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({
  isOpen,
  onClose,
  children,
  className = "max-w-2xl max-h-[80vh] rounded-none flex flex-col"
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </Dialog>
  );
};
