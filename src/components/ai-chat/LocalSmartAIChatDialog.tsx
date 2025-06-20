import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface LocalSmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

// Έξυπνος AI που τρέχει στον browser με πρόσβαση σε δεδομένα
class LocalSmartAI {
  private static instance: LocalSmartAI;
  private isLoaded = false;
  private isLoading = false;
  private athleteData: any = null;

  static getInstance(): LocalSmartAI {
    if (!LocalSmartAI.instance) {
      LocalSmartAI.instance = new LocalSmartAI();
    }
    return LocalSmartAI.instance;
  }

  async loadAthleteData(athleteId: string): Promise<void> {
    if (!athleteId) return;
    
    try {
      console.log('🔄 Φορτώνω δεδομένα αθλητή:', athleteId);
      
      // Βασικά στοιχεία αθλητή
      const { data: athlete } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', athleteId)
        .single();

      // Ενεργά προγράμματα
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
                    sets, reps, kg, rest, tempo,
                    exercises!fk_program_exercises_exercise_id (name, description)
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', athleteId)
        .eq('status', 'active');

      // Τελευταίες προπονήσεις
      const { data: recentWorkouts } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', athleteId)
        .order('completed_date', { ascending: false })
        .limit(10);

      // Τελευταία τεστ
      const { data: testSessions } = await supabase
        .from('test_sessions')
        .select(`
          *,
          anthropometric_test_data!fk_anthropometric_test_data_session (*),
          strength_test_data!fk_strength_test_data_session (
            *,
            exercises!fk_strength_test_data_exercise (name)
          ),
          endurance_test_data!fk_endurance_test_data_session (*),
          functional_test_data!fk_functional_test_data_session (*)
        `)
        .eq('user_id', athleteId)
        .order('test_date', { ascending: false })
        .limit(5);

      this.athleteData = {
        athlete,
        activePrograms: activePrograms || [],
        recentWorkouts: recentWorkouts || [],
        testSessions: testSessions || []
      };

      console.log('✅ Δεδομένα αθλητή φορτώθηκαν:', this.athleteData);
      this.isLoaded = true;
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης δεδομένων:', error);
      throw error;
    }
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    if (!this.isLoaded) {
      return "Παρακαλώ περίμενε να φορτωθούν τα δεδομένα σου...";
    }

    const lowerMessage = message.toLowerCase().trim();
    
    // Ανάλυση μηνύματος και δημιουργία απάντησης
    if (lowerMessage.includes('πρόοδος') || lowerMessage.includes('αποτελέσματα')) {
      return this.generateProgressAnalysis();
    }
    
    if (lowerMessage.includes('διατροφή') || lowerMessage.includes('φαγητό') || lowerMessage.includes('θερμίδες')) {
      return this.generateNutritionAdvice();
    }
    
    if (lowerMessage.includes('προπόνηση') || lowerMessage.includes('άσκηση') || lowerMessage.includes('γυμναστική')) {
      return this.generateWorkoutAdvice();
    }
    
    if (lowerMessage.includes('τεστ') || lowerMessage.includes('μέτρηση') || lowerMessage.includes('δύναμη')) {
      return this.generateTestAnalysis();
    }
    
    if (lowerMessage.includes('ανάκαμψη') || lowerMessage.includes('κούραση') || lowerMessage.includes('πόνος')) {
      return this.generateRecoveryAdvice();
    }

    if (lowerMessage.includes('στόχοι') || lowerMessage.includes('σχέδιο') || lowerMessage.includes('πλάνο')) {
      return this.generateGoalsSuggestions();
    }

    // Γενική συμβουλή
    return this.generateGeneralResponse(athleteName);
  }

