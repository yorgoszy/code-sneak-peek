import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
interface CompetitionDay {
  dayIndex: number;
  dayName: string;
  weekName: string;
}

interface MonthlyPhase {
  month: number;
  week: number;
  phase: string;
}

interface WeeklyPhase {
  month: number;
  week: number;
  day: number;
  phase: string;
}

export const competitionService = {
  /**
   * Βρίσκει τις ημέρες αγώνα στο πρόγραμμα και επιστρέφει τα indexes τους
   */
  findCompetitionDays(weeks: any[]): CompetitionDay[] {
    console.log('🔍 [CompetitionService] Searching competition days in weeks:', JSON.stringify(weeks, null, 2));
    const competitionDays: CompetitionDay[] = [];
    let dayIndex = 0;

    for (const week of weeks) {
      const days = week.program_days || week.days || [];
      console.log(`🔍 [CompetitionService] Week "${week.name}" has ${days.length} days`);
      for (const day of days) {
        console.log(`🔍 [CompetitionService] Day "${day.name}" is_competition_day:`, day.is_competition_day);
        if (day.is_competition_day) {
          competitionDays.push({
            dayIndex,
            dayName: day.name || `Ημέρα ${day.day_number}`,
            weekName: week.name || `Εβδομάδα ${week.week_number}`
          });
          console.log(`✅ [CompetitionService] Found competition day: ${day.name}`);
        }
        dayIndex++;
      }
    }

    console.log('🏆 [CompetitionService] Total competition days found:', competitionDays.length);
    return competitionDays;
  },

  /**
   * Υπολογίζει τον αριθμό εβδομάδας μέσα στον μήνα (1-indexed)
   */
  getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday=0
    const dayOfMonth = date.getDate();
    return Math.ceil((startDayOfWeek + dayOfMonth) / 7);
  },

  /**
   * Υπολογίζει την ημέρα της εβδομάδας (1=Δευτέρα, 7=Κυριακή)
   */
  getDayOfWeek(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 7 : day; // Κυριακή = 7
  },

  /**
   * Δημιουργεί εγγραφές αγώνων στον πίνακα competitions και ενημερώνει το ετήσιο πλάνο
   */
  async createCompetitionsForUser(
    userId: string,
    programName: string,
    weeks: any[],
    trainingDates: string[]
  ): Promise<void> {
    console.log('🏆 [CompetitionService] Checking for competition days...');
    
    const competitionDays = this.findCompetitionDays(weeks);
    
    if (competitionDays.length === 0) {
      console.log('✅ [CompetitionService] No competition days found');
      return;
    }

    console.log('🏆 [CompetitionService] Found competition days:', competitionDays);

    for (const compDay of competitionDays) {
      // Ελέγχουμε αν υπάρχει αντίστοιχη ημερομηνία
      if (compDay.dayIndex >= trainingDates.length) {
        console.warn(`⚠️ [CompetitionService] No date for day index ${compDay.dayIndex}`);
        continue;
      }

      const competitionDate = trainingDates[compDay.dayIndex];
      const competitionName = `${programName} - ${compDay.weekName} - ${compDay.dayName}`;

      // Δημιουργία εγγραφής στον πίνακα competitions
      await this.createCompetitionEntry(userId, competitionDate, competitionName, programName);
      
      // Ενημέρωση/Δημιουργία ετήσιου πλάνου (ετήσιο, μηνιαίο, εβδομαδιαίο)
      await this.updateAllPlanningLevels(userId, competitionDate);
    }
  },

  /**
   * Δημιουργεί εγγραφή στον πίνακα competitions
   */
  async createCompetitionEntry(
    userId: string,
    competitionDate: string,
    competitionName: string,
    programName: string
  ): Promise<void> {
    // Ελέγχουμε αν υπάρχει ήδη αγώνας για αυτή την ημερομηνία και χρήστη
    const { data: existingCompetition, error: checkError } = await supabase
      .from('competitions')
      .select('id')
      .eq('user_id', userId)
      .eq('competition_date', competitionDate)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [CompetitionService] Error checking existing competition:', checkError);
      return;
    }

    if (existingCompetition) {
      console.log(`ℹ️ [CompetitionService] Competition already exists for ${competitionDate}`);
      return;
    }

    // Δημιουργία νέου αγώνα
    const { error: insertError } = await supabase
      .from('competitions')
      .insert([{
        user_id: userId,
        competition_date: competitionDate,
        name: competitionName,
        notes: `Αυτόματη δημιουργία από πρόγραμμα: ${programName}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ [CompetitionService] Error creating competition:', insertError);
    } else {
      console.log(`✅ [CompetitionService] Competition created for ${competitionDate}`);
    }
  },

  /**
   * Ενημερώνει όλα τα επίπεδα προγραμματισμού (ετήσιο, μηνιαίο, εβδομαδιαίο)
   */
  async updateAllPlanningLevels(
    userId: string,
    competitionDate: string
  ): Promise<void> {
    const date = new Date(competitionDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const weekOfMonth = this.getWeekOfMonth(date);
    const dayOfWeek = this.getDayOfWeek(date);

    console.log(`📅 [CompetitionService] Updating planning for ${year}/${month} week ${weekOfMonth} day ${dayOfWeek}`);

    // 1. Ενημέρωση ετήσιου πλάνου (user_annual_phases)
    await this.updateAnnualPhase(userId, year, month);
    
    // 2. Ενημέρωση μηνιαίου και εβδομαδιαίου πλάνου (user_annual_planning)
    await this.updateMonthlyAndWeeklyPlanning(userId, year, month, weekOfMonth, dayOfWeek, competitionDate);
  },

  /**
   * Ενημερώνει ή δημιουργεί ετήσια φάση competition στον πίνακα user_annual_phases
   * Αυτός ο πίνακας χρησιμοποιείται στο /dashboard/annual-planning -> "Ετήσιος Προγραμματισμός"
   */
  async updateAnnualPhase(
    userId: string,
    year: number,
    month: number
  ): Promise<void> {
    // Ελέγχουμε αν υπάρχει ήδη φάση competition για αυτόν τον μήνα
    const { data: existingPhase, error: checkError } = await supabase
      .from('user_annual_phases')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .eq('phase', 'competition')
      .maybeSingle();

    if (checkError) {
      console.error('❌ [CompetitionService] Error checking existing annual phase:', checkError);
      return;
    }

    if (existingPhase) {
      console.log(`ℹ️ [CompetitionService] Competition phase already exists for ${year}/${month}`);
      return;
    }

    // Δημιουργία νέας φάσης competition στο ετήσιο πλάνο (κλικ στο Competition για τον συγκεκριμένο μήνα)
    const { error: insertError } = await supabase
      .from('user_annual_phases')
      .insert([{
        user_id: userId,
        year,
        month,
        phase: 'competition',
        notes: `Αυτόματη δημιουργία από ημέρα αγώνα`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ [CompetitionService] Error creating annual phase:', insertError);
    } else {
      console.log(`✅ [CompetitionService] Competition phase added to annual planning for ${year}/${month}`);
    }
  },

  /**
   * Ενημερώνει ή δημιουργεί μηνιαίο και εβδομαδιαίο πλάνο
   */
  async updateMonthlyAndWeeklyPlanning(
    userId: string,
    year: number,
    month: number,
    weekOfMonth: number,
    dayOfWeek: number,
    competitionDate: string
  ): Promise<void> {
    // Ελέγχουμε αν υπάρχει ήδη εγγραφή user_annual_planning για αυτόν τον χρήστη και έτος
    const { data: existingPlanning, error: checkError } = await supabase
      .from('user_annual_planning')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [CompetitionService] Error checking existing planning:', checkError);
      return;
    }

    const newMonthlyPhase: MonthlyPhase = {
      month,
      week: weekOfMonth,
      phase: 'competition'
    };

    const newWeeklyPhase: WeeklyPhase = {
      month,
      week: weekOfMonth,
      day: dayOfWeek,
      phase: 'competition'
    };

    if (existingPlanning) {
      // Ενημέρωση υπάρχοντος πλάνου
      const currentMonthlyPhases = (existingPlanning.monthly_phases as unknown as MonthlyPhase[]) || [];
      const currentWeeklyPhases = (existingPlanning.weekly_phases as unknown as WeeklyPhase[]) || [];

      // Έλεγχος αν υπάρχει ήδη η ίδια φάση
      const monthlyExists = currentMonthlyPhases.some(
        p => p.month === month && p.week === weekOfMonth && p.phase === 'competition'
      );
      const weeklyExists = currentWeeklyPhases.some(
        p => p.month === month && p.week === weekOfMonth && p.day === dayOfWeek && p.phase === 'competition'
      );

      const updatedMonthlyPhases = monthlyExists 
        ? currentMonthlyPhases 
        : [...currentMonthlyPhases, newMonthlyPhase];
      
      const updatedWeeklyPhases = weeklyExists 
        ? currentWeeklyPhases 
        : [...currentWeeklyPhases, newWeeklyPhase];

      const { error: updateError } = await supabase
        .from('user_annual_planning')
        .update({
          monthly_phases: JSON.parse(JSON.stringify(updatedMonthlyPhases)),
          weekly_phases: JSON.parse(JSON.stringify(updatedWeeklyPhases)),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlanning.id);

      if (updateError) {
        console.error('❌ [CompetitionService] Error updating planning:', updateError);
      } else {
        console.log(`✅ [CompetitionService] Updated existing planning for ${year}`);
      }
    } else {
      // Δημιουργία νέου πλάνου
      const { error: insertError } = await supabase
        .from('user_annual_planning')
        .insert([{
          user_id: userId,
          year,
          monthly_phases: JSON.parse(JSON.stringify([newMonthlyPhase])),
          weekly_phases: JSON.parse(JSON.stringify([newWeeklyPhase])),
          notes: `Αυτόματη δημιουργία - Ημέρα αγώνα ${competitionDate}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('❌ [CompetitionService] Error creating planning:', insertError);
      } else {
        console.log(`✅ [CompetitionService] Created new planning for ${year}`);
      }
    }
  }
};
