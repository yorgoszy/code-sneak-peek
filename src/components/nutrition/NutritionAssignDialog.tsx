import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { el } from "date-fns/locale";

interface NutritionAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
}

export const NutritionAssignDialog: React.FC<NutritionAssignDialogProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, photo_url')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Επιλέξτε χρήστη');
      return;
    }

    setLoading(true);
    try {
      // Generate training dates (one for each day)
      const trainingDates: string[] = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        trainingDates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }

      const { error } = await supabase
        .from('nutrition_assignments')
        .insert([{
          plan_id: plan.id,
          user_id: selectedUserId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          training_dates: trainingDates,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast.error('Σφάλμα κατά την ανάθεση');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00ffba]" />
            Ανάθεση Προγράμματος
          </DialogTitle>
          <p className="text-sm text-gray-500">{plan.name}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Επιλέξτε Χρήστη</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Αναζήτηση χρήστη..."
                className="pl-9 rounded-none"
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredUsers.map(user => (
                <Card
                  key={user.id}
                  className={`rounded-none cursor-pointer transition-colors ${
                    selectedUserId === user.id 
                      ? 'border-[#00ffba] bg-[#00ffba]/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <CardContent className="p-2 flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#cb8954] rounded-full flex items-center justify-center text-white text-xs">
                      {user.name?.charAt(0)}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ημερομηνία Έναρξης</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-none">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(startDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={el}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Ημερομηνία Λήξης</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-none">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(endDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={el}
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedUser && (
            <Card className="rounded-none bg-[#00ffba]/5 border-[#00ffba]">
              <CardContent className="p-3 text-sm">
                <p className="font-medium">Επιλεγμένος χρήστης: {selectedUser.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Διάρκεια: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-none">
              Ακύρωση
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
              className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ανάθεση...
                </>
              ) : (
                'Ανάθεση'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
