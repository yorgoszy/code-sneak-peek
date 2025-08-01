
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProgramBuilderTriggerProps {
  onClick: () => void;
}

export const ProgramBuilderTrigger: React.FC<ProgramBuilderTriggerProps> = ({ onClick }) => {
  const isMobile = useIsMobile();

  return (
    <Button 
      className="rounded-none" 
      onClick={onClick}
      size={isMobile ? "sm" : "default"}
    >
      <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
      {isMobile ? 'Νέο' : 'Νέο Πρόγραμμα'}
    </Button>
  );
};
