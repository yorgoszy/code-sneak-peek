
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProgramDetailsSidebar } from './program-details/ProgramDetailsSidebar';
import { ProgramDetailsContent } from './program-details/ProgramDetailsContent';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface ProgramDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export const ProgramDetailsDialog: React.FC<ProgramDetailsDialogProps> = ({
  isOpen,
  onClose,
  program
}) => {
  const [activeSection, setActiveSection] = useState(1);

  if (!program) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-black text-white border-gray-700 rounded-none p-0">
        <div className="flex">
          <ProgramDetailsSidebar 
            onClose={onClose} 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <ProgramDetailsContent 
            program={program} 
            onClose={onClose} 
            activeSection={activeSection}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