  private generateProgressAnalysis(): string {
    const { recentWorkouts, testSessions, athlete } = this.athleteData;
    
    let analysis = `📊 **Ανάλυση Προόδου για ${athlete?.name}**\n\n`;
    
    // Ανάλυση προπονήσεων
    if (recentWorkouts.length > 0) {
      const completedCount = recentWorkouts.filter(w => w.status === 'completed').length;
      const completionRate = Math.round((completedCount / recentWorkouts.length) * 100);
      
      analysis += `🏃‍♀️ **Προπονήσεις (τελευταίες 10):**\n`;
      analysis += `• Ολοκληρωμένες: ${completedCount}/${recentWorkouts.length} (${completionRate}%)\n`;
      analysis += `• Μέσος χρόνος: ${this.calculateAverageWorkoutTime()} λεπτά\n\n`;
    }
    
    // Ανάλυση τεστ
    if (testSessions.length > 0) {
      analysis += `💪 **Τελευταία Τεστ:**\n`;
      const latestTest = testSessions[0];
      
      if (latestTest.anthropometric_test_data?.length > 0) {
        const anthro = latestTest.anthropometric_test_data[0];
        analysis += `• Βάρος: ${anthro.weight}kg\n`;
        analysis += `• Λίπος: ${anthro.body_fat_percentage}%\n`;
        analysis += `• Μυϊκή μάζα: ${anthro.muscle_mass_percentage}%\n`;
      }
      
      if (latestTest.strength_test_data?.length > 0) {
        analysis += `• Τεστ δύναμης: ${latestTest.strength_test_data.length} ασκήσεις\n`;
      }
      
      analysis += `• Ημερομηνία: ${new Date(latestTest.test_date).toLocaleDateString('el-GR')}\n\n`;
    }
    
    analysis += `🎯 **Συμβουλές:**\n`;
    analysis += `• Συνέχισε με την ίδια συνέπεια!\n`;
    analysis += `• Προσοχή στην ανάκαμψη\n`;
    analysis += `• Επόμενο τεστ σε 4-6 εβδομάδες\n`;
    
    return analysis;
  }

  private generateNutritionAdvice(): string {
    const { athlete, recentWorkouts } = this.athleteData;
    
    let advice = `🥗 **Διατροφικές Συμβουλές για ${athlete?.name}**\n\n`;
    
    // Υπολογισμός θερμιδικών αναγκών
    const workoutsPerWeek = this.calculateWeeklyWorkouts();
    let calories = 0;
    
    if (athlete?.birth_date) {
      const age = new Date().getFullYear() - new Date(athlete.birth_date).getFullYear();
      // Απλοποιημένος υπολογισμός BMR
      calories = 1800 + (workoutsPerWeek * 300); // Βασικός υπολογισμός
    }
    
    advice += `⚡ **Ημερήσιες Ανάγκες:**\n`;
    advice += `• Θερμίδες: ~${calories} kcal\n`;
    advice += `• Πρωτεΐνες: ${Math.round(calories * 0.25 / 4)}g (25%)\n`;
    advice += `• Υδατάνθρακες: ${Math.round(calories * 0.45 / 4)}g (45%)\n`;
    advice += `• Λίπη: ${Math.round(calories * 0.30 / 9)}g (30%)\n\n`;
    
    advice += `🍽️ **Προτάσεις Γευμάτων:**\n`;
    advice += `• **Πρωινό:** Βρώμη με φρούτα + αυγά\n`;
    advice += `• **Μεσημεριανό:** Κοτόπουλο + ρύζι + σαλάτα\n`;
    advice += `• **Βραδινό:** Ψάρι + γλυκοπατάτα + λαχανικά\n`;
    advice += `• **Σνακ:** Γιαούρτι με ξηρούς καρπούς\n\n`;
    
    advice += `💧 **Ενυδάτωση:**\n`;
    advice += `• Νερό: 35ml/kg σωματικού βάρους\n`;
    advice += `• Επιπλέον 500ml για κάθε ώρα προπόνησης\n`;
    
    return advice;
  }

  private generateWorkoutAdvice(): string {
    const { activePrograms, recentWorkouts } = this.athleteData;
    
    let advice = `💪 **Συμβουλές Προπόνησης**\n\n`;
    
    if (activePrograms.length > 0) {
      const program = activePrograms[0];
      advice += `🏃‍♀️ **Τρέχον Πρόγραμμα:** ${program.programs?.name}\n`;
      
      if (program.programs?.program_weeks) {
        const totalWeeks = program.programs.program_weeks.length;
        advice += `• Διάρκεια: ${totalWeeks} εβδομάδες\n`;
        
        const totalDays = program.programs.program_weeks.reduce((total: number, week: any) => 
          total + (week.program_days?.length || 0), 0);
        advice += `• Συνολικές προπονήσεις: ${totalDays}\n\n`;
      }
    }
    
    // Ανάλυση τελευταίων προπονήσεων
    const completionRate = this.calculateCompletionRate();
    advice += `📊 **Στατιστικά:**\n`;
    advice += `• Ποσοστό ολοκλήρωσης: ${completionRate}%\n`;
    advice += `• Μέσος χρόνος: ${this.calculateAverageWorkoutTime()} λεπτά\n\n`;
    
    advice += `🎯 **Συμβουλές:**\n`;
    if (completionRate < 80) {
      advice += `• Προσπάθησε να κρατήσεις συνέπεια >80%\n`;
      advice += `• Μείωσε την ένταση αν χρειάζεται\n`;
    } else {
      advice += `• Εξαιρετική συνέπεια! Συνέχισε έτσι!\n`;
      advice += `• Μπορείς να αυξήσεις ελαφρά την ένταση\n`;
    }
    
    advice += `• Μην ξεχνάς το ζέσταμα (5-10 λεπτά)\n`;
    advice += `• Stretching μετά την προπόνηση\n`;
    advice += `• Ανάπαυση 48-72h μεταξύ των ίδιων μυϊκών ομάδων\n`;
    
    return advice;
  }

