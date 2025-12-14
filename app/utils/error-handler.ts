/**
 * Error handling utilities for chat and generation errors
 * Provides error parsing, formatting, and retry logic
 */

export enum ErrorType {
  NETWORK = 'network',
  AI_ERROR = 'ai_error',
  RATE_LIMIT = 'rate_limit',
  AUTH = 'auth',
  UNKNOWN = 'unknown',
}

export interface ChatError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  suggestion?: string;
}

/**
 * Parse error response into ChatError
 */
export function parseError(error: unknown): ChatError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Connection lost. Please check your internet.',
        retryable: true,
        suggestion: 'Retry sending your message.',
      };
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate limit')) {
      return {
        type: ErrorType.RATE_LIMIT,
        message: 'Too many requests. Please wait a moment.',
        retryable: true,
        suggestion: 'Wait 30 seconds before trying again.',
      };
    }

    // Auth errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        type: ErrorType.AUTH,
        message: 'Session expired. Please refresh the page.',
        retryable: false,
      };
    }

    // AI-specific errors
    if (message.includes('gemini') || message.includes('generation') || message.includes('ai')) {
      return {
        type: ErrorType.AI_ERROR,
        message: 'AI processing failed. Try rephrasing your request.',
        retryable: true,
        suggestion: 'Simplify your request or be more specific.',
      };
    }

    // HTTP errors
    if (message.includes('http 5')) {
      return {
        type: ErrorType.UNKNOWN,
        message: 'Server error. Please try again.',
        retryable: true,
      };
    }
  }

  return {
    type: ErrorType.UNKNOWN,
    message: 'Something went wrong. Please try again.',
    retryable: true,
  };
}

/**
 * Format error for display in chat
 */
export function formatErrorMessage(error: ChatError): string {
  let message = error.message;
  if (error.suggestion) {
    message += ` ${error.suggestion}`;
  }
  return message;
}

/**
 * Auto-retry logic with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 2, delayMs = 1000, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const chatError = parseError(error);

      if (!chatError.retryable || attempt === maxRetries) {
        throw error;
      }

      onRetry?.(attempt + 1);
      // Exponential backoff: 1s, 2s, 4s, etc.
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}
