
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProgramBuilderTriggerProps {
  onClick: () => void;
}

export const ProgramBuilderTrigger: React.FC<ProgramBuilderTriggerProps> = ({ onClick }) => {
  return (
    <Button className="rounded-none" onClick={onClick}>
      <Plus className="w-4 h-4 mr-2" />
      Νέο Πρόγραμμα
    </Button>
  );
};