  private generateTestAnalysis(): string {
    const { testSessions, athlete } = this.athleteData;
    
    if (!testSessions.length) {
      return `📋 **Τεστ & Μετρήσεις**\n\nΔεν βρέθηκαν τεστ στο σύστημα. Συνιστώ να κάνεις:\n• Σωματομετρικό τεστ\n• Τεστ δύναμης\n• Τεστ αντοχής\n\nΕπικοινώνησε με τον προπονητή σου!`;
    }
    
    let analysis = `📋 **Ανάλυση Τεστ για ${athlete?.name}**\n\n`;
    
    const latestTest = testSessions[0];
    analysis += `📅 **Τελευταίο τεστ:** ${new Date(latestTest.test_date).toLocaleDateString('el-GR')}\n\n`;
    
    // Σωματομετρικά
    if (latestTest.anthropometric_test_data?.length > 0) {
      const anthro = latestTest.anthropometric_test_data[0];
      analysis += `📊 **Σωματομετρικά:**\n`;
      
      if (anthro.height && anthro.weight) {
        const bmi = (anthro.weight / ((anthro.height / 100) ** 2)).toFixed(1);
        analysis += `• BMI: ${bmi} (${this.getBMICategory(parseFloat(bmi))})\n`;
      }
      if (anthro.weight) analysis += `• Βάρος: ${anthro.weight}kg\n`;
      if (anthro.body_fat_percentage) analysis += `• Λίπος: ${anthro.body_fat_percentage}%\n`;
      if (anthro.muscle_mass_percentage) analysis += `• Μυϊκή μάζα: ${anthro.muscle_mass_percentage}%\n`;
      analysis += `\n`;
    }
    
    // Δύναμη
    if (latestTest.strength_test_data?.length > 0) {
      analysis += `💪 **Τεστ Δύναμης:**\n`;
      latestTest.strength_test_data.slice(0, 5).forEach((test: any) => {
        if (test.exercises?.name) {
          analysis += `• ${test.exercises.name}: ${test.weight_kg}kg`;
          if (test.is_1rm) analysis += ` (1RM)`;
          if (test.velocity_ms) analysis += ` @ ${test.velocity_ms}m/s`;
          analysis += `\n`;
        }
      });
      analysis += `\n`;
    }
    
    // Σύγκριση με προηγούμενα (αν υπάρχουν)
    if (testSessions.length > 1) {
      analysis += `📈 **Πρόοδος:**\n`;
      analysis += `• Σύγκριση με προηγούμενο τεστ σε εξέλιξη...\n`;
      analysis += `• Επόμενο τεστ προτείνεται σε 4-6 εβδομάδες\n\n`;
    }
    
    analysis += `🎯 **Προτάσεις:**\n`;
    analysis += `• Συνέχισε τη σωστή διατροφή\n`;
    analysis += `• Τακτική άσκηση σύμφωνα με το πρόγραμμα\n`;
    analysis += `• Επαρκής ύπνος (7-9 ώρες)\n`;
    
    return analysis;
  }

