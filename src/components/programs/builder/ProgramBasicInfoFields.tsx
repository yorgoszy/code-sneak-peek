
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProgramBasicInfoFieldsProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const ProgramBasicInfoFields: React.FC<ProgramBasicInfoFieldsProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
        <Input
          id="program-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Εισάγετε το όνομα του προγράμματος"
          className="rounded-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="program-description">Περιγραφή</Label>
        <Textarea
          id="program-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Προαιρετική περιγραφή του προγράμματος"
          className="rounded-none"
          rows={3}
        />
      </div>
    </>
  );
};
