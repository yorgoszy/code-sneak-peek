
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProgramBuilderTriggerProps {
  onClick: () => void;
}

export const ProgramBuilderTrigger: React.FC<ProgramBuilderTriggerProps> = ({ onClick }) => {
  const handleClick = () => {
    // Open program builder in new window/tab
    window.open('/dashboard/program-builder', '_blank');
  };

  return (
    <Button className="rounded-none" onClick={handleClick}>
      <Plus className="w-4 h-4 mr-2" />
      Νέο Πρόγραμμα
    </Button>
  );
};
