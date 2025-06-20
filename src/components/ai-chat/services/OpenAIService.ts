
import { supabase } from "@/integrations/supabase/client";
import { UserDataService } from './UserDataService';

export class OpenAIService {
  private userDataService: UserDataService;

  constructor() {
    this.userDataService = UserDataService.getInstance();
  }

  async generateResponse(message: string, analysis: any): Promise<string> {
    try {
      console.log('🤖 Συμβουλεύομαι το OpenAI για σύνθετη ερώτηση');
      
      const context = this.buildContextForOpenAI();
      const currentUserId = this.userDataService.getCurrentUserId();
      const isAdmin = this.userDataService.getIsAdmin();
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message,
          context,
          userId: currentUserId,
          isAdmin
        }
      });

      if (error) throw error;

      return data.response;
    } catch (error) {
      console.error('❌ OpenAI Error:', error);
      throw error;
    }
  }

  private buildContextForOpenAI(): string {
    const userData = this.userDataService.getUserData();
    if (!userData) return "";

    const { athlete, activePrograms, recentWorkouts, testSessions } = userData;
    
    let context = `Αθλητής: ${athlete?.name}\n`;
    context += `Ηλικία: ${athlete?.birth_date ? this.userDataService.calculateAge(athlete.birth_date) : 'Άγνωστη'}\n`;
    
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
}
