import type { ConversationContext } from '../types/ai.types';
import type { ModelMessage } from '../types/chat.types';

/**
 * Chat-specific system prompt extension
 * Appended to base SYSTEM_PROMPT for conversational context
 */
const CHAT_SYSTEM_EXTENSION = `

=== CONVERSATION MODE ===

You are now in conversation mode, helping the user iteratively refine their Liquid section.

RESPONSE RULES:
1. If user asks for code changes, output the COMPLETE updated section code
2. Include ALL code (schema, style, markup) - never output partial sections
3. Wrap code in \`\`\`liquid ... \`\`\` fences
4. Briefly explain what you changed (1-3 bullet points)
5. If user asks a question (not requesting changes), answer without code

CHANGE REQUEST EXAMPLES:
- "Make the heading larger" → Increase font-size in CSS, output full section
- "Add a button" → Add button markup + settings, output full section
- "Change colors to blue" → Update color defaults/CSS, output full section

QUESTION EXAMPLES:
- "What settings does this have?" → List settings without code output
- "How do I use this?" → Explain usage without code output

CONTEXT:
The user's current section code is provided below. Always base your changes on this code.
Never start from scratch unless explicitly asked.`;

/**
 * Build full prompt with conversation context
 */
export function buildConversationPrompt(
  userMessage: string,
  context: ConversationContext
): string {
  const parts: string[] = [];

  // Current code context
  if (context.currentCode) {
    parts.push('=== CURRENT SECTION CODE ===');
    parts.push('```liquid');
    parts.push(context.currentCode);
    parts.push('```');
    parts.push('');
  }

  // Recent conversation history
  if (context.recentMessages.length > 0) {
    parts.push('=== RECENT CONVERSATION ===');
    for (const msg of context.recentMessages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      // Truncate long messages for context efficiency
      const content = msg.content.length > 500
        ? msg.content.slice(0, 500) + '...[truncated]'
        : msg.content;
      parts.push(`${role}: ${content}`);
    }
    parts.push('');
  }

  // Summarized history (if available)
  if (context.summarizedHistory) {
    parts.push('=== EARLIER CONTEXT (SUMMARIZED) ===');
    parts.push(context.summarizedHistory);
    parts.push('');
  }

  // Current user request
  parts.push('=== USER REQUEST ===');
  parts.push(userMessage);

  return parts.join('\n');
}

/**
 * Get system prompt with chat extension
 */
export function getChatSystemPrompt(baseSystemPrompt: string): string {
  return baseSystemPrompt + CHAT_SYSTEM_EXTENSION;
}

/**
 * Summarize old messages to save tokens
 * Called when conversation exceeds ~20 messages
 */
export function summarizeOldMessages(messages: ModelMessage[]): string {
  if (messages.length === 0) return '';

  const summary: string[] = [];
  summary.push('Previous conversation covered:');

  // Extract key topics from messages
  const topics = new Set<string>();

  for (const msg of messages) {
    // Look for common request patterns
    if (msg.content.toLowerCase().includes('color')) topics.add('color changes');
    if (msg.content.toLowerCase().includes('button')) topics.add('button modifications');
    if (msg.content.toLowerCase().includes('heading')) topics.add('heading styling');
    if (msg.content.toLowerCase().includes('spacing')) topics.add('spacing adjustments');
    if (msg.content.toLowerCase().includes('image')) topics.add('image settings');
    if (msg.content.toLowerCase().includes('font')) topics.add('font changes');
    if (msg.content.toLowerCase().includes('responsive')) topics.add('responsive design');
    if (msg.content.toLowerCase().includes('background')) topics.add('background styling');
    if (msg.content.toLowerCase().includes('padding')) topics.add('padding adjustments');
    if (msg.content.toLowerCase().includes('margin')) topics.add('margin changes');
  }

  for (const topic of topics) {
    summary.push(`- ${topic}`);
  }

  // Count exchanges
  const userMessages = messages.filter(m => m.role === 'user').length;
  summary.push(`(${userMessages} refinement requests made)`);

  return summary.join('\n');
}
