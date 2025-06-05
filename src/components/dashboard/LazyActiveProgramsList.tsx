
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";

export const LazyActiveProgramsList: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { programs, loading, refetch } = useActivePrograms(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Trigger fetch όταν ανοίγει για πρώτη φορά
      refetch();
    }
  };

  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <Button
          onClick={handleToggle}
          variant="ghost"
          className="w-full flex items-center justify-between p-2 rounded-none"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="font-medium">Ενεργά Προγράμματα</span>
            {programs.length > 0 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {programs.length}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Φόρτωση προγραμμάτων...
              </div>
            ) : (
              <ActiveProgramsList 
                programs={programs.slice(0, 5)} 
                onRefresh={refetch}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
