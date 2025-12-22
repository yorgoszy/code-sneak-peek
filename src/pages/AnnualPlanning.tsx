import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Search, Check, Save, UserPlus, Eye, Pencil, Trash2, X, RotateCcw } from "lucide-react";
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

interface DialogMonthlyPhase {
  month: number;
  week: number;
  phase: string;
}

interface DialogWeeklyPhase {
  month: number;
  week: number;
  day: number;
  phase: string;
}

const PHASES = [
  { value: 'corrective', label: 'Corrective', shortLabel: 'COR', color: 'bg-red-500' },
  { value: 'stabilization', label: 'Stabilization Training', shortLabel: 'STB', color: 'bg-orange-500' },
  { value: 'connecting-linking', label: 'Connecting Linking', shortLabel: 'CL', color: 'bg-yellow-500' },
  { value: 'movement-skills', label: 'Movement Skills', shortLabel: 'MS', color: 'bg-amber-500' },
  { value: 'non-functional-hypertrophy', label: 'Non-Functional Hypertrophy', shortLabel: 'NFH', color: 'bg-lime-500' },
  { value: 'functional-hypertrophy', label: 'Functional Hypertrophy', shortLabel: 'FH', color: 'bg-green-500' },
  { value: 'maximal-strength', label: 'Maximal Strength Training', shortLabel: 'MAX', color: 'bg-teal-500' },
  { value: 'power', label: 'Power Training', shortLabel: 'PWR', color: 'bg-blue-500' },
  { value: 'endurance', label: 'Endurance', shortLabel: 'END', color: 'bg-purple-500' },
  { value: 'competition', label: 'Competition', shortLabel: 'COMP', color: 'bg-pink-500' },
];

// Sub-phases for weekly planning based on monthly phase selection
const SUB_PHASES: Record<string, { value: string; label: string; shortLabel: string; color: string }[]> = {
  'maximal-strength': [
    { value: 'starting-strength', label: 'Starting Strength', shortLabel: 'START', color: 'bg-teal-400' },
    { value: 'explosive-strength', label: 'Explosive Strength', shortLabel: 'EXPL', color: 'bg-teal-500' },
    { value: 'reactive-strength', label: 'Reactive Strength', shortLabel: 'REACT', color: 'bg-teal-600' },
  ],
  'power': [
    { value: 'str-spd', label: 'Strength/Speed', shortLabel: 'STR/SPD', color: 'bg-blue-400' },
    { value: 'pwr', label: 'Power', shortLabel: 'PWR', color: 'bg-blue-500' },
    { value: 'spd-str', label: 'Speed/Strength', shortLabel: 'SPD/STR', color: 'bg-blue-600' },
    { value: 'spd', label: 'Speed', shortLabel: 'SPD', color: 'bg-blue-700' },
  ],
  'endurance': [
    { value: 'str-end', label: 'Strength Endurance', shortLabel: 'STR/END', color: 'bg-purple-400' },
    { value: 'pwr-end', label: 'Power Endurance', shortLabel: 'PWR/END', color: 'bg-purple-500' },
    { value: 'spd-end', label: 'Speed Endurance', shortLabel: 'SPD/END', color: 'bg-purple-600' },
    { value: 'aero-end', label: 'Aerobic Endurance', shortLabel: 'AERO/END', color: 'bg-purple-700' },
  ],
};

const MONTHS = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
const MONTHS_FULL = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ'];
const MONTHS_DROPDOWN = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
const DAYS = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'];
const DAYS_FULL = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

