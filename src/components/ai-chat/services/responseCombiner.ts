
import type { AIResponse } from './ensembleController';

interface CombinedResponse {
  content: string;
  sources: string[];
  totalConfidence: number;
  processingTime: number;
}

class ResponseCombiner {
  combineResponses(responses: AIResponse[]): CombinedResponse {
    if (responses.length === 0) {
      return {
        content: 'Δεν μπόρεσα να παράγω απάντηση. Παρακαλώ δοκιμάστε ξανά.',
        sources: [],
        totalConfidence: 0,
        processingTime: 0
      };
    }

    if (responses.length === 1) {
      const response = responses[0];
      return {
        content: response.content,
        sources: [response.source],
        totalConfidence: response.confidence,
        processingTime: response.responseTime
      };
    }

    // Multiple responses - combine them intelligently
    return this.intelligentCombine(responses);
  }

  private intelligentCombine(responses: AIResponse[]): CombinedResponse {
    // Sort by confidence
    const sortedResponses = responses.sort((a, b) => b.confidence - a.confidence);
    
    // Get the best response as primary
    const primaryResponse = sortedResponses[0];
    const secondaryResponses = sortedResponses.slice(1);
    
    let combinedContent = `**Σύνθετη απάντηση από ${responses.length} AI πηγές:**\n\n`;
    
    // Add primary response with source indicator
    combinedContent += `🤖 **${this.getSourceEmoji(primaryResponse.source)} ${this.getSourceName(primaryResponse.source)}:**\n`;
    combinedContent += `${primaryResponse.content}\n\n`;
    
    // Add secondary responses if they provide additional value
    for (const response of secondaryResponses) {
      if (this.hasAdditionalValue(primaryResponse.content, response.content)) {
        combinedContent += `🤖 **${this.getSourceEmoji(response.source)} ${this.getSourceName(response.source)}:**\n`;
        combinedContent += `${response.content}\n\n`;
      }
    }
    
    // Add summary footer
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const maxProcessingTime = Math.max(...responses.map(r => r.responseTime));
    
    combinedContent += `---\n`;
    combinedContent += `💡 *Συνδυάστηκαν ${responses.length} πηγές AI για την καλύτερη δυνατή απάντηση*`;
    
    return {
      content: combinedContent,
      sources: responses.map(r => r.source),
      totalConfidence: avgConfidence,
      processingTime: maxProcessingTime
    };
  }

  private hasAdditionalValue(primaryContent: string, secondaryContent: string): boolean {
    // Simple check for content similarity
    const primaryWords = primaryContent.toLowerCase().split(' ');
    const secondaryWords = secondaryContent.toLowerCase().split(' ');
    
    const commonWords = primaryWords.filter(word => 
      word.length > 3 && secondaryWords.includes(word)
    );
    
    // If less than 30% overlap, consider it additional value
    const overlapRatio = commonWords.length / Math.min(primaryWords.length, secondaryWords.length);
    return overlapRatio < 0.3;
  }

  private getSourceEmoji(source: string): string {
    switch (source) {
      case 'local':
        return '🏠';
      case 'gemini':
        return '💎';
      default:
        return '🤖';
    }
  }

  private getSourceName(source: string): string {
    switch (source) {
      case 'local':
        return 'Local AI';
      case 'gemini':
        return 'Gemini AI';
      default:
        return 'Unknown AI';
    }
  }

  selectBestResponse(responses: AIResponse[]): AIResponse {
    if (responses.length === 0) {
      return {
        content: 'Δεν υπάρχει διαθέσιμη απάντηση.',
        confidence: 0,
        source: 'local',
        responseTime: 0
      };
    }

    // Return the response with highest confidence
    return responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
}

export { ResponseCombiner, type CombinedResponse };
