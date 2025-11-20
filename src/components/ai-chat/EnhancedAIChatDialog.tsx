import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Download, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  aiType?: 'rid-smart';
}

interface EnhancedAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
  athletePhotoUrl?: string;
}

// Κλήσεις στα AI Edge Functions
const callGeminiAI = async (message: string, userId?: string, userName?: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai-chat', {
      body: { 
        message,
        userId,
        userName
      }
    });

    if (error) throw error;
    return data?.response || 'Σφάλμα στην απάντηση του Gemini AI';
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Το Gemini AI δεν είναι διαθέσιμο αυτή τη στιγμή');
  }
};

const callOpenAI = async (message: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-fitness-chat', {
      body: { message }
    });

    if (error) throw error;
    return data?.response || 'Σφάλμα στην απάντηση του OpenAI';
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw new Error('Το OpenAI δεν είναι διαθέσιμο αυτή τη στιγμή');
  }
};

// Έξυπνο Local AI που μαθαίνει από Gemini και OpenAI
class SmartLocalAI {
  private static instance: SmartLocalAI;
  private knowledgeBase: Map<string, string> = new Map();
  private userProfiles: Map<string, any> = new Map();
  private conversationMemory: Map<string, any[]> = new Map();

  static getInstance(): SmartLocalAI {
    if (!SmartLocalAI.instance) {
      SmartLocalAI.instance = new SmartLocalAI();
    }
    return SmartLocalAI.instance;
  }

  // Μαθαίνει από τις απαντήσεις του Gemini και OpenAI
  async learnFromResponse(question: string, response: string, source: 'gemini' | 'openai', userId?: string) {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Αποθηκεύει τη γνώση για μελλοντική χρήση
    this.knowledgeBase.set(normalizedQuestion, response);
    
    // Αναλύει και εξάγει προσωπικές πληροφορίες από τη συνομιλία
    if (userId) {
      await this.extractPersonalInfo(question, response, userId);
    }
    
    console.log(`🧠 Local AI έμαθε από ${source.toUpperCase()}: "${normalizedQuestion.substring(0, 50)}..."`);
    
    // Αποθηκεύει στη βάση δεδομένων
    await this.saveToDatabase(question, response, source, userId);
  }

  // Εξάγει προσωπικές πληροφορίες από τη συνομιλία
  async extractPersonalInfo(question: string, response: string, userId: string) {
    const lowerText = (question + ' ' + response).toLowerCase();
    const userProfile = this.userProfiles.get(userId) || {};

    // Διατροφικές προτιμήσεις
    if (lowerText.includes('βίγκαν') || lowerText.includes('vegan')) {
      userProfile.dietary_preferences = [...(Array.isArray(userProfile.dietary_preferences) ? userProfile.dietary_preferences : []), 'vegan'];
    }
    if (lowerText.includes('χορτοφάγος') || lowerText.includes('vegetarian')) {
      userProfile.dietary_preferences = [...(Array.isArray(userProfile.dietary_preferences) ? userProfile.dietary_preferences : []), 'vegetarian'];
    }
    
    // Ιατρικές καταστάσεις
    if (lowerText.includes('διαβητικός') || lowerText.includes('διαβήτη')) {
      userProfile.medical_conditions = [...(Array.isArray(userProfile.medical_conditions) ? userProfile.medical_conditions : []), 'diabetes'];
    }
    if (lowerText.includes('καρδιακός') || lowerText.includes('καρδιά')) {
      userProfile.medical_conditions = [...(Array.isArray(userProfile.medical_conditions) ? userProfile.medical_conditions : []), 'heart_condition'];
    }
    if (lowerText.includes('υπέρταση') || lowerText.includes('πίεση')) {
      userProfile.medical_conditions = [...(Array.isArray(userProfile.medical_conditions) ? userProfile.medical_conditions : []), 'hypertension'];
    }

    // Στόχοι προπόνησης
    if (lowerText.includes('αδυνάτισμα') || lowerText.includes('χάσω κιλά')) {
      userProfile.goals = [...(Array.isArray(userProfile.goals) ? userProfile.goals : []), 'weight_loss'];
    }
    if (lowerText.includes('μυϊκή μάζα') || lowerText.includes('όγκος')) {
      userProfile.goals = [...(Array.isArray(userProfile.goals) ? userProfile.goals : []), 'muscle_gain'];
    }
    if (lowerText.includes('δύναμη')) {
      userProfile.goals = [...(Array.isArray(userProfile.goals) ? userProfile.goals : []), 'strength'];
    }

    this.userProfiles.set(userId, userProfile);
    
    // Ενημερώνει τη βάση δεδομένων
    await this.updateUserProfile(userId, userProfile);
  }

