
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramAssignment } from "@/types/assignments";
import { User } from "@/components/programs/types";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentDialogProps {
  users: User[];
  onCreateAssignment: (assignment: any) => void;
  onOpenChange: () => void;
  editingAssignment?: ProgramAssignment | null;
  isOpen: boolean;
}

export const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  users,
  onCreateAssignment,
  onOpenChange,
  editingAssignment,
  isOpen
}) => {
  const [formData, setFormData] = useState({
    program_id: '',
    assignment_type: 'individual' as 'individual' | 'group',
    athlete_id: '',
    group_id: '',
    start_date: '',
    end_date: '',
    status: 'active',
    notes: ''
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPrograms();
      fetchGroups();
      
      if (editingAssignment) {
        setFormData({
          program_id: editingAssignment.program_id,
          assignment_type: editingAssignment.assignment_type,
          athlete_id: editingAssignment.athlete_id || '',
          group_id: editingAssignment.group_id || '',
          start_date: editingAssignment.start_date,
          end_date: editingAssignment.end_date || '',
          status: editingAssignment.status,
          notes: editingAssignment.notes || ''
        });
      } else {
        setFormData({
          program_id: '',
          assignment_type: 'individual',
          athlete_id: '',
          group_id: '',
          start_date: '',
          end_date: '',
          status: 'active',
          notes: ''
        });
      }
    }
  }, [isOpen, editingAssignment]);

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from('programs')
      .select('id, name, description')
      .order('name');
    setPrograms(data || []);
  };

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('athlete_groups')
      .select('id, name, athlete_ids')
      .order('name');
    setGroups(data || []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program_id || !formData.start_date) {
      alert('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία');
      return;
    }

    if (formData.assignment_type === 'individual' && !formData.athlete_id) {
      alert('Παρακαλώ επιλέξτε αθλητή');
      return;
    }

    if (formData.assignment_type === 'group' && !formData.group_id) {
      alert('Παρακαλώ επιλέξτε ομάδα');
      return;
    }

    const assignmentData = {
      program_id: formData.program_id,
      assignment_type: formData.assignment_type,
      athlete_id: formData.assignment_type === 'individual' ? formData.athlete_id : null,
      group_id: formData.assignment_type === 'group' ? formData.group_id : null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      status: formData.status,
      notes: formData.notes || null
    };

    onCreateAssignment(assignmentData);
  };

  // Show all users from app_users table instead of filtering by role
  const availableUsers = users || [];

  console.log('Available users in AssignmentDialog:', availableUsers);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingAssignment ? 'Επεξεργασία Ανάθεσης' : 'Νέα Ανάθεση Προγράμματος'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="program_id">Πρόγραμμα *</Label>
            <Select value={formData.program_id} onValueChange={(value) => setFormData(prev => ({ ...prev, program_id: value }))}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε πρόγραμμα" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignment_type">Τύπος Ανάθεσης *</Label>
            <Select value={formData.assignment_type} onValueChange={(value: 'individual' | 'group') => 
              setFormData(prev => ({ ...prev, assignment_type: value, athlete_id: '', group_id: '' }))}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Μεμονωμένος Αθλητής</SelectItem>
                <SelectItem value="group">Ομάδα</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.assignment_type === 'individual' && (
            <div>
              <Label htmlFor="athlete_id">Αθλητής *</Label>
              <Select value={formData.athlete_id} onValueChange={(value) => setFormData(prev => ({ ...prev, athlete_id: value }))}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε αθλητή" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.email && `(${user.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Διαθέσιμοι χρήστες: {availableUsers.length}
              </p>
            </div>
          )}

          {formData.assignment_type === 'group' && (
            <div>
              <Label htmlFor="group_id">Ομάδα *</Label>
              <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε ομάδα" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.athlete_ids?.length || 0} αθλητές)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Ημερομηνία Έναρξης *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="rounded-none"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Ημερομηνία Λήξης</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="rounded-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Κατάσταση</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ενεργό</SelectItem>
                <SelectItem value="paused">Παυμένο</SelectItem>
                <SelectItem value="completed">Ολοκληρωμένο</SelectItem>
                <SelectItem value="cancelled">Ακυρωμένο</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Σημειώσεις</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Προαιρετικές σημειώσεις..."
              className="rounded-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onOpenChange} className="rounded-none">
              Ακύρωση
            </Button>
            <Button type="submit" className="rounded-none">
              {editingAssignment ? 'Ενημέρωση' : 'Δημιουργία'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
