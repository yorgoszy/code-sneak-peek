
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface Attempt {
  id?: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
  is_1rm: boolean;
}

interface AttemptInputProps {
  attempt: Attempt;
  onUpdate: (field: keyof Attempt, value: any) => void;
  onRemove: () => void;
  onMark1RM: () => void;
}

export const AttemptInput = ({ attempt, onUpdate, onRemove, onMark1RM }: AttemptInputProps) => {
  return (
    <div className="flex items-center gap-1 mb-2 p-2 border rounded-none bg-white">
      <span className="text-xs font-medium w-6">#{attempt.attempt_number}</span>
      
      <Input
        type="number"
        step="0.5"
        placeholder="kg"
        value={attempt.weight_kg || ''}
        onChange={(e) => onUpdate('weight_kg', parseFloat(e.target.value) || 0)}
        className="rounded-none text-sm h-8 w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
      />

      <Input
        type="number"
        step="0.01"
        placeholder="m/s"
        value={attempt.velocity_ms || ''}
        onChange={(e) => onUpdate('velocity_ms', parseFloat(e.target.value) || 0)}
        className="rounded-none text-sm h-8 w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
      />

      <Button
        size="sm"
        variant={attempt.is_1rm ? "default" : "outline"}
        onClick={onMark1RM}
        className="rounded-none text-xs px-2 h-8"
      >
        1RM
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onRemove}
        className="rounded-none h-8 w-8 p-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};
