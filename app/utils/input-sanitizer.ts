/**
 * Input sanitization utilities for AI chat
 * Protects against prompt injection and XSS attacks
 */

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /forget\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /override\s+system\s+prompt/i,
  /new\s+instructions?:/i,
  /you\s+are\s+now/i,
  /act\s+as\s+if/i,
  /pretend\s+(that\s+)?you/i,
  /roleplay\s+as/i,
  /system:\s*/i,
  /\[system\]/i,
  /\[assistant\]/i,
];

// XSS patterns for Liquid code validation
const XSS_PATTERNS = [
  /<script[\s\S]*?>/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /eval\s*\(/i,
  /Function\s*\(/i,
  /document\.(cookie|location|write)/i,
  /window\.(location|open)/i,
  /innerHTML\s*=/i,
  /outerHTML\s*=/i,
];

/**
 * Sanitize user input to prevent prompt injection
 * Returns cleaned input or null if severe injection detected
 */
export function sanitizeUserInput(input: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push('Potential prompt injection pattern detected and neutralized');
      // Replace with harmless text
      sanitized = sanitized.replace(pattern, '[filtered]');
    }
  }

  // Strip any control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit consecutive newlines
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  return { sanitized, warnings };
}

/**
 * Validate Liquid code for XSS vulnerabilities
 * Returns validation result with issues found
 */
export function validateLiquidCode(code: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(code)) {
      const match = code.match(pattern);
      issues.push(`Potential XSS: ${match?.[0] || 'script pattern'} detected`);
    }
  }

  // Check for base64 encoded scripts
  if (/data:text\/html/i.test(code) || /data:application\/javascript/i.test(code)) {
    issues.push('Potential XSS: data URI with script detected');
  }

  return { isValid: issues.length === 0, issues };
}

/**
 * Sanitize extracted Liquid code by removing dangerous patterns
 * Also fixes common AI hallucination errors with Liquid forms
 */
export function sanitizeLiquidCode(code: string): string {
  let sanitized = code;

  // === XSS SANITIZATION ===
  // Remove script tags entirely
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '<!-- script removed -->');

  // Remove javascript: hrefs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove inline event handlers (but preserve Liquid syntax)
  // Only match HTML attribute patterns, not Liquid
  sanitized = sanitized.replace(/\s(on\w+)\s*=\s*["'][^"']*["']/gi, '');

  // === LIQUID FORM SANITIZATION ===
  // Fix AI hallucinations with incorrect Liquid form syntax

  // ALWAYS remove new_comment forms - we never generate article sections
  // This form type requires an article object and causes errors in product/collection sections
  const newCommentFormRegex = /\{%[-\s]*form\s+['"]new_comment['"][^%]*%\}[\s\S]*?\{%[-\s]*endform[-\s]*%\}/gi;
  sanitized = sanitized.replace(newCommentFormRegex, '<!-- new_comment form removed: not supported -->');

  // Check if section has product picker
  const hasProductPicker = /"type"\s*:\s*"product"/.test(sanitized);

  // Fix product forms missing product argument
  // {% form 'product' %} -> {% form 'product', section.settings.product %}
  if (hasProductPicker) {
    // Match {% form 'product' %} WITHOUT a second argument (no comma after 'product')
    sanitized = sanitized.replace(
      /(\{%[-\s]*form\s+['"]product['"])(\s*%\})/gi,
      '$1, section.settings.product$2'
    );
  }

  return sanitized;
}
