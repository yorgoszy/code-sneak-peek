import type { Week } from "@/components/programs/types";

/**
 * Αν το πρόγραμμα έχει λιγότερες εβδομάδες από όσες απαιτούνται από τις training_dates,
 * δημιουργούμε "εικονικές" εβδομάδες (read-only) επαναλαμβάνοντας τη δομή.
 *
 * Σημείωση: Χρησιμοποιείται ΜΟΝΟ για προβολή (όχι για αποθήκευση/edit).
 */
export function buildDisplayWeeks(params: {
  baseWeeks: Week[] | undefined;
  trainingDates?: string[];
}): Week[] {
  const baseWeeks = (params.baseWeeks || []).filter(Boolean);
  if (baseWeeks.length === 0) return [];

  const daysPerWeek = baseWeeks[0]?.program_days?.length || 0;
  const derivedWeeksCount =
    daysPerWeek > 0 && (params.trainingDates?.length || 0) > 0
      ? Math.ceil((params.trainingDates?.length || 0) / daysPerWeek)
      : baseWeeks.length;

  const weeksCount = Math.max(baseWeeks.length, derivedWeeksCount);

  // Αν ήδη έχουμε αρκετές πραγματικές εβδομάδες, απλά επιστρέφουμε τις base.
  if (weeksCount === baseWeeks.length) return baseWeeks;

  return Array.from({ length: weeksCount }, (_, idx) => {
    const templateWeek = baseWeeks[idx] ?? baseWeeks[idx % baseWeeks.length];
    const week_number = idx + 1;

    return {
      ...templateWeek,
      id: `${templateWeek.id}__display_${week_number}`,
      week_number,
      name: templateWeek.name || `Εβδομάδα ${week_number}`,
      program_days: (templateWeek.program_days || []).map((day) => ({
        ...day,
        id: `${day.id}__display_${week_number}`,
        // day_number παραμένει ίδιο (1..n)
        program_blocks: (day.program_blocks || []).map((block) => ({
          ...block,
          id: `${block.id}__display_${week_number}`,
          program_exercises: (block.program_exercises || []).map((pe) => ({
            ...pe,
            id: `${pe.id}__display_${week_number}`
          }))
        }))
      }))
    };
  });
}
