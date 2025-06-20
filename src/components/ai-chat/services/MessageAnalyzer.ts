
export interface MessageAnalysis {
  complexity: 'simple' | 'complex';
  category: string;
  intent: string;
}

export class MessageAnalyzer {
  analyzeMessage(message: string): MessageAnalysis {
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
}
