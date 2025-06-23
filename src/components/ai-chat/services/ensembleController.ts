
interface AIResponse {
  content: string;
  confidence: number;
  source: 'local' | 'gemini';
  responseTime: number;
}

interface EnsembleConfig {
  useLocal: boolean;
  useGemini: boolean;
  geminiApiKey?: string;
  combineResponses: boolean;
  fallbackMode: boolean;
}

class EnsembleController {
  private config: EnsembleConfig;

  constructor(config: EnsembleConfig) {
    this.config = config;
  }

  async processQuery(query: string, athleteName: string): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];
    const promises: Promise<AIResponse>[] = [];

    // Decide which AIs to use based on query complexity and config
    const queryComplexity = this.analyzeQueryComplexity(query);
    const shouldUseLocal = this.config.useLocal && this.shouldUseLocal(queryComplexity);
    const shouldUseGemini = this.config.useGemini && this.config.geminiApiKey && this.shouldUseGemini(queryComplexity);

    if (shouldUseLocal) {
      promises.push(this.callLocalAI(query, athleteName));
    }

    if (shouldUseGemini) {
      promises.push(this.callGeminiAI(query, athleteName));
    }

    // Execute in parallel for better performance
    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      }
    }

    return responses;
  }

  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const complexKeywords = ['αναλυση', 'στρατηγικη', 'σχεδιο', 'πολυπλοκος', 'λεπτομερεια'];
    const mediumKeywords = ['πως', 'γιατι', 'ποτε', 'που', 'τι'];
    
    const lowerQuery = query.toLowerCase();
    
    if (complexKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'complex';
    }
    
    if (mediumKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 100) {
      return 'medium';
    }
    
    return 'simple';
  }

  private shouldUseLocal(complexity: string): boolean {
    // Local AI is good for simple and medium queries
    return complexity === 'simple' || complexity === 'medium';
  }

  private shouldUseGemini(complexity: string): boolean {
    // Gemini is better for medium and complex queries
    return complexity === 'medium' || complexity === 'complex';
  }

  private async callLocalAI(query: string, athleteName: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    const responses = [
      `Εξαιρετική ερώτηση ${athleteName}! Για την προπόνηση σου, συνιστώ να εστιάσεις σε σύνθετες κινήσεις όπως squats, deadlifts και push-ups. Αυτές δουλεύουν πολλές μυϊκές ομάδες ταυτόχρονα! 💪`,
      
      `Η διατροφή είναι το 70% της επιτυχίας σου! Προτείνω να τρως πρωτεΐνη σε κάθε γεύμα, πολλά λαχανικά και να υδατώνεσαι καλά. Τι είδους στόχους έχεις; 🥗`,
      
      `Η ανάπαυση είναι εξίσου σημαντική με την προπόνηση! Φρόντισε να κοιμάσαι 7-9 ώρες και να έχεις τουλάχιστον μία ημέρα ξεκούρασης την εβδομάδα. 😴`,
      
      `Για καλύτερα αποτελέσματα, κράτα ένα ημερολόγιο προπόνησης και διατροφής. Η παρακολούθηση της προόδου σου θα σε κρατήσει παρακινημένο! 📈`,
      
      `Θυμήσου: η συνέπεια είναι το κλειδί! Καλύτερα 20 λεπτά κάθε μέρα παρά 2 ώρες μία φορά την εβδομάδα. Μικρά βήματα οδηγούν σε μεγάλα αποτελέσματα! 🎯`
    ];
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responseTime = Date.now() - startTime;
    const content = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      content,
      confidence: 0.7 + Math.random() * 0.2, // 70-90% confidence for local
      source: 'local',
      responseTime
    };
  }

  private async callGeminiAI(query: string, athleteName: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    if (!this.config.geminiApiKey?.trim()) {
      throw new Error('Gemini API key is required');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Είσαι ο RID, ένας εξειδικευμένος AI προπονητής και διατροφολόγος για τον αθλητή ${athleteName}. 

Δώσε συμβουλές για:
- Προπόνηση και fitness
- Διατροφή και θρέψη  
- Ανάπαυση και αποκατάσταση
- Κίνητρα και ψυχολογία

Απάντα στα ελληνικά, με φιλικό τόνο και χρησιμοποίησε emoji.

Ερώτηση: ${query}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Σφάλμα στο Gemini API');
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return {
      content: data.candidates[0].content.parts[0].text,
      confidence: 0.8 + Math.random() * 0.15, // 80-95% confidence for Gemini
      source: 'gemini',
      responseTime
    };
  }

  updateConfig(newConfig: Partial<EnsembleConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export { EnsembleController, type AIResponse, type EnsembleConfig };
