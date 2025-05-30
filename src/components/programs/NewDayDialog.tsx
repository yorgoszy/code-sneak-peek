
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NewDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newDay: { name: string; day_number: number };
  setNewDay: (day: { name: string; day_number: number }) => void;
  onCreateDay: () => void;
  onSetCurrentWeek: () => void;
}

export const NewDayDialog: React.FC<NewDayDialogProps> = ({
  open,
  onOpenChange,
  newDay,
  setNewDay,
  onCreateDay,
  onSetCurrentWeek
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-none"
          onClick={onSetCurrentWeek}
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Ημέρας
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Νέα Ημέρα</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Όνομα Ημέρας</Label>
            <Input
              className="rounded-none"
              value={newDay.name}
              onChange={(e) => setNewDay({...newDay, name: e.target.value})}
              placeholder="π.χ. Δευτέρα - Upper Body"
            />
          </div>
          <div>
            <Label>Αριθμός Ημέρας</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newDay.day_number}
              onChange={(e) => setNewDay({...newDay, day_number: parseInt(e.target.value)})}
            />
          </div>
          <Button className="rounded-none w-full" onClick={onCreateDay}>
            Δημιουργία
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
