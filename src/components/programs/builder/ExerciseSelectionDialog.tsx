
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Exercise } from '../types';
import { Search, Filter } from "lucide-react";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useExerciseCategories } from './hooks/useExerciseCategories';

interface ExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const ExerciseSelectionDialog: React.FC<ExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  
  const { categories } = useExerciseCategories();

  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(exercise => {
        const typeCategories = categories.filter(cat => cat.type === 'type');
        return typeCategories.some(cat => 
          cat.name.toLowerCase() === selectedType.toLowerCase()
        );
      });
    }

    // Direction filter
    if (selectedDirection !== 'all') {
      filtered = filtered.filter(exercise => {
        const directionCategories = categories.filter(cat => cat.type === 'direction');
        return directionCategories.some(cat => 
          cat.name.toLowerCase() === selectedDirection.toLowerCase()
        );
      });
    }

    // Equipment filter
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(exercise => {
        const equipmentCategories = categories.filter(cat => cat.type === 'equipment');
        return equipmentCategories.some(cat => 
          cat.name.toLowerCase() === selectedEquipment.toLowerCase()
        );
      });
    }

    return filtered;
  }, [exercises, searchTerm, selectedType, selectedDirection, selectedEquipment, categories]);

  const handleSelectExercise = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onOpenChange(false);
    setSearchTerm('');
    setSelectedType('all');
    setSelectedDirection('all');
    setSelectedEquipment('all');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setSelectedType('all');
    setSelectedDirection('all');
    setSelectedEquipment('all');
  };

  const uniqueTypes = useMemo(() => {
    const types = categories
      .filter(cat => cat.type === 'type')
      .map(cat => cat.name);
    return [...new Set(types)];
  }, [categories]);

  const uniqueDirections = useMemo(() => {
    const directions = categories
      .filter(cat => cat.type === 'direction')
      .map(cat => cat.name);
    return [...new Set(directions)];
  }, [categories]);

  const uniqueEquipment = useMemo(() => {
    const equipment = categories
      .filter(cat => cat.type === 'equipment')
      .map(cat => cat.name);
    return [...new Set(equipment)];
  }, [categories]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Επιλογή Άσκησης
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Αναζήτηση άσκησης..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Τύπος</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Όλοι οι τύποι" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Όλοι οι τύποι</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Κατεύθυνση</label>
              <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Όλες οι κατευθύνσεις" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Όλες οι κατευθύνσεις</SelectItem>
                  {uniqueDirections.map((direction) => (
                    <SelectItem key={direction} value={direction}>
                      {direction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Εξοπλισμός</label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Όλος ο εξοπλισμός" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Όλος ο εξοπλισμός</SelectItem>
                  {uniqueEquipment.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto border rounded">
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                {filteredExercises.map((exercise) => {
                  const videoUrl = exercise.video_url;
                  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
                  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;
                  
                  return (
                    <div
                      key={exercise.id}
                      className="border rounded p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectExercise(exercise.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          {exercise.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {exercise.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0">
                          {hasValidVideo && thumbnailUrl ? (
                            <div className="w-16 h-12 rounded overflow-hidden bg-gray-100">
                              <img
                                src={thumbnailUrl}
                                alt={`${exercise.name} video thumbnail`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-400">Video</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
