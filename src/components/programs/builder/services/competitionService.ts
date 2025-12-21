import { supabase } from '@/integrations/supabase/client';

interface CompetitionDay {
  dayIndex: number;
  dayName: string;
  weekName: string;
}

export const competitionService = {
  /**
   * Βρίσκει τις ημέρες αγώνα στο πρόγραμμα και επιστρέφει τα indexes τους
   */
  findCompetitionDays(weeks: any[]): CompetitionDay[] {
    const competitionDays: CompetitionDay[] = [];
    let dayIndex = 0;

    for (const week of weeks) {
      const days = week.program_days || week.days || [];
      for (const day of days) {
        if (day.is_competition_day) {
          competitionDays.push({
            dayIndex,
            dayName: day.name || `Ημέρα ${day.day_number}`,
            weekName: week.name || `Εβδομάδα ${week.week_number}`
          });
        }
        dayIndex++;
      }
    }

    return competitionDays;
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
      
      // Ενημέρωση/Δημιουργία ετήσιου πλάνου με φάση competition
      await this.updateAnnualPlanWithCompetition(userId, competitionDate);
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
   * Ενημερώνει ή δημιουργεί ετήσιο πλάνο με φάση competition για τον μήνα του αγώνα
   */
  async updateAnnualPlanWithCompetition(
    userId: string,
    competitionDate: string
  ): Promise<void> {
    const date = new Date(competitionDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed

    console.log(`📅 [CompetitionService] Updating annual plan for ${year}/${month}`);

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

    // Δημιουργία νέας φάσης competition στο ετήσιο πλάνο
    const { error: insertError } = await supabase
      .from('user_annual_phases')
      .insert([{
        user_id: userId,
        year,
        month,
        phase: 'competition',
        notes: `Αυτόματη δημιουργία - Αγώνας στις ${competitionDate}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ [CompetitionService] Error creating annual phase:', insertError);
    } else {
      console.log(`✅ [CompetitionService] Annual plan updated with competition phase for ${year}/${month}`);
    }
  }
};