// Calculate weeks per month for a given year
const getWeeksInMonth = (year: number, month: number): number => {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday=0
  const totalDays = startDayOfWeek + daysInMonth;
  return Math.ceil(totalDays / 7);
};

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
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [dialogMacrocycle, setDialogMacrocycle] = useState<AssignedMacrocycle | null>(null);
  const [dialogPhases, setDialogPhases] = useState<{ month: number; phase: string }[]>([]);
  const [dialogYear, setDialogYear] = useState(new Date().getFullYear());

  // Dialog monthly and weekly phases
  const [dialogMonthlyPhases, setDialogMonthlyPhases] = useState<DialogMonthlyPhase[]>([]);
  const [dialogWeeklyPhases, setDialogWeeklyPhases] = useState<DialogWeeklyPhase[]>([]);
  const [dialogWeeklyMonth, setDialogWeeklyMonth] = useState(new Date().getMonth() + 1);

  // Monthly planning state
  const [monthlyPhases, setMonthlyPhases] = useState<{ month: number; week: number; phase: string }[]>([]);

  // Weekly planning state
  const [selectedWeeklyMonth, setSelectedWeeklyMonth] = useState(new Date().getMonth() + 1);
  const [weeklyPhases, setWeeklyPhases] = useState<{ month: number; week: number; day: number; phase: string }[]>([]);

  // Get annual phase for a specific month
  const getAnnualPhaseForMonth = (month: number) => {
    return selectedPhases.find(p => p.month === month);
  };

  // Get monthly phase for a specific week
  const getMonthlyPhaseForWeek = (month: number, week: number) => {
    return monthlyPhases.find(p => p.month === month && p.week === week);
  };

  // Get sub-phases for weekly planning based on monthly phase selection
  // Get phases available for a specific week based on monthly planning
  const getWeeklySubPhasesForWeek = (weekNumber: number) => {
    // Βρίσκουμε τις φάσεις που έχουν επιλεγεί στον Μηνιαίο Προγραμματισμό για αυτή την εβδομάδα
    const weekPhases = monthlyPhases.filter(p => p.month === selectedWeeklyMonth && p.week === weekNumber);
    const uniquePhaseValues = [...new Set(weekPhases.map(p => p.phase))];
    
    // Collect all sub-phases for selected monthly phases
    const allSubPhases: { value: string; label: string; shortLabel: string; color: string; parentPhase: string }[] = [];
    
    uniquePhaseValues.forEach(phaseValue => {
      const subPhases = SUB_PHASES[phaseValue];
      if (subPhases) {
        // If there are sub-phases, add them
        subPhases.forEach(sp => {
          allSubPhases.push({ ...sp, parentPhase: phaseValue });
        });
      } else {
        // Otherwise, use the main phase as-is
        const mainPhase = PHASES.find(p => p.value === phaseValue);
        if (mainPhase) {
          allSubPhases.push({ ...mainPhase, parentPhase: phaseValue });
        }
      }
    });
    
    return allSubPhases;
  };

  // Get all unique sub-phases across all weeks for row rendering
  const getWeeklySubPhases = useMemo(() => {
    const monthPhases = monthlyPhases.filter(p => p.month === selectedWeeklyMonth);
    const uniquePhaseValues = [...new Set(monthPhases.map(p => p.phase))];
    
    // Collect all sub-phases for selected monthly phases
    const allSubPhases: { value: string; label: string; shortLabel: string; color: string; parentPhase: string }[] = [];
    
    uniquePhaseValues.forEach(phaseValue => {
      const subPhases = SUB_PHASES[phaseValue];
      if (subPhases) {
        // If there are sub-phases, add them
        subPhases.forEach(sp => {
          allSubPhases.push({ ...sp, parentPhase: phaseValue });
        });
      } else {
        // Otherwise, use the main phase as-is
        const mainPhase = PHASES.find(p => p.value === phaseValue);
        if (mainPhase) {
          allSubPhases.push({ ...mainPhase, parentPhase: phaseValue });
        }
      }
    });
    
    return allSubPhases;
  }, [monthlyPhases, selectedWeeklyMonth]);

  // Calculate actual calendar weeks for a month (Monday-based)
  const getCalendarWeeksForMonth = useMemo(() => {
    const firstDay = new Date(year, selectedWeeklyMonth - 1, 1);
    const daysInMonth = new Date(year, selectedWeeklyMonth, 0).getDate();
    
    // Get day of week (0=Sunday, 1=Monday, etc.) and convert to Monday-based (0=Monday)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday=0
    
    const weeks: (number | null)[][] = [];
    let currentDate = 1;
    
    // Calculate number of weeks needed
    const totalDays = startDayOfWeek + daysInMonth;
    const numWeeks = Math.ceil(totalDays / 7);
    
    for (let week = 0; week < numWeeks; week++) {
      const weekDates: (number | null)[] = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startDayOfWeek) {
          weekDates.push(null); // Empty cell before month starts
        } else if (currentDate > daysInMonth) {
          weekDates.push(null); // Empty cell after month ends
        } else {
          weekDates.push(currentDate);
          currentDate++;
        }
      }
      weeks.push(weekDates);
    }
    
    return weeks;
  }, [year, selectedWeeklyMonth]);

  // Handle monthly phase cell click - allows multiple phases per week
  const handleMonthlyPhaseClick = (month: number, week: number, phase: string) => {
    setMonthlyPhases(prev => {
      const existing = prev.find(p => p.month === month && p.week === week && p.phase === phase);
      if (existing) {
        // Remove if already selected
        return prev.filter(p => !(p.month === month && p.week === week && p.phase === phase));
      }
      // Add new phase (without removing existing ones for this week)
      return [...prev, { month, week, phase }];
    });
  };

  // Check if monthly phase is selected
  const isMonthlyPhaseSelected = (month: number, week: number, phase: string) => {
    return monthlyPhases.some(p => p.month === month && p.week === week && p.phase === phase);
  };

  // Handle weekly phase cell click - allows multiple phases per day
  const handleWeeklyPhaseClick = (month: number, week: number, day: number, phase: string) => {
    setWeeklyPhases(prev => {
      const existing = prev.find(p => p.month === month && p.week === week && p.day === day && p.phase === phase);
      if (existing) {
        // Remove if already selected
        return prev.filter(p => !(p.month === month && p.week === week && p.day === day && p.phase === phase));
      }
      // Add new phase (without removing existing ones for this day)
      return [...prev, { month, week, day, phase }];
    });
  };

  // Check if weekly phase is selected
  const isWeeklyPhaseSelected = (month: number, week: number, day: number, phase: string) => {
    return weeklyPhases.some(p => p.month === month && p.week === week && p.day === day && p.phase === phase);
  };

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

    // Insert annual phases
    const phasesToInsert = selectedPhases.map(p => ({
      user_id: selectedUser.id,
      year,
      month: p.month,
      phase: p.phase
    }));

    const { error: annualError } = await supabase
      .from('user_annual_phases')
      .insert(phasesToInsert);

    if (annualError) {
      toast.error('Σφάλμα κατά την ανάθεση');
      return;
    }

    // Insert monthly phases
    if (monthlyPhases.length > 0) {
      const monthlyToInsert = monthlyPhases.map(p => ({
        user_id: selectedUser.id,
        year,
        month: p.month,
        week: p.week,
        phase: p.phase
      }));

      await supabase
        .from('user_monthly_phases')
        .insert(monthlyToInsert);
    }

    // Insert weekly phases
    if (weeklyPhases.length > 0) {
      const weeklyToInsert = weeklyPhases.map(p => ({
        user_id: selectedUser.id,
        year,
        month: p.month,
        week: p.week,
        day: p.day,
        phase: p.phase
      }));

      await supabase
        .from('user_weekly_phases')
        .insert(weeklyToInsert);
    }

    toast.success(`Ο μακροκύκλος ανατέθηκε στον ${selectedUser.name}`);
    setSelectedPhases([]);
    setMonthlyPhases([]);
    setWeeklyPhases([]);
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

  const handleDeleteAssignment = async (macrocycle: AssignedMacrocycle) => {
    const phaseIds = macrocycle.phases.map(p => p.id);
    
    // Delete annual phases
    const { error } = await supabase
      .from('user_annual_phases')
      .delete()
      .in('id', phaseIds);

    if (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
      return;
    }

    // Delete monthly phases
    await supabase
      .from('user_monthly_phases')
      .delete()
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);

    // Delete weekly phases
    await supabase
      .from('user_weekly_phases')
      .delete()
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);

    toast.success('Ο μακροκύκλος διαγράφηκε');
    fetchAssignedMacrocycles();
  };

  const handleViewAssignment = async (macrocycle: AssignedMacrocycle) => {
    setDialogMacrocycle(macrocycle);
    setDialogPhases(macrocycle.phases.map(p => ({ month: p.month, phase: p.phase })));
    setDialogYear(macrocycle.year);
    setDialogMode('view');
    setDialogWeeklyMonth(new Date().getMonth() + 1);
    
    // Fetch monthly phases from database
    const { data: monthlyData } = await supabase
      .from('user_monthly_phases')
      .select('*')
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);
    
    setDialogMonthlyPhases(
      (monthlyData || []).map(p => ({ month: p.month, week: p.week, phase: p.phase }))
    );
    
    // Fetch weekly phases from database
    const { data: weeklyData } = await supabase
      .from('user_weekly_phases')
      .select('*')
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);
    
    setDialogWeeklyPhases(
      (weeklyData || []).map(p => ({ month: p.month, week: p.week, day: p.day, phase: p.phase }))
    );
    
    setDialogOpen(true);
  };

  const handleEditAssignment = async (macrocycle: AssignedMacrocycle) => {
    setDialogMacrocycle(macrocycle);
    setDialogPhases(macrocycle.phases.map(p => ({ month: p.month, phase: p.phase })));
    setDialogYear(macrocycle.year);
    setDialogMode('edit');
    setDialogWeeklyMonth(new Date().getMonth() + 1);
    
    // Fetch monthly phases from database
    const { data: monthlyData } = await supabase
      .from('user_monthly_phases')
      .select('*')
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);
    
    setDialogMonthlyPhases(
      (monthlyData || []).map(p => ({ month: p.month, week: p.week, phase: p.phase }))
    );
    
    // Fetch weekly phases from database
    const { data: weeklyData } = await supabase
      .from('user_weekly_phases')
      .select('*')
      .eq('user_id', macrocycle.user_id)
      .eq('year', macrocycle.year);
    
    setDialogWeeklyPhases(
      (weeklyData || []).map(p => ({ month: p.month, week: p.week, day: p.day, phase: p.phase }))
    );
    
    setDialogOpen(true);
  };

  const handleDialogCellClick = (month: number, phaseValue: string) => {
    if (dialogMode === 'view') return;
    
    const exists = dialogPhases.some(p => p.month === month && p.phase === phaseValue);
    
    if (exists) {
      setDialogPhases(dialogPhases.filter(p => !(p.month === month && p.phase === phaseValue)));
    } else {
      setDialogPhases([...dialogPhases, { month, phase: phaseValue }]);
    }
  };

  const isDialogPhaseSelected = (month: number, phaseValue: string): boolean => {
    return dialogPhases.some(p => p.month === month && p.phase === phaseValue);
  };

  // Dialog Monthly phase check
  const isDialogMonthlyPhaseSelected = (month: number, week: number, phase: string) => {
    return dialogMonthlyPhases.some(p => p.month === month && p.week === week && p.phase === phase);
  };

  // Get dialog annual phase for a specific month
  const getDialogAnnualPhaseForMonth = (month: number) => {
    return dialogPhases.find(p => p.month === month);
  };

  // Get dialog monthly phase for a specific week
  const getDialogMonthlyPhaseForWeek = (month: number, week: number) => {
    return dialogMonthlyPhases.find(p => p.month === month && p.week === week);
  };

  // Dialog Weekly phase check
  const isDialogWeeklyPhaseSelected = (month: number, week: number, day: number, phase: string) => {
    return dialogWeeklyPhases.some(p => p.month === month && p.week === week && p.day === day && p.phase === phase);
  };

  // Get calendar weeks for dialog
  const getDialogCalendarWeeksForMonth = useMemo(() => {
    const firstDay = new Date(dialogYear, dialogWeeklyMonth - 1, 1);
    const daysInMonth = new Date(dialogYear, dialogWeeklyMonth, 0).getDate();
    
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const weeks: (number | null)[][] = [];
    let currentDate = 1;
    
    const totalDays = startDayOfWeek + daysInMonth;
    const numWeeks = Math.ceil(totalDays / 7);
    
    for (let week = 0; week < numWeeks; week++) {
      const weekDates: (number | null)[] = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startDayOfWeek) {
          weekDates.push(null);
        } else if (currentDate > daysInMonth) {
          weekDates.push(null);
        } else {
          weekDates.push(currentDate);
          currentDate++;
        }
      }
      weeks.push(weekDates);
    }
    
    return weeks;
  }, [dialogYear, dialogWeeklyMonth]);

  // Get dialog weekly sub-phases for a specific week
  const getDialogWeeklySubPhasesForWeek = (weekNumber: number) => {
    const weekPhases = dialogMonthlyPhases.filter(p => p.month === dialogWeeklyMonth && p.week === weekNumber);
    const uniquePhaseValues = [...new Set(weekPhases.map(p => p.phase))];
    
    const allSubPhases: { value: string; label: string; shortLabel: string; color: string; parentPhase: string }[] = [];
    
    uniquePhaseValues.forEach(phaseValue => {
      const subPhases = SUB_PHASES[phaseValue];
      if (subPhases) {
        subPhases.forEach(sp => {
          allSubPhases.push({ ...sp, parentPhase: phaseValue });
        });
      } else {
        const mainPhase = PHASES.find(p => p.value === phaseValue);
        if (mainPhase) {
          allSubPhases.push({ ...mainPhase, parentPhase: phaseValue });
        }
      }
    });
    
    return allSubPhases;
  };

  // Get all unique dialog weekly sub-phases for row rendering
  const getDialogWeeklySubPhases = useMemo(() => {
    const monthPhases = dialogMonthlyPhases.filter(p => p.month === dialogWeeklyMonth);
    const uniquePhaseValues = [...new Set(monthPhases.map(p => p.phase))];
    
    const allSubPhases: { value: string; label: string; shortLabel: string; color: string; parentPhase: string }[] = [];
    
    uniquePhaseValues.forEach(phaseValue => {
      const subPhases = SUB_PHASES[phaseValue];
      if (subPhases) {
        subPhases.forEach(sp => {
          allSubPhases.push({ ...sp, parentPhase: phaseValue });
        });
      } else {
        const mainPhase = PHASES.find(p => p.value === phaseValue);
        if (mainPhase) {
          allSubPhases.push({ ...mainPhase, parentPhase: phaseValue });
        }
      }
    });
    
    return allSubPhases;
  }, [dialogMonthlyPhases, dialogWeeklyMonth]);

  const handleSaveDialogChanges = async () => {
    if (!dialogMacrocycle) return;

    // Delete old annual phases
    const phaseIds = dialogMacrocycle.phases.map(p => p.id);
    await supabase
      .from('user_annual_phases')
      .delete()
      .in('id', phaseIds);

    // Insert new annual phases
    const phasesToInsert = dialogPhases.map(p => ({
      user_id: dialogMacrocycle.user_id,
      year: dialogYear,
      month: p.month,
      phase: p.phase
    }));

    const { error: annualError } = await supabase
      .from('user_annual_phases')
      .insert(phasesToInsert);

    if (annualError) {
      toast.error('Σφάλμα κατά την αποθήκευση');
      return;
    }

    // Delete old monthly phases
    await supabase
      .from('user_monthly_phases')
      .delete()
      .eq('user_id', dialogMacrocycle.user_id)
      .eq('year', dialogYear);

    // Insert new monthly phases
    if (dialogMonthlyPhases.length > 0) {
      const monthlyToInsert = dialogMonthlyPhases.map(p => ({
        user_id: dialogMacrocycle.user_id,
        year: dialogYear,
        month: p.month,
        week: p.week,
        phase: p.phase
      }));

      await supabase
        .from('user_monthly_phases')
        .insert(monthlyToInsert);
    }

    // Delete old weekly phases
    await supabase
      .from('user_weekly_phases')
      .delete()
      .eq('user_id', dialogMacrocycle.user_id)
      .eq('year', dialogYear);

    // Insert new weekly phases
    if (dialogWeeklyPhases.length > 0) {
      const weeklyToInsert = dialogWeeklyPhases.map(p => ({
        user_id: dialogMacrocycle.user_id,
        year: dialogYear,
        month: p.month,
        week: p.week,
        day: p.day,
        phase: p.phase
      }));

      await supabase
        .from('user_weekly_phases')
        .insert(weeklyToInsert);
    }

    toast.success('Οι αλλαγές αποθηκεύτηκαν');
    setDialogOpen(false);
    fetchAssignedMacrocycles();
  };

  return (
    <div className="p-2 lg:p-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none h-8">
          <TabsTrigger value="new" className="rounded-none text-xs">Νέο</TabsTrigger>
          <TabsTrigger value="assigned" className="rounded-none text-xs">Ανατεθημένα</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-none text-xs">Αποθηκευμένα</TabsTrigger>
        </TabsList>

        {/* New Macrocycle Tab */}
        <TabsContent value="new" className="space-y-2 mt-2">
          {/* User Selection, Macrocycle Name & Actions - Moved here */}
          <Card className="rounded-none border-l-0">
            <CardContent className="p-2 sm:p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* User Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Επιλογή Χρήστη</label>
                  {selectedUser ? (
                    <div className="flex items-center gap-2 p-1.5 bg-muted rounded-none">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedUser.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(selectedUser.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{selectedUser.name}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                        className="rounded-none text-[10px] h-6 px-2"
                      >
                        Αλλαγή
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Αναζήτηση χρήστη..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowUserList(true);
                        }}
                        onFocus={() => setShowUserList(true)}
                        className="pl-7 rounded-none h-8 text-xs"
                      />
                      {showUserList && searchQuery && (
                        <div className="absolute z-10 w-full max-h-40 overflow-y-auto border rounded-none bg-background shadow-lg">
                          {filteredUsers.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground text-xs">
                              Δεν βρέθηκαν
                            </div>
                          ) : (
                            filteredUsers.slice(0, 5).map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSearchQuery('');
                                  setShowUserList(false);
                                }}
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{user.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Macrocycle Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Όνομα Μακροκύκλου</label>
                  <Input
                    placeholder="π.χ. Προετοιμασία 2025"
                    value={macrocycleName}
                    onChange={(e) => setMacrocycleName(e.target.value)}
                    className="rounded-none h-8 text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">&nbsp;</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      variant="outline"
                      className="rounded-none flex-1 h-8 text-xs"
                      disabled={selectedPhases.length === 0 || !macrocycleName.trim()}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Αποθήκευση
                    </Button>
                    <Button
                      onClick={handleAssign}
                      className="rounded-none flex-1 h-8 text-xs"
                      style={{ backgroundColor: '#00ffba', color: 'black' }}
                      disabled={selectedPhases.length === 0 || !selectedUser}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Ανάθεση
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ετήσιος Προγραμματισμός */}
          <Card className="rounded-none border-l-0">
            <CardHeader className="p-2 sm:p-4">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ετήσιος Προγραμματισμός
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setYear(y => y - 1)}
                    className="rounded-none h-7 w-7"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-semibold w-12 text-center">{year}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setYear(y => y + 1)}
                    className="rounded-none h-7 w-7"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedPhases([])}
                    className="rounded-none h-6 w-6"
                    title="Καθαρισμός Ετήσιου"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0">
              <div className="overflow-x-auto scrollbar-gold">
                <table className="w-full border-collapse text-[9px] sm:text-xs">
                  <thead>
                    <tr>
                      <th className="border p-0.5 sm:p-1 bg-muted text-left w-[50px] sm:w-[160px]">Φάση</th>
                      {MONTHS.map((month, index) => (
                        <th key={index} className="border p-0.5 bg-muted text-center w-[18px] sm:w-auto">
                          <span className="sm:hidden">{month}</span>
                          <span className="hidden sm:inline">{MONTHS_FULL[index]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PHASES.map((phase) => (
                      <tr key={phase.value} className={cn(phase.color, "bg-opacity-10")}>
                        <td className="border p-0.5 font-medium">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0", phase.color)} />
                            <span className="md:hidden text-[7px] font-semibold">{phase.shortLabel}</span>
                            <span className="hidden md:inline lg:hidden text-[9px]">{phase.shortLabel}</span>
                            <span className="hidden lg:inline text-xs">{phase.label}</span>
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
                                "border p-0 text-center cursor-pointer transition-colors h-4 sm:h-5",
                                isSelected && phase.color
                              )}
                            >
                              {isSelected && (
                                <Check className="h-2 w-2 sm:h-3 sm:w-3 mx-auto text-white" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Μηνιαίος Προγραμματισμός */}

        <Card className="rounded-none border-l-0 mt-2">
        <CardHeader className="p-2 sm:p-4">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Μηνιαίος Προγραμματισμός
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedWeeklyMonth}
                onChange={(e) => setSelectedWeeklyMonth(Number(e.target.value))}
                className="rounded-none border px-2 py-1 text-xs sm:text-sm bg-background"
              >
                {MONTHS_DROPDOWN.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMonthlyPhases([])}
                className="rounded-none h-6 w-6"
                title="Καθαρισμός Μηνιαίου"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="overflow-x-auto scrollbar-gold">
            <table className="w-full border-collapse text-[7px] sm:text-[9px] md:text-xs">
              <thead>
                <tr>
                  <th className="border p-0.5 sm:p-1 bg-muted text-left w-[40px] sm:w-[80px] md:w-[120px]">Φάση</th>
                  {MONTHS_FULL.map((month, monthIndex) => {
                    const annualPhase = getAnnualPhaseForMonth(monthIndex + 1);
                    const phaseInfo = annualPhase ? PHASES.find(p => p.value === annualPhase.phase) : null;
                    const weeksCount = getWeeksInMonth(year, monthIndex + 1);
                    return (
                      <th 
                        key={monthIndex} 
                        colSpan={weeksCount}
                        className={cn(
                          "border p-0.5 bg-muted text-center",
                          phaseInfo && phaseInfo.color
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[8px] sm:text-[10px] font-medium",
                            phaseInfo && "text-white"
                          )}>
                            {month}
                          </span>
                          {phaseInfo && (
                            <span className="text-[6px] sm:text-[8px] text-white/80">
                              {phaseInfo.shortLabel}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  <th className="border p-0.5 bg-muted text-left text-[7px] sm:text-[9px]">Εβδ.</th>
                  {MONTHS_FULL.map((_, monthIndex) => {
                    const weeksCount = getWeeksInMonth(year, monthIndex + 1);
                    return Array.from({ length: weeksCount }, (_, weekIndex) => (
                      <th 
                        key={`${monthIndex}-${weekIndex}`}
                        className="border p-0.5 bg-muted/50 text-center text-[6px] sm:text-[8px] w-[14px] sm:w-[18px]"
                      >
                        Ε{weekIndex + 1}
                      </th>
                    ));
                  })}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => {
                  // Βρίσκουμε σε ποιους μήνες είναι επιλεγμένη αυτή η φάση στον Ετήσιο Προγραμματισμό
                  const monthsWithThisPhase = selectedPhases
                    .filter(p => p.phase === phase.value)
                    .map(p => p.month);
                  
                  // Αν δεν υπάρχει σε κανέναν μήνα, δεν εμφανίζουμε τη γραμμή
                  if (monthsWithThisPhase.length === 0) return null;
                  
                  return (
                    <tr key={phase.value}>
                      <td className="border p-0.5 font-medium bg-background">
                        <div className="flex items-center gap-0.5">
                          <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0", phase.color)} />
                          <span className="lg:hidden text-[6px] sm:text-[8px] font-semibold">{phase.shortLabel}</span>
                          <span className="hidden lg:inline text-xs">{phase.label}</span>
                        </div>
                      </td>
                      {MONTHS_FULL.map((_, monthIndex) => {
                        const month = monthIndex + 1;
                        const weeksCount = getWeeksInMonth(year, month);
                        const isPhaseAvailableForMonth = monthsWithThisPhase.includes(month);
                        
                        return Array.from({ length: weeksCount }, (_, weekIndex) => {
                          const week = weekIndex + 1;
                          const isSelected = isMonthlyPhaseSelected(month, week, phase.value);
                          
                          // Αν η φάση δεν είναι επιλεγμένη στον Ετήσιο για αυτόν τον μήνα, 
                          // εμφανίζουμε κενό μη-κλικάρισμα κελί
                          if (!isPhaseAvailableForMonth) {
                            return (
                              <td
                                key={`${monthIndex}-${weekIndex}`}
                                className="border p-0 text-center bg-muted/30 h-3 sm:h-4"
                              />
                            );
                          }
                          
                          return (
                            <td
                              key={`${monthIndex}-${weekIndex}`}
                              onClick={() => handleMonthlyPhaseClick(month, week, phase.value)}
                              className={cn(
                                "border p-0 text-center cursor-pointer transition-colors h-3 sm:h-4",
                                phase.color,
                                isSelected ? "" : "bg-opacity-10"
                              )}
                            >
                              {isSelected && (
                                <Check className="h-1.5 w-1.5 sm:h-2 sm:w-2 mx-auto text-white" />
                              )}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Planning Container */}
      <Card className="rounded-none border-l-0 mt-2">
        <CardHeader className="p-2 sm:p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4" />
              Εβδομαδιαίος Προγραμματισμός
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeeklyPhases([])}
                className="rounded-none h-6 w-6"
                title="Καθαρισμός Εβδομαδιαίου"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <select
                value={selectedWeeklyMonth}
                onChange={(e) => setSelectedWeeklyMonth(Number(e.target.value))}
                className="rounded-none border px-2 py-1 text-xs sm:text-sm bg-background"
              >
                {MONTHS_DROPDOWN.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="overflow-x-auto scrollbar-gold">
            <table className="w-full border-collapse text-[7px] sm:text-[9px] md:text-xs">
              <thead>
                {/* Week headers row */}
                <tr>
                  <th className="border p-0.5 sm:p-1 bg-muted text-left w-[40px] sm:w-[80px] md:w-[100px]" rowSpan={3}>Φάση</th>
                  {getCalendarWeeksForMonth.map((_, weekIndex) => {
                    const monthlyPhase = getMonthlyPhaseForWeek(selectedWeeklyMonth, weekIndex + 1);
                    const phaseInfo = monthlyPhase ? PHASES.find(p => p.value === monthlyPhase.phase) : null;
                    return (
                      <th 
                        key={weekIndex} 
                        colSpan={7}
                        className={cn(
                          "border p-0.5 bg-muted text-center",
                          phaseInfo && phaseInfo.color
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[8px] sm:text-[10px] font-medium",
                            phaseInfo && "text-white"
                          )}>
                            Ε{weekIndex + 1}
                          </span>
                          {phaseInfo && (
                            <span className="text-[6px] sm:text-[8px] text-white/80">
                              {phaseInfo.shortLabel}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                {/* Day names row */}
                <tr>
                  {getCalendarWeeksForMonth.map((_, weekIndex) => (
                    DAYS_FULL.map((dayName, dayIndex) => (
                      <th 
                        key={`day-${weekIndex}-${dayIndex}`}
                        className="border p-0.5 bg-muted/70 text-center text-[6px] sm:text-[8px] w-[14px] sm:w-[18px] font-medium"
                      >
                        {dayName}
                      </th>
                    ))
                  ))}
                </tr>
                {/* Date numbers row */}
                <tr>
                  {getCalendarWeeksForMonth.map((weekDates, weekIndex) => (
                    weekDates.map((dateNum, dayIndex) => (
                      <th 
                        key={`date-${weekIndex}-${dayIndex}`}
                        className="border p-0.5 bg-muted/50 text-center text-[6px] sm:text-[8px] w-[14px] sm:w-[18px]"
                      >
                        {dateNum !== null ? dateNum : '-'}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {getWeeklySubPhases.length === 0 ? (
                  <tr>
                    <td colSpan={1 + getCalendarWeeksForMonth.length * 7} className="border p-4 text-center text-muted-foreground text-xs">
                      Δεν έχουν επιλεγεί φάσεις στον Μηνιαίο Προγραμματισμό για τον {MONTHS_DROPDOWN[selectedWeeklyMonth - 1]}
                    </td>
                  </tr>
                ) : (
                  getWeeklySubPhases.map((phase) => (
                    <tr key={phase.value}>
                      <td className="border p-0.5 font-medium bg-background">
                        <div className="flex items-center gap-0.5">
                          <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0", phase.color)} />
                          <span className="lg:hidden text-[6px] sm:text-[8px] font-semibold">{phase.shortLabel}</span>
                          <span className="hidden lg:inline text-xs">{phase.label}</span>
                        </div>
                      </td>
                      {getCalendarWeeksForMonth.map((weekDates, weekIndex) => {
                        const week = weekIndex + 1;
                        // Βρίσκουμε αν αυτή η φάση είναι διαθέσιμη για αυτή την εβδομάδα
                        const weekSubPhases = getWeeklySubPhasesForWeek(week);
                        const isPhaseAvailableForWeek = weekSubPhases.some(sp => sp.value === phase.value);
                        
                        return weekDates.map((dateNum, dayIndex) => {
                          const day = dayIndex + 1;
                          const isSelected = isWeeklyPhaseSelected(selectedWeeklyMonth, week, day, phase.value);
                          const isValidDate = dateNum !== null;
                          
                          // Αν η φάση δεν είναι διαθέσιμη για αυτή την εβδομάδα, εμφανίζουμε disabled κελί
                          if (!isPhaseAvailableForWeek) {
                            return (
                              <td
                                key={`${weekIndex}-${dayIndex}`}
                                className="border p-0 text-center bg-muted/30 h-3 sm:h-4"
                              />
                            );
                          }
                          
                          return (
                            <td
                              key={`${weekIndex}-${dayIndex}`}
                              onClick={() => isValidDate && handleWeeklyPhaseClick(selectedWeeklyMonth, week, day, phase.value)}
                              className={cn(
                                "border p-0 text-center transition-colors h-3 sm:h-4",
                                isValidDate ? "cursor-pointer" : "bg-muted/30 cursor-default",
                                isSelected && isValidDate && phase.color
                              )}
                            >
                              {isSelected && isValidDate && (
                                <Check className="h-1.5 w-1.5 sm:h-2 sm:w-2 mx-auto text-white" />
                              )}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>
        </TabsContent>

        {/* Assigned Macrocycles Tab */}
        <TabsContent value="assigned" className="mt-2">
          {assignedMacrocycles.length === 0 ? (
            <Card className="rounded-none border-l-0">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground text-sm">
                  Δεν υπάρχουν ανατεθειμένοι μακροκύκλοι
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {assignedMacrocycles.map((macrocycle) => (
                <Card key={macrocycle.id} className="rounded-none border-l-0">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={macrocycle.user_avatar || undefined} />
                          <AvatarFallback className="text-[10px]">{getInitials(macrocycle.user_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium">{macrocycle.user_name}</p>
                          <p className="text-[10px] text-muted-foreground">Έτος: {macrocycle.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-none h-7 w-7"
                          onClick={() => handleViewAssignment(macrocycle)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-none h-7 w-7"
                          onClick={() => handleEditAssignment(macrocycle)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-none h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAssignment(macrocycle)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-2">
                      {macrocycle.phases.map((phase, idx) => (
                        <span 
                          key={idx} 
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 text-white",
                            getPhaseColor(phase.phase)
                          )}
                        >
                          {MONTHS_FULL[phase.month - 1]}-{PHASES.find(p => p.value === phase.phase)?.shortLabel}
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
        <TabsContent value="saved" className="mt-2">
          {savedMacrocycles.length === 0 ? (
            <Card className="rounded-none border-l-0">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground text-sm">
                  Δεν υπάρχουν αποθηκευμένοι μακροκύκλοι
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {savedMacrocycles.map((macrocycle) => (
                <Card key={macrocycle.id} className="rounded-none border-l-0">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{macrocycle.name}</p>
                        <p className="text-[10px] text-muted-foreground">Έτος: {macrocycle.year}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none h-7 text-xs"
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
                    <div className="flex flex-wrap gap-0.5 mt-2">
                      {macrocycle.phases.map((phase, idx) => (
                        <span 
                          key={idx} 
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 text-white",
                            getPhaseColor(phase.phase)
                          )}
                        >
                          {MONTHS_FULL[phase.month - 1]}-{PHASES.find(p => p.value === phase.phase)?.shortLabel}
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

      {/* View/Edit Dialog - Responsive */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl h-auto max-h-[95vh] p-2 sm:p-3 rounded-none overflow-y-auto [&>button]:hidden">
          <DialogHeader className="pb-0.5 sm:pb-1">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
              <div className="flex items-center gap-2">
                {dialogMacrocycle && (
                  <>
                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                      <AvatarImage src={dialogMacrocycle.user_avatar || undefined} />
                      <AvatarFallback className="text-[7px] sm:text-[9px]">{getInitials(dialogMacrocycle.user_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm">{dialogMacrocycle.user_name}</span>
                  </>
                )}
                <span className="text-muted-foreground text-[10px]">- {dialogMode === 'view' ? 'Προβολή' : 'Επεξεργασία'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDialogYear(y => y - 1)}
                  className="rounded-none h-5 w-5"
                  disabled={dialogMode === 'view'}
                >
                  <ChevronLeft className="h-2.5 w-2.5" />
                </Button>
                <span className="text-xs font-semibold w-9 text-center">{dialogYear}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDialogYear(y => y + 1)}
                  className="rounded-none h-5 w-5"
                  disabled={dialogMode === 'view'}
                >
                  <ChevronRight className="h-2.5 w-2.5" />
                </Button>
                {dialogMode === 'edit' && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-none h-5 text-[10px] px-2"
                      onClick={() => setDialogOpen(false)}
                    >
                      Ακύρωση
                    </Button>
                    <Button
                      className="rounded-none h-5 text-[10px] px-2"
                      style={{ backgroundColor: '#00ffba', color: 'black' }}
                      onClick={handleSaveDialogChanges}
                    >
                      Αποθήκευση
                    </Button>
                  </>
                )}
                {dialogMode === 'view' && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-none h-5 w-5 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Phases Grid in Dialog - Compact */}
          <div className="overflow-x-auto scrollbar-gold">
            <table className="w-full border-collapse text-[6px] sm:text-[8px] md:text-[10px]">
              <thead>
                <tr>
                  <th className="border p-0.5 bg-muted text-left w-[35px] sm:w-[70px] md:w-[120px]">Φάση</th>
                  {MONTHS.map((month, index) => (
                    <th key={index} className="border p-0.5 bg-muted text-center w-[14px] sm:w-auto">
                      <span className="sm:hidden">{month}</span>
                      <span className="hidden sm:inline">{MONTHS_FULL[index]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase.value}>
                    <td className="border p-0.5 font-medium bg-background">
                      <div className="flex items-center gap-0.5">
                        <div className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0", phase.color)} />
                        <span className="md:hidden text-[5px] sm:text-[7px] font-semibold">{phase.shortLabel}</span>
                        <span className="hidden md:inline text-[10px]">{phase.label}</span>
                      </div>
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const month = monthIndex + 1;
                      const isSelected = isDialogPhaseSelected(month, phase.value);
                      
                      return (
                        <td
                          key={monthIndex}
                          onClick={() => handleDialogCellClick(month, phase.value)}
                          className={cn(
                            "border p-0 text-center transition-colors h-2.5 sm:h-3 md:h-4",
                            dialogMode === 'edit' ? "cursor-pointer hover:bg-muted" : "cursor-default",
                            isSelected && phase.color
                          )}
                        >
                          {isSelected && (
                            <Check className="h-1.5 w-1.5 sm:h-2 sm:w-2 mx-auto text-white" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dialog Monthly Planning - Same as "νέο" tab - Compact */}
          <div className="mt-2">
            <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              Μηνιαίος Προγραμματισμός
            </h4>
            <div className="overflow-x-auto scrollbar-gold">
              <table className="w-full border-collapse text-[5px] sm:text-[7px] md:text-[9px]">
                <thead>
                  <tr>
                    <th className="border p-0.5 bg-muted text-left w-[35px] sm:w-[70px] md:w-[100px]">Φάση</th>
                    {MONTHS_FULL.map((month, monthIndex) => {
                      const annualPhase = getDialogAnnualPhaseForMonth(monthIndex + 1);
                      const phaseInfo = annualPhase ? PHASES.find(p => p.value === annualPhase.phase) : null;
                      const weeksCount = getWeeksInMonth(dialogYear, monthIndex + 1);
                      return (
                        <th 
                          key={monthIndex} 
                          colSpan={weeksCount}
                          className={cn(
                            "border p-0.5 bg-muted text-center",
                            phaseInfo && phaseInfo.color
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[6px] sm:text-[8px] font-medium",
                              phaseInfo && "text-white"
                            )}>
                              {month}
                            </span>
                            {phaseInfo && (
                              <span className="text-[5px] sm:text-[6px] text-white/80">
                                {phaseInfo.shortLabel}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    <th className="border p-0.5 bg-muted text-left text-[5px] sm:text-[7px]">Εβδ.</th>
                    {MONTHS_FULL.map((_, monthIndex) => {
                      const weeksCount = getWeeksInMonth(dialogYear, monthIndex + 1);
                      return Array.from({ length: weeksCount }, (_, weekIndex) => (
                        <th 
                          key={`${monthIndex}-${weekIndex}`}
                          className="border p-0.5 bg-muted/50 text-center text-[5px] sm:text-[6px] w-[12px] sm:w-[14px]"
                        >
                          Ε{weekIndex + 1}
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PHASES.map((phase) => {
                    const monthsWithThisPhase = dialogPhases
                      .filter(p => p.phase === phase.value)
                      .map(p => p.month);
                    
                    if (monthsWithThisPhase.length === 0) return null;
                    
                    return (
                      <tr key={phase.value}>
                        <td className="border p-0.5 font-medium bg-background">
                          <div className="flex items-center gap-0.5">
                            <div className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0", phase.color)} />
                            <span className="lg:hidden text-[5px] sm:text-[6px] font-semibold">{phase.shortLabel}</span>
                            <span className="hidden lg:inline text-[9px]">{phase.label}</span>
                          </div>
                        </td>
                        {MONTHS_FULL.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const weeksCount = getWeeksInMonth(dialogYear, month);
                          const isPhaseAvailableForMonth = monthsWithThisPhase.includes(month);
                          
                          return Array.from({ length: weeksCount }, (_, weekIndex) => {
                            const week = weekIndex + 1;
                            const isSelected = isDialogMonthlyPhaseSelected(month, week, phase.value);
                            
                            if (!isPhaseAvailableForMonth) {
                              return (
                                <td
                                  key={`${monthIndex}-${weekIndex}`}
                                  className="border p-0 text-center bg-muted/30 h-2 sm:h-2.5"
                                />
                              );
                            }
                            
                            return (
                              <td
                                key={`${monthIndex}-${weekIndex}`}
                                onClick={() => {
                                  if (dialogMode !== 'edit') return;
                                  const exists = dialogMonthlyPhases.some(p => p.month === month && p.week === week && p.phase === phase.value);
                                  if (exists) {
                                    setDialogMonthlyPhases(dialogMonthlyPhases.filter(p => !(p.month === month && p.week === week && p.phase === phase.value)));
                                  } else {
                                    setDialogMonthlyPhases([...dialogMonthlyPhases, { month, week, phase: phase.value }]);
                                  }
                                }}
                                className={cn(
                                  "border p-0 text-center h-2 sm:h-2.5",
                                  dialogMode === 'edit' ? "cursor-pointer hover:bg-muted" : "cursor-default",
                                  isSelected && phase.color
                                )}
                              >
                                {isSelected && (
                                  <Check className="h-1 w-1 sm:h-1.5 sm:w-1.5 mx-auto text-white" />
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dialog Weekly Planning - Same as "νέο" tab - Compact */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[10px] font-semibold flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                Εβδομαδιαίος Προγραμματισμός
              </h4>
              <select
                value={dialogWeeklyMonth}
                onChange={(e) => setDialogWeeklyMonth(Number(e.target.value))}
                className="rounded-none border px-1.5 py-0.5 text-[10px] sm:text-xs bg-background"
              >
                {MONTHS_DROPDOWN.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto scrollbar-gold">
              <table className="w-full border-collapse text-[5px] sm:text-[7px] md:text-[9px]">
                <thead>
                  {/* Week headers row */}
                  <tr>
                    <th className="border p-0.5 bg-muted text-left w-[35px] sm:w-[70px] md:w-[90px]" rowSpan={3}>Φάση</th>
                    {getDialogCalendarWeeksForMonth.map((_, weekIndex) => {
                      const monthlyPhase = getDialogMonthlyPhaseForWeek(dialogWeeklyMonth, weekIndex + 1);
                      const phaseInfo = monthlyPhase ? PHASES.find(p => p.value === monthlyPhase.phase) : null;
                      return (
                        <th 
                          key={weekIndex} 
                          colSpan={7}
                          className={cn(
                            "border p-0.5 bg-muted text-center",
                            phaseInfo && phaseInfo.color
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[6px] sm:text-[8px] font-medium",
                              phaseInfo && "text-white"
                            )}>
                              Ε{weekIndex + 1}
                            </span>
                            {phaseInfo && (
                              <span className="text-[5px] sm:text-[6px] text-white/80">
                                {phaseInfo.shortLabel}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Day names row */}
                  <tr>
                    {getDialogCalendarWeeksForMonth.map((_, weekIndex) => (
                      DAYS_FULL.map((dayName, dayIndex) => (
                        <th 
                          key={`day-${weekIndex}-${dayIndex}`}
                          className="border p-0.5 bg-muted/70 text-center text-[5px] sm:text-[6px] w-[12px] sm:w-[14px] font-medium"
                        >
                          {dayName}
                        </th>
                      ))
                    ))}
                  </tr>
                  {/* Date numbers row */}
                  <tr>
                    {getDialogCalendarWeeksForMonth.map((weekDates, weekIndex) => (
                      weekDates.map((dateNum, dayIndex) => (
                        <th 
                          key={`date-${weekIndex}-${dayIndex}`}
                          className="border p-0.5 bg-muted/50 text-center text-[5px] sm:text-[6px] w-[12px] sm:w-[14px]"
                        >
                          {dateNum !== null ? dateNum : '-'}
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getDialogWeeklySubPhases.length === 0 ? (
                    <tr>
                      <td colSpan={1 + getDialogCalendarWeeksForMonth.length * 7} className="border p-2 text-center text-muted-foreground text-[10px]">
                        Δεν έχουν επιλεγεί φάσεις στον Μηνιαίο Προγραμματισμό για τον {MONTHS_DROPDOWN[dialogWeeklyMonth - 1]}
                      </td>
                    </tr>
                  ) : (
                    getDialogWeeklySubPhases.map((phase) => (
                      <tr key={phase.value}>
                        <td className="border p-0.5 font-medium bg-background">
                          <div className="flex items-center gap-0.5">
                            <div className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0", phase.color)} />
                            <span className="lg:hidden text-[5px] sm:text-[6px] font-semibold">{phase.shortLabel}</span>
                            <span className="hidden lg:inline text-[9px]">{phase.label}</span>
                          </div>
                        </td>
                        {getDialogCalendarWeeksForMonth.map((weekDates, weekIndex) => {
                          const week = weekIndex + 1;
                          const weekSubPhases = getDialogWeeklySubPhasesForWeek(week);
                          const isPhaseAvailableForWeek = weekSubPhases.some(sp => sp.value === phase.value);
                          
                          return weekDates.map((dateNum, dayIndex) => {
                            const day = dayIndex + 1;
                            const isSelected = isDialogWeeklyPhaseSelected(dialogWeeklyMonth, week, day, phase.value);
                            const isValidDate = dateNum !== null;
                            
                            if (!isPhaseAvailableForWeek) {
                              return (
                                <td
                                  key={`${weekIndex}-${dayIndex}`}
                                  className="border p-0 text-center bg-muted/30 h-2 sm:h-2.5"
                                />
                              );
                            }
                            
                            return (
                              <td
                                key={`${weekIndex}-${dayIndex}`}
                                onClick={() => {
                                  if (dialogMode !== 'edit' || !isValidDate) return;
                                  const exists = dialogWeeklyPhases.some(p => p.month === dialogWeeklyMonth && p.week === week && p.day === day && p.phase === phase.value);
                                  if (exists) {
                                    setDialogWeeklyPhases(dialogWeeklyPhases.filter(p => !(p.month === dialogWeeklyMonth && p.week === week && p.day === day && p.phase === phase.value)));
                                  } else {
                                    setDialogWeeklyPhases([...dialogWeeklyPhases, { month: dialogWeeklyMonth, week, day, phase: phase.value }]);
                                  }
                                }}
                                className={cn(
                                  "border p-0 text-center h-2 sm:h-2.5",
                                  isValidDate && dialogMode === 'edit' ? "cursor-pointer hover:bg-muted" : "cursor-default",
                                  !isValidDate && "bg-muted/30",
                                  isSelected && isValidDate && phase.color
                                )}
                              >
                                {isSelected && isValidDate && (
                                  <Check className="h-1 w-1 sm:h-1.5 sm:w-1.5 mx-auto text-white" />
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnualPlanning;
