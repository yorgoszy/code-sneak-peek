import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface UserPhase {
  id: string;
  user_id: string;
  year: number;
  month: number;
  phase: string;
  notes: string | null;
}

const PHASES = [
  { value: 'preparation', label: 'Προετοιμασία' },
  { value: 'strength', label: 'Δύναμη' },
  { value: 'hypertrophy', label: 'Υπερτροφία' },
  { value: 'power', label: 'Ισχύς' },
  { value: 'competition', label: 'Αγωνιστική' },
  { value: 'recovery', label: 'Αποκατάσταση' },
  { value: 'off-season', label: 'Off-Season' },
];

const MONTHS = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
  'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
  'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ά]/g, 'α')
    .replace(/[έ]/g, 'ε')
    .replace(/[ή]/g, 'η')
    .replace(/[ί]/g, 'ι')
    .replace(/[ό]/g, 'ο')
    .replace(/[ύ]/g, 'υ')
    .replace(/[ώ]/g, 'ω');
};

export default function AnnualPlanning() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [phases, setPhases] = useState<UserPhase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPhases();
    }
  }, [selectedUser, year]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, avatar_url')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
  };

  const fetchUserPhases = async () => {
    if (!selectedUser) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_annual_phases')
      .select('*')
      .eq('user_id', selectedUser.id)
      .eq('year', year);

    if (error) {
      console.error('Error fetching phases:', error);
    } else {
      setPhases(data || []);
    }
    setLoading(false);
  };

  const handlePhaseChange = async (month: number, phaseValue: string) => {
    if (!selectedUser) return;

    const existingPhase = phases.find(p => p.month === month);

    if (phaseValue === 'none') {
      // Delete phase
      if (existingPhase) {
        const { error } = await supabase
          .from('user_annual_phases')
          .delete()
          .eq('id', existingPhase.id);

        if (error) {
          toast.error('Σφάλμα κατά τη διαγραφή');
          return;
        }
        setPhases(phases.filter(p => p.id !== existingPhase.id));
        toast.success('Η φάση διαγράφηκε');
      }
      return;
    }

    if (existingPhase) {
      // Update existing
      const { error } = await supabase
        .from('user_annual_phases')
        .update({ phase: phaseValue, updated_at: new Date().toISOString() })
        .eq('id', existingPhase.id);

      if (error) {
        toast.error('Σφάλμα κατά την ενημέρωση');
        return;
      }

      setPhases(phases.map(p => 
        p.id === existingPhase.id ? { ...p, phase: phaseValue } : p
      ));
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('user_annual_phases')
        .insert({
          user_id: selectedUser.id,
          year,
          month,
          phase: phaseValue
        })
        .select()
        .single();

      if (error) {
        toast.error('Σφάλμα κατά την αποθήκευση');
        return;
      }

      setPhases([...phases, data]);
    }
    toast.success('Η φάση αποθηκεύτηκε');
  };

  const getPhaseForMonth = (month: number): string => {
    const phase = phases.find(p => p.month === month);
    return phase?.phase || 'none';
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const normalized = normalizeString(searchQuery);
    return users.filter(user => {
      const normalizedName = normalizeString(user.name);
      const normalizedEmail = normalizeString(user.email);
      return normalizedName.includes(normalized) || normalizedEmail.includes(normalized);
    });
  }, [users, searchQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ετήσιος Προγραμματισμός
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Αναζήτηση Χρήστη</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση με όνομα ή email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>
          </div>

          {/* User List */}
          {searchQuery && (
            <div className="max-h-60 overflow-y-auto border rounded-none">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Δεν βρέθηκαν χρήστες
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                      selectedUser?.id === user.id ? 'bg-muted' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-none">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="rounded-none"
              >
                Αλλαγή
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Year Navigation & Phases Grid */}
      {selectedUser && (
        <Card className="rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Φάσεις Προπόνησης - {selectedUser.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(y => y - 1)}
                  className="rounded-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-16 text-center">{year}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(y => y + 1)}
                  className="rounded-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MONTHS.map((monthName, index) => {
                const month = index + 1;
                const currentPhase = getPhaseForMonth(month);
                
                return (
                  <div key={month} className="space-y-2">
                    <label className="text-sm font-medium">{monthName}</label>
                    <Select
                      value={currentPhase}
                      onValueChange={(value) => handlePhaseChange(month, value)}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Επιλέξτε φάση" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Καμία --</SelectItem>
                        {PHASES.map(phase => (
                          <SelectItem key={phase.value} value={phase.value}>
                            {phase.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
