
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Users, User } from "lucide-react";
import { User as UserType } from '../types';
import { supabase } from "@/integrations/supabase/client";

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  athlete_id?: string;
  start_date?: string;
  training_days?: number;
  users: UserType[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (athlete_id: string) => void;
  onStartDateChange: (start_date: string) => void;
  onTrainingDaysChange: (training_days: number) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  athlete_id,
  start_date,
  training_days,
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onStartDateChange,
  onTrainingDaysChange
}) => {
  const [assignmentType, setAssignmentType] = useState<'none' | 'individual' | 'group'>('none');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('athlete_groups')
      .select('id, name, athlete_ids')
      .order('name');
    setGroups(data || []);
  };

  const athletes = users.filter(user => user.role === 'athlete');

  const handleAthleteSelect = (athleteId: string) => {
    if (!selectedAthletes.includes(athleteId)) {
      const newSelected = [...selectedAthletes, athleteId];
      setSelectedAthletes(newSelected);
      // For backward compatibility, set the first selected athlete as the main athlete_id
      if (newSelected.length === 1) {
        onAthleteChange(athleteId);
      }
    }
  };

  const handleAthleteRemove = (athleteId: string) => {
    const newSelected = selectedAthletes.filter(id => id !== athleteId);
    setSelectedAthletes(newSelected);
    // Update the main athlete_id to the first remaining athlete or empty
    onAthleteChange(newSelected.length > 0 ? newSelected[0] : '');
  };

  const handleGroupSelect = (groupId: string) => {
    if (!selectedGroups.includes(groupId)) {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleGroupRemove = (groupId: string) => {
    setSelectedGroups(selectedGroups.filter(id => id !== groupId));
  };

  const getAthleteName = (athleteId: string) => {
    return athletes.find(athlete => athlete.id === athleteId)?.name || '';
  };

  const getGroupName = (groupId: string) => {
    return groups.find(group => group.id === groupId)?.name || '';
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Όνομα Προγράμματος *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="π.χ. Εβδομαδιαίο Πρόγραμμα Δύναμης"
            className="rounded-none"
          />
        </div>

        <div>
          <Label htmlFor="description">Περιγραφή</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Περιγραφή του προγράμματος..."
            className="rounded-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Ημερομηνία Έναρξης</Label>
            <Input
              id="start_date"
              type="date"
              value={start_date || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="training_days">Ημέρες Προπόνησης/Εβδομάδα</Label>
            <Input
              id="training_days"
              type="number"
              min="1"
              max="7"
              value={training_days || ''}
              onChange={(e) => onTrainingDaysChange(parseInt(e.target.value) || 0)}
              placeholder="π.χ. 3"
              className="rounded-none"
            />
          </div>
        </div>

        <div>
          <Label>Ανάθεση Προγράμματος</Label>
          <Select value={assignmentType} onValueChange={(value: 'none' | 'individual' | 'group') => setAssignmentType(value)}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Επιλέξτε τύπο ανάθεσης" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Χωρίς Ανάθεση</SelectItem>
              <SelectItem value="individual">Μεμονωμένοι Αθλητές</SelectItem>
              <SelectItem value="group">Ομάδες</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assignmentType === 'individual' && (
          <div>
            <Label>Επιλογή Αθλητών</Label>
            <Select onValueChange={handleAthleteSelect}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Προσθήκη αθλητή" />
              </SelectTrigger>
              <SelectContent>
                {athletes
                  .filter(athlete => !selectedAthletes.includes(athlete.id))
                  .map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {athlete.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {selectedAthletes.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label>Επιλεγμένοι Αθλητές:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedAthletes.map((athleteId) => (
                    <Badge key={athleteId} variant="secondary" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {getAthleteName(athleteId)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleAthleteRemove(athleteId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {assignmentType === 'group' && (
          <div>
            <Label>Επιλογή Ομάδων</Label>
            <Select onValueChange={handleGroupSelect}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Προσθήκη ομάδας" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter(group => !selectedGroups.includes(group.id))
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {group.name} ({group.athlete_ids?.length || 0} αθλητές)
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {selectedGroups.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label>Επιλεγμένες Ομάδες:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedGroups.map((groupId) => (
                    <Badge key={groupId} variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {getGroupName(groupId)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleGroupRemove(groupId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
