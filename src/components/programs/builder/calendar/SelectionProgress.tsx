
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Send } from 'lucide-react';

interface SelectionProgressProps {
  selectedCount: number;
  totalDays: number;
  onAssign?: () => void;
  canAssign?: boolean;
  loading?: boolean;
}

export const SelectionProgress: React.FC<SelectionProgressProps> = ({
  selectedCount,
  totalDays,
  onAssign,
  canAssign = false,
  loading = false
}) => {
  const isComplete = selectedCount >= totalDays && totalDays > 0;

  // Αν η επιλογή ολοκληρώθηκε και υπάρχει onAssign, εμφανίζουμε κουμπί ανάθεσης
  if (isComplete && onAssign && canAssign) {
    return (
      <Button
        onClick={onAssign}
        disabled={loading}
        className="w-full h-auto py-3 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span className="font-semibold">Ανάθεση Προγράμματος</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-3 rounded-none">
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
        Πρόοδος Επιλογής
        {isComplete && <CheckCircle className="w-4 h-4 text-[#00ffba]" />}
      </div>
      <div className="text-lg font-semibold text-gray-900">
        Επιλεγμένες ημερομηνίες: {selectedCount} / {totalDays}
      </div>
      <div className="w-full bg-gray-200 rounded-none h-2 mt-2">
        <div 
          className="bg-[#00ffba] h-2 rounded-none transition-all duration-300"
          style={{ width: `${Math.min((selectedCount / totalDays) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};
