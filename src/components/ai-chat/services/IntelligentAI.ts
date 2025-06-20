
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  athlete: any;
  activePrograms: any[];
  recentWorkouts: any[];
  testSessions: any[];
  conversations: any[];
  allUsers?: any[]; // Για admin
}

export class IntelligentAI {
  private static instance: IntelligentAI;
  private userData: UserData | null = null;
  private currentUserId: string | null = null;
  private isAdmin = false;

  static getInstance(): IntelligentAI {
    if (!IntelligentAI.instance) {
      IntelligentAI.instance = new IntelligentAI();
    }
    return IntelligentAI.instance;
  }

  async loadUserData(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.userData) return;
    
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
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης δεδομένων:', error);
      throw error;
    }
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    if (!this.userData) {
      return "Παρακαλώ περίμενε να φορτωθούν τα δεδομένα...";
    }

    // Αποθήκευση του μηνύματος του χρήστη
    await this.saveMessage(message, 'user');

    // Ανάλυση μηνύματος
    const analysis = this.analyzeMessage(message);
    
    // Δημιουργία απάντησης
    let response: string;
    
    if (analysis.complexity === 'simple') {
      response = await this.generateLocalResponse(message, analysis);
    } else {
      response = await this.generateOpenAIResponse(message, analysis);
    }

    // Αποθήκευση της απάντησης
    await this.saveMessage(response, 'assistant');
    
    // Μάθηση από τη συνομιλία
    await this.learnFromConversation(message, response, analysis);

    return response;
  }

  private analyzeMessage(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    // Απλές ερωτήσεις που μπορώ να απαντήσω τοπικά
    const simplePatterns = [
      'πρόοδος', 'προπόνηση', 'διατροφή', 'τεστ', 'βάρος', 'στόχοι'
    ];
    
    // Σύνθετες ερωτήσεις για OpenAI
    const complexPatterns = [
      'γιατί', 'πώς να', 'στρατηγική', 'σχέδιο', 'συγκρίνω', 'αναλύω'
    ];

    const isSimple = simplePatterns.some(pattern => lowerMessage.includes(pattern));
    const isComplex = complexPatterns.some(pattern => lowerMessage.includes(pattern));

    return {
      complexity: isComplex ? 'complex' : 'simple',
      category: this.categorizeMessage(lowerMessage),
      intent: this.getMessageIntent(lowerMessage)
    };
  }

  private categorizeMessage(message: string): string {
    if (message.includes('διατροφή') || message.includes('φαγητό')) return 'nutrition';
    if (message.includes('προπόνηση') || message.includes('άσκηση')) return 'training';
    if (message.includes('τεστ') || message.includes('μέτρηση')) return 'testing';
    if (message.includes('πρόοδος') || message.includes('αποτελέσματα')) return 'progress';
    if (message.includes('ανάκαμψη') || message.includes('κούραση')) return 'recovery';
    return 'general';
  }

  private getMessageIntent(message: string): string {
    if (message.includes('πόσο') || message.includes('τι')) return 'question';
    if (message.includes('θέλω') || message.includes('μπορώ')) return 'request';
    if (message.includes('βοήθεια') || message.includes('συμβουλή')) return 'advice';
    return 'conversation';
  }

  private async generateLocalResponse(message: string, analysis: any): Promise<string> {
    const { category } = analysis;
    const { athlete, activePrograms, recentWorkouts, testSessions } = this.userData!;

    switch (category) {
      case 'progress':
        return this.generateProgressReport();
      case 'training':
        return this.generateTrainingAdvice();
      case 'nutrition':
        return this.generateNutritionAdvice();
      case 'testing':
        return this.generateTestAnalysis();
      case 'recovery':
        return this.generateRecoveryAdvice();
      default:
        return this.generateGeneralResponse(message);
    }
  }

  private async generateOpenAIResponse(message: string, analysis: any): Promise<string> {
    try {
      console.log('🤖 Συμβουλεύομαι το OpenAI για σύνθετη ερώτηση');
      
      const context = this.buildContextForOpenAI();
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message,
          context,
          userId: this.currentUserId,
          isAdmin: this.isAdmin
        }
      });

      if (error) throw error;

      // Μάθηση από την OpenAI απάντηση
      await this.learnFromOpenAI(message, data.response);

      return data.response;
    } catch (error) {
      console.error('❌ OpenAI Error:', error);
      return this.generateLocalResponse(message, analysis);
    }
  }

  private buildContextForOpenAI(): string {
    const { athlete, activePrograms, recentWorkouts, testSessions } = this.userData!;
    
    let context = `Αθλητής: ${athlete?.name}\n`;
    context += `Ηλικία: ${athlete?.birth_date ? this.calculateAge(athlete.birth_date) : 'Άγνωστη'}\n`;
    
    if (activePrograms.length > 0) {
      context += `\nΕνεργά Προγράμματα:\n`;
      activePrograms.forEach((prog: any) => {
        context += `- ${prog.programs?.name}: ${prog.programs?.type}\n`;
      });
    }

    if (recentWorkouts.length > 0) {
      context += `\nΠρόσφατες Προπονήσεις: ${recentWorkouts.length}\n`;
      const completionRate = Math.round(
        (recentWorkouts.filter((w: any) => w.status === 'completed').length / recentWorkouts.length) * 100
      );
      context += `Ποσοστό ολοκλήρωσης: ${completionRate}%\n`;
    }

    if (testSessions.length > 0) {
      const latest = testSessions[0];
      context += `\nΤελευταίο τεστ: ${new Date(latest.test_date).toLocaleDateString('el-GR')}\n`;
    }

    return context;
  }

  private async saveMessage(content: string, type: 'user' | 'assistant'): Promise<void> {
    try {
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: this.currentUserId,
          content,
          message_type: type,
          metadata: {
            timestamp: new Date().toISOString(),
            isAdmin: this.isAdmin
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα αποθήκευσης μηνύματος:', error);
    }
  }

  private async learnFromConversation(question: string, answer: string, analysis: any): Promise<void> {
    // Εδώ θα αποθηκεύουμε τα patterns για μάθηση
    try {
      await supabase
        .from('ai_global_knowledge')
        .insert({
          knowledge_type: 'conversation_pattern',
          category: analysis.category,
          original_info: question,
          corrected_info: answer,
          confidence_score: analysis.complexity === 'simple' ? 8 : 6,
          metadata: {
            user_id: this.currentUserId,
            intent: analysis.intent,
            learned_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα μάθησης:', error);
    }
  }

  private async learnFromOpenAI(question: string, answer: string): Promise<void> {
    try {
      await supabase
        .from('ai_global_knowledge')
        .insert({
          knowledge_type: 'openai_response',
          category: 'complex_answer',
          original_info: question,
          corrected_info: answer,
          confidence_score: 9,
          metadata: {
            source: 'openai',
            user_id: this.currentUserId,
            learned_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα μάθησης από OpenAI:', error);
    }
  }

  private generateProgressReport(): string {
    const { athlete, recentWorkouts, testSessions } = this.userData!;
    
    let report = `📊 **Αναφορά Προόδου για ${athlete?.name}**\n\n`;
    
    if (recentWorkouts.length > 0) {
      const completed = recentWorkouts.filter((w: any) => w.status === 'completed').length;
      const rate = Math.round((completed / recentWorkouts.length) * 100);
      
      report += `🏃‍♀️ **Προπονήσεις (τελευταίες 20):**\n`;
      report += `• Ολοκληρωμένες: ${completed}/${recentWorkouts.length} (${rate}%)\n`;
      
      if (recentWorkouts[0]?.actual_duration_minutes) {
        const avgTime = Math.round(
          recentWorkouts
            .filter((w: any) => w.actual_duration_minutes)
            .reduce((sum: number, w: any) => sum + w.actual_duration_minutes, 0) / 
          recentWorkouts.filter((w: any) => w.actual_duration_minutes).length
        );
        report += `• Μέσος χρόνος: ${avgTime} λεπτά\n`;
      }
    }

    if (testSessions.length > 0) {
      const latest = testSessions[0];
      report += `\n💪 **Τελευταίο Τεστ:**\n`;
      report += `• Ημερομηνία: ${new Date(latest.test_date).toLocaleDateString('el-GR')}\n`;
      
      if (latest.anthropometric_test_data?.length > 0) {
        const anthro = latest.anthropometric_test_data[0];
        if (anthro.weight) report += `• Βάρος: ${anthro.weight}kg\n`;
        if (anthro.body_fat_percentage) report += `• Λίπος: ${anthro.body_fat_percentage}%\n`;
      }
    }

    report += `\n🎯 **Συμβουλές:**\n`;
    report += `• Συνέχισε με τη συνέπεια!\n`;
    report += `• Προσοχή στην ανάκαμψη\n`;

    return report;
  }

  private generateTrainingAdvice(): string {
    const { activePrograms, recentWorkouts } = this.userData!;
    
    let advice = `💪 **Συμβουλές Προπόνησης**\n\n`;
    
    if (activePrograms.length > 0) {
      const program = activePrograms[0];
      advice += `🏃‍♀️ **Τρέχον Πρόγραμμα:** ${program.programs?.name}\n`;
      advice += `• Τύπος: ${program.programs?.type}\n`;
    }

    if (recentWorkouts.length > 0) {
      const completionRate = Math.round(
        (recentWorkouts.filter((w: any) => w.status === 'completed').length / recentWorkouts.length) * 100
      );
      
      advice += `\n📊 **Στατιστικά:**\n`;
      advice += `• Ποσοστό ολοκλήρωσης: ${completionRate}%\n`;
      
      if (completionRate < 80) {
        advice += `\n⚠️ **Προσοχή:** Χαμηλή συνέπεια. Προσπάθησε να κρατήσεις >80%\n`;
      } else {
        advice += `\n✅ **Εξαιρετικά!** Υψηλή συνέπεια!\n`;
      }
    }

    return advice;
  }

  private generateNutritionAdvice(): string {
    const { athlete } = this.userData!;
    
    let advice = `🥗 **Διατροφικές Συμβουλές**\n\n`;
    
    const age = athlete?.birth_date ? this.calculateAge(athlete.birth_date) : 25;
    const baseCalories = 1800 + (age < 30 ? 200 : age > 40 ? -100 : 0);
    
    advice += `⚡ **Εκτιμώμενες Ανάγκες:**\n`;
    advice += `• Θερμίδες: ~${baseCalories} kcal\n`;
    advice += `• Πρωτεΐνες: ${Math.round(baseCalories * 0.25 / 4)}g\n`;
    advice += `• Υδατάνθρακες: ${Math.round(baseCalories * 0.45 / 4)}g\n`;
    advice += `• Λίπη: ${Math.round(baseCalories * 0.30 / 9)}g\n\n`;
    
    advice += `🍽️ **Προτάσεις:**\n`;
    advice += `• Πρωινό: Βρώμη + φρούτα + αυγά\n`;
    advice += `• Μεσημεριανό: Κοτόπουλο + ρύζι + σαλάτα\n`;
    advice += `• Βραδινό: Ψάρι + λαχανικά\n`;

    return advice;
  }

  private generateTestAnalysis(): string {
    const { testSessions, athlete } = this.userData!;
    
    if (!testSessions.length) {
      return `📋 **Τεστ & Μετρήσεις**\n\nΔεν υπάρχουν τεστ. Συνιστώ να κάνεις:\n• Σωματομετρικό\n• Τεστ δύναμης\n• Τεστ αντοχής`;
    }

    let analysis = `📋 **Ανάλυση Τεστ για ${athlete?.name}**\n\n`;
    
    const latest = testSessions[0];
    analysis += `📅 **Τελευταίο:** ${new Date(latest.test_date).toLocaleDateString('el-GR')}\n\n`;
    
    if (latest.anthropometric_test_data?.length > 0) {
      const anthro = latest.anthropometric_test_data[0];
      analysis += `📊 **Σωματομετρικά:**\n`;
      if (anthro.weight && anthro.height) {
        const bmi = (anthro.weight / ((anthro.height / 100) ** 2)).toFixed(1);
        analysis += `• BMI: ${bmi}\n`;
      }
      if (anthro.body_fat_percentage) analysis += `• Λίπος: ${anthro.body_fat_percentage}%\n`;
    }

    return analysis;
  }

  private generateRecoveryAdvice(): string {
    const { recentWorkouts } = this.userData!;
    
    let advice = `😴 **Συμβουλές Ανάκαμψης**\n\n`;
    
    const intensity = recentWorkouts.length > 5 ? 'Υψηλό' : 'Μέτριο';
    advice += `⚡ **Φόρτος:** ${intensity}\n\n`;
    
    advice += `🛌 **Ύπνος:**\n• 7-9 ώρες ποιοτικού ύπνου\n`;
    advice += `💧 **Ενυδάτωση:**\n• 35ml/kg σωματικού βάρους\n`;
    advice += `🧘‍♀️ **Ενεργητική Ανάκαμψη:**\n• Ελαφρύ περπάτημα\n• Stretching\n`;

    return advice;
  }

  private generateGeneralResponse(message: string): string {
    const { athlete } = this.userData!;
    
    return `Γεια σου ${athlete?.name}! 👋

Είμαι ο **RID AI** και έχω φορτώσει όλα τα δεδομένα σου! 🤖

Μπορώ να σε βοηθήσω με:
💪 **Προπόνηση & Προγράμματα**
🥗 **Διατροφή & Θερμίδες**
📊 **Ανάλυση Προόδου**
🧪 **Αξιολόγηση Τεστ**
😴 **Ανάκαμψη & Ύπνο**

**Μαθαίνω από κάθε συνομιλία μας!** 🧠

Τι θα θέλες να μάθεις;`;
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getIsAdmin(): boolean {
    return this.isAdmin;
  }

  getUserData(): UserData | null {
    return this.userData;
  }
}
