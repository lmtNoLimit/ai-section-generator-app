import type { CodeExtractionResult } from '../types/ai.types';

// Code block patterns in priority order (allow optional whitespace/newline after language)
const CODE_BLOCK_PATTERNS = [
  /```liquid\s*([\s\S]*?)```/g,
  /```html\s*([\s\S]*?)```/g,
  /```\s*([\s\S]*?)```/g,
];

/**
 * Extract Liquid code from AI response
 * Handles multiple formats:
 * 1. Fenced code blocks (```liquid...```, ```html...```, ```...```)
 * 2. Raw Liquid schema pattern (fallback)
 *
 * When multiple code blocks exist, takes the LAST one (final version)
 */
export function extractCodeFromResponse(content: string): CodeExtractionResult {
  let code: string | undefined;

  // Try each pattern and take the LAST match (final version)
  for (const pattern of CODE_BLOCK_PATTERNS) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const potentialCode = lastMatch[1].trim();

      // Verify it looks like Liquid/HTML
      if (potentialCode.includes('{%') || potentialCode.includes('{{') || potentialCode.includes('<')) {
        code = potentialCode;
        break;
      }
    }
  }

  // Fallback: look for raw Liquid schema pattern (no fencing)
  if (!code) {
    const schemaMatch = content.match(/(\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\})/);
    if (schemaMatch) {
      // Find the full section including HTML around the schema
      const sectionMatch = content.match(
        /((?:<[a-z][^>]*>[\s\S]*?)?\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}(?:[\s\S]*?<\/[a-z]+>)?)/i
      );
      code = sectionMatch ? sectionMatch[1].trim() : schemaMatch[1].trim();
    }
  }

  if (!code) {
    return {
      hasCode: false,
      explanation: content,
    };
  }

  // Compute explanation (content without the code block)
  const explanation = content
    .replace(/```(?:liquid|html)?\s*[\s\S]*?```/g, '')
    .trim() || undefined;

  return {
    hasCode: true,
    code,
    explanation,
    changes: extractChangeSummary(content),
  };
}

/**
 * Extract change summary from AI response
 * Looks for bullet points or numbered lists describing changes
 */
function extractChangeSummary(content: string): string[] | undefined {
  const changes: string[] = [];

  // Match bullet points (- or *)
  const bulletMatches = content.matchAll(/^[\s]*[-*]\s+(.+)$/gm);
  for (const match of bulletMatches) {
    changes.push(match[1].trim());
  }

  // Match numbered lists
  const numberedMatches = content.matchAll(/^[\s]*\d+\.\s+(.+)$/gm);
  for (const match of numberedMatches) {
    changes.push(match[1].trim());
  }

  return changes.length > 0 ? changes : undefined;
}

/**
 * Validate extracted code is a complete Liquid section
 */
export function isCompleteLiquidSection(code: string): boolean {
  const hasSchema = /\{%\s*schema\s*%\}[\s\S]*\{%\s*endschema\s*%\}/.test(code);
  const hasMarkup = /<[a-z][\s\S]*>/i.test(code);

  return hasSchema && hasMarkup;
}
