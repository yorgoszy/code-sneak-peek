
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, ChevronDown, ChevronRight, ChevronUp, Check, Play, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTimeInput } from '@/utils/timeFormatting';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useExercises } from '@/hooks/useExercises';
import { EditBlockTemplateDialog } from './EditBlockTemplateDialog';
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

const TRAINING_TYPE_LABELS: Record<string, string> = {
  'warm up': 'warm up',
  str: 'str',
  'str/spd': 'str/spd',
  pwr: 'pwr',
  'spd/str': 'spd/str',
  spd: 'spd',
  'str/end': 'str/end',
  'pwr/end': 'pwr/end',
  'spd/end': 'spd/end',
  end: 'end',
  hpr: 'hpr',
  recovery: 'rec',
  accessory: 'acc',
  rotational: 'rot',
};

const WORKOUT_FORMAT_LABELS: Record<string, string> = {
  non_stop: 'Non Stop',
  emom: 'EMOM',
  for_time: 'For Time',
  amrap: 'AMRAP',
};

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
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<BlockTemplate | null>(null);

  const { exercises: availableExercises } = useExercises();

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

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const getExerciseName = (exercise: any) => {
    if (exercise.exercise_name) return exercise.exercise_name;
    const found = availableExercises.find(e => e.id === exercise.exercise_id);
    return found?.name || 'Άγνωστη άσκηση';
  };

  const getExerciseVideoUrl = (exercise: any) => {
    const found = availableExercises.find(e => e.id === exercise.exercise_id);
    return found?.video_url;
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

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Φόρτωση...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'Δεν βρέθηκαν templates' : 'Δεν υπάρχουν templates ακόμα'}
              </div>
            ) : (
              filteredTemplates.map(template => {
                const isExpanded = expandedTemplates.has(template.id);
                
                return (
                  <Card key={template.id} className="rounded-none w-full" style={{ backgroundColor: '#31365d' }}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(template.id)}>
                      <CardHeader className="p-1 space-y-0">
                        <div className="flex justify-between items-center">
                          <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded flex-1">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-white" />}
                            <div className="flex items-center gap-2">
                              {template.training_type && (
                                <span className="text-xs text-white bg-gray-700 px-2 py-0.5 rounded-none">
                                  {TRAINING_TYPE_LABELS[template.training_type] || template.training_type}
                                </span>
                              )}
                              <span className="text-xs text-white font-medium">{template.name}</span>
                              {!isExpanded && template.exercises?.length > 0 && (
                                <span className="text-xs bg-gray-500 px-2 py-0.5 rounded-full text-white">
                                  {template.exercises.length}
                                </span>
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex gap-0">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTemplate(template);
                              }}
                              size="sm"
                              variant="ghost"
                              className="rounded-none hover:bg-gray-600"
                              title="Επιλογή"
                            >
                              <Check className="w-3 h-3 text-[#00ffba]" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateToEdit(template);
                                setEditDialogOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="rounded-none hover:bg-gray-600"
                              title="Επεξεργασία"
                            >
                              <Pencil className="w-3 h-3 text-white" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateToDelete(template);
                                setDeleteDialogOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="rounded-none hover:bg-gray-600"
                              title="Διαγραφή"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Workout Format and Sets */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {template.workout_format && (
                            <span className="text-xs text-gray-400">
                              {WORKOUT_FORMAT_LABELS[template.workout_format] || template.workout_format}
                            </span>
                          )}
                          {template.workout_duration && (
                            <span className="text-xs text-white">{template.workout_duration}</span>
                          )}
                          {template.block_sets > 1 && (
                            <span className="text-xs text-[#00ffba]">x{template.block_sets}</span>
                          )}
                        </div>
                      </CardHeader>

                      <CollapsibleContent>
                        <CardContent className="p-0 m-0">
                          {template.exercises?.length === 0 ? (
                            <div className="p-3 text-center text-gray-400 text-xs">
                              Δεν υπάρχουν ασκήσεις
                            </div>
                          ) : (
                            <div className="w-full">
                              {template.exercises?.map((exercise, index) => {
                                const exerciseName = getExerciseName(exercise);
                                const videoUrl = getExerciseVideoUrl(exercise);
                                const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
                                const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

                                return (
                                  <div key={index} className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
                                    {/* Exercise Selection Button */}
                                    <div className="px-2 py-0 border-b bg-gray-100 flex items-center gap-2 w-full" style={{ minHeight: '28px' }}>
                                      <div className="flex-1 text-sm h-6 flex items-center px-2 bg-gray-200" style={{ borderRadius: '0px', fontSize: '12px' }}>
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="flex items-center gap-1 flex-1">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm">
                                              {index + 1}
                                            </span>
                                            <span className="truncate">{exerciseName}</span>
                                          </div>
                                          
                                          {/* Video Thumbnail */}
                                          {hasValidVideo && thumbnailUrl ? (
                                            <div className="w-8 h-5 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                                              <img
                                                src={thumbnailUrl}
                                                alt={`${exerciseName} video thumbnail`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.currentTarget as HTMLImageElement;
                                                  target.style.display = 'none';
                                                }}
                                              />
                                            </div>
                                          ) : hasValidVideo ? (
                                            <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                                              <Play className="w-2 h-2 text-gray-400" />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                                              <span className="text-xs text-gray-400">-</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Exercise Details Form */}
                                    <div className="flex px-2 py-0 gap-0 w-full" style={{ minHeight: '28px' }}>
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Sets</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.sets || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Reps</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.reps || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.percentage_1rm || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Kg</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.kg || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>m/s</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.velocity_ms || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Tempo</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.tempo || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center" style={{ width: '52px' }}>
                                        <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
                                        <div className="text-center w-full bg-gray-50 border" style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '2px 4px' }}>
                                          {exercise.rest || '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })
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

      <EditBlockTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={templateToEdit}
        onSuccess={() => {
          fetchTemplates();
        }}
      />
    </>
  );
};
