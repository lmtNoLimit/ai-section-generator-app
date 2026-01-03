/**
 * CSS selector generation utilities for element targeting
 * Generates unique selectors prioritizing: id > data attributes > class + index > tag + index
 */

/**
 * Generate a unique CSS selector for an element
 * Used inside iframe to identify clicked elements
 */
export function generateUniqueSelector(element: Element): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: Data attributes (common in Liquid sections)
  const dataAttrs = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .slice(0, 2);
  if (dataAttrs.length > 0) {
    const selector = dataAttrs
      .map(attr => `[${attr.name}="${CSS.escape(attr.value)}"]`)
      .join('');
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Priority 3: Class with nth-of-type
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2);
    if (classes.length > 0 && classes[0]) {
      const classSelector = '.' + classes.map(c => CSS.escape(c)).join('.');
      const matches = document.querySelectorAll(classSelector);
      if (matches.length === 1) {
        return classSelector;
      }
      const index = Array.from(matches).indexOf(element);
      if (index >= 0) {
        return `${classSelector}:nth-of-type(${index + 1})`;
      }
    }
  }

  // Priority 4: Tag with parent path
  const parent = element.parentElement;
  if (parent && parent !== document.body) {
    const siblings = Array.from(parent.children).filter(
      child => child.tagName === element.tagName
    );
    const index = siblings.indexOf(element);
    const parentSelector = generateUniqueSelector(parent);
    return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
  }

  // Fallback: just tag name
  return element.tagName.toLowerCase();
}

/**
 * Get ancestor path for breadcrumb display (e.g., "section > div.hero > h1")
 */
export function getAncestorPath(element: Element, maxDepth = 4): string[] {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && path.length < maxDepth && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const className = typeof current.className === 'string'
      ? current.className.split(' ')[0]
      : '';
    path.unshift(className ? `${tag}.${className}` : tag);
    current = current.parentElement;
  }

  return path;
}

/**
 * Truncate text content for preview display
 */
export function truncateText(text: string, maxLength = 100): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim() + '...';
}
