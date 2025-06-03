
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ProgramCardStatusBadgeProps {
  status: string;
}

export const ProgramCardStatusBadge: React.FC<ProgramCardStatusBadgeProps> = ({ status }) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Badge 
      variant={getStatusBadgeVariant(status)} 
      className="rounded-none text-xs px-1 py-0"
    >
      {status === 'active' ? 'Ε' : status}
    </Badge>
  );
};
