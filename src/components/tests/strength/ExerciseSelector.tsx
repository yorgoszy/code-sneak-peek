import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Exercise } from "./types";

const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExerciseId: string;
  exerciseIndex: number;
  onExerciseSelect: (exerciseId: string) => void;
  onRemove: () => void;
}

export const ExerciseSelector = ({ 
  exercises, 
  selectedExerciseId, 
  exerciseIndex, 
  onExerciseSelect, 
  onRemove 
}: ExerciseSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises;
    const normalized = normalizeText(searchQuery);
    return exercises.filter(e => normalizeText(e.name).includes(normalized));
  }, [exercises, searchQuery]);

  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 pr-2">
        <Label className="text-sm">Άσκηση {exerciseIndex + 1}</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between rounded-none h-8 text-sm"
            >
              {selectedExerciseId
                ? exercises.find((exercise) => exercise.id === selectedExerciseId)?.name
                : "Επιλέξτε άσκηση..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 rounded-none">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Αναζήτηση ασκήσεων..." 
                className="h-9" 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>Δεν βρέθηκαν ασκήσεις.</CommandEmpty>
              <CommandGroup>
                <CommandList>
                  {filteredExercises.map((exercise) => (
                    <CommandItem
                      key={exercise.id}
                      value={exercise.name}
                      onSelect={() => {
                        onExerciseSelect(exercise.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{exercise.name}</span>
                        {exercise.usage_count && exercise.usage_count > 0 && (
                          <Badge variant="secondary" className="text-xs rounded-none">
                            {exercise.usage_count}x
                          </Badge>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedExerciseId === exercise.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRemove}
        className="rounded-none h-8 w-8 p-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};
