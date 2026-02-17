
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
        <h1 className="text-sm sm:text-lg md:text-xl font-bold flex items-center gap-1">
          <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#00ffba]" />
          Ενεργά Προγράμματα
        </h1>
      </div>
    </div>
  );
};
