
import { UserData, UserDataService } from './UserDataService';

export class ResponseGenerator {
  private userDataService: UserDataService;

  constructor() {
    this.userDataService = UserDataService.getInstance();
  }

  generateProgressReport(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { athlete, recentWorkouts, testSessions } = userData;
    
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

  generateTrainingAdvice(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { activePrograms, recentWorkouts } = userData;
    
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

  generateNutritionAdvice(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { athlete } = userData;
    
    let advice = `🥗 **Διατροφικές Συμβουλές**\n\n`;
    
    const age = athlete?.birth_date ? this.userDataService.calculateAge(athlete.birth_date) : 25;
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

  generateTestAnalysis(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { testSessions, athlete } = userData;
    
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

  generateRecoveryAdvice(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { recentWorkouts } = userData;
    
    let advice = `😴 **Συμβουλές Ανάκαμψης**\n\n`;
    
    const intensity = recentWorkouts.length > 5 ? 'Υψηλό' : 'Μέτριο';
    advice += `⚡ **Φόρτος:** ${intensity}\n\n`;
    
    advice += `🛌 **Ύπνος:**\n• 7-9 ώρες ποιοτικού ύπνου\n`;
    advice += `💧 **Ενυδάτωση:**\n• 35ml/kg σωματικού βάρους\n`;
    advice += `🧘‍♀️ **Ενεργητική Ανάκαμψη:**\n• Ελαφρύ περπάτημα\n• Stretching\n`;

    return advice;
  }

  generateGeneralResponse(message: string): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "Δεν υπάρχουν διαθέσιμα δεδομένα";

    const { athlete } = userData;
    
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
}
