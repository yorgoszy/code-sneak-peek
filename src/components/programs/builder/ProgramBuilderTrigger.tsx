
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProgramBuilderTriggerProps {
  onClick?: () => void;
}

export const ProgramBuilderTrigger: React.FC<ProgramBuilderTriggerProps> = ({ onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/dashboard/program-builder-fullscreen');
    }
  };

  return (
    <Button className="rounded-none" onClick={handleClick}>
      <Plus className="w-4 h-4 mr-2" />
      Νέο Πρόγραμμα
    </Button>
  );
};
