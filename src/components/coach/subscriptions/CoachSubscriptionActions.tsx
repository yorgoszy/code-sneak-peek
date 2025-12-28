import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, Pause, Play, RotateCcw, Edit2, Trash2 } from "lucide-react";

interface CoachSubscriptionActionsProps {
  subscriptionId: string;
  isPaused: boolean;
  isPaid: boolean;
  onTogglePayment: (id: string, currentStatus: boolean) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRenew: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CoachSubscriptionActions: React.FC<CoachSubscriptionActionsProps> = ({
  subscriptionId,
  isPaused,
  isPaid,
  onTogglePayment,
  onPause,
  onResume,
  onRenew,
  onEdit,
  onDelete
}) => {
  return (
    <div className="flex gap-1">
      {/* Payment Status Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onTogglePayment(subscriptionId, isPaid)}
        className={`rounded-none h-7 w-7 md:h-8 md:w-8 p-0 ${isPaid 
          ? 'border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10' 
          : 'border-red-300 text-red-600 hover:bg-red-50'}`}
        title={isPaid ? "Σημείωση ως μη πληρωμένη" : "Σημείωση ως πληρωμένη"}
      >
        {isPaid ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <X className="w-3 h-3 md:w-4 md:h-4" />}
      </Button>

      {/* Pause/Resume Button */}
      {isPaused ? (
        <Button
          size="sm"
          onClick={() => onResume(subscriptionId)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 w-7 md:h-8 md:w-8 p-0"
          title="Συνέχιση συνδρομής"
        >
          <Play className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPause(subscriptionId)}
          className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0 border-orange-300 text-orange-600 hover:bg-orange-50"
          title="Παύση συνδρομής"
        >
          <Pause className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      )}

      {/* Renewal Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRenew(subscriptionId)}
        className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0 border-blue-300 text-blue-600 hover:bg-blue-50"
        title="Ανανέωση συνδρομής"
      >
        <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
      </Button>

      {/* Edit Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEdit(subscriptionId)}
        className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-50"
        title="Επεξεργασία συνδρομής"
      >
        <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
      </Button>

      {/* Delete Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDelete(subscriptionId)}
        className="rounded-none h-7 w-7 md:h-8 md:w-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
        title="Διαγραφή συνδρομής"
      >
        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
      </Button>
    </div>
  );
};
