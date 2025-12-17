import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ProgramStructure, Week, Day, Block, ProgramExercise } from '@/components/programs/builder/hooks/useProgramBuilderState';

interface AIAction {
  type: string;
  payload?: any;
}

interface AIProgramBuilderContextType {
  // State
  isDialogOpen: boolean;
  pendingActions: AIAction[];
  
  // Dialog control
  openDialog: () => void;
  closeDialog: () => void;
  
  // AI Actions queue
  queueAction: (action: AIAction) => void;
  getNextAction: () => AIAction | undefined;
  clearActions: () => void;
  
  // Program state callback (set by dialog)
  registerProgramHandlers: (handlers: ProgramHandlers) => void;
  
  // Direct execution
  executeAction: (action: AIAction) => void;
}

interface ProgramHandlers {
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  selectUser: (userId: string) => void;
  selectUsers: (userIds: string[]) => void;
  selectGroup: (groupId: string) => void;
  toggleMultipleMode: (isMultiple: boolean) => void;
  addWeek: () => void;
  removeWeek: (weekId: string) => void;
  duplicateWeek: (weekId: string) => void;
  updateWeekName: (weekId: string, name: string) => void;
  addDay: (weekId: string) => void;
  removeDay: (weekId: string, dayId: string) => void;
  duplicateDay: (weekId: string, dayId: string) => void;
  updateDayName: (weekId: string, dayId: string, name: string) => void;
  addBlock: (weekId: string, dayId: string) => void;
  removeBlock: (weekId: string, dayId: string, blockId: string) => void;
  duplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  updateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  updateBlockType: (weekId: string, dayId: string, blockId: string, type: string) => void;
  updateBlockFormat: (weekId: string, dayId: string, blockId: string, format: string) => void;
  updateBlockDuration: (weekId: string, dayId: string, blockId: string, duration: string) => void;
  updateBlockSets: (weekId: string, dayId: string, blockId: string, sets: number) => void;
  addExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  removeExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  duplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  updateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  setTrainingDates: (dates: Date[]) => void;
  save: () => Promise<void>;
  assign: () => void;
  getProgram: () => ProgramStructure | null;
  getStats: () => { weeks: number; days: number; blocks: number; exercises: number };
}

const AIProgramBuilderContext = createContext<AIProgramBuilderContextType | null>(null);

export const useAIProgramBuilder = () => {
  const context = useContext(AIProgramBuilderContext);
  if (!context) {
    throw new Error('useAIProgramBuilder must be used within AIProgramBuilderProvider');
  }
  return context;
};

export const AIProgramBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const handlersRef = useRef<ProgramHandlers | null>(null);

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPendingActions([]);
  }, []);

  const queueAction = useCallback((action: AIAction) => {
    setPendingActions(prev => [...prev, action]);
  }, []);

  const getNextAction = useCallback(() => {
    const [next, ...rest] = pendingActions;
    if (next) {
      setPendingActions(rest);
    }
    return next;
  }, [pendingActions]);

  const clearActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  const registerProgramHandlers = useCallback((handlers: ProgramHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const executeAction = useCallback((action: AIAction) => {
    const handlers = handlersRef.current;
    if (!handlers) {
      console.warn('⚠️ No program handlers registered');
      return;
    }

    console.log('🤖 Executing AI action:', action);

    switch (action.type) {
      case 'SET_NAME':
        handlers.setName(action.payload);
        break;
      case 'SET_DESCRIPTION':
        handlers.setDescription(action.payload);
        break;
      case 'SELECT_USER':
        handlers.selectUser(action.payload);
        break;
      case 'SELECT_USERS':
        handlers.selectUsers(action.payload);
        break;
      case 'SELECT_GROUP':
        handlers.selectGroup(action.payload);
        break;
      case 'TOGGLE_MULTIPLE_MODE':
        handlers.toggleMultipleMode(action.payload);
        break;
      case 'ADD_WEEK':
        handlers.addWeek();
        break;
      case 'REMOVE_WEEK':
        handlers.removeWeek(action.payload.weekId);
        break;
      case 'DUPLICATE_WEEK':
        handlers.duplicateWeek(action.payload.weekId);
        break;
      case 'UPDATE_WEEK_NAME':
        handlers.updateWeekName(action.payload.weekId, action.payload.name);
        break;
      case 'ADD_DAY':
        handlers.addDay(action.payload.weekId);
        break;
      case 'REMOVE_DAY':
        handlers.removeDay(action.payload.weekId, action.payload.dayId);
        break;
      case 'DUPLICATE_DAY':
        handlers.duplicateDay(action.payload.weekId, action.payload.dayId);
        break;
      case 'UPDATE_DAY_NAME':
        handlers.updateDayName(action.payload.weekId, action.payload.dayId, action.payload.name);
        break;
      case 'ADD_BLOCK':
        handlers.addBlock(action.payload.weekId, action.payload.dayId);
        break;
      case 'REMOVE_BLOCK':
        handlers.removeBlock(action.payload.weekId, action.payload.dayId, action.payload.blockId);
        break;
      case 'DUPLICATE_BLOCK':
        handlers.duplicateBlock(action.payload.weekId, action.payload.dayId, action.payload.blockId);
        break;
      case 'UPDATE_BLOCK_NAME':
        handlers.updateBlockName(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.name);
        break;
      case 'UPDATE_BLOCK_TYPE':
        handlers.updateBlockType(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.trainingType);
        break;
      case 'UPDATE_BLOCK_FORMAT':
        handlers.updateBlockFormat(action.payload.weekId, action.payload.dayId, action.payload.dayId, action.payload.format);
        break;
      case 'UPDATE_BLOCK_DURATION':
        handlers.updateBlockDuration(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.duration);
        break;
      case 'UPDATE_BLOCK_SETS':
        handlers.updateBlockSets(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.sets);
        break;
      case 'ADD_EXERCISE':
        handlers.addExercise(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.exerciseId);
        break;
      case 'REMOVE_EXERCISE':
        handlers.removeExercise(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.exerciseId);
        break;
      case 'DUPLICATE_EXERCISE':
        handlers.duplicateExercise(action.payload.weekId, action.payload.dayId, action.payload.blockId, action.payload.exerciseId);
        break;
      case 'UPDATE_EXERCISE':
        handlers.updateExercise(
          action.payload.weekId, 
          action.payload.dayId, 
          action.payload.blockId, 
          action.payload.exerciseId,
          action.payload.field,
          action.payload.value
        );
        break;
      case 'SET_TRAINING_DATES':
        const dates = action.payload.map((d: string) => new Date(d));
        handlers.setTrainingDates(dates);
        break;
      case 'SAVE':
        handlers.save();
        break;
      case 'ASSIGN':
        handlers.assign();
        break;
      case 'GET_STATS':
        return handlers.getStats();
      case 'GET_PROGRAM':
        return handlers.getProgram();
      default:
        console.warn('Unknown AI action:', action.type);
    }
  }, []);

  return (
    <AIProgramBuilderContext.Provider value={{
      isDialogOpen,
      pendingActions,
      openDialog,
      closeDialog,
      queueAction,
      getNextAction,
      clearActions,
      registerProgramHandlers,
      executeAction
    }}>
      {children}
    </AIProgramBuilderContext.Provider>
  );
};
