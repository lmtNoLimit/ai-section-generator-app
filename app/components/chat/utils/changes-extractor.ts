/**
 * Changes Extractor Utility
 * Extracts change summaries from AI response text for display in AIResponseCard
 *
 * Patterns detected:
 * - Bullet points (•, -, *, numbered lists)
 * - "I've added/changed/updated/removed" phrases
 * - "Added/Changed/Updated/Removed" at start of line
 */

// Keywords that indicate a change description
const CHANGE_KEYWORDS = [
  'added', 'changed', 'updated', 'removed', 'created', 'modified',
  'set', 'applied', 'implemented', 'adjusted', 'fixed', 'improved',
];

/**
 * Extract change bullets from AI response text
 * Returns array of change descriptions for display
 * Max input length: 50KB (defense against DoS)
 */
export function extractChanges(content: string): string[] {
  const changes: string[] = [];
  const seenChanges = new Set<string>();

  // Guard: Limit input size to prevent DoS via large payloads
  const MAX_INPUT_LENGTH = 50000;
  const safeContent = content.length > MAX_INPUT_LENGTH
    ? content.slice(0, MAX_INPUT_LENGTH)
    : content;

  // Remove code blocks to avoid extracting code as changes
  const textOnly = safeContent.replace(/```[\s\S]*?```/g, '');

  // Split into lines and analyze
  const lines = textOnly.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for bullet points (•, -, *)
    const bulletMatch = trimmed.match(/^[•\-*]\s+(.+)$/);
    if (bulletMatch) {
      const change = bulletMatch[1].trim();
      if (change && !seenChanges.has(change.toLowerCase())) {
        seenChanges.add(change.toLowerCase());
        changes.push(change);
      }
      continue;
    }

    // Check for numbered list items
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      const change = numberedMatch[1].trim();
      if (change && !seenChanges.has(change.toLowerCase())) {
        seenChanges.add(change.toLowerCase());
        changes.push(change);
      }
      continue;
    }

    // Check for action verb patterns
    const actionMatch = trimmed.match(/^(?:I've\s+)?(?:Added|Changed|Updated|Removed|Created|Modified|Set|Applied|Implemented)\s+(.+)$/i);
    if (actionMatch) {
      // Use full line as the change (preserving the action verb)
      const change = trimmed.replace(/^I've\s+/i, '');
      if (change && !seenChanges.has(change.toLowerCase())) {
        seenChanges.add(change.toLowerCase());
        changes.push(capitalizeFirst(change));
      }
    }
  }

  // Limit to 5 most important changes
  return changes.slice(0, 5);
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check if content likely contains change descriptions
 */
export function hasChanges(content: string): boolean {
  const textOnly = content.replace(/```[\s\S]*?```/g, '').toLowerCase();
  return CHANGE_KEYWORDS.some(keyword => textOnly.includes(keyword));
}
