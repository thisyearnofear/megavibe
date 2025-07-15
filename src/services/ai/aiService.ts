/**
 * AI Service for content generation and suggestions
 * This service provides AI assistance for bounty creation and other content tasks
 */

// Types for AI service responses
export interface BountyAIResponse {
  description: string;
  title: string;
  tags: string[];
  suggestedPrice: string;
  suggestedDeadline: string;
}

export interface ContentQualityResponse {
  feedback: string[];
  qualityScore: number;
  improvementSuggestions: string[];
}

class AIService {
  private apiUrl: string;
  private enabled: boolean;
  
  constructor() {
    // Get configuration from environment variables
    this.apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || '/api/ai';
    this.enabled = process.env.NEXT_PUBLIC_AI_ENABLED !== 'false'; // Enabled by default
  }
  
  /**
   * Process a user's natural language bounty request into a structured bounty
   * @param userInput The user's description of what they want
   * @returns Structured bounty content with suggestions
   */
  public async processBountyRequest(userInput: string): Promise<BountyAIResponse> {
    try {
      // In a real implementation, this would call an external AI service
      // For now, we'll simulate the response with some basic NLP-like processing
      
      // Extract potential tags from input
      const potentialTags = this.extractTags(userInput);
      
      // Determine if this is likely a music-related bounty
      const isMusicRelated = this.checkIfMusicRelated(userInput);
      
      // Determine likely bounty type
      const isPerformerToAudience = userInput.toLowerCase().includes('audience') || 
                                   userInput.toLowerCase().includes('promotion') ||
                                   userInput.toLowerCase().includes('fan');
      
      // Generate a more professional description
      const enhancedDescription = this.enhanceDescription(userInput, isMusicRelated);
      
      // Generate a title based on the first part of the description
      const title = this.generateTitle(enhancedDescription);
      
      // Suggest price based on complexity
      const suggestedPrice = this.suggestPrice(userInput);
      
      // Suggest deadline based on complexity
      const suggestedDeadline = this.suggestDeadline(userInput);
      
      return {
        description: enhancedDescription,
        title,
        tags: potentialTags,
        suggestedPrice,
        suggestedDeadline
      };
    } catch (error) {
      console.error('Error processing bounty request:', error);
      throw new Error('Failed to process bounty request');
    }
  }
  
  /**
   * Analyze uploaded content for quality issues
   * @param contentUrl URL of the content to analyze
   * @param contentType Type of content (audio, video, image, etc.)
   * @returns Quality analysis with feedback
   */
  public async analyzeContentQuality(contentUrl: string, contentType: string): Promise<ContentQualityResponse> {
    try {
      // In a real implementation, this would call an external AI service
      // For now, we'll return simulated results
      
      return {
        feedback: [
          'Content meets the basic requirements',
          'Good overall quality'
        ],
        qualityScore: 8.5,
        improvementSuggestions: [
          'Consider increasing audio levels slightly',
          'Adding tags would improve discoverability'
        ]
      };
    } catch (error) {
      console.error('Error analyzing content quality:', error);
      throw new Error('Failed to analyze content');
    }
  }
  
  // Private helper methods
  
  /**
   * Extract potential tags from user input
   */
  private extractTags(input: string): string[] {
    const commonTags = [
      'Music', 'Audio', 'Vocal', 'Beat', 'Remix', 'Production',
      'Video', 'Visual', 'Animation', 'Design', 'Artwork',
      'Podcast', 'Interview', 'Writing', 'Lyrics', 'Translation'
    ];
    
    // Look for potential matches in the input
    return commonTags.filter(tag => 
      input.toLowerCase().includes(tag.toLowerCase())
    ).slice(0, 5); // Limit to 5 tags
  }
  
  /**
   * Check if the bounty is likely music-related
   */
  private checkIfMusicRelated(input: string): boolean {
    const musicKeywords = [
      'music', 'song', 'track', 'beat', 'melody', 'vocal', 'lyrics',
      'remix', 'producer', 'artist', 'band', 'concert', 'perform'
    ];
    
    return musicKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }
  
  /**
   * Enhance a user's description to be more professional
   */
  private enhanceDescription(input: string, isMusicRelated: boolean): string {
    // This is a simplified version - in reality, this would use a proper NLP model
    let enhanced = input.trim();
    
    // Ensure first letter is capitalized
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    // Ensure it ends with a period
    if (!enhanced.endsWith('.') && !enhanced.endsWith('!') && !enhanced.endsWith('?')) {
      enhanced += '.';
    }
    
    // Add more professional framing
    if (isMusicRelated) {
      enhanced += ' The finished work should maintain high audio quality and be delivered in a standard digital format.';
    } else {
      enhanced += ' The final deliverable should be professional quality and provided in an industry-standard format.';
    }
    
    return enhanced;
  }
  
  /**
   * Generate a title from a description
   */
  private generateTitle(description: string): string {
    // Take first ~50 chars up to the end of a word
    const firstSentence = description.split(/[.!?]/)[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }
    
    // Find a good cutoff point around 50 chars
    const cutoff = firstSentence.substr(0, 50).lastIndexOf(' ');
    return firstSentence.substr(0, cutoff) + '...';
  }
  
  /**
   * Suggest a price based on the complexity of the request
   */
  private suggestPrice(input: string): string {
    // This is a simplified heuristic - in reality, this would use more sophisticated analysis
    const wordCount = input.split(/\s+/).length;
    
    if (wordCount < 20) {
      return '50'; // Simple request
    } else if (wordCount < 50) {
      return '100'; // Moderate request
    } else {
      return '250'; // Complex request
    }
  }
  
  /**
   * Suggest a deadline based on the complexity of the request
   */
  private suggestDeadline(input: string): string {
    // This is a simplified heuristic - in reality, this would use more sophisticated analysis
    const wordCount = input.split(/\s+/).length;
    const currentDate = new Date();
    
    if (wordCount < 20) {
      // Simple request - 3 days
      const deadline = new Date(currentDate);
      deadline.setDate(deadline.getDate() + 3);
      return deadline.toISOString().split('T')[0];
    } else if (wordCount < 50) {
      // Moderate request - 7 days
      const deadline = new Date(currentDate);
      deadline.setDate(deadline.getDate() + 7);
      return deadline.toISOString().split('T')[0];
    } else {
      // Complex request - 14 days
      const deadline = new Date(currentDate);
      deadline.setDate(deadline.getDate() + 14);
      return deadline.toISOString().split('T')[0];
    }
  }
}

// Create singleton instance
export const aiService = new AIService();

export default aiService;