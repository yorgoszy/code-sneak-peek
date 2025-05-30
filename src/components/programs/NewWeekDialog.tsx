
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NewWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newWeek: { name: string; week_number: number };
  setNewWeek: (week: { name: string; week_number: number }) => void;
  onCreateWeek: () => void;
}

export const NewWeekDialog: React.FC<NewWeekDialogProps> = ({
  open,
  onOpenChange,
  newWeek,
  setNewWeek,
  onCreateWeek
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Εβδομάδας
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Νέα Εβδομάδα</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Όνομα Εβδομάδας</Label>
            <Input
              className="rounded-none"
              value={newWeek.name}
              onChange={(e) => setNewWeek({...newWeek, name: e.target.value})}
              placeholder="π.χ. Εβδομάδα 1"
            />
          </div>
          <div>
            <Label>Αριθμός Εβδομάδας</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newWeek.week_number}
              onChange={(e) => setNewWeek({...newWeek, week_number: parseInt(e.target.value)})}
            />
          </div>
          <Button className="rounded-none w-full" onClick={onCreateWeek}>
            Δημιουργία
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
