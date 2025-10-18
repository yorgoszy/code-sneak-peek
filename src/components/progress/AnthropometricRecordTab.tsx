import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnthropometricRecordTabProps {
  users: any[];
  onRecordSaved: () => void;
}

const anthropometricFields = [
  { key: 'height', label: 'Ύψος (cm)', type: 'number', step: '0.1' },
  { key: 'weight', label: 'Βάρος (kg)', type: 'number', step: '0.1' },
  { key: 'body_fat_percentage', label: 'Ποσοστό Λίπους (%)', type: 'number', step: '0.1' },
  { key: 'muscle_mass_percentage', label: 'Ποσοστό Μυϊκής Μάζας (%)', type: 'number', step: '0.1' },
  { key: 'chest_circumference', label: 'Περιφέρεια Στήθους (cm)', type: 'number', step: '0.1' },
  { key: 'waist_circumference', label: 'Περιφέρεια Μέσης (cm)', type: 'number', step: '0.1' },
  { key: 'hip_circumference', label: 'Περιφέρεια Ισχίων (cm)', type: 'number', step: '0.1' },
  { key: 'thigh_circumference', label: 'Περιφέρεια Μηρού (cm)', type: 'number', step: '0.1' },
  { key: 'arm_circumference', label: 'Περιφέρεια Βραχίονα (cm)', type: 'number', step: '0.1' },
];

export const AnthropometricRecordTab = ({ users, onRecordSaved }: AnthropometricRecordTabProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε χρήστη');
      return;
    }

    setLoading(true);

    try {
      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .insert({
          user_id: selectedUserId,
          test_date: testDate,
          notes: notes || null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create anthropometric data
      const dataToInsert: Record<string, any> = {
        test_session_id: session.id
      };

      anthropometricFields.forEach(field => {
        if (formData[field.key]) {
          dataToInsert[field.key] = parseFloat(formData[field.key]);
        }
      });

      const { error: dataError } = await supabase
        .from('anthropometric_test_data')
        .insert(dataToInsert);

      if (dataError) throw dataError;

      toast.success('Η σωματομετρική καταγραφή αποθηκεύτηκε επιτυχώς');
      
      // Reset form
      setSelectedUserId('');
      setTestDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setFormData({});
      
      onRecordSaved();
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user">Χρήστης *</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Επιλέξτε χρήστη" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Ημερομηνία</Label>
          <Input
            id="date"
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="rounded-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {anthropometricFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type}
              step={field.step}
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={`Εισάγετε ${field.label.toLowerCase()}`}
              className="rounded-none"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Σημειώσεις</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Προσθέστε σημειώσεις..."
          className="rounded-none min-h-[100px]"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
      >
        {loading ? 'Αποθήκευση...' : 'Αποθήκευση Καταγραφής'}
      </Button>
    </form>
  );
};
