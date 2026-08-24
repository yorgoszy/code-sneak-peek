import { supabase } from "@/integrations/supabase/client";
import type { Program } from "@/components/programs/types";

/**
 * Ελαφριά φόρτωση λίστας προγραμμάτων (draft/template του admin, χωρίς αναθέσεις).
 * Φέρνουμε ΜΟΝΟ όσα χρειάζεται η λίστα (εβδομάδες/ημέρες για counters) —
 * όχι blocks/ασκήσεις (χιλιάδες γραμμές) που έκαναν τη σελίδα αργή.
 */
export const fetchDraftProgramsLight = async (): Promise<Program[]> => {
  const [{ data: programsData, error }, { data: assignmentRows }] = await Promise.all([
    supabase
      .from('programs')
      .select(`
        id, name, description, is_template, is_sellable, price, created_at, created_by, coach_id, user_id,
        program_weeks!fk_program_weeks_program_id(
          id, name, week_number,
          program_days!fk_program_days_week_id(id, name, day_number)
        )
      `)
      .is('created_by', null)
      .is('coach_id', null)
      .order('created_at', { ascending: false }),
    supabase.from('program_assignments').select('program_id'),
  ]);

  if (error) throw error;

  const assignedIds = new Set((assignmentRows || []).map((a: any) => a.program_id));

  return (programsData || [])
    .filter((p: any) => !assignedIds.has(p.id))
    .map((p: any) => ({
      ...p,
      program_assignments: [],
      program_weeks: (p.program_weeks || [])
        .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
        .map((w: any) => ({
          ...w,
          program_days: (w.program_days || []).sort(
            (a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)
          ),
        })),
    })) as Program[];
};

/**
 * Ελαφριά φόρτωση λίστας templates (χωρίς blocks/ασκήσεις).
 * Admin: μόνο templates χωρίς coach_id/created_by. Coach: τα δικά του.
 */
export const fetchTemplateProgramsLight = async (
  opts: { isAdmin: boolean; coachId?: string }
): Promise<Program[]> => {
  let query = supabase
    .from('programs')
    .select(`
      id, name, description, is_template, is_sellable, price, created_at, created_by, coach_id, user_id,
      program_weeks!fk_program_weeks_program_id(
        id, name, week_number,
        program_days!fk_program_days_week_id(id, name, day_number)
      )
    `)
    .eq('is_template', true)
    .order('created_at', { ascending: false });

  if (opts.isAdmin) {
    query = query.is('coach_id', null).is('created_by', null);
  } else if (opts.coachId) {
    query = query.or(`coach_id.eq.${opts.coachId},created_by.eq.${opts.coachId}`);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((p: any) => ({
    ...p,
    program_assignments: [],
    program_weeks: (p.program_weeks || [])
      .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
      .map((w: any) => ({
        ...w,
        program_days: (w.program_days || []).sort(
          (a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)
        ),
      })),
  })) as Program[];
};

/** Πλήρης φόρτωση ενός προγράμματος (on demand: edit / preview / duplicate). */
export const fetchFullProgram = async (programId: string): Promise<Program | null> => {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      program_weeks!fk_program_weeks_program_id(
        *,
        program_days!fk_program_days_week_id(
          *,
          program_blocks!fk_program_blocks_day_id(
            *,
            program_exercises!fk_program_exercises_block_id(
              *,
              exercises!fk_program_exercises_exercise_id(id, name, description, video_url)
            )
          )
        )
      )
    `)
    .eq('id', programId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching full program:', error);
    return null;
  }
  if (!data) return null;

  const program: any = {
    ...data,
    program_assignments: [],
    program_weeks: (data.program_weeks || [])
      .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
      .map((week: any) => ({
        ...week,
        program_days: (week.program_days || [])
          .sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
          .map((day: any) => ({
            ...day,
            program_blocks: (day.program_blocks || [])
              .sort((a: any, b: any) => (a.block_order || 0) - (b.block_order || 0))
              .map((block: any) => ({
                ...block,
                program_exercises: (block.program_exercises || []).sort(
                  (a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0)
                ),
              })),
          })),
      })),
  };

  return program as Program;
};