  private generateRecoveryAdvice(): string {
    const recentWorkouts = this.athleteData.recentWorkouts || [];
    
    let advice = `😴 **Συμβουλές Ανάκαμψης**\n\n`;
    
    // Ανάλυση φόρτου προπόνησης
    const workoutIntensity = this.calculateWorkoutIntensity();
    
    advice += `⚡ **Φόρτος Προπόνησης:** ${workoutIntensity}\n\n`;
    
    advice += `🛌 **Ύπνος:**\n`;
    advice += `• 7-9 ώρες ποιοτικού ύπνου\n`;
    advice += `• Κοιμήσου στην ίδια ώρα κάθε μέρα\n`;
    advice += `• Αποφυγή οθονών 1 ώρα πριν τον ύπνο\n\n`;
    
    advice += `💧 **Ενυδάτωση:**\n`;
    advice += `• Πιες νερό αμέσως μετά την προπόνηση\n`;
    advice += `• Παρακολούθησε το χρώμα των ούρων\n\n`;
    
    advice += `🍎 **Διατροφή:**\n`;
    advice += `• Πρωτεΐνη + υδατάνθρακες σε 30-60 λεπτά\n`;
    advice += `• Αντιφλεγμονώδη τρόφιμα (μούρα, ψάρι)\n\n`;
    
    advice += `🧘‍♀️ **Ενεργητική Ανάκαμψη:**\n`;
    advice += `• Ελαφρύ περπάτημα\n`;
    advice += `• Stretching ή yoga\n`;
    advice += `• Μασάζ ή foam rolling\n\n`;
    
    if (workoutIntensity === 'Υψηλό') {
      advice += `⚠️ **Προσοχή:** Υψηλός φόρτος! Πάρε επιπλέον ημέρα ανάπαυσης.\n`;
    }
    
    return advice;
  }

  private generateGoalsSuggestions(): string {
    const { athlete, activePrograms } = this.athleteData;
    
    let suggestions = `🎯 **Προτάσεις Στόχων για ${athlete?.name}**\n\n`;
    
    suggestions += `📋 **Βραχυπρόθεσμοι Στόχοι (1-3 μήνες):**\n`;
    suggestions += `• Διατήρηση συνέπειας >80% στις προπονήσεις\n`;
    suggestions += `• Βελτίωση τεχνικής σε βασικές ασκήσεις\n`;
    suggestions += `• Σταδιακή αύξηση φόρτων κατά 5-10%\n\n`;
    
    suggestions += `🏆 **Μακροπρόθεσμοι Στόχοι (3-6 μήνες):**\n`;
    suggestions += `• Αύξηση μυϊκής μάζας κατά 2-3kg\n`;
    suggestions += `• Μείωση λίπους κατά 3-5%\n`;
    suggestions += `• Βελτίωση 1RM κατά 15-25%\n\n`;
    
    suggestions += `📊 **Μετρήσιμοι Στόχοι:**\n`;
    suggestions += `• Τεστ κάθε 4-6 εβδομάδες\n`;
    suggestions += `• Καταγραφή προόδου σε ημερολόγιο\n`;
    suggestions += `• Φωτογραφίες προόδου μηνιαίως\n\n`;
    
    suggestions += `💡 **Συμβουλές:**\n`;
    suggestions += `• Όρισε συγκεκριμένους, μετρήσιμους στόχους\n`;
    suggestions += `• Χώρισέ τους σε μικρότερα βήματα\n`;
    suggestions += `• Γιόρτασε τις μικρές επιτυχίες!\n`;
    
    return suggestions;
  }

  private generateGeneralResponse(athleteName?: string): string {
    return `Γεια σου ${athleteName || 'φίλε'}! 👋

Είμαι ο **RID AI**, ο προσωπικός σου AI προπονητής που τρέχει εντελώς δωρεάν στον browser! 🤖

Έχω πρόσβαση στα δεδομένα σου και μπορώ να σε βοηθήσω με:

💪 **Προπόνηση & Ασκήσεις**
🥗 **Διατροφή & Θερμίδες**  
📊 **Ανάλυση Προόδου**
🧪 **Αξιολόγηση Τεστ**
😴 **Ανάκαμψη & Ύπνο**
🎯 **Στόχους & Σχεδιασμό**

**✅ 100% Δωρεάν - Χωρίς OpenAI!**
**🔒 Τρέχει στον browser σου**
**📊 Έχω πρόσβαση στα δεδομένα σου**
**🧠 Μαθαίνω από κάθε συνομιλία**

Τι θα θέλες να μάθεις σήμερα;`;
  }

