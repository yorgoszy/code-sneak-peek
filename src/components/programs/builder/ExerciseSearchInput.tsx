
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ExerciseSearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ExerciseSearchInput: React.FC<ExerciseSearchInputProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" style={{ zIndex: 10 }} />
      <Input
        placeholder="Αναζήτηση άσκησης..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 rounded-none h-8 text-[11px] placeholder:text-[11px]"
      />
    </div>
  );
};
