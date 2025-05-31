
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  athleteId: string;
  users: User[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (athleteId: string) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  athleteId,
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange
}) => {
  const handleAthleteChange = (value: string) => {
    const id = value === "no-athlete" ? "" : value;
    onAthleteChange(id);
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Όνομα Προγράμματος *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          className="rounded-none"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="π.χ. Πρόγραμμα Δύναμης"
        />
        
        <div>
          <Label>Περιγραφή</Label>
          <Textarea
            className="rounded-none"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Περιγραφή προγράμματος..."
          />
        </div>

        <div>
          <Label>Αθλητής (προαιρετικό)</Label>
          <Select 
            value={athleteId || "no-athlete"} 
            onValueChange={handleAthleteChange}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Επιλέξτε αθλητή" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-athlete">Χωρίς συγκεκριμένο αθλητή</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