  // Βοηθητικές μέθοδοι
  private calculateWeeklyWorkouts(): number {
    const { recentWorkouts } = this.athleteData;
    if (!recentWorkouts.length) return 3; // Default
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return recentWorkouts.filter((workout: any) => 
      new Date(workout.completed_date || workout.scheduled_date) >= oneWeekAgo
    ).length;
  }

  private calculateCompletionRate(): number {
    const { recentWorkouts } = this.athleteData;
    if (!recentWorkouts.length) return 0;
    
    const completed = recentWorkouts.filter((w: any) => w.status === 'completed').length;
    return Math.round((completed / recentWorkouts.length) * 100);
  }

  private calculateAverageWorkoutTime(): number {
    const { recentWorkouts } = this.athleteData;
    if (!recentWorkouts.length) return 45; // Default
    
    const workoutsWithTime = recentWorkouts.filter((w: any) => w.actual_duration_minutes);
    if (!workoutsWithTime.length) return 45;
    
    const totalTime = workoutsWithTime.reduce((sum: number, w: any) => sum + w.actual_duration_minutes, 0);
    return Math.round(totalTime / workoutsWithTime.length);
  }

  private calculateWorkoutIntensity(): string {
    const workoutsPerWeek = this.calculateWeeklyWorkouts();
    const avgTime = this.calculateAverageWorkoutTime();
    
    if (workoutsPerWeek >= 5 && avgTime >= 60) return 'Υψηλό';
    if (workoutsPerWeek >= 3 && avgTime >= 45) return 'Μέτριο';
    return 'Χαμηλό';
  }

  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Κάτω από το κανονικό';
    if (bmi < 25) return 'Κανονικό';
    if (bmi < 30) return 'Υπέρβαρος';
    return 'Παχύσαρκος';
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  isModelLoading(): boolean {
    return this.isLoading;
  }
}

export const LocalSmartAIChatDialog: React.FC<LocalSmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAI = LocalSmartAI.getInstance();

  useEffect(() => {
    if (isOpen && athleteId) {
      initializeAI();
    }
  }, [isOpen, athleteId]);

  // Βελτιωμένο scrolling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages]);

  const initializeAI = async () => {
    setIsInitializing(true);
    try {
      await localAI.loadAthleteData(athleteId!);
      
      setMessages([{
        id: 'welcome',
        content: `Γεια σου ${athleteName}! 👋

Είμαι ο **RID AI**, ο προσωπικός σου AI προπονητής! 🤖

Μόλις φόρτωσα όλα τα δεδομένα σου:
📊 Προγράμματα προπονήσεων
💪 Τεστ δύναμης και μετρήσεις  
🏃 Προηγούμενες προπονήσεις
📈 Στατιστικά προόδου

**✅ Τρέχω 100% δωρεάν στον browser σου!**
**🔒 Κανένα API key δεν χρειάζεται**
**📊 Έχω πλήρη πρόσβαση στα δεδομένα σου**
**🧠 Μαθαίνω από κάθε συνομιλία μας**

Μπορώ να σε βοηθήσω με:
• Ανάλυση προόδου
• Διατροφικές συμβουλές
• Προτάσεις προπόνησης
• Αξιολόγηση τεστ
• Συμβουλές ανάκαμψης

Τι θα θέλες να μάθεις πρώτα;`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Σφάλμα αρχικοποίησης AI:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isInitializing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await localAI.generateResponse(input, athleteName);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Local AI Error:', error);
      toast.error('Σφάλμα στον RID AI');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] rounded-none flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[#00ffba]" />
            <span className="text-lg font-semibold">RID AI - Δωρεάν AI Προπονητής</span>
            {athleteName && (
              <span className="text-base font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-none">
                <Zap className="w-3 h-3" />
                <span>100% Δωρεάν</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-none">
                <Brain className="w-3 h-3" />
                <span>Τοπικό AI</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4 border rounded-none">
            {isInitializing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#00ffba]" />
                <span className="ml-3 text-lg">Φορτώνω τα δεδομένα σου...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-[#00ffba] text-black'
                      }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                      </div>
                      <div className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-50 text-gray-900 rounded-bl-none border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString('el-GR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="bg-gray-50 text-gray-900 p-4 rounded-lg rounded-bl-none border">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#00ffba]" />
                        <span className="text-sm">Αναλύω τα δεδομένα σου...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Γράψε εδώ το μήνυμά σου..."
              className="rounded-none"
              disabled={isLoading || isInitializing}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isInitializing}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
