
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  selectedUserId?: string;
  users: User[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (userId: string) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  selectedUserId,
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange
}) => {
  const athleteUsers = users.filter(user => user.role === 'athlete');

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl">Βασικές Πληροφορίες</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="program-name" className="text-sm font-medium">
              Όνομα Προγράμματος *
            </Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="π.χ. Πρόγραμμα Δύναμης 8 Εβδομάδων"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="athlete-select" className="text-sm font-medium">
              Αθλητής (προαιρετικό)
            </Label>
            <Select value={selectedUserId || ""} onValueChange={onAthleteChange}>
              <SelectTrigger id="athlete-select" className="rounded-none">
                <SelectValue placeholder="Επιλέξτε αθλητή..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Κανένας (Template)</SelectItem>
                {athleteUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description" className="text-sm font-medium">
            Περιγραφή (προαιρετικό)
          </Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προσθέστε μια περιγραφή για το πρόγραμμα..."
            className="rounded-none min-h-[80px] resize-none"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
