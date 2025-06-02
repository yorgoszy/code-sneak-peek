
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Eye, Edit, CheckCircle2 } from "lucide-react";

export const ProgramCardActions: React.FC = () => {
  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
        <Play className="w-4 h-4" />
        Έναρξη
      </Button>
      <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
        <Eye className="w-4 h-4" />
        Προβολή
      </Button>
      <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
        <Edit className="w-4 h-4" />
        Επεξεργασία
      </Button>
      <Button size="sm" variant="outline" className="rounded-none flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4" />
        Ολοκλήρωση
      </Button>
    </div>
  );
};
