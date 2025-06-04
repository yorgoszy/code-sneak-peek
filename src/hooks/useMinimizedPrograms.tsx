
import { create } from 'zustand';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface WorkoutState {
  workoutInProgress: boolean;
  startTime: Date | null;
  elapsedTime: number;
}

interface MinimizedProgram {
  id: string;
  program: EnrichedAssignment;
  selectedDate: Date;
  workoutStatus: string;
  workoutState?: WorkoutState;
}

interface MinimizedProgramsStore {
  minimizedPrograms: MinimizedProgram[];
  addMinimizedProgram: (program: MinimizedProgram) => void;
  removeMinimizedProgram: (id: string) => void;
  clearAll: () => void;
  getMinimizedProgram: (id: string) => MinimizedProgram | undefined;
}

export const useMinimizedPrograms = create<MinimizedProgramsStore>((set, get) => ({
  minimizedPrograms: [],
  
  addMinimizedProgram: (program) => {
    set((state) => {
      // Αν υπάρχει ήδη, το αντικαθιστούμε
      const filtered = state.minimizedPrograms.filter(p => p.id !== program.id);
      return {
        minimizedPrograms: [...filtered, program]
      };
    });
  },
  
  removeMinimizedProgram: (id) => {
    set((state) => ({
      minimizedPrograms: state.minimizedPrograms.filter(p => p.id !== id)
    }));
  },
  
  clearAll: () => {
    set({ minimizedPrograms: [] });
  },
  
  getMinimizedProgram: (id) => {
    return get().minimizedPrograms.find(p => p.id === id);
  }
}));
