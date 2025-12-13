import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface IssueMappingPanelProps {
  category: string;
  title: string;
  issues: string[];
}

export const IssueMappingPanel = ({ category, title, issues }: IssueMappingPanelProps) => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'strengthen' | 'stretch'>('strengthen');

  useEffect(() => {
    fetchData();
  }, [category]);

  const fetchData = async () => {
    setLoading(true);
    
    const [musclesRes, mappingsRes] = await Promise.all([
      supabase.from('muscles').select('*').order('name'),
      supabase
        .from('functional_issue_muscle_mappings')
        .select('*, muscles(*)')
        .eq('issue_category', category)
    ]);

    if (musclesRes.data) setMuscles(musclesRes.data);
    if (mappingsRes.data) setMappings(mappingsRes.data as Mapping[]);
    
    setLoading(false);
  };

  const handleOpenDialog = (issue: string) => {
    setSelectedIssue(issue);
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
        issue_category: category,
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

  const getMappingsForIssue = (issueName: string, actionType: string) => {
    return mappings.filter(m => m.issue_name === issueName && m.action_type === actionType);
  };

  const hasStrengthen = (issue: string) => getMappingsForIssue(issue, 'strengthen').length > 0;
  const hasStretch = (issue: string) => getMappingsForIssue(issue, 'stretch').length > 0;

  const dialogMappings = mappings.filter(m => m.issue_name === selectedIssue);
  const dialogStrengthen = dialogMappings.filter(m => m.action_type === 'strengthen');
  const dialogStretch = dialogMappings.filter(m => m.action_type === 'stretch');

  return (
    <>
      <Card className="rounded-none">
        <CardHeader className="py-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold text-sm">Επιλογή</th>
                  <th className="text-center py-2 px-4 font-semibold text-sm w-12">Α</th>
                  <th className="text-center py-2 px-4 font-semibold text-sm w-12">Δ</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr 
                    key={issue} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOpenDialog(issue)}
                  >
                    <td className="py-2 px-4 text-sm">{issue}</td>
                    <td className="py-2 px-4 text-center">
                      {hasStrengthen(issue) && (
                        <Check className="w-4 h-4 text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {hasStretch(issue) && (
                        <Check className="w-4 h-4 text-gray-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

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
