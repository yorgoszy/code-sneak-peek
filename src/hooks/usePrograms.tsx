
import { useProgramCrud } from './programs/useProgramCrud';
import { useProgramSave } from './programs/useProgramSave';
import { useProgramAssignments } from './programs/useProgramAssignments';

export const usePrograms = () => {
  const { loading: crudLoading, fetchPrograms, deleteProgram, duplicateProgram } = useProgramCrud();
  const { loading: saveLoading, saveProgram } = useProgramSave();
  const { fetchProgramAssignments } = useProgramAssignments();

  const loading = crudLoading || saveLoading;

  const wrappedSaveProgram = async (data: any): Promise<void> => {
    await saveProgram(data);
  };

  return {
    loading,
    fetchPrograms,
    saveProgram: wrappedSaveProgram,
    deleteProgram,
    duplicateProgram: async (program: any) => {
      return await duplicateProgram(program, wrappedSaveProgram);
    },
    fetchProgramAssignments
  };
};
