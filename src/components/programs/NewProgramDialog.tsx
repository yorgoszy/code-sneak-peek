
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { User } from './types';

interface NewProgramDialogProps {
  newProgram: { name: string; description: string; athlete_id: string };
  setNewProgram: (program: { name: string; description: string; athlete_id: string }) => void;
  users: User[];
  onCreateProgram: () => void;
}

export const NewProgramDialog: React.FC<NewProgramDialogProps> = ({
  newProgram,
  setNewProgram,
  users,
  onCreateProgram
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateClick = () => {
    onCreateProgram();
    setIsOpen(false);
  };

  return (
    <>
      <Button className="rounded-none" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Νέο Πρόγραμμα
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Δημιουργία Νέου Προγράμματος</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Όνομα Προγράμματος</Label>
              <Input
                className="rounded-none"
                value={newProgram.name}
                onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                placeholder="π.χ. Πρόγραμμα Δύναμης"
              />
            </div>
            <div>
              <Label>Περιγραφή</Label>
              <Textarea
                className="rounded-none"
                value={newProgram.description}
                onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                placeholder="Περιγραφή προγράμματος..."
              />
            </div>
            <div>
              <Label>Αθλητής (προαιρετικό)</Label>
              <Select value={newProgram.athlete_id} onValueChange={(value) => setNewProgram({...newProgram, athlete_id: value})}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε αθλητή" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Χωρίς συγκεκριμένο αθλητή</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-none w-full" onClick={handleCreateClick}>
              Δημιουργία
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
