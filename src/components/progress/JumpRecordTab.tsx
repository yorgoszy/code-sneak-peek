import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save } from "lucide-react";
import { format } from "date-fns";

interface JumpRecordTabProps {
  users: any[];
  onRecordSaved?: () => void;
}

interface JumpEntry {
  id: string;
  userId: string;
  cmjHeight: string;
  saving: boolean;
}

export const JumpRecordTab: React.FC<JumpRecordTabProps> = ({ users, onRecordSaved }) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JumpEntry[]>([
    { id: '1', userId: '', cmjHeight: '', saving: false }
  ]);

  const addNewEntry = () => {
    const newEntry: JumpEntry = {
      id: Date.now().toString(),
      userId: '',
      cmjHeight: '',
      saving: false
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (id: string, field: keyof JumpEntry, value: string) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const saveEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry || !entry.userId || !entry.cmjHeight) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive",
      });
      return;
    }

    // Set saving state
    setEntries(entries.map(e => 
      e.id === entryId ? { ...e, saving: true } : e
    ));

    try {
      // Create jump test session
      const { data: session, error: sessionError } = await supabase
        .from('jump_test_sessions')
        .insert({
          user_id: entry.userId,
          test_date: format(new Date(), 'yyyy-MM-dd'),
          notes: null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create jump test data
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .insert({
          test_session_id: session.id,
          cmj_height: parseFloat(entry.cmjHeight),
          sqj_height: null,
          dj_height: null,
          dj_contact_time: null,
          rsi: null,
          asymmetry_percentage: null
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή αποθηκεύτηκε",
      });

      // Clear this entry after successful save
      setEntries(entries.map(e => 
        e.id === entryId 
          ? { ...e, userId: '', cmjHeight: '', saving: false } 
          : e
      ));
      
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving jump test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση",
        variant: "destructive",
      });
      
      // Reset saving state on error
      setEntries(entries.map(e => 
        e.id === entryId ? { ...e, saving: false } : e
      ));
    }
  };

  return (
    <div className="space-y-2">
      <Card className="rounded-none w-80">
        <CardHeader className="p-2">
          <CardTitle className="text-xs">Non-CMJ</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1">
              <Select 
                value={entry.userId} 
                onValueChange={(value) => updateEntry(entry.id, 'userId', value)}
                disabled={entry.saving}
              >
                <SelectTrigger className="rounded-none h-7 text-xs flex-1">
                  <SelectValue placeholder="Χρήστης" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-xs">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.1"
                value={entry.cmjHeight}
                onChange={(e) => updateEntry(entry.id, 'cmjHeight', e.target.value)}
                placeholder="cm"
                className="rounded-none h-7 w-16 text-xs"
                disabled={entry.saving}
              />

              <Button
                type="button"
                size="icon"
                onClick={() => saveEntry(entry.id)}
                disabled={entry.saving}
                className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-7 w-7"
              >
                <Save className="w-3 h-3" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            onClick={addNewEntry}
            variant="outline"
            className="w-full rounded-none h-6 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Προσθήκη
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
