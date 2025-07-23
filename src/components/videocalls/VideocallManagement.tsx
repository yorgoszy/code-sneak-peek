import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Plus, Trash2, Search, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, normalizeGreekText } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface User {
  id: string;
  name: string;
  email: string;
}

interface VideocallSession {
  id: string;
  user_id: string;
  videocall_date: string;
  created_at: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  app_users?: {
    name: string;
    email: string;
  };
}

export const VideocallManagement: React.FC = () => {
  const [videocalls, setVideocalls] = useState<VideocallSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadVideocalls(), loadUsers()]);
    setLoading(false);
  };

  const loadVideocalls = async () => {
    try {
      // Πρώτα φορτώνουμε τις βιντεοκλήσεις
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('booking_sessions')
        .select('id, user_id, booking_date, created_at, notes, status')
        .eq('booking_type', 'videocall')
        .order('booking_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setVideocalls([]);
        return;
      }

      // Στη συνέχεια φορτώνουμε τα στοιχεία των χρηστών
      const userIds = [...new Set(sessionsData.map(session => session.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Ενώνουμε τα δεδομένα
      const mappedData = sessionsData.map(item => {
        const user = usersData?.find(u => u.id === item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          videocall_date: item.booking_date,
          created_at: item.created_at,
          notes: item.notes,
          status: item.status as 'scheduled' | 'completed' | 'cancelled',
          app_users: user ? {
            name: user.name,
            email: user.email
          } : undefined
        };
      });

      setVideocalls(mappedData);
    } catch (error) {
      console.error('Error loading videocalls:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των βιντεοκλήσεων');
      setVideocalls([]);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .neq('role', 'admin')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε χρήστη');
      return;
    }

    setSaving(true);
    try {
      // Πρώτα παίρνουμε το section_id για τις βιντεοκλήσεις
      const { data: sectionData, error: sectionError } = await supabase
        .from('booking_sections')
        .select('id')
        .eq('name', 'Βιντεοκλήσεις')
        .single();

      if (sectionError) throw sectionError;

      // Προσθήκη δεδομένων στον πίνακα booking_sessions
      const { error } = await supabase
        .from('booking_sessions')
        .insert({
          user_id: selectedUserId,
          booking_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          booking_time: '00:00', // Default time for videocall sessions
          booking_type: 'videocall',
          status: 'completed', // Mark as completed since we're manually adding it
          notes: notes.trim() || null,
          section_id: sectionData.id
        });

      if (error) throw error;

      toast.success('Η βιντεοκλήση προστέθηκε επιτυχώς!');
      setIsDialogOpen(false);
      resetForm();
      await loadVideocalls();
    } catch (error) {
      console.error('Error saving videocall:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Η βιντεοκλήση διαγράφηκε επιτυχώς!');
      await loadVideocalls();
    } catch (error) {
      console.error('Error deleting videocall:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedDate(undefined);
    setNotes('');
    setUserSearchTerm('');
    setUserSearchOpen(false);
  };

  // Filter users based on search term (supports Greek text without accents)
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true;
    const searchableText = `${user.name} ${user.email}`;
    return normalizeGreekText(searchableText).includes(normalizeGreekText(userSearchTerm));
  });

  const selectedUser = users.find(user => user.id === selectedUserId);

  const filteredVideocalls = videocalls.filter(videocall => {
    const userName = videocall.app_users?.name || '';
    const userEmail = videocall.app_users?.email || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τις βιντεοκλήσεις...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            <span>Διαχείριση Βιντεοκλήσεων</span>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Προσθήκη Βιντεοκλήσης
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Αναζήτηση χρήστη..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Συνολικές Βιντεοκλήσεις</p>
                  <p className="text-2xl font-bold text-purple-600">{videocalls.length}</p>
                </div>
                <Video className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ολοκληρωμένες</p>
                  <p className="text-2xl font-bold text-green-600">
                    {videocalls.filter(v => v.status === 'completed').length}
                  </p>
                </div>
                <Video className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Προγραμματισμένες</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {videocalls.filter(v => v.status === 'scheduled').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videocalls List */}
        <div className="space-y-4">
          {filteredVideocalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν βιντεοκλήσεις</h3>
              <p>Δεν υπάρχουν καταχωρημένες βιντεοκλήσεις για αυτόν τον χρήστη.</p>
            </div>
          ) : (
            filteredVideocalls.map((videocall) => (
              <Card key={videocall.id} className="rounded-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Video className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {videocall.app_users?.name}
                        </h3>
                        <p className="text-sm text-gray-500">{videocall.app_users?.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(videocall.videocall_date), 'dd/MM/yyyy', { locale: el })}
                          </div>
                          <Badge 
                            variant={videocall.status === 'completed' ? 'default' : 'secondary'}
                            className="rounded-none"
                          >
                            {videocall.status === 'completed' ? 'Ολοκληρωμένη' : 
                             videocall.status === 'scheduled' ? 'Προγραμματισμένη' : 'Ακυρωμένη'}
                          </Badge>
                        </div>
                        {videocall.notes && (
                          <p className="text-sm text-gray-600 mt-1">Σημειώσεις: {videocall.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(videocall.id)}
                      className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>

      {/* Add Videocall Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open && !saving) {
          setIsDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Προσθήκη Βιντεοκλήσης</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">Χρήστης*</Label>
              <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userSearchOpen}
                    className={cn(
                      "w-full justify-between rounded-none",
                      !selectedUserId && "text-muted-foreground"
                    )}
                    disabled={saving}
                  >
                    {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Επιλέξτε χρήστη"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Αναζήτηση χρήστη..." 
                      value={userSearchTerm}
                      onValueChange={setUserSearchTerm}
                    />
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>Δεν βρέθηκε χρήστης.</CommandEmpty>
                      <CommandGroup>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.name} ${user.email}`}
                            onSelect={() => {
                              setSelectedUserId(user.id);
                              setUserSearchOpen(false);
                              setUserSearchTerm('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUserId === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name} ({user.email})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Ημερομηνία Βιντεοκλήσης (προαιρετική)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-none",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={saving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: el }) : "Επιλέξτε ημερομηνία"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Σημειώσεις</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-none"
                placeholder="Προαιρετικές σημειώσεις..."
                disabled={saving}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={saving}
                className="flex-1 rounded-none"
              >
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};