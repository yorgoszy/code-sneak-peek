
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Complete';
      case 'paused': return 'Paused';
      default: return status;
    }
  };

  return (
    <Badge 
      variant={getStatusBadgeVariant(status)} 
      className="rounded-none text-xs px-1 py-0"
    >
      {getStatusText(status)}
    </Badge>
  );
};