  // Αποθηκεύει συνομιλία στη βάση δεδομένων
  async saveToDatabase(question: string, response: string, source: string, userId?: string) {
    try {
      // Αποθηκεύει τη συνομιλία
      if (userId) {
        await supabase.from('ai_conversations').insert([
          { user_id: userId, message_type: 'user', content: question },
          { user_id: userId, message_type: 'assistant', content: response, metadata: { source } }
        ]);
      }

      // Αποθηκεύει τη γενική γνώση
      await supabase.from('ai_global_knowledge').insert({
        knowledge_type: 'learned_response',
        category: this.categorizeQuestion(question),
        original_info: question,
        corrected_info: response,
        confidence_score: source === 'openai' ? 8 : 6,
        metadata: { source, learned_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Σφάλμα αποθήκευσης:', error);
    }
  }

  // Ενημερώνει το προφίλ χρήστη
  async updateUserProfile(userId: string, profileData: any) {
    try {
      await supabase.from('ai_user_profiles').upsert({
        user_id: userId,
        goals: Array.isArray(profileData.goals) ? profileData.goals : [],
        medical_conditions: Array.isArray(profileData.medical_conditions) ? profileData.medical_conditions : [],
        dietary_preferences: Array.isArray(profileData.dietary_preferences) ? profileData.dietary_preferences : [],
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Σφάλμα ενημέρωσης προφίλ:', error);
    }
  }

  // Κατηγοριοποιεί την ερώτηση
  categorizeQuestion(question: string): string {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('διατροφή') || lowerQ.includes('φαγητό')) return 'nutrition';
    if (lowerQ.includes('προπόνηση') || lowerQ.includes('άσκηση')) return 'training';
    if (lowerQ.includes('υγεία') || lowerQ.includes('ιατρικό')) return 'medical';
    return 'general';
  }

  // Φορτώνει το προφίλ χρήστη
  async loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        this.userProfiles.set(userId, data);
        return data;
      }
    } catch (error) {
      console.error('Σφάλμα φόρτωσης προφίλ:', error);
    }
    return null;
  }

  // Ελέγχει αν το Local AI γνωρίζει την απάντηση
  async hasKnowledge(question: string, userId?: string): Promise<string | null> {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Ακριβής match στη μνήμη
    if (this.knowledgeBase.has(normalizedQuestion)) {
      return this.knowledgeBase.get(normalizedQuestion) || null;
    }

    // Αναζήτηση στη βάση δεδομένων
    try {
      const { data, error } = await supabase
        .from('ai_global_knowledge')
        .select('corrected_info, confidence_score')
        .ilike('original_info', `%${normalizedQuestion}%`)
        .order('confidence_score', { ascending: false })
        .limit(1)
        .single();

      if (data && !error && data.confidence_score > 5) {
        return data.corrected_info;
      }
    } catch (error) {
      console.log('Δεν βρέθηκε στη βάση γνώσης');
    }

    return null;
  }

  // Βασικές απαντήσεις με εξατομίκευση
  async getBasicResponse(message: string, athleteName?: string, userId?: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase();
    const greeting = athleteName ? `${athleteName}` : 'φίλε μου';
    
    // Φορτώνει το προφίλ του χρήστη
    const userProfile = userId ? await this.loadUserProfile(userId) : null;
    
    if (lowerMessage.includes('γεια') || lowerMessage.includes('hello') || lowerMessage.includes('καλησπέρα') || lowerMessage.includes('καλημέρα')) {
      let personalizedGreeting = `Γεια σου ${greeting}! 👋 

Είμαι ο **RidAI Προπονητής** - ένα έξυπνο σύστημα τεχνητής νοημοσύνης.

**Ειδικεύομαι σε:**
🏋️ Προπόνηση & Ασκήσεις
🥗 Διατροφή & Θερμίδες  
💪 Μυϊκή Ανάπτυξη
🔥 Απώλεια Βάρους
😴 Ανάκαμψη & Ύπνο`;

      // Προσθέτει εξατομικευμένες πληροφορίες αν υπάρχουν
      if (userProfile) {
        const dietaryPrefs = Array.isArray(userProfile.dietary_preferences) ? userProfile.dietary_preferences : [];
        const medicalConds = Array.isArray(userProfile.medical_conditions) ? userProfile.medical_conditions : [];
        const userGoals = Array.isArray(userProfile.goals) ? userProfile.goals : [];

        if (dietaryPrefs.length > 0) {
          personalizedGreeting += `\n\n🌱 **Θυμάμαι ότι είσαι:** ${dietaryPrefs.join(', ')}`;
        }
        if (medicalConds.length > 0) {
          personalizedGreeting += `\n💊 **Λαμβάνω υπόψη:** ${medicalConds.join(', ')}`;
        }
        if (userGoals.length > 0) {
          personalizedGreeting += `\n🎯 **Οι στόχοι σου:** ${userGoals.join(', ')}`;
        }
      }

      personalizedGreeting += `\n\nΡώτα με ό,τι θέλεις και θα σου δώσω την καλύτερη δυνατή απάντηση! 🚀`;
      
      return personalizedGreeting;
    }

    return null;
  }

  // Αναλύει τις προπονήσεις του χρήστη
  async analyzeUserWorkouts(userId: string) {
    try {
      // Φέρνει τα προγράμματα του χρήστη με διευκρίνιση της σχέσης
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!program_assignments_program_id_fkey(
            *,
            program_weeks(
              *,
              program_days(
                *,
                program_blocks(
                  *,
                  program_exercises(
                    *,
                    exercises(name)
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (!assignments) return null;

      const workoutAnalysis = {
        strength_hours: 0,
        endurance_hours: 0,
        power_hours: 0,
        speed_hours: 0
      };

      assignments.forEach(assignment => {
        if (assignment.programs && typeof assignment.programs === 'object' && 'program_weeks' in assignment.programs) {
          const programs = assignment.programs as any;
          if (Array.isArray(programs.program_weeks)) {
            programs.program_weeks.forEach((week: any) => {
              week.program_days?.forEach((day: any) => {
                day.program_blocks?.forEach((block: any) => {
                  block.program_exercises?.forEach((exercise: any) => {
                    const type = this.categorizeExerciseType(exercise);
                    const duration = this.calculateExerciseDuration(exercise);
                    workoutAnalysis[`${type}_hours`] += duration;
                  });
                });
              });
            });
          }
        }
      });

      return workoutAnalysis;
    } catch (error) {
      console.error('Σφάλμα ανάλυσης προπονήσεων:', error);
      return null;
    }
  }

  // Κατηγοριοποιεί τον τύπο άσκησης
  categorizeExerciseType(exercise: any): 'strength' | 'endurance' | 'power' | 'speed' {
    const reps = parseInt(exercise.reps) || 0;
    const percentage = parseFloat(exercise.percentage_1rm) || 0;
    const velocity = parseFloat(exercise.velocity_ms) || 0;

    if (percentage > 85 || reps <= 5) return 'strength';
    if (percentage < 65 || reps > 12) return 'endurance';
    if (velocity > 0.8 && percentage < 60) return 'speed';
    return 'power';
  }

  // Υπολογίζει τη διάρκεια άσκησης
  calculateExerciseDuration(exercise: any): number {
    const sets = parseInt(exercise.sets) || 1;
    const reps = parseInt(exercise.reps) || 1;
    const tempo = exercise.tempo || '2.1.2';
    const rest = parseInt(exercise.rest) || 60;

    // Υπολογίζει τον χρόνο του tempo
    const tempoSeconds = tempo.split('.').reduce((sum: number, phase: string) => sum + parseInt(phase), 0);
    
    // Συνολικός χρόνος: (sets * reps * tempo) + (sets * rest)
    const totalSeconds = (sets * reps * tempoSeconds) + (sets * rest);
    return totalSeconds / 3600; // μετατροπή σε ώρες
  }
}

export const EnhancedAIChatDialog: React.FC<EnhancedAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  athletePhotoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const smartLocalAI = SmartLocalAI.getInstance();

  useEffect(() => {
    if (isOpen && athleteId) {
      loadConversationHistory();
    }
  }, [isOpen, athleteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationHistory = async () => {
    if (!athleteId) return;
    
    setIsLoadingHistory(true);
    try {
      console.log('📚 Loading conversation history for:', athleteId);
      
      const { data: history, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', athleteId)
        .order('created_at', { ascending: true })
        .limit(50); // Τα 50 πιο πρόσφατα μηνύματα

      if (error) throw error;

      if (history && history.length > 0) {
        const formattedMessages: Message[] = history.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.message_type as 'user' | 'assistant',
          timestamp: new Date(msg.created_at),
          aiType: msg.message_type === 'assistant' ? 'rid-smart' : undefined
        }));
        setMessages(formattedMessages);
        console.log('✅ Loaded', formattedMessages.length, 'messages from history');
      } else {
        // Αν δεν υπάρχει ιστορικό, δείχνουμε το καλωσόρισμα
        await initializeChat();
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του ιστορικού');
      // Αν αποτύχει η φόρτωση, δείχνουμε τουλάχιστον το καλωσόρισμα
      await initializeChat();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessageToDatabase = async (message: Message) => {
    if (!athleteId) return;
    
    try {
      console.log('💾 Saving message to database:', { athleteId, role: message.role, content: message.content.substring(0, 50) });
      
      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: athleteId,
          message_type: message.role,
          content: message.content,
          metadata: message.aiType ? { aiType: message.aiType } : {}
        });

      if (error) {
        console.error('❌ Error saving message:', error);
        toast.error('Σφάλμα αποθήκευσης μηνύματος');
      } else {
        console.log('✅ Message saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving message to database:', error);
      toast.error('Σφάλμα αποθήκευσης συνομιλίας');
    }
  };

  const initializeChat = async () => {
    const welcomeResponse = await smartLocalAI.getBasicResponse(
      'γεια σου', 
      athleteName, 
      athleteId
    );

    const welcomeMessage: Message = {
      id: 'welcome',
      content: welcomeResponse || 'Γεια σου! Είμαι ο RidAI Προπονητής!',
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };

    setMessages([welcomeMessage]);
    
    // Αποθηκεύουμε το μήνυμα καλωσορίσματος
    await saveMessageToDatabase(welcomeMessage);
  };

  // Ελέγχει αν μια απάντηση είναι ικανοποιητική
  const isGoodResponse = (response: string): boolean => {
    const lowResponse = response.toLowerCase();
    
    if (response.length < 50) return false;
    
    const uncertainPhrases = [
      'δεν είμαι σίγουρος',
      'δεν γνωρίζω',
      'δεν μπορώ να',
      'λυπάμαι',
      'δεν έχω πληροφορίες',
      'δεν είμαι ειδικός'
    ];
    
    return !uncertainPhrases.some(phrase => lowResponse.includes(phrase));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Αποθηκεύουμε το μήνυμα του χρήστη
    await saveMessageToDatabase(userMessage);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let finalResponse = '';

      // Βήμα 1: Έλεγχος αν το Smart Local AI γνωρίζει την απάντηση
      const localKnowledge = await smartLocalAI.hasKnowledge(currentInput, athleteId);
      const basicResponse = await smartLocalAI.getBasicResponse(currentInput, athleteName, athleteId);

      if (localKnowledge) {
        finalResponse = localKnowledge;
      } else if (basicResponse) {
        finalResponse = basicResponse;
      } else {
        // Βήμα 2: Δοκιμάζουμε πρώτα το Gemini AI (δωρεάν)
        try {
          console.log('🔥 Δοκιμάζω Gemini AI πρώτα...');
          const geminiResponse = await callGeminiAI(currentInput, athleteId, athleteName);
          
          if (isGoodResponse(geminiResponse)) {
            finalResponse = geminiResponse;
            
            // Το Smart Local AI μαθαίνει από το Gemini
            await smartLocalAI.learnFromResponse(currentInput, geminiResponse, 'gemini', athleteId);
          } else {
            throw new Error('Gemini response not satisfactory');
          }
        } catch (geminiError) {
          console.log('⚠️ Gemini AI δεν μπόρεσε, δοκιμάζω OpenAI...');
          
          // Βήμα 3: Αν το Gemini αποτύχει, καλούμε το OpenAI
          try {
            const openaiResponse = await callOpenAI(currentInput);
            finalResponse = openaiResponse;
            
            // Το Smart Local AI μαθαίνει από το OpenAI
            await smartLocalAI.learnFromResponse(currentInput, openaiResponse, 'openai', athleteId);
          } catch (openaiError) {
            finalResponse = `❌ **Σφάλμα:**\nΔυστυχώς αντιμετωπίζω τεχνικά προβλήματα με όλα τα AI συστήματα.\n\nΠαρακαλώ δοκιμάστε ξανά σε λίγο.`;
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalResponse,
        role: 'assistant',
        timestamp: new Date(),
        aiType: 'rid-smart'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Αποθηκεύουμε την απάντηση του AI
      await saveMessageToDatabase(assistantMessage);
      
    } catch (error) {
      console.error('RidAI Error:', error);
      toast.error('Σφάλμα στον RidAI Προπονητή');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToDatabase(errorMessage);
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

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#cb8954]" />
            RidAI Προπονητής
            {athleteName && (
              <span className="text-sm font-normal text-gray-600">
                για {athleteName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-500">Φόρτωση ιστορικού...</span>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={athletePhotoUrl} alt={athleteName || 'User'} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {getUserInitials(athleteName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center">
                            <Brain className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('el-GR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {message.role === 'assistant' && (
                            <span className="text-xs opacity-70 ml-2">
                              RidAI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Το RidAI σκέφτεται έξυπνα...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-4 border-t bg-white">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ρώτα τον RidAI Προπονητή για προπόνηση, διατροφή, ανάκαμψη..."
              className="rounded-none"
              disabled={isLoading || isLoadingHistory}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
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
