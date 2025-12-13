import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, MoveHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';

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

const POSTURE_ISSUES = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός', 'Σκολίωση'];

const SQUAT_ISSUES = [
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

const SINGLE_LEG_ISSUES = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ'
];

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

  const getDialogMappings = () => {
    return mappings.filter(m => m.issue_name === selectedIssue && m.issue_category === selectedCategory);
  };

  const renderTestTable = (title: string, issues: string[], category: string, showAD: boolean = true) => (
    <div className="border">
      <div className="font-semibold text-sm px-3 py-2 border-b bg-white">{title}</div>
      <table className="w-full text-sm">
        {showAD && (
          <thead>
            <tr className="border-b">
              <th className="text-left py-1.5 px-3 font-medium text-gray-600">Επιλογή</th>
              <th className="text-center py-1.5 px-2 font-medium text-gray-600 w-10">Α</th>
              <th className="text-center py-1.5 px-2 font-medium text-gray-600 w-10">Δ</th>
            </tr>
          </thead>
        )}
        <tbody>
          {issues.map((issue) => (
            <tr 
              key={issue} 
              className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleOpenDialog(issue, category)}
            >
              <td className="py-1.5 px-3">{issue}</td>
              {showAD && (
                <>
                  <td className="py-1.5 px-2 text-center">
                    {hasMapping(issue, category, 'strengthen') && (
                      <Check className="w-4 h-4 text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {hasMapping(issue, category, 'stretch') && (
                      <Check className="w-4 h-4 text-gray-600 mx-auto" />
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const dialogMappings = getDialogMappings();
  const dialogStrengthen = dialogMappings.filter(m => m.action_type === 'strengthen');
  const dialogStretch = dialogMappings.filter(m => m.action_type === 'stretch');

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Στάση Σώματος */}
        <div>
          {renderTestTable('Στάση Σώματος', POSTURE_ISSUES, 'posture', false)}
        </div>

        {/* Καθήματα */}
        <div>
          {renderTestTable('Καθήματα', SQUAT_ISSUES, 'squat')}
        </div>

        {/* Μονοποδικά Καθήματα */}
        <div>
          {renderTestTable('Μονοποδικά Καθήματα', SINGLE_LEG_ISSUES, 'single_leg_squat')}
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
                Ενδυνάμωση (Α)
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
                Διάταση (Δ)
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
