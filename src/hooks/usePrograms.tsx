
import { useState } from 'react';
import { Program } from "@/components/programs/types";
import { 
  fetchPrograms as fetchProgramsUtil,
  saveProgram as saveProgramUtil,
  deleteProgram as deleteProgramUtil
} from "./usePrograms/programCrudOperations";
import { duplicateProgram as duplicateProgramUtil } from "./usePrograms/programDuplicationUtils";

export const usePrograms = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      return await fetchProgramsUtil();
    } finally {
      setLoading(false);
    }
  };

  const saveProgram = async (programData: any) => {
    setLoading(true);
    try {
      await saveProgramUtil(programData);
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string) => {
    return await deleteProgramUtil(programId);
  };

  const duplicateProgram = async (originalProgram: Program) => {
    await duplicateProgramUtil(originalProgram);
  };

  return {
    loading,
    fetchPrograms,
    saveProgram,
    deleteProgram,
    duplicateProgram
  };
};
