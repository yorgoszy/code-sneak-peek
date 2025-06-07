
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ActiveProgramsHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="rounded-none"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Επιστροφή
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
          Ενεργά Προγράμματα
        </h1>
      </div>
    </div>
  );
};
