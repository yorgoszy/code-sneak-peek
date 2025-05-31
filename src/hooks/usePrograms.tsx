
import { useProgramCrud } from './programs/useProgramCrud';
import { useProgramSave } from './programs/useProgramSave';
import { useProgramAssignments } from './programs/useProgramAssignments';

export const usePrograms = () => {
  const { loading: crudLoading, fetchPrograms, deleteProgram, duplicateProgram } = useProgramCrud();
  const { loading: saveLoading, saveProgram } = useProgramSave();
  const { fetchProgramAssignments } = useProgramAssignments();

  const loading = crudLoading || saveLoading;

  return {
    loading,
    fetchPrograms,
    saveProgram,
    deleteProgram,
    duplicateProgram: (program: any) => duplicateProgram(program, saveProgram),
    fetchProgramAssignments
  };
};
