import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Search, Check, Save, UserPlus } from "lucide-react";
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

interface SavedMacrocycle {
  id: string;
  name: string;
  year: number;
  phases: { month: number; phase: string }[];
  created_at: string;
}

interface AssignedMacrocycle {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  year: number;
  phases: UserPhase[];
  assigned_at: string;
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
  const [selectedPhases, setSelectedPhases] = useState<{ month: number; phase: string }[]>([]);
  const [assignedMacrocycles, setAssignedMacrocycles] = useState<AssignedMacrocycle[]>([]);
  const [savedMacrocycles, setSavedMacrocycles] = useState<SavedMacrocycle[]>([]);
  const [macrocycleName, setMacrocycleName] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    fetchUsers();
    fetchAssignedMacrocycles();
    fetchSavedMacrocycles();
  }, []);

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

  const fetchAssignedMacrocycles = async () => {
    const { data, error } = await supabase
      .from('user_annual_phases')
      .select(`
        id,
        user_id,
        year,
        month,
        phase,
        notes,
        created_at,
        app_users!user_annual_phases_user_id_fkey (
          name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned macrocycles:', error);
      return;
    }

    // Group by user_id and year
    const grouped = (data || []).reduce((acc, item) => {
      const key = `${item.user_id}-${item.year}`;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          user_id: item.user_id,
          user_name: (item.app_users as any)?.name || 'Άγνωστος',
          user_avatar: (item.app_users as any)?.avatar_url,
          year: item.year,
          phases: [],
          assigned_at: item.created_at
        };
      }
      acc[key].phases.push(item);
      return acc;
    }, {} as Record<string, AssignedMacrocycle>);

    setAssignedMacrocycles(Object.values(grouped));
  };

  const fetchSavedMacrocycles = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('saved_macrocycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved macrocycles:', error);
        return;
      }

      setSavedMacrocycles(data || []);
    } catch (err) {
      console.error('Error fetching saved macrocycles:', err);
    }
  };

  const handleCellClick = (month: number, phaseValue: string) => {
    const exists = selectedPhases.some(p => p.month === month && p.phase === phaseValue);
    
    if (exists) {
      setSelectedPhases(selectedPhases.filter(p => !(p.month === month && p.phase === phaseValue)));
    } else {
      setSelectedPhases([...selectedPhases, { month, phase: phaseValue }]);
    }
  };

  const isPhaseSelected = (month: number, phaseValue: string): boolean => {
    return selectedPhases.some(p => p.month === month && p.phase === phaseValue);
  };

  const handleSave = async () => {
    if (!macrocycleName.trim()) {
      toast.error('Εισάγετε όνομα για τον μακροκύκλο');
      return;
    }

    if (selectedPhases.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία φάση');
      return;
    }

    const { error } = await (supabase as any)
      .from('saved_macrocycles')
      .insert({
        name: macrocycleName,
        year,
        phases: selectedPhases
      });

    if (error) {
      toast.error('Σφάλμα κατά την αποθήκευση');
      return;
    }

    toast.success('Ο μακροκύκλος αποθηκεύτηκε');
    setMacrocycleName('');
    setSelectedPhases([]);
    fetchSavedMacrocycles();
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error('Επιλέξτε χρήστη');
      return;
    }

    if (selectedPhases.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία φάση');
      return;
    }

    // Insert all phases for the user
    const phasesToInsert = selectedPhases.map(p => ({
      user_id: selectedUser.id,
      year,
      month: p.month,
      phase: p.phase
    }));

    const { error } = await supabase
      .from('user_annual_phases')
      .insert(phasesToInsert);

    if (error) {
      toast.error('Σφάλμα κατά την ανάθεση');
      return;
    }

    toast.success(`Ο μακροκύκλος ανατέθηκε στον ${selectedUser.name}`);
    setSelectedPhases([]);
    setSelectedUser(null);
    fetchAssignedMacrocycles();
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

  const getPhaseColor = (phaseValue: string) => {
    return PHASES.find(p => p.value === phaseValue)?.color || 'bg-gray-500';
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
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none">
              <TabsTrigger value="new" className="rounded-none">Νέος Μακροκύκλος</TabsTrigger>
              <TabsTrigger value="assigned" className="rounded-none">Ανατεθημένα</TabsTrigger>
              <TabsTrigger value="saved" className="rounded-none">Αποθηκευμένα</TabsTrigger>
            </TabsList>

            {/* New Macrocycle Tab */}
            <TabsContent value="new" className="p-3 sm:p-6 space-y-4">
              {/* Year Navigation */}
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Φάσεις Προπόνησης</h3>
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

              {/* Phases Grid */}
              <div className="overflow-x-auto">
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
                        <td className="border p-0.5 sm:p-1 lg:p-2 font-medium bg-background">
                          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
                            <div className={cn("w-1.5 h-1.5 sm:w-2 lg:w-3 sm:h-2 lg:h-3 rounded-full flex-shrink-0", phase.color)} />
                            <span className="md:hidden text-[8px] font-semibold">{phase.shortLabel}</span>
                            <span className="hidden md:inline lg:hidden text-[10px]">{phase.shortLabel}</span>
                            <span className="hidden lg:inline text-sm">{phase.label}</span>
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
              </div>

              {/* User Selection for Assignment */}
              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium">Επιλογή Χρήστη για Ανάθεση</label>
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

                {/* User List Dropdown */}
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
              </div>

              {/* Save Macrocycle Name */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Όνομα Μακροκύκλου (για αποθήκευση)</label>
                <Input
                  placeholder="π.χ. Προετοιμασία Αγώνων 2025"
                  value={macrocycleName}
                  onChange={(e) => setMacrocycleName(e.target.value)}
                  className="rounded-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="rounded-none flex-1"
                  disabled={selectedPhases.length === 0 || !macrocycleName.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Αποθήκευση
                </Button>
                <Button
                  onClick={handleAssign}
                  className="rounded-none flex-1"
                  style={{ backgroundColor: '#00ffba', color: 'black' }}
                  disabled={selectedPhases.length === 0 || !selectedUser}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ανάθεση
                </Button>
              </div>
            </TabsContent>

            {/* Assigned Macrocycles Tab */}
            <TabsContent value="assigned" className="p-3 sm:p-6">
              {assignedMacrocycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Δεν υπάρχουν ανατεθειμένοι μακροκύκλοι
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedMacrocycles.map((macrocycle) => (
                    <Card key={macrocycle.id} className="rounded-none">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={macrocycle.user_avatar || undefined} />
                            <AvatarFallback>{getInitials(macrocycle.user_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{macrocycle.user_name}</p>
                            <p className="text-sm text-muted-foreground">Έτος: {macrocycle.year}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {macrocycle.phases.map((phase, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "text-xs px-2 py-1 text-white",
                                getPhaseColor(phase.phase)
                              )}
                            >
                              {MONTHS_FULL[phase.month - 1]} - {PHASES.find(p => p.value === phase.phase)?.shortLabel}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Macrocycles Tab */}
            <TabsContent value="saved" className="p-3 sm:p-6">
              {savedMacrocycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Δεν υπάρχουν αποθηκευμένοι μακροκύκλοι
                </div>
              ) : (
                <div className="space-y-4">
                  {savedMacrocycles.map((macrocycle) => (
                    <Card key={macrocycle.id} className="rounded-none">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{macrocycle.name}</p>
                            <p className="text-sm text-muted-foreground">Έτος: {macrocycle.year}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none"
                            onClick={() => {
                              setSelectedPhases(macrocycle.phases);
                              setYear(macrocycle.year);
                              setActiveTab('new');
                              toast.success('Ο μακροκύκλος φορτώθηκε');
                            }}
                          >
                            Χρήση
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {macrocycle.phases.map((phase, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "text-xs px-2 py-1 text-white",
                                getPhaseColor(phase.phase)
                              )}
                            >
                              {MONTHS_FULL[phase.month - 1]} - {PHASES.find(p => p.value === phase.phase)?.shortLabel}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnualPlanning;
