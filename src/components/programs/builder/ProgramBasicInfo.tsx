
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { User } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Εισάγετε το όνομα του προγράμματος"
            className="rounded-none"
          />
        </div>

        <div>
          <Label htmlFor="program-description">Περιγραφή</Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προαιρετική περιγραφή του προγράμματος"
            className="rounded-none min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};
