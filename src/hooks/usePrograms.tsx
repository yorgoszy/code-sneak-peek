
import { useProgramCrud } from './programs/useProgramCrud';
import { useProgramSave } from './programs/useProgramSave';
import { useProgramAssignments } from './programs/useProgramAssignments';

export const usePrograms = () => {
  const { loading: crudLoading, fetchPrograms, deleteProgram, duplicateProgram, fetchProgramsWithAssignments } = useProgramCrud();
  const { loading: saveLoading, saveProgram } = useProgramSave();
  const { fetchProgramAssignments } = useProgramAssignments();

  const loading = crudLoading || saveLoading;

  return {
    loading,
    fetchPrograms,
    fetchProgramsWithAssignments,
    saveProgram,
    deleteProgram,
    duplicateProgram: async (program: any) => {
      return await duplicateProgram(program, saveProgram);
    },
    fetchProgramAssignments
  };
};
