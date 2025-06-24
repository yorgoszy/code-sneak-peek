
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface UseSmartAIChatProps {
  isOpen: boolean;
  userId?: string;
  userName?: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isCheckingSubscription: boolean;
}

export interface ConversationState {
  messages: Message[];
  isLoadingHistory: boolean;
}

export interface MessageHandlers {
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}
