import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, MoveHorizontal } from 'lucide-react';
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
  const [selectedIssue, setSelectedIssue] = useState<string>(issues[0] || '');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('strengthen');
  const [dysfunction, setDysfunction] = useState<string>('');

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

  const handleAddMapping = async () => {
    if (!selectedIssue || !selectedMuscle) {
      toast.error('Επιλέξτε πρόβλημα και μυ');
      return;
    }

    const { error } = await supabase
      .from('functional_issue_muscle_mappings')
      .insert({
        issue_category: category,
        issue_name: selectedIssue,
        muscle_id: selectedMuscle,
        action_type: selectedAction,
        dysfunction: dysfunction.trim() || null
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
      setDysfunction('');
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

  const getMappingsForIssue = (issueName: string) => {
    return mappings.filter(m => m.issue_name === issueName);
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new mapping */}
        <div className="p-4 bg-gray-50 border space-y-4">
          <h3 className="font-semibold text-sm">Νέα Σύνδεση</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={selectedIssue} onValueChange={setSelectedIssue}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Πρόβλημα" />
              </SelectTrigger>
              <SelectContent>
                {issues.map(issue => (
                  <SelectItem key={issue} value={issue}>{issue}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Μυς" />
              </SelectTrigger>
              <SelectContent>
                {muscles.map(muscle => (
                  <SelectItem key={muscle.id} value={muscle.id}>
                    {muscle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strengthen">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="w-3 h-3 text-green-600" />
                    Ενδυνάμωση
                  </span>
                </SelectItem>
                <SelectItem value="stretch">
                  <span className="flex items-center gap-2">
                    <MoveHorizontal className="w-3 h-3 text-blue-600" />
                    Διάταση
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Δυσλειτουργία (προαιρετικό)"
              value={dysfunction}
              onChange={(e) => setDysfunction(e.target.value)}
              className="rounded-none"
            />

            <Button 
              onClick={handleAddMapping} 
              className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Προσθήκη
            </Button>
          </div>
        </div>

        {/* Mappings by issue */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
        ) : (
          <div className="space-y-4">
            {issues.map(issue => {
              const issueMappings = getMappingsForIssue(issue);
              const strengthenMappings = issueMappings.filter(m => m.action_type === 'strengthen');
              const stretchMappings = issueMappings.filter(m => m.action_type === 'stretch');
              
              return (
                <div key={issue} className="border border-gray-200">
                  <div className="bg-gray-100 px-4 py-2 font-semibold text-sm border-b">
                    {issue}
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengthen */}
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
                        <ArrowUp className="w-4 h-4" />
                        Ενδυνάμωση
                      </div>
                      {strengthenMappings.length === 0 ? (
                        <span className="text-xs text-gray-400">Δεν υπάρχουν μύες</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {strengthenMappings.map(m => (
                            <div 
                              key={m.id} 
                              className="flex items-center gap-2 bg-green-50 border border-green-200 px-2 py-1 text-xs group"
                            >
                              <span>{m.muscles?.name}</span>
                              {m.dysfunction && (
                                <span className="text-gray-500">({m.dysfunction})</span>
                              )}
                              <button
                                onClick={() => handleDeleteMapping(m.id)}
                                className="text-red-500 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stretch */}
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                        <MoveHorizontal className="w-4 h-4" />
                        Διάταση
                      </div>
                      {stretchMappings.length === 0 ? (
                        <span className="text-xs text-gray-400">Δεν υπάρχουν μύες</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {stretchMappings.map(m => (
                            <div 
                              key={m.id} 
                              className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-2 py-1 text-xs group"
                            >
                              <span>{m.muscles?.name}</span>
                              {m.dysfunction && (
                                <span className="text-gray-500">({m.dysfunction})</span>
                              )}
                              <button
                                onClick={() => handleDeleteMapping(m.id)}
                                className="text-red-500 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
