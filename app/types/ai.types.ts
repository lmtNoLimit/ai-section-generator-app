/**
 * AI Streaming and Context Types
 * Types for real-time AI generation with conversation context
 */

/**
 * Streaming generation options
 */
export interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Context for conversation-aware generation
 */
export interface ConversationContext {
  currentCode?: string;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  summarizedHistory?: string;
}

/**
 * Result of code extraction from AI response
 */
export interface CodeExtractionResult {
  hasCode: boolean;
  code?: string;
  explanation?: string;
  changes?: string[];
}

/**
 * Extended streaming options with finish reason callback
 */
export interface ExtendedStreamingOptions extends StreamingOptions {
  onFinishReason?: (reason: string | undefined) => void;
}

/**
 * Result of auto-continuation process
 */
export interface ContinuationResult {
  content: string;
  finishReason: string | undefined;
  continuationCount: number;
  wasComplete: boolean;
}
