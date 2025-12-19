import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ChevronLeft, ChevronRight, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  { value: 'corrective', label: 'Corrective', shortLabel: 'COR', color: 'bg-red-500' },
  { value: 'stabilization', label: 'Stabilization Training', shortLabel: 'STB', color: 'bg-orange-500' },
  { value: 'strength', label: 'Strength Training', shortLabel: 'STR', color: 'bg-yellow-500' },
  { value: 'non-functional-hypertrophy', label: 'Non-Functional Hypertrophy', shortLabel: 'NFH', color: 'bg-lime-500' },
  { value: 'functional-hypertrophy', label: 'Functional Hypertrophy', shortLabel: 'FH', color: 'bg-green-500' },
  { value: 'maximal-strength', label: 'Maximal Strength Training', shortLabel: 'MAX', color: 'bg-teal-500' },
  { value: 'power', label: 'Power Training', shortLabel: 'PWR', color: 'bg-blue-500' },
  { value: 'max-power', label: 'Max Power Training', shortLabel: 'MPW', color: 'bg-purple-500' },
];

const MONTHS = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
const MONTHS_FULL = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ'];

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

const AnnualPlanning: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [phases, setPhases] = useState<UserPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

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

  const handleCellClick = async (month: number, phaseValue: string) => {
    if (!selectedUser) return;

    const existingPhase = phases.find(p => p.month === month);

    // If clicking the same phase, remove it
    if (existingPhase?.phase === phaseValue) {
      const { error } = await supabase
        .from('user_annual_phases')
        .delete()
        .eq('id', existingPhase.id);

      if (error) {
        toast.error('Σφάλμα κατά τη διαγραφή');
        return;
      }
      setPhases(phases.filter(p => p.id !== existingPhase.id));
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
  };

  const isPhaseSelected = (month: number, phaseValue: string): boolean => {
    const phase = phases.find(p => p.month === month);
    return phase?.phase === phaseValue;
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
    <div className="space-y-0 p-2 sm:p-4 lg:p-0">
      <Card className="rounded-none border-l-0">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            Ετήσιος Προγραμματισμός
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          {/* User Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Αναζήτηση Χρήστη</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση με όνομα ή email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowUserList(true);
                }}
                onFocus={() => setShowUserList(true)}
                className="pl-10 rounded-none"
              />
            </div>
          </div>

          {/* User List */}
          {showUserList && searchQuery && (
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
                      setShowUserList(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors",
                      selectedUser?.id === user.id && "bg-muted"
                    )}
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
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted rounded-none">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs sm:text-sm">{getInitials(selectedUser.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{selectedUser.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedUser.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="rounded-none text-xs sm:text-sm"
              >
                Αλλαγή
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Year Navigation & Phases Grid */}
      {selectedUser && (
        <Card className="rounded-none border-l-0">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <CardTitle className="text-base sm:text-lg">
                Φάσεις Προπόνησης - {selectedUser.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(y => y - 1)}
                  className="rounded-none h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base sm:text-lg font-semibold w-14 sm:w-16 text-center">{year}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(y => y + 1)}
                  className="rounded-none h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-1 sm:p-6">
            <table className="w-full border-collapse text-[9px] sm:text-sm">
              <thead>
                <tr>
                  <th className="border p-0.5 sm:p-2 bg-muted text-left w-[60px] sm:w-[200px]">Φάση</th>
                  {MONTHS.map((month, index) => (
                    <th key={index} className="border p-0.5 sm:p-2 bg-muted text-center w-[20px] sm:w-auto">
                      <span className="sm:hidden">{month}</span>
                      <span className="hidden sm:inline">{MONTHS_FULL[index]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase.value}>
                    <td className="border p-0.5 sm:p-2 font-medium bg-background">
                      <div className="flex items-center gap-0.5 sm:gap-2">
                        <div className={cn("w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0", phase.color)} />
                        <span className="sm:hidden text-[8px] font-semibold">{phase.shortLabel}</span>
                        <span className="hidden sm:inline text-sm">{phase.label}</span>
                      </div>
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const month = monthIndex + 1;
                      const isSelected = isPhaseSelected(month, phase.value);
                      
                      return (
                        <td
                          key={monthIndex}
                          onClick={() => handleCellClick(month, phase.value)}
                          className={cn(
                            "border p-0 sm:p-2 text-center cursor-pointer transition-colors hover:bg-muted h-5 sm:h-auto",
                            isSelected && phase.color
                          )}
                        >
                          {isSelected && (
                            <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 mx-auto text-white" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnualPlanning;
