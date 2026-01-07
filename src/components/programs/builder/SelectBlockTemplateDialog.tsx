
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlockTemplate {
  id: string;
  name: string;
  description: string | null;
  training_type: string | null;
  workout_format: string | null;
  workout_duration: string | null;
  block_sets: number;
  exercises: any[];
  created_at: string;
}

interface SelectBlockTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: BlockTemplate) => void;
}

export const SelectBlockTemplateDialog: React.FC<SelectBlockTemplateDialogProps> = ({
  open,
  onOpenChange,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<BlockTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('block_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse exercises JSON
      const parsedTemplates = (data || []).map(t => ({
        ...t,
        exercises: typeof t.exercises === 'string' ? JSON.parse(t.exercises) : (t.exercises || [])
      }));
      
      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      const { error } = await supabase
        .from('block_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      toast.success('Template διαγράφηκε');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    }
  };

  const handleSelectTemplate = (template: BlockTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.training_type && t.training_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] rounded-none flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Επιλογή Block Template</DialogTitle>
          </DialogHeader>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Αναζήτηση template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none h-8 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto border">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Φόρτωση...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'Δεν βρέθηκαν templates' : 'Δεν υπάρχουν templates ακόμα'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredTemplates.map(template => (
                  <div 
                    key={template.id} 
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{template.name}</span>
                        {template.training_type && (
                          <Badge variant="outline" className="rounded-none text-[10px] px-1">
                            {template.training_type}
                          </Badge>
                        )}
                        {template.workout_format && (
                          <Badge variant="secondary" className="rounded-none text-[10px] px-1">
                            {template.workout_format}
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{template.description}</p>
                      )}
                      <div className="text-[10px] text-gray-400 mt-1">
                        {template.exercises?.length || 0} ασκήσεις
                        {template.block_sets > 1 && ` • ${template.block_sets} sets`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-none text-[#00ffba] hover:text-[#00ffba]/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-none text-red-600 hover:text-red-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-none h-8 text-xs"
            >
              Κλείσιμο
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Το template "{templateToDelete?.name}" θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
