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
   * Δημιουργεί εγγραφές αγώνων στο ετήσιο πλάνο του χρήστη
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

      // Ελέγχουμε αν υπάρχει ήδη αγώνας για αυτή την ημερομηνία και χρήστη
      const { data: existingCompetition, error: checkError } = await supabase
        .from('competitions')
        .select('id')
        .eq('user_id', userId)
        .eq('competition_date', competitionDate)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [CompetitionService] Error checking existing competition:', checkError);
        continue;
      }

      if (existingCompetition) {
        console.log(`ℹ️ [CompetitionService] Competition already exists for ${competitionDate}`);
        continue;
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
    }
  }
};
