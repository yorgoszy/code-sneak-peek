import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JumpRecordTabProps {
  users: any[];
  onRecordSaved?: () => void;
}

export const JumpRecordTab: React.FC<JumpRecordTabProps> = ({ users, onRecordSaved }) => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [testDate, setTestDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Jump test data states
  const [cmj, setCmj] = useState<string>("");
  const [sqj, setSqj] = useState<string>("");
  const [djHeight, setDjHeight] = useState<string>("");
  const [djContact, setDjContact] = useState<string>("");
  const [rsi, setRsi] = useState<string>("");
  const [asymmetry, setAsymmetry] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create jump test session
      const { data: session, error: sessionError } = await supabase
        .from('jump_test_sessions')
        .insert({
          user_id: selectedUser,
          test_date: format(testDate, 'yyyy-MM-dd'),
          notes: notes || null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create jump test data
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .insert({
          test_session_id: session.id,
          cmj_height: cmj ? parseFloat(cmj) : null,
          sqj_height: sqj ? parseFloat(sqj) : null,
          dj_height: djHeight ? parseFloat(djHeight) : null,
          dj_contact_time: djContact ? parseFloat(djContact) : null,
          rsi: rsi ? parseFloat(rsi) : null,
          asymmetry_percentage: asymmetry ? parseFloat(asymmetry) : null
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή αποθηκεύτηκε με επιτυχία",
      });

      // Reset form
      setCmj("");
      setSqj("");
      setDjHeight("");
      setDjContact("");
      setRsi("");
      setAsymmetry("");
      setNotes("");
      setTestDate(new Date());
      
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving jump test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User and Date Selection */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm">Στοιχεία Χρήστη</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Χρήστης *</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
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
              <Label>Ημερομηνία Τεστ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-none",
                      !testDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {testDate ? format(testDate, "dd/MM/yyyy") : <span>Επιλέξτε ημερομηνία</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none">
                  <Calendar
                    mode="single"
                    selected={testDate}
                    onSelect={(date) => date && setTestDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm">Σημειώσεις</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Προσθέστε σημειώσεις..."
            className="rounded-none min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
      >
        {loading ? "Αποθήκευση..." : "Αποθήκευση Καταγραφής"}
      </Button>
    </form>
  );
};
