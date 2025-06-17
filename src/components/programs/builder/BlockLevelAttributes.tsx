
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BlockLevelAttributesProps {
  blockSets?: number;
  blockReps?: string;
  blockTime?: string;
  blockRest?: string;
  blockTimecup?: string;
  onUpdate: (field: string, value: any) => void;
}

export const BlockLevelAttributes: React.FC<BlockLevelAttributesProps> = ({
  blockSets,
  blockReps,
  blockTime,
  blockRest,
  blockTimecup,
  onUpdate
}) => {
  return (
    <div className="bg-gray-100 border-t border-gray-300 p-3 mt-2">
      <div className="text-xs font-medium text-gray-700 mb-2">
        Στοιχεία Block (ισχύουν για όλες τις ασκήσεις)
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        <div>
          <Label className="text-xs text-gray-600">Sets</Label>
          <Input
            type="number"
            value={blockSets || ''}
            onChange={(e) => onUpdate('block_sets', parseInt(e.target.value) || undefined)}
            className="text-xs h-7 rounded-none"
            placeholder=""
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Reps</Label>
          <Input
            value={blockReps || ''}
            onChange={(e) => onUpdate('block_reps', e.target.value || undefined)}
            className="text-xs h-7 rounded-none"
            placeholder=""
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Time</Label>
          <Input
            value={blockTime || ''}
            onChange={(e) => onUpdate('block_time', e.target.value || undefined)}
            className="text-xs h-7 rounded-none"
            placeholder=""
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Rest</Label>
          <Input
            value={blockRest || ''}
            onChange={(e) => onUpdate('block_rest', e.target.value || undefined)}
            className="text-xs h-7 rounded-none"
            placeholder=""
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Timecup</Label>
          <Input
            value={blockTimecup || ''}
            onChange={(e) => onUpdate('block_timecup', e.target.value || undefined)}
            className="text-xs h-7 rounded-none"
            placeholder=""
          />
        </div>
      </div>
    </div>
  );
};
