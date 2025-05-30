
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NewBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newBlock: { name: string; block_order: number };
  setNewBlock: (block: { name: string; block_order: number }) => void;
  onCreateBlock: () => void;
  onSetCurrentDay: () => void;
}

export const NewBlockDialog: React.FC<NewBlockDialogProps> = ({
  open,
  onOpenChange,
  newBlock,
  setNewBlock,
  onCreateBlock,
  onSetCurrentDay
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSetCurrentDay}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Νέο Block</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Όνομα Block</Label>
            <Input
              className="rounded-none"
              value={newBlock.name}
              onChange={(e) => setNewBlock({...newBlock, name: e.target.value})}
              placeholder="π.χ. Warm-up, Main Set"
            />
          </div>
          <div>
            <Label>Σειρά</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newBlock.block_order}
              onChange={(e) => setNewBlock({...newBlock, block_order: parseInt(e.target.value)})}
            />
          </div>
          <Button className="rounded-none w-full" onClick={onCreateBlock}>
            Δημιουργία
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
