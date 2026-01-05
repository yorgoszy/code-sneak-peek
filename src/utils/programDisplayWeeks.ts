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

  const trainingDatesCount = params.trainingDates?.length || 0;
  if (trainingDatesCount === 0) return baseWeeks;

  // Υπολογίζουμε το συνολικό αριθμό ημερών ανά κύκλο (όλες οι εβδομάδες του template)
  const totalDaysPerCycle = baseWeeks.reduce(
    (sum, week) => sum + (week.program_days?.length || 0),
    0
  );

  if (totalDaysPerCycle === 0) return baseWeeks;

  // Πόσους πλήρεις κύκλους χρειαζόμαστε + τυχόν επιπλέον εβδομάδες
  const fullCycles = Math.floor(trainingDatesCount / totalDaysPerCycle);
  const remainingDays = trainingDatesCount % totalDaysPerCycle;

  // Υπολογίζουμε πόσες εβδομάδες χρειάζονται για τις υπόλοιπες ημέρες
  let extraWeeks = 0;
  let daysCounter = 0;
  for (const week of baseWeeks) {
    if (daysCounter >= remainingDays) break;
    extraWeeks++;
    daysCounter += week.program_days?.length || 0;
  }

  const totalWeeksNeeded = fullCycles * baseWeeks.length + extraWeeks;

  // Αν ήδη έχουμε αρκετές πραγματικές εβδομάδες, απλά επιστρέφουμε τις base.
  if (totalWeeksNeeded <= baseWeeks.length) return baseWeeks;

  return Array.from({ length: totalWeeksNeeded }, (_, idx) => {
    const templateWeek = baseWeeks[idx % baseWeeks.length];
    const week_number = idx + 1;

    return {
      ...templateWeek,
      id: `${templateWeek.id}__display_${week_number}`,
      week_number,
      name: `Εβδομάδα ${week_number}`,
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
