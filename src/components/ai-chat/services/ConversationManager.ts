
import { supabase } from "@/integrations/supabase/client";
import { UserDataService } from './UserDataService';

export class ConversationManager {
  private userDataService: UserDataService;

  constructor() {
    this.userDataService = UserDataService.getInstance();
  }

  async saveMessage(content: string, type: 'user' | 'assistant'): Promise<void> {
    const currentUserId = this.userDataService.getCurrentUserId();
    const isAdmin = this.userDataService.getIsAdmin();

    if (!currentUserId) return;

    try {
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: currentUserId,
          content,
          message_type: type,
          metadata: {
            timestamp: new Date().toISOString(),
            isAdmin
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα αποθήκευσης μηνύματος:', error);
    }
  }

  async learnFromConversation(question: string, answer: string, analysis: any): Promise<void> {
    const currentUserId = this.userDataService.getCurrentUserId();
    if (!currentUserId) return;

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
            user_id: currentUserId,
            intent: analysis.intent,
            learned_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα μάθησης:', error);
    }
  }

  async learnFromOpenAI(question: string, answer: string): Promise<void> {
    const currentUserId = this.userDataService.getCurrentUserId();
    if (!currentUserId) return;

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
            user_id: currentUserId,
            learned_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('❌ Σφάλμα μάθησης από OpenAI:', error);
    }
  }
}
