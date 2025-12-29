import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

interface CoachSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CoachSearchInput: React.FC<CoachSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Αναζήτηση (όνομα, email)..."
}) => {
  return (
    <div className="relative w-full sm:w-[280px] mb-4">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-none pl-8 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          onClick={() => onChange('')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
