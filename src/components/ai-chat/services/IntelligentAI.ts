
import { UserDataService, UserData } from './UserDataService';
import { MessageAnalyzer, MessageAnalysis } from './MessageAnalyzer';
import { ResponseGenerator } from './ResponseGenerator';
import { ConversationManager } from './ConversationManager';
import { OpenAIService } from './OpenAIService';

export class IntelligentAI {
  private static instance: IntelligentAI;
  private userDataService: UserDataService;
  private messageAnalyzer: MessageAnalyzer;
  private responseGenerator: ResponseGenerator;
  private conversationManager: ConversationManager;
  private openAIService: OpenAIService;

  private constructor() {
    this.userDataService = UserDataService.getInstance();
    this.messageAnalyzer = new MessageAnalyzer();
    this.responseGenerator = new ResponseGenerator();
    this.conversationManager = new ConversationManager();
    this.openAIService = new OpenAIService();
  }

  static getInstance(): IntelligentAI {
    if (!IntelligentAI.instance) {
      IntelligentAI.instance = new IntelligentAI();
    }
    return IntelligentAI.instance;
  }

  async loadUserData(userId: string): Promise<void> {
    await this.userDataService.loadUserData(userId);
  }

  async generateResponse(message: string, athleteName?: string): Promise<string> {
    const userData = this.userDataService.getUserData();
    if (!userData) {
      return "Παρακαλώ περίμενε να φορτωθούν τα δεδομένα...";
    }

    // Αποθήκευση του μηνύματος του χρήστη
    await this.conversationManager.saveMessage(message, 'user');

    // Ανάλυση μηνύματος
    const analysis = this.messageAnalyzer.analyzeMessage(message);
    
    // Δημιουργία απάντησης
    let response: string;
    
    if (analysis.complexity === 'simple') {
      response = await this.generateLocalResponse(message, analysis);
    } else {
      response = await this.generateOpenAIResponse(message, analysis);
    }

    // Αποθήκευση της απάντησης
    await this.conversationManager.saveMessage(response, 'assistant');
    
    // Μάθηση από τη συνομιλία
    await this.conversationManager.learnFromConversation(message, response, analysis);

    return response;
  }

  private async generateLocalResponse(message: string, analysis: MessageAnalysis): Promise<string> {
    const { category } = analysis;

    switch (category) {
      case 'progress':
        return this.responseGenerator.generateProgressReport();
      case 'training':
        return this.responseGenerator.generateTrainingAdvice();
      case 'nutrition':
        return this.responseGenerator.generateNutritionAdvice();
      case 'testing':
        return this.responseGenerator.generateTestAnalysis();
      case 'recovery':
        return this.responseGenerator.generateRecoveryAdvice();
      default:
        return this.responseGenerator.generateGeneralResponse(message);
    }
  }

  private async generateOpenAIResponse(message: string, analysis: MessageAnalysis): Promise<string> {
    try {
      const response = await this.openAIService.generateResponse(message, analysis);
      
      // Μάθηση από την OpenAI απάντηση
      await this.conversationManager.learnFromOpenAI(message, response);

      return response;
    } catch (error) {
      console.error('❌ OpenAI Error:', error);
      return this.generateLocalResponse(message, analysis);
    }
  }

  getUserData(): UserData | null {
    return this.userDataService.getUserData();
  }

  getIsAdmin(): boolean {
    return this.userDataService.getIsAdmin();
  }
}

export type { UserData };
