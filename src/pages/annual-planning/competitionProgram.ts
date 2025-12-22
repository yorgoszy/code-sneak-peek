import { supabase } from "@/integrations/supabase/client";

export type WeeklyPhase = {
  month: number;
  week: number;
  day: number; // 1..7, Monday=1
};

const getWeeksGridForMonth = (year: number, month: number): (number | null)[][] => {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Convert JS getDay() (0=Sun) to Monday-based index (0=Mon)
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const weeks: (number | null)[][] = [];
  let currentDate = 1;

  const totalDays = startDayOfWeek + daysInMonth;
  const numWeeks = Math.ceil(totalDays / 7);

  for (let w = 0; w < numWeeks; w++) {
    const weekDates: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < startDayOfWeek) weekDates.push(null);
      else if (currentDate > daysInMonth) weekDates.push(null);
      else weekDates.push(currentDate++);
    }
    weeks.push(weekDates);
  }

  return weeks;
};

const dateToYmd = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeekMonday = (date: Date) => {
  const jsDay = date.getDay(); // 0=Sun
  const dow = jsDay === 0 ? 7 : jsDay; // 1..7 with Monday=1
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dow - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const ensureCompetitionProgramCard = async (params: {
  userId: string;
  userName: string;
  year: number;
  phase: WeeklyPhase;
}) => {
  const { userId, userName, year, phase } = params;

  const weeksGrid = getWeeksGridForMonth(year, phase.month);
  const dateNum = weeksGrid[phase.week - 1]?.[phase.day - 1] ?? null;
  if (!dateNum) return { created: false as const, reason: "invalid_date" as const };

  const competitionDate = new Date(year, phase.month - 1, dateNum);
  competitionDate.setHours(0, 0, 0, 0);

  const competitionDateStr = dateToYmd(competitionDate);
  const monday = startOfWeekMonday(competitionDate);
  const trainingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dateToYmd(d);
  });

  const programName = `Competition ${competitionDateStr} - ${userName}`;

  // Program
  const { data: existingProgram, error: programFindError } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", userId)
    .eq("name", programName)
    .maybeSingle();

  if (programFindError) throw programFindError;

  let programId = existingProgram?.id as string | undefined;

  if (!programId) {
    const { data: newProgram, error: programError } = await supabase
      .from("programs")
      .insert({
        name: programName,
        user_id: userId,
        type: "competition",
        status: "active",
        is_template: false,
      })
      .select("id")
      .single();

    if (programError) throw programError;
    programId = newProgram.id;
  }

  // Week (single week program)
  const { data: existingWeek, error: weekFindError } = await supabase
    .from("program_weeks")
    .select("id")
    .eq("program_id", programId)
    .eq("week_number", 1)
    .maybeSingle();

  if (weekFindError) throw weekFindError;

  let weekId = existingWeek?.id as string | undefined;
  if (!weekId) {
    const { data: newWeek, error: weekError } = await supabase
      .from("program_weeks")
      .insert({
        program_id: programId,
        name: `Εβδομάδα Αγώνα - ${competitionDateStr}`,
        week_number: 1,
      })
      .select("id")
      .single();

    if (weekError) throw weekError;
    weekId = newWeek.id;
  }

  // Days (7 days)
  const { data: existingDays, error: daysFindError } = await supabase
    .from("program_days")
    .select("id, day_number")
    .eq("week_id", weekId);

  if (daysFindError) throw daysFindError;

  const existingByDay = new Map<number, string>();
  (existingDays || []).forEach((d: any) => existingByDay.set(d.day_number, d.id));

  const daysToInsert = Array.from({ length: 7 }, (_, idx) => {
    const dayNumber = idx + 1;
    const isComp = dayNumber === phase.day;
    return {
      week_id: weekId,
      day_number: dayNumber,
      name: isComp ? `Ημέρα Αγώνα - ${competitionDateStr}` : `Ημέρα ${dayNumber}`,
      is_competition_day: isComp,
    };
  }).filter((d) => !existingByDay.has(d.day_number));

  if (daysToInsert.length) {
    const { error: insertDaysError } = await supabase.from("program_days").insert(daysToInsert);
    if (insertDaysError) throw insertDaysError;
  }

  // Ensure the competition day is flagged correctly (update existing day if it existed)
  const existingCompDayId = existingByDay.get(phase.day);
  if (existingCompDayId) {
    const { error: updateCompDayError } = await supabase
      .from("program_days")
      .update({ is_competition_day: true, name: `Ημέρα Αγώνα - ${competitionDateStr}` })
      .eq("id", existingCompDayId);

    if (updateCompDayError) throw updateCompDayError;
  }

  // Assignment (ProgramCard)
  const { data: existingAssignment, error: assignmentFindError } = await supabase
    .from("program_assignments")
    .select("id")
    .eq("program_id", programId)
    .eq("user_id", userId)
    .maybeSingle();

  if (assignmentFindError) throw assignmentFindError;

  if (!existingAssignment?.id) {
    const { error: assignmentError } = await supabase.from("program_assignments").insert({
      program_id: programId,
      user_id: userId,
      status: "active",
      training_dates: trainingDates,
    });

    if (assignmentError) throw assignmentError;
  }

  return { created: true as const, competitionDateStr };
};
