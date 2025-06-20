
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface DialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] h-[90vh] m-2' : 'max-w-4xl h-[80vh]'} rounded-none p-0 flex flex-col`}>
        {children}
      </DialogContent>
    </Dialog>
  );
};
