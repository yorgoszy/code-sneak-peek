import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, MoveHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Muscle {
  id: string;
  name: string;
  muscle_group: string | null;
}

interface Mapping {
  id: string;
  issue_category: string;
  issue_name: string;
  muscle_id: string;
  action_type: string;
  dysfunction: string | null;
  muscles?: Muscle;
}

// Posture options
const postureOptions = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός', 'Σκολίωση'];

// Squat options - top (without Α/Δ)
const squatTopOptions = [
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

// Squat options - bottom (with Α/Δ)
const squatBottomOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ'
];

// Single leg squat options
const singleLegSquatOptions = [
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ'
];

// FMS exercises
const fmsRows = [
  ['DEEP SQUAT', 'HURDLE STEP', 'INLINE LUNGE'],
  ['SHOULDER', 'ASLR', 'PUSH UP'],
  ['ROTARY']
];

const hasLeftRight = ['HURDLE STEP', 'INLINE LUNGE', 'SHOULDER', 'ASLR', 'ROTARY'];

export const AllTestsPanel = () => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'strengthen' | 'stretch'>('strengthen');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [musclesRes, mappingsRes] = await Promise.all([
      supabase.from('muscles').select('*').order('name'),
      supabase.from('functional_issue_muscle_mappings').select('*, muscles(*)')
    ]);

    if (musclesRes.data) setMuscles(musclesRes.data);
    if (mappingsRes.data) setMappings(mappingsRes.data as Mapping[]);
    
    setLoading(false);
  };

  const handleOpenDialog = (issue: string, category: string) => {
    setSelectedIssue(issue);
    setSelectedCategory(category);
    setSelectedMuscle('');
    setDialogOpen(true);
  };

  const handleAddMapping = async () => {
    if (!selectedMuscle) {
      toast.error('Επιλέξτε μυ');
      return;
    }

    const { error } = await supabase
      .from('functional_issue_muscle_mappings')
      .insert({
        issue_category: selectedCategory,
        issue_name: selectedIssue,
        muscle_id: selectedMuscle,
        action_type: selectedAction,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Αυτή η σύνδεση υπάρχει ήδη');
      } else {
        toast.error('Σφάλμα προσθήκης');
        console.error(error);
      }
    } else {
      toast.success('Η σύνδεση προστέθηκε');
      setSelectedMuscle('');
      fetchData();
    }
  };

  const handleDeleteMapping = async (id: string) => {
    const { error } = await supabase
      .from('functional_issue_muscle_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Σφάλμα διαγραφής');
    } else {
      toast.success('Η σύνδεση διαγράφηκε');
      fetchData();
    }
  };

  const hasMapping = (issue: string, category: string, actionType: string) => {
    return mappings.some(m => 
      m.issue_name === issue && 
      m.issue_category === category && 
      m.action_type === actionType
    );
  };

  const hasMappingAny = (issue: string, category: string) => {
    return hasMapping(issue, category, 'strengthen') || hasMapping(issue, category, 'stretch');
  };

  const getDialogMappings = () => {
    return mappings.filter(m => m.issue_name === selectedIssue && m.issue_category === selectedCategory);
  };

  const dialogMappings = getDialogMappings();
  const dialogStrengthen = dialogMappings.filter(m => m.action_type === 'strengthen');
  const dialogStretch = dialogMappings.filter(m => m.action_type === 'stretch');

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Στάση Σώματος + Μονοποδικά */}
        <div className="space-y-4">
          {/* Posture */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Στάση Σώματος</h3>
            <table className="w-full border-collapse text-xs">
              <tbody>
                {postureOptions.map((option) => (
                  <tr
                    key={option}
                    onClick={() => handleOpenDialog(option, 'posture')}
                    className={cn(
                      "cursor-pointer transition-colors",
                      hasMappingAny(option, 'posture')
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-50"
                    )}
                  >
                    <td className="border border-gray-300 py-1.5 px-3 text-center">
                      {option}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Single Leg Squat */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Μονοποδικά Καθήματα</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
                </tr>
              </thead>
              <tbody>
                {singleLegSquatOptions.map((option) => (
                  <tr key={option}>
                    <td className="border border-gray-300 py-1.5 px-3">{option}</td>
                    <td 
                      className={cn(
                        "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                        hasMappingAny(`${option} Α`, 'single_leg_squat')
                          ? "bg-black text-white"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleOpenDialog(`${option} Α`, 'single_leg_squat')}
                    >
                      ✓
                    </td>
                    <td 
                      className={cn(
                        "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                        hasMappingAny(`${option} Δ`, 'single_leg_squat')
                          ? "bg-black text-white"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleOpenDialog(`${option} Δ`, 'single_leg_squat')}
                    >
                      ✓
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Καθήματα */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Καθήματα</h3>
          <table className="w-full border-collapse text-xs">
            <tbody>
              {squatTopOptions.map((option) => (
                <tr
                  key={option}
                  onClick={() => handleOpenDialog(option, 'squat')}
                  className={cn(
                    "cursor-pointer transition-colors",
                    hasMappingAny(option, 'squat')
                      ? "bg-black text-white"
                      : "bg-white hover:bg-gray-50"
                  )}
                >
                  <td className="border border-gray-300 py-1.5 px-3" colSpan={3}>
                    {option}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse text-xs mt-2">
            <thead>
              <tr>
                <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
              </tr>
            </thead>
            <tbody>
              {squatBottomOptions.map((option) => (
                <tr key={option}>
                  <td className="border border-gray-300 py-1.5 px-3">{option}</td>
                  <td 
                    className={cn(
                      "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                      hasMappingAny(`${option} Α`, 'squat')
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleOpenDialog(`${option} Α`, 'squat')}
                  >
                    ✓
                  </td>
                  <td 
                    className={cn(
                      "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                      hasMappingAny(`${option} Δ`, 'squat')
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleOpenDialog(`${option} Δ`, 'squat')}
                  >
                    ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FMS */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">FMS</h3>
          </div>
          
          <div className="space-y-2">
            {fmsRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={cn(
                  "grid gap-2",
                  rowIndex === 2 ? "grid-cols-1" : "grid-cols-3"
                )}
              >
                {row.map((exercise) => (
                  <div key={exercise} className="border border-gray-300 p-2">
                    <div className="text-xs font-medium mb-1 text-center">{exercise}</div>
                    {hasLeftRight.includes(exercise) ? (
                      <div className="grid grid-cols-2 gap-1">
                        <div 
                          className={cn(
                            "text-center py-1 text-xs cursor-pointer transition-colors border",
                            hasMappingAny(`${exercise} L`, 'fms')
                              ? "bg-black text-white"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => handleOpenDialog(`${exercise} L`, 'fms')}
                        >
                          L
                        </div>
                        <div 
                          className={cn(
                            "text-center py-1 text-xs cursor-pointer transition-colors border",
                            hasMappingAny(`${exercise} R`, 'fms')
                              ? "bg-black text-white"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => handleOpenDialog(`${exercise} R`, 'fms')}
                        >
                          R
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "text-center py-1 text-xs cursor-pointer transition-colors border",
                          hasMappingAny(exercise, 'fms')
                            ? "bg-black text-white"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => handleOpenDialog(exercise, 'fms')}
                      >
                        0-3
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedIssue}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Ενδυνάμωση */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-4">
                <ArrowUp className="w-4 h-4" />
                Ενδυνάμωση
              </div>
              
              <div className="space-y-2 mb-4">
                {dialogStrengthen.length === 0 ? (
                  <p className="text-xs text-gray-400">Δεν υπάρχουν μύες</p>
                ) : (
                  dialogStrengthen.map(m => (
                    <div 
                      key={m.id} 
                      className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 text-sm"
                    >
                      <span>{m.muscles?.name}</span>
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Select 
                  value={selectedAction === 'strengthen' ? selectedMuscle : ''} 
                  onValueChange={(v) => {
                    setSelectedAction('strengthen');
                    setSelectedMuscle(v);
                  }}
                >
                  <SelectTrigger className="rounded-none flex-1">
                    <SelectValue placeholder="Προσθήκη μυός..." />
                  </SelectTrigger>
                  <SelectContent>
                    {muscles.map(muscle => (
                      <SelectItem key={muscle.id} value={muscle.id}>
                        {muscle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    setSelectedAction('strengthen');
                    handleAddMapping();
                  }}
                  size="icon"
                  className="rounded-none bg-green-600 hover:bg-green-700"
                  disabled={!selectedMuscle || selectedAction !== 'strengthen'}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Διάταση */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-4">
                <MoveHorizontal className="w-4 h-4" />
                Διάταση
              </div>
              
              <div className="space-y-2 mb-4">
                {dialogStretch.length === 0 ? (
                  <p className="text-xs text-gray-400">Δεν υπάρχουν μύες</p>
                ) : (
                  dialogStretch.map(m => (
                    <div 
                      key={m.id} 
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 text-sm"
                    >
                      <span>{m.muscles?.name}</span>
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Select 
                  value={selectedAction === 'stretch' ? selectedMuscle : ''} 
                  onValueChange={(v) => {
                    setSelectedAction('stretch');
                    setSelectedMuscle(v);
                  }}
                >
                  <SelectTrigger className="rounded-none flex-1">
                    <SelectValue placeholder="Προσθήκη μυός..." />
                  </SelectTrigger>
                  <SelectContent>
                    {muscles.map(muscle => (
                      <SelectItem key={muscle.id} value={muscle.id}>
                        {muscle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    setSelectedAction('stretch');
                    handleAddMapping();
                  }}
                  size="icon"
                  className="rounded-none bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedMuscle || selectedAction !== 'stretch'}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
