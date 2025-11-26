import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeEntry {
  id: string;
  category: string;
  original_info: string;
  corrected_info: string;
  knowledge_type: string;
  created_at: string;
}

const CATEGORIES = ['exercises', 'nutrition', 'philosophy'] as const;
const CATEGORY_LABELS = {
  exercises: 'Ασκήσεις',
  nutrition: 'Διατροφή',
  philosophy: 'Φιλοσοφία'
};

export const AdminAIKnowledge = () => {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    category: 'exercises' as typeof CATEGORIES[number],
    title: '',
    content: ''
  });
  const [editForm, setEditForm] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_global_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledge(data || []);
    } catch (error) {
      console.error('Error loading knowledge:', error);
      toast.error('Σφάλμα κατά τη φόρτωση της γνώσης');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error('Παρακαλώ συμπληρώστε τίτλο και περιεχόμενο');
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_global_knowledge')
        .insert({
          category: newEntry.category,
          original_info: newEntry.title,
          corrected_info: newEntry.content,
          knowledge_type: 'training'
        });

      if (error) throw error;

      toast.success('Η γνώση προστέθηκε επιτυχώς!');
      setNewEntry({ category: 'exercises', title: '', content: '' });
      loadKnowledge();
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast.error('Σφάλμα κατά την προσθήκη');
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setEditForm({
      title: entry.original_info,
      content: entry.corrected_info
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Παρακαλώ συμπληρώστε τίτλο και περιεχόμενο');
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_global_knowledge')
        .update({
          original_info: editForm.title,
          corrected_info: editForm.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Η γνώση ενημερώθηκε επιτυχώς!');
      setEditingId(null);
      loadKnowledge();
    } catch (error) {
      console.error('Error updating knowledge:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη γνώση;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_global_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Η γνώση διαγράφηκε επιτυχώς!');
      loadKnowledge();
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const getEntriesByCategory = (category: string) => {
    return knowledge.filter(entry => entry.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-[#00ffba]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RID AI Knowledge Base</h1>
          <p className="text-sm text-gray-600">Μάθε στον AI την εμπειρία και τη φιλοσοφία σου</p>
        </div>
      </div>

      {/* Φόρμα προσθήκης */}
      <Card className="rounded-none border-[#00ffba]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Προσθήκη Νέας Γνώσης
          </CardTitle>
          <CardDescription>
            Όλα τα prompts προστίθενται αυτόματα στο RID AI Coach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Κατηγορία</Label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as typeof CATEGORIES[number] })}
                className="w-full h-10 px-3 rounded-none border border-gray-200 bg-white text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Τίτλος</Label>
              <Input
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="π.χ. Τεχνική Squat"
                className="rounded-none"
              />
            </div>
          </div>
          <div>
            <Label>Περιεχόμενο / Οδηγίες</Label>
            <Textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              placeholder="Γράψε λεπτομερείς οδηγίες για το πως θέλεις να σκέφτεται ο AI..."
              className="rounded-none min-h-[120px]"
            />
          </div>
          <Button 
            onClick={handleAdd} 
            className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Προσθήκη
          </Button>
        </CardContent>
      </Card>

      {/* Tabs για κατηγορίες */}
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat} value={cat} className="rounded-none">
              {CATEGORY_LABELS[cat]} ({getEntriesByCategory(cat).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(category => (
          <TabsContent key={category} value={category} className="space-y-3 mt-6">
            {getEntriesByCategory(category).length === 0 ? (
              <Card className="rounded-none">
                <CardContent className="py-8 text-center text-gray-500">
                  Δεν υπάρχουν καταχωρήσεις σε αυτή την κατηγορία
                </CardContent>
              </Card>
            ) : (
              getEntriesByCategory(category).map(entry => (
                <Card key={entry.id} className="rounded-none">
                  <CardContent className="pt-6">
                    {editingId === entry.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Τίτλος</Label>
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="rounded-none"
                          />
                        </div>
                        <div>
                          <Label>Περιεχόμενο</Label>
                          <Textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            className="rounded-none min-h-[100px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(entry.id)}
                            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Αποθήκευση
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                            className="rounded-none"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Ακύρωση
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{entry.original_info}</h3>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(entry)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(entry.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{entry.corrected_info}</p>
                        <p className="text-xs text-gray-400 mt-3">
                          {new Date(entry.created_at).toLocaleDateString('el-GR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
