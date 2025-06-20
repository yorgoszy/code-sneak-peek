
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  athlete: any;
  activePrograms: any[];
  recentWorkouts: any[];
  testSessions: any[];
  conversations: any[];
  allUsers?: any[]; // Για admin
}

export class UserDataService {
  private static instance: UserDataService;
  private userData: UserData | null = null;
  private currentUserId: string | null = null;
  private isAdmin = false;

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  async loadUserData(userId: string): Promise<UserData> {
    if (this.currentUserId === userId && this.userData) {
      return this.userData;
    }
    
    try {
      console.log('🔄 Φορτώνω δεδομένα για χρήστη:', userId);
      
      // Βασικά στοιχεία χρήστη
      const { data: athlete } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      // Έλεγχος αν είναι admin
      this.isAdmin = athlete?.role === 'admin';

      // Ενεργά προγράμματα με όλες τις λεπτομέρειες
      const { data: activePrograms } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!fk_program_assignments_program_id (
            name, description, type,
            program_weeks!fk_program_weeks_program_id (
              name, week_number,
              program_days!fk_program_days_week_id (
                name, day_number, estimated_duration_minutes,
                program_blocks!fk_program_blocks_day_id (
                  name, block_order,
                  program_exercises!fk_program_exercises_block_id (
                    sets, reps, kg, rest, tempo, rm, ms,
                    exercises!fk_program_exercises_exercise_id (name, description, video_url)
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Προπονήσεις με αποτελέσματα
      const { data: recentWorkouts } = await supabase
        .from('workout_completions')
        .select(`
          *,
          exercise_results!fk_exercise_results_workout_completion (
            *,
            program_exercises!fk_exercise_results_program_exercise (
              *,
              exercises!fk_program_exercises_exercise_id (name)
            )
          )
        `)
        .eq('user_id', userId)
        .order('completed_date', { ascending: false })
        .limit(20);

      // Όλα τα τεστ με λεπτομέρειες
      const { data: testSessions } = await supabase
        .from('test_sessions')
        .select(`
          *,
          anthropometric_test_data!fk_anthropometric_test_data_session (*),
          strength_test_data!fk_strength_test_data_session (
            *,
            exercises!fk_strength_test_data_exercise (name, description)
          ),
          endurance_test_data!fk_endurance_test_data_session (*),
          functional_test_data!fk_functional_test_data_session (*)
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(10);

      // Προηγούμενες συνομιλίες για μάθηση
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Αν είναι admin, φόρτωσε όλα τα δεδομένα
      let allUsers = null;
      if (this.isAdmin) {
        const { data: users } = await supabase
          .from('app_users')
          .select(`
            *,
            program_assignments!fk_program_assignments_user_id (
              *,
              programs!fk_program_assignments_program_id (name, type)
            )
          `)
          .limit(100);
        allUsers = users;
      }

      this.userData = {
        athlete,
        activePrograms: activePrograms || [],
        recentWorkouts: recentWorkouts || [],
        testSessions: testSessions || [],
        conversations: conversations || [],
        allUsers: allUsers || []
      };

      this.currentUserId = userId;
      console.log('✅ Δεδομένα φορτώθηκαν επιτυχώς');
      return this.userData;
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης δεδομένων:', error);
      throw error;
    }
  }

  getUserData(): UserData | null {
    return this.userData;
  }

  getIsAdmin(): boolean {
    return this.isAdmin;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
