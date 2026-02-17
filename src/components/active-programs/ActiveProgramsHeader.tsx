
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ActiveProgramsHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="rounded-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Επιστροφή</span>
        </Button>
        <h1 className="text-base sm:text-xl md:text-2xl font-bold flex items-center gap-1 sm:gap-2">
          <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#00ffba]" />
          Ενεργά Προγράμματα
        </h1>
      </div>
    </div>
  );
};
