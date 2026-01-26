/**
 * Client-side code extraction from AI responses
 * Pure functions with no server dependencies (no process.env)
 * Used by useChat to extract code after streaming completes
 */

export interface ClientCodeExtractionResult {
  hasCode: boolean;
  code?: string;
  explanation?: string;
  changes?: string[];
}

// Code block patterns in priority order
const CODE_BLOCK_PATTERNS = [
  /```liquid\s*([\s\S]*?)```/g,
  /```html\s*([\s\S]*?)```/g,
  /```\s*([\s\S]*?)```/g,
];

// Pattern to match structured CHANGES comment (using [\s\S] instead of dotAll flag)
const CHANGES_COMMENT_PATTERN = /<!--\s*CHANGES:\s*(\[[\s\S]*?\])\s*-->/;

const MAX_CHANGES = 5;

/**
 * Extract Liquid code from AI response content
 * Takes the LAST code block (final version)
 */
export function extractCodeFromContent(content: string): ClientCodeExtractionResult {
  let code: string | undefined;

  // Try each pattern and take the LAST match
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

  // Fallback: look for raw Liquid schema pattern
  if (!code) {
    const schemaMatch = content.match(/(\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\})/);
    if (schemaMatch) {
      const sectionMatch = content.match(
        /((?:<[a-z][^>]*>[\s\S]*?)?\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}(?:[\s\S]*?<\/[a-z]+>)?)/i
      );
      code = sectionMatch ? sectionMatch[1].trim() : schemaMatch[1].trim();
    }
  }

  if (!code) {
    return { hasCode: false, explanation: content };
  }

  // Extract changes
  const changes = extractChanges(content, code);

  // Remove CHANGES comment from code
  const cleanedCode = code.replace(CHANGES_COMMENT_PATTERN, '').trim();

  // Compute explanation
  const explanation = content
    .replace(/```(?:liquid|html)?\s*[\s\S]*?```/g, '')
    .trim() || undefined;

  return {
    hasCode: true,
    code: cleanedCode,
    explanation,
    changes,
  };
}

/**
 * Extract changes from AI response
 */
function extractChanges(fullContent: string, codeContent: string): string[] | undefined {
  // Try structured comment
  let changes = parseStructuredChanges(codeContent);
  if (changes) return changes;

  changes = parseStructuredChanges(fullContent);
  if (changes) return changes;

  // Fallback: bullet points
  const explanationText = fullContent.replace(/```[\s\S]*?```/g, '');
  return extractBulletChanges(explanationText);
}

function parseStructuredChanges(content: string): string[] | undefined {
  const match = content.match(CHANGES_COMMENT_PATTERN);
  if (!match) return undefined;

  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .slice(0, MAX_CHANGES);
    }
  } catch {
    // Invalid JSON
  }
  return undefined;
}

function extractBulletChanges(content: string): string[] | undefined {
  const changes: string[] = [];

  // Bullet points
  const bulletMatches = content.matchAll(/^[\s]*[-*]\s+(.+)$/gm);
  for (const match of bulletMatches) {
    const text = match[1].trim();
    if (text && !text.startsWith('`') && !text.includes('```')) {
      changes.push(text);
    }
  }

  // Numbered lists
  const numberedMatches = content.matchAll(/^[\s]*\d+\.\s+(.+)$/gm);
  for (const match of numberedMatches) {
    const text = match[1].trim();
    if (text && !text.startsWith('`') && !text.includes('```')) {
      changes.push(text);
    }
  }

  return changes.length > 0 ? changes.slice(0, MAX_CHANGES) : undefined;
}

/**
 * Sanitize Liquid code - remove XSS patterns and fix common AI errors
 */
export function sanitizeLiquidCode(code: string): string {
  let sanitized = code;

  // Remove script tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '<!-- script removed -->');

  // Remove javascript: hrefs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove inline event handlers
  sanitized = sanitized.replace(/\s(on\w+)\s*=\s*["'][^"']*["']/gi, '');

  // Remove new_comment forms (AI hallucination - requires article object)
  const newCommentFormRegex = /\{%[-\s]*form\s+['"]new_comment['"][^%]*%\}[\s\S]*?\{%[-\s]*endform[-\s]*%\}/gi;
  sanitized = sanitized.replace(newCommentFormRegex, '<!-- new_comment form removed: not supported -->');

  // Fix product forms missing product argument
  const hasProductPicker = /"type"\s*:\s*"product"/.test(sanitized);
  if (hasProductPicker) {
    sanitized = sanitized.replace(
      /(\{%[-\s]*form\s+['"]product['"])(\s*%\})/gi,
      '$1, section.settings.product$2'
    );
  }

  return sanitized;
}
