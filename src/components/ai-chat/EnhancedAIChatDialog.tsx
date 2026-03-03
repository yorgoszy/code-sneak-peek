import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Brain, Crown, Sparkles, Loader2, Wand2, Utensils, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAIProgramBuilder } from "@/contexts/AIProgramBuilderContext";
import { Badge } from "@/components/ui/badge";
import { QuickAssignProgramDialog, AIProgramData } from "@/components/ai-chat/QuickAssignProgramDialog";
import { QuickAssignNutritionDialog, AINutritionData } from "@/components/ai-chat/QuickAssignNutritionDialog";
import { AICoachDialog } from "@/components/ai-coach";
import { AIActionConfirmDialog, AIAction } from "@/components/ai-chat/AIActionConfirmDialog";

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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [lastAIProgramData, setLastAIProgramData] = useState<AIProgramData | null>(null);
  
  // Nutrition states
  const [nutritionAssignOpen, setNutritionAssignOpen] = useState(false);
  const [lastAINutritionData, setLastAINutritionData] = useState<AINutritionData | null>(null);
  
  // AI Coach Camera state
  const [showAICoach, setShowAICoach] = useState(false);
  
  // AI Action Confirmation state
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const { openDialog: openProgramBuilder, queueAction, executeAction } = useAIProgramBuilder();

  // Keep ref in sync with prop
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!athleteId) return;

      try {
        // ✅ Admin έλεγχος για ΤΡΕΧΟΝ logged-in χρήστη (όχι για τον athlete που βλέπουμε)
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth?.user?.id;

        if (authUserId) {
          const { data: currentUserData } = await supabase
            .from('app_users')
            .select('role')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

          setIsAdmin(currentUserData?.role === 'admin');
        } else {
          setIsAdmin(false);
        }

        // Subscription status αφορά τον athleteId (τον χρήστη που «ανήκει» το chat)
        const today = new Date().toISOString().split('T')[0];
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', athleteId)
          .eq('status', 'active')
          .gte('end_date', today)
          .limit(1);

        setHasActiveSubscription(!!(subscriptionData && subscriptionData.length > 0));
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    if (isOpen) {
      checkUserStatus();
    }
  }, [isOpen, athleteId]);

  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    if (isOpen && athleteId && !hasLoadedRef.current && !isLoading) {
      hasLoadedRef.current = true;
      loadConversationHistory();
    }
  }, [isOpen, athleteId]);

  // Reset loaded flag when athleteId changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [athleteId]);

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
        .order('created_at', { ascending: false })
        .limit(50); // Τα 50 πιο πρόσφατα μηνύματα

      if (error) throw error;

      if (history && history.length > 0) {
        // Αντιστρέφουμε τη σειρά για να δείξουμε τα παλαιότερα πρώτα
        const formattedMessages: Message[] = history.reverse().map((msg: any) => ({
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
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Γεια σου${athleteName ? ` ${athleteName}` : ''}! 👋

Είμαι ο **RID AI Προπονητής** και είμαι εδώ για να σε βοηθήσω με:

🏋️ Προπονητικές συμβουλές
🥗 Διατροφή και σχεδιασμό γευμάτων  
📊 Ανάλυση της προόδου σου
💪 Ασκησιολογικές τεχνικές
🔄 Αποκατάσταση και πρόληψη τραυματισμών

Έχω πρόσβαση στο ιστορικό προόδου σου και μπορώ να σου δώσω εξατομικευμένες συμβουλές!

Τι θα ήθελες να συζητήσουμε σήμερα;`,
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };

    setMessages([welcomeMessage]);
    
    // Αποθηκεύουμε το μήνυμα καλωσορίσματος
    await saveMessageToDatabase(welcomeMessage);
  };

  // Επεξεργασία AI actions (δημιουργία/ανάθεση προγραμμάτων + ProgramBuilder control)
  const processAIActions = async (response: string) => {
    const extractActionJson = (text: string): string | null => {
      const actionMatch = text.match(/```ai-action\s*([\s\S]*?)```/);
      if (actionMatch?.[1]) return actionMatch[1].trim();

      const markerIdx = text.search(/"action"\s*:\s*"(create_program|open_program_builder)"/);
      if (markerIdx === -1) return null;

      const startIdx = text.lastIndexOf('{', markerIdx);
      if (startIdx === -1) return null;

      let depth = 0;
      for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth === 0) return text.slice(startIdx, i + 1).trim();
      }

      return null;
    };

    const extracted = extractActionJson(response);
    if (!extracted) return;

    let jsonStr = extracted;

    if (!jsonStr.startsWith('{')) {
      console.error('❌ AI action block δεν περιέχει valid JSON - ξεκινάει με:', jsonStr.substring(0, 50));
      toast.error('Το AI έδωσε λάθος format. Παρακαλώ δοκίμασε ξανά.');
      return;
    }

    try {
      // Διόρθωση JSON (trailing commas)
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;

      const missingBraces = openBraces - closeBraces;
      const missingBrackets = openBrackets - closeBrackets;

      if (missingBraces > 5 || missingBrackets > 5) {
        console.error('❌ JSON φαίνεται truncated - λείπουν πολλές αγκύλες');
        toast.error('Το πρόγραμμα ήταν πολύ μεγάλο. Ζήτα απλούστερο πρόγραμμα με λιγότερες ασκήσεις.');
        return;
      }

      for (let i = 0; i < missingBrackets; i++) jsonStr += ']';
      for (let i = 0; i < missingBraces; i++) jsonStr += '}';

      const actionData = JSON.parse(jsonStr);
      console.log('🤖 Processing AI action:', actionData);

      if (actionData.action === 'open_program_builder') {
        openProgramBuilder();
        toast.success('Άνοιξε ο Program Builder!');

        if (actionData.actions && Array.isArray(actionData.actions)) {
          setTimeout(() => {
            actionData.actions.forEach((act: any) => executeAction(act));
          }, 500);
        }
        return;
      }

      // For ALL other actions, show confirmation dialog first
      setPendingAction(actionData);
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error processing AI action:', error, 'JSON:', jsonStr);
      toast.error('Σφάλμα επεξεργασίας AI action');
    }
  };

  // Execute action after confirmation
  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    
    setIsExecutingAction(true);
    const actionData = pendingAction;
    
    try {
      if (actionData.action === 'create_program') {
        setLastAIProgramData({
          name: actionData.name || 'Πρόγραμμα AI',
          description: actionData.description,
          training_dates: actionData.training_dates || [new Date().toISOString().split('T')[0]],
          weeks: actionData.weeks || [],
          user_id: actionData.user_id,
          user_ids: actionData.user_ids,
          group_id: actionData.group_id,
        });
        toast.success('Πρόγραμμα έτοιμο για ανάθεση!');
      } else if (actionData.action === 'create_nutrition_plan') {
        setLastAINutritionData({
          name: actionData.name || 'Πρόγραμμα Διατροφής AI',
          description: actionData.description,
          goal: actionData.goal,
          totalCalories: actionData.totalCalories || actionData.total_calories,
          proteinTarget: actionData.proteinTarget || actionData.protein_target,
          carbsTarget: actionData.carbsTarget || actionData.carbs_target,
          fatTarget: actionData.fatTarget || actionData.fat_target,
          days: actionData.days || [],
          targetUserId: actionData.target_user_id || actionData.targetUserId || actionData.user_id,
          targetUserName: actionData.target_user_name || actionData.targetUserName || actionData.user_name,
        });
        toast.success('Διατροφή έτοιμη για ανάθεση!');
      } else if (actionData.action === 'create_annual_plan') {
        await handleCreateAnnualPlan(actionData);
      } else if (actionData.action === 'delete_annual_plan') {
        await handleDeleteAnnualPlan(actionData);
      } else if (['create_subscription', 'pause_subscription', 'resume_subscription', 'renew_subscription', 'create_booking', 'cancel_booking', 'update_subscription_end_date', 'toggle_payment', 'record_visit', 'update_user_section', 'confirm_receipt_mark'].includes(actionData.action)) {
        // Execute via ai-program-actions edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-program-actions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(actionData),
          }
        );
        const result = await response.json();
        if (result.success) {
          toast.success(result.message || 'Η ενέργεια εκτελέστηκε!');
        } else {
          toast.error(result.error || 'Σφάλμα εκτέλεσης');
        }
      }
    } catch (error) {
      console.error('Error executing confirmed action:', error);
      toast.error('Σφάλμα εκτέλεσης ενέργειας');
    } finally {
      setIsExecutingAction(false);
      setConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  // Helper to extract month from various formats
  const extractMonth = (phaseData: any): number | null => {
    // Direct month number
    if (typeof phaseData.month === 'number') return phaseData.month;
    if (typeof phaseData.month === 'string' && !isNaN(parseInt(phaseData.month))) {
      return parseInt(phaseData.month);
    }
    
    // Try to extract from start_date (e.g., "2025-01-01" or "01/01/2025")
    if (phaseData.start_date) {
      const dateStr = phaseData.start_date;
      // Try YYYY-MM-DD format
      const isoMatch = dateStr.match(/^\d{4}-(\d{2})-\d{2}/);
      if (isoMatch) return parseInt(isoMatch[1]);
      // Try DD/MM/YYYY format
      const euMatch = dateStr.match(/^\d{2}\/(\d{2})\/\d{4}/);
      if (euMatch) return parseInt(euMatch[1]);
    }
    
    // Try month_name in Greek
    const monthNames: Record<string, number> = {
      'ιανουάριος': 1, 'ιανουαριος': 1,
      'φεβρουάριος': 2, 'φεβρουαριος': 2,
      'μάρτιος': 3, 'μαρτιος': 3,
      'απρίλιος': 4, 'απριλιος': 4,
      'μάιος': 5, 'μαιος': 5,
      'ιούνιος': 6, 'ιουνιος': 6,
      'ιούλιος': 7, 'ιουλιος': 7,
      'αύγουστος': 8, 'αυγουστος': 8,
      'σεπτέμβριος': 9, 'σεπτεμβριος': 9,
      'οκτώβριος': 10, 'οκτωβριος': 10,
      'νοέμβριος': 11, 'νοεμβριος': 11,
      'δεκέμβριος': 12, 'δεκεμβριος': 12
    };
    if (phaseData.month_name) {
      const normalized = phaseData.month_name.toLowerCase().trim();
      if (monthNames[normalized]) return monthNames[normalized];
    }
    
    return null;
  };

  // Helper to normalize Greek text (remove accents)
  const normalizeGreek = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ά]/g, 'α')
      .replace(/[έ]/g, 'ε')
      .replace(/[ή]/g, 'η')
      .replace(/[ί]/g, 'ι')
      .replace(/[ό]/g, 'ο')
      .replace(/[ύ]/g, 'υ')
      .replace(/[ώ]/g, 'ω')
      .trim();
  };

  // Helper to map phase names to valid phase keys
  const mapPhaseToKey = (phaseName: string): string => {
    if (!phaseName) return '';
    
    const normalized = normalizeGreek(phaseName);
    console.log('🔄 Mapping phase:', phaseName, '→ normalized:', normalized);
    
    // Direct phase keys (already valid)
    const validPhases = [
      'corrective', 'stabilization', 'connecting-linking', 'movement-skills',
      'non-functional-hypertrophy', 'functional-hypertrophy', 'maximal-strength',
      'power', 'endurance', 'competition'
    ];
    if (validPhases.includes(normalized)) return normalized;
    
    // Greek to English mapping (supports variations with/without accents)
    const phaseMap: Record<string, string> = {
      // Hypertrophy
      'υπερτροφια': 'functional-hypertrophy',
      'hypertrophy': 'functional-hypertrophy',
      'functional hypertrophy': 'functional-hypertrophy',
      'non functional hypertrophy': 'non-functional-hypertrophy',
      'μη λειτουργικη υπερτροφια': 'non-functional-hypertrophy',
      // Maximal Strength
      'μεγιστη δυναμη': 'maximal-strength',
      'maximal strength': 'maximal-strength',
      'max strength': 'maximal-strength',
      // Power
      'ισχυς': 'power',
      'str/spd': 'power',
      'power': 'power',
      'power training': 'power',
      // Competition
      'αγωνας': 'competition',
      'competition': 'competition',
      'tapering': 'competition',
      // Corrective
      'διορθωτικες': 'corrective',
      'corrective': 'corrective',
      // Stabilization
      'σταθεροποιηση': 'stabilization',
      'stabilization': 'stabilization',
      'stabilization training': 'stabilization',
      // Endurance
      'αντοχη': 'endurance',
      'endurance': 'endurance',
      // Movement Skills
      'κινητικες δεξιοτητες': 'movement-skills',
      'movement skills': 'movement-skills',
      // Connecting Linking
      'συνδεση': 'connecting-linking',
      'connecting linking': 'connecting-linking',
    };
    
    // Try direct match
    if (phaseMap[normalized]) {
      console.log('✅ Found match:', phaseMap[normalized]);
      return phaseMap[normalized];
    }
    
    // Try partial match (for cases like "Υπερτροφία" matching "υπερτροφια")
    for (const [key, value] of Object.entries(phaseMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        console.log('✅ Found partial match:', value);
        return value;
      }
    }
    
    console.warn('⚠️ No phase match found for:', phaseName);
    return '';
  };

  // Handle create annual plan action
  const handleCreateAnnualPlan = async (actionData: any) => {
    try {
      console.log('📅 Creating annual plan:', actionData);
      
      // Determine the correct year.
      // Goal: if user says "αγώνας τον Απρίλιο" and we're already past April in the CURRENT year,
      // we must schedule it for NEXT year (e.g. April 2026 when today is Dec 2025).
      let year = actionData.year || new Date().getFullYear();
      const phases = actionData.phases || [];

      // Find competition month from phases
      const competitionPhase = phases.find((p: any) => {
        const phaseName = (p.phase || p.phase_name || p.name || '').toLowerCase();
        return phaseName.includes('αγων') || phaseName.includes('competition') || phaseName.includes('tapering');
      });

      const inferCompetitionMonth = (): number | null => {
        if (!competitionPhase) return null;

        // Extract competition month - can be number or string
        if (typeof competitionPhase.month === 'number') return competitionPhase.month;
        if (typeof competitionPhase.month === 'string') {
          const monthNames: Record<string, number> = {
            'ιανουαριος': 1, 'ιανουάριος': 1, 'january': 1, 'jan': 1,
            'φεβρουαριος': 2, 'φεβρουάριος': 2, 'february': 2, 'feb': 2,
            'μαρτιος': 3, 'μάρτιος': 3, 'march': 3, 'mar': 3,
            'απριλιος': 4, 'απρίλιος': 4, 'april': 4, 'apr': 4,
            'μαιος': 5, 'μάιος': 5, 'may': 5,
            'ιουνιος': 6, 'ιούνιος': 6, 'june': 6, 'jun': 6,
            'ιουλιος': 7, 'ιούλιος': 7, 'july': 7, 'jul': 7,
            'αυγουστος': 8, 'αύγουστος': 8, 'august': 8, 'aug': 8,
            'σεπτεμβριος': 9, 'σεπτέμβριος': 9, 'september': 9, 'sep': 9,
            'οκτωβριος': 10, 'οκτώβριος': 10, 'october': 10, 'oct': 10,
            'νοεμβριος': 11, 'νοέμβριος': 11, 'november': 11, 'nov': 11,
            'δεκεμβριος': 12, 'δεκέμβριος': 12, 'december': 12, 'dec': 12,
          };

          const compMonthStr = competitionPhase.month
            .toLowerCase()
            .replace(/[άέήίόύώ]/g, (c: string) => {
              const map: Record<string, string> = {
                'ά': 'α',
                'έ': 'ε',
                'ή': 'η',
                'ί': 'ι',
                'ό': 'ο',
                'ύ': 'υ',
                'ώ': 'ω',
              };
              return map[c] || c;
            })
            .trim();

          return monthNames[compMonthStr] || (Number.isFinite(parseInt(compMonthStr)) ? parseInt(compMonthStr) : null);
        }

        return null;
      };

      const competitionMonth = inferCompetitionMonth();
      if (competitionMonth) {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const currentYear = new Date().getFullYear();

        // If we're past the competition month in the CURRENT year, the target year must be next year.
        // Apply even when the AI provided year=currentYear (it often "defaults" wrong).
        if (year === currentYear && competitionMonth <= currentMonth) {
          year = currentYear + 1;
          console.log(`📅 Competition month (${competitionMonth}) has passed in ${currentYear}, using next year: ${year}`);
        }
      }
      
      // Resolve user IDs from names
      let userIds: string[] = [];
      
      if (actionData.user_ids && Array.isArray(actionData.user_ids)) {
        // Multiple users
        for (const nameOrEmail of actionData.user_ids) {
          const userId = await resolveUserIdByName(nameOrEmail);
          if (userId) userIds.push(userId);
        }
      } else if (actionData.user_id) {
        // Single user
        const userId = await resolveUserIdByName(actionData.user_id);
        if (userId) userIds.push(userId);
      }
      
      if (userIds.length === 0) {
        toast.error('Δεν βρέθηκαν χρήστες για την ανάθεση');
        return;
      }
      
      // Create phases for each user
      for (const userId of userIds) {
        // Overwrite existing plan for this year (avoid duplicates / partial data)
        const { error: deleteError } = await supabase
          .from('user_annual_phases')
          .delete()
          .eq('user_id', userId)
          .eq('year', year);

        if (deleteError) {
          console.error('Error clearing existing annual phases:', deleteError);
          toast.error('Σφάλμα: δεν μπόρεσα να καθαρίσω το υπάρχον πλάνο');
          return;
        }

        const phasesToInsert = phases
          .map((p: any) => {
            const month = extractMonth(p);
            if (!month) {
              console.warn('Could not extract month from phase:', p);
              return null;
            }

            const phaseKey = mapPhaseToKey(p.phase || p.phase_name || p.name || '');
            if (!phaseKey) {
              console.warn('Could not map phase name to key:', p);
              return null;
            }

            return {
              user_id: userId,
              year,
              month,
              phase: phaseKey,
            };
          })
          .filter(Boolean);

        if (phasesToInsert.length === 0) {
          console.error('No valid phases to insert. Raw phases:', phases);
          toast.error('Δεν βρέθηκαν έγκυρες φάσεις για ανάθεση');
          return;
        }

        console.log('📊 Phases to insert:', phasesToInsert);

        const { error } = await supabase
          .from('user_annual_phases')
          .insert(phasesToInsert);

        if (error) {
          console.error('Error inserting phases:', error);
          toast.error('Σφάλμα κατά την ανάθεση μακροκύκλου');
          return;
        }

        // Also create monthly phases (4 weeks per month)
        const monthlyPhasesToInsert: any[] = [];
        for (const annualPhase of phasesToInsert) {
          for (let week = 1; week <= 4; week++) {
            monthlyPhasesToInsert.push({
              user_id: userId,
              year,
              month: annualPhase.month,
              week,
              phase: annualPhase.phase,
            });
          }
        }

        // Delete existing monthly phases for this user/year
        await supabase
          .from('user_monthly_phases')
          .delete()
          .eq('user_id', userId)
          .eq('year', year);

        if (monthlyPhasesToInsert.length > 0) {
          const { error: monthlyError } = await supabase
            .from('user_monthly_phases')
            .insert(monthlyPhasesToInsert);

          if (monthlyError) {
            console.error('Error inserting monthly phases:', monthlyError);
          } else {
            console.log(`📅 Inserted ${monthlyPhasesToInsert.length} monthly phases`);
          }
        }

        // Also create weekly phases based on training days.
        // If the AI provides training_days, we only mark those weekdays; otherwise fall back to all 7 days.
        const weeklyPhasesToInsert: any[] = [];

        const parseTrainingDays = (raw: any): number[] | null => {
          if (!raw) return null;

          // Numbers (1-7)
          if (Array.isArray(raw) && raw.every((v) => typeof v === 'number')) {
            const unique = Array.from(new Set(raw as number[])).filter((d) => d >= 1 && d <= 7);
            return unique.length ? unique : null;
          }

          // Strings (Greek/English day names)
          const mapDay = (s: string): number | null => {
            const n = s
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim();

            const dict: Record<string, number> = {
              // Greek
              'δευτερα': 1,
              'τριτη': 2,
              'τεταρτη': 3,
              'πεμπτη': 4,
              'παρασκευη': 5,
              'σαββατο': 6,
              'κυριακη': 7,
              // English
              'monday': 1,
              'mon': 1,
              'tuesday': 2,
              'tue': 2,
              'wednesday': 3,
              'wed': 3,
              'thursday': 4,
              'thu': 4,
              'friday': 5,
              'fri': 5,
              'saturday': 6,
              'sat': 6,
              'sunday': 7,
              'sun': 7,
            };

            return dict[n] ?? null;
          };

          if (Array.isArray(raw) && raw.every((v) => typeof v === 'string')) {
            const mapped = (raw as string[]).map(mapDay).filter((v): v is number => typeof v === 'number');
            const unique = Array.from(new Set(mapped)).filter((d) => d >= 1 && d <= 7);
            return unique.length ? unique : null;
          }

          return null;
        };

        const trainingDays =
          parseTrainingDays(actionData.training_days) ||
          parseTrainingDays(actionData.trainingDays) ||
          parseTrainingDays(actionData.workout_days) ||
          null;

        const daysToMark = trainingDays ?? [1, 2, 3, 4, 5, 6, 7];

        // Fetch jump profile to determine strength sub-phases
        const { data: jumpSessions } = await supabase
          .from('jump_test_sessions')
          .select(`
            id,
            test_date,
            jump_test_data (
              non_counter_movement_jump,
              counter_movement_jump,
              depth_jump
            )
          `)
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .limit(1);

        // Determine primary/secondary strength based on jump profile
        let primaryStrength = 'starting-strength';
        let secondaryStrength = 'explosive-strength';
        let hasJumpProfile = false;

        if (jumpSessions && jumpSessions.length > 0 && jumpSessions[0].jump_test_data?.length > 0) {
          const jumpData = jumpSessions[0].jump_test_data[0];
          const nonCmj = jumpData.non_counter_movement_jump;
          const cmj = jumpData.counter_movement_jump;
          const depthJump = jumpData.depth_jump;

          if (nonCmj !== null && cmj !== null && depthJump !== null) {
            hasJumpProfile = true;
            
            // If Non-CMJ < CMJ and Non-CMJ < Depth Jump → Primary: Starting, Secondary: Reactive
            if (nonCmj < cmj && nonCmj < depthJump) {
              primaryStrength = 'starting-strength';
              secondaryStrength = 'reactive-strength';
            }
            // If CMJ < Non-CMJ and CMJ < Depth Jump → Primary: Explosive, Secondary: Starting
            else if (cmj < nonCmj && cmj < depthJump) {
              primaryStrength = 'explosive-strength';
              secondaryStrength = 'starting-strength';
            }
            // If Depth Jump < Non-CMJ and Depth Jump < CMJ → Primary: Reactive, Secondary: Explosive
            else if (depthJump < nonCmj && depthJump < cmj) {
              primaryStrength = 'reactive-strength';
              secondaryStrength = 'explosive-strength';
            }
            
            console.log(`🏃 Jump Profile: Non-CMJ=${nonCmj}, CMJ=${cmj}, Depth=${depthJump}`);
            console.log(`💪 Strength: Primary=${primaryStrength}, Secondary=${secondaryStrength}`);
          }
        }

        // If no jump profile, we'll use 3-week rotation logic
        // Week 1-3: Starting (primary) / Explosive (secondary)
        // Week 4-6: Explosive (primary) / Reactive (secondary)
        // Week 7-9: Reactive (primary) / Starting (secondary)
        const getStrengthByWeekRotation = (weekIndex: number): { primary: string; secondary: string } => {
          const cycle = Math.floor(weekIndex / 3) % 3;
          switch (cycle) {
            case 0:
              return { primary: 'starting-strength', secondary: 'explosive-strength' };
            case 1:
              return { primary: 'explosive-strength', secondary: 'reactive-strength' };
            case 2:
              return { primary: 'reactive-strength', secondary: 'starting-strength' };
            default:
              return { primary: 'starting-strength', secondary: 'explosive-strength' };
          }
        };

        let weekCounter = 0;
        for (const monthlyPhase of monthlyPhasesToInsert) {
          // Only add sub-phases for strength-related phases
          const isStrengthPhase = ['maximal-strength', 'power'].includes(monthlyPhase.phase);
          
          let currentPrimary = primaryStrength;
          let currentSecondary = secondaryStrength;
          
          if (!hasJumpProfile && isStrengthPhase) {
            const rotation = getStrengthByWeekRotation(weekCounter);
            currentPrimary = rotation.primary;
            currentSecondary = rotation.secondary;
          }
          
          for (const day of daysToMark) {
            weeklyPhasesToInsert.push({
              user_id: userId,
              year,
              month: monthlyPhase.month,
              week: monthlyPhase.week,
              day,
              phase: monthlyPhase.phase,
              // Add sub-phases for strength phases
              ...(isStrengthPhase && {
                primary_subphase: currentPrimary,
                secondary_subphase: currentSecondary,
              }),
            });
          }
          
          if (isStrengthPhase) {
            weekCounter++;
          }
        }

        // Delete existing weekly phases for this user/year
        await supabase
          .from('user_weekly_phases')
          .delete()
          .eq('user_id', userId)
          .eq('year', year);

        if (weeklyPhasesToInsert.length > 0) {
          const { error: weeklyError } = await supabase
            .from('user_weekly_phases')
            .insert(weeklyPhasesToInsert);

          if (weeklyError) {
            console.error('Error inserting weekly phases:', weeklyError);
          } else {
            console.log(`📅 Inserted ${weeklyPhasesToInsert.length} weekly phases`);
          }
        }
      }
      
      toast.success(`Ο μακροκύκλος ανατέθηκε σε ${userIds.length} χρήστη(ες)!`);
      console.log('✅ Annual plan created successfully');
    } catch (error) {
      console.error('Error creating annual plan:', error);
      toast.error('Σφάλμα κατά τη δημιουργία μακροκύκλου');
    }
  };

  // Handle delete annual plan action
  const handleDeleteAnnualPlan = async (actionData: any) => {
    try {
      console.log('🗑️ Deleting annual plan:', actionData);
      
      const year = actionData.year || new Date().getFullYear();
      const userId = await resolveUserIdByName(actionData.user_id);
      
      if (!userId) {
        toast.error('Δεν βρέθηκε ο χρήστης');
        return;
      }
      
      // Delete annual phases
      const { error: annualError } = await supabase
        .from('user_annual_phases')
        .delete()
        .eq('user_id', userId)
        .eq('year', year);
      
      if (annualError) {
        console.error('Error deleting annual phases:', annualError);
        toast.error('Σφάλμα κατά τη διαγραφή');
        return;
      }
      
      // Also delete monthly and weekly phases
      await supabase
        .from('user_monthly_phases')
        .delete()
        .eq('user_id', userId)
        .eq('year', year);
      
      await supabase
        .from('user_weekly_phases')
        .delete()
        .eq('user_id', userId)
        .eq('year', year);
      
      toast.success('Ο μακροκύκλος διαγράφηκε!');
      console.log('✅ Annual plan deleted successfully');
    } catch (error) {
      console.error('Error deleting annual plan:', error);
      toast.error('Σφάλμα κατά τη διαγραφή μακροκύκλου');
    }
  };

  // Resolve user ID from name or email
  const resolveUserIdByName = async (nameOrEmail: string): Promise<string | null> => {
    if (!nameOrEmail) return null;
    
    // Check if it's already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(nameOrEmail)) {
      return nameOrEmail;
    }
    
    // Search by name or email
    const { data } = await supabase
      .from('app_users')
      .select('id')
      .or(`name.ilike.%${nameOrEmail}%,email.ilike.%${nameOrEmail}%`)
      .limit(1)
      .maybeSingle();
    
    return data?.id || null;
  };

  // Φιλτράρισμα του ai-action block από το μήνυμα (σιωπηλό - δεν φαίνεται στον χρήστη)
  const filterAIActionBlock = (content: string) => {
    // Remove ```ai-action...``` blocks
    let filtered = content.replace(/```ai-action[\s\S]*?```/g, '');
    // Also remove any raw JSON action blocks that might not be in code blocks
    filtered = filtered.replace(/\{[\s\S]*?"action"\s*:\s*"(create_program|open_program_builder|create_nutrition_plan|create_annual_plan|delete_annual_plan|create_subscription|pause_subscription|resume_subscription|renew_subscription|create_booking|cancel_booking)"[\s\S]*?\}(?:\s*\})*\s*/g, '');
    return filtered.trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !athleteId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Δημιουργία placeholder για το streaming message
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      aiType: 'rid-smart'
    };
    
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      // Κλήση rid-ai-coach με streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rid-ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: currentInput }],
            userId: athleteId
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Υπερβήκατε το όριο αιτημάτων. Παρακαλώ δοκιμάστε αργότερα.');
        }
        if (response.status === 402) {
          throw new Error('Απαιτείται πληρωμή. Παρακαλώ προσθέστε πιστώσεις στο Lovable AI workspace.');
        }
        throw new Error('Σφάλμα επικοινωνίας με το AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) throw new Error('No response stream');

      // ✅ Robust SSE parsing (handles partial JSON across chunks)
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // Μην εμφανίζεις τίποτα κατά το streaming — μόνο "Σκέφτομαι..."
              fullResponse += content;
            }
          } catch {
            // Incomplete JSON split across chunks: put back & wait for more
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush (in case stream ended without trailing newline)
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;

          const data = raw.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // Μην εμφανίζεις τίποτα κατά το streaming — μόνο "Σκέφτομαι..."
              fullResponse += content;
            }
          } catch {
            // ignore leftovers
          }
        }
      }

      console.log('✅ Streaming completed');

      // Εμφάνιση τελικής απάντησης (χωρίς ai-action/json)
      const finalVisibleResponse = filterAIActionBlock(fullResponse);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId ? { ...msg, content: finalVisibleResponse } : msg
        )
      );

      // 🔔 Αν το dialog είναι κλειστό, δείξε notification
      if (!isOpenRef.current && finalVisibleResponse.trim()) {
        toast('💬 Ο RidAI απάντησε!', {
          description: finalVisibleResponse.substring(0, 100) + (finalVisibleResponse.length > 100 ? '...' : ''),
          duration: 8000,
        });
      }

      // Έλεγχος για AI actions στην πλήρη απάντηση
      await processAIActions(fullResponse);
      
    } catch (error) {
      console.error('RID AI Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα στην επικοινωνία με το AI';
      toast.error(errorMessage);
      
      // Update placeholder with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: `Λυπάμαι, ${errorMessage}` }
            : msg
        )
      );
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] sm:h-[80vh] rounded-none flex flex-col p-0">
        <DialogHeader className="p-3 sm:p-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#cb8954] flex-shrink-0" />
              <span className="truncate">RidAI Προπονητής</span>
              {athleteName && (
                <span className="text-xs sm:text-sm font-normal text-gray-600 truncate hidden sm:inline">
                  για {athleteName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {/* Camera AI Coach button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAICoach(true)}
                className="rounded-none text-[10px] sm:text-xs h-7 px-2 sm:px-3"
                title="AI Coach με Κάμερα"
              >
                <Camera className="w-3 h-3 text-[#00ffba]" />
              </Button>
              
              {isAdmin && (
                <>
                  <Button
                    size="sm"
                    variant={lastAIProgramData ? "default" : "outline"}
                    onClick={() => setQuickAssignOpen(true)}
                    className={`rounded-none text-[10px] sm:text-xs h-7 px-2 sm:px-3 ${
                      lastAIProgramData 
                        ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black animate-pulse' 
                        : ''
                    }`}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    {lastAIProgramData ? 'Έτοιμο!' : 'Assign'}
                  </Button>
                  <Button
                    size="sm"
                    variant={lastAINutritionData ? "default" : "outline"}
                    onClick={() => setNutritionAssignOpen(true)}
                    className={`rounded-none text-[10px] sm:text-xs h-7 px-2 sm:px-3 ${
                      lastAINutritionData 
                        ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black animate-pulse' 
                        : ''
                    }`}
                  >
                    <Utensils className="w-3 h-3 mr-1" />
                    {lastAINutritionData ? 'NutrEnd!' : 'NutrEnd'}
                  </Button>
                </>
              )}
              {isAdmin ? (
                <Badge variant="default" className="bg-[#cb8954] text-white rounded-none text-[10px] sm:text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              ) : hasActiveSubscription ? (
                <Badge variant="default" className="bg-[#00ffba] text-black rounded-none text-[10px] sm:text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-none text-[10px] sm:text-xs">
                  Βασική
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-2 sm:px-4">
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-500">Φόρτωση ιστορικού...</span>
                </div>
              ) : (
                messages
                  .map((message) => {
                    if (message.role === 'assistant' && !message.content.trim()) return null;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="flex-shrink-0">
                            {message.role === 'user' ? (
                              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                                <AvatarImage src={athletePhotoUrl} alt={athleteName || 'User'} />
                                <AvatarFallback className="bg-blue-500 text-white text-[10px] sm:text-xs">
                                  {getUserInitials(athleteName)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center flex-shrink-0">
                                <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                              </div>
                            )}
                          </div>
                          <div className={`p-2 sm:p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}>
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{filterAIActionBlock(message.content)}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] sm:text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString('el-GR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {message.role === 'assistant' && (
                                <span className="text-[10px] sm:text-xs opacity-70 ml-2">
                                  RidAI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean)
              )}
              
              {isLoading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#cb8954] text-white flex items-center justify-center flex-shrink-0">
                    <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-2 sm:p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span className="text-xs sm:text-sm">Σκέφτομαι...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 p-2 sm:p-4 border-t bg-white">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ρώτησε κάτι..."
              className="rounded-none text-sm sm:text-base h-9 sm:h-10"
              disabled={isLoading || isLoadingHistory}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white h-9 sm:h-10 w-9 sm:w-10 p-0"
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

    {/* Quick Assign Dialog */}
    {athleteId && (
      <QuickAssignProgramDialog
        isOpen={quickAssignOpen}
        onClose={() => {
          setQuickAssignOpen(false);
          setLastAIProgramData(null);
        }}
        userId={athleteId}
        programData={lastAIProgramData}
      />
    )}

    {/* Quick Assign Nutrition Dialog */}
    <QuickAssignNutritionDialog
      isOpen={nutritionAssignOpen}
      onClose={() => {
        setNutritionAssignOpen(false);
        setLastAINutritionData(null);
      }}
      nutritionData={lastAINutritionData}
      defaultUserId={athleteId}
    />
    
    <AICoachDialog isOpen={showAICoach} onClose={() => setShowAICoach(false)} />
    
    <AIActionConfirmDialog
      isOpen={confirmDialogOpen}
      onClose={() => {
        setConfirmDialogOpen(false);
        setPendingAction(null);
      }}
      onConfirm={executeConfirmedAction}
      action={pendingAction}
      isExecuting={isExecutingAction}
    />
    </>
  );
};
