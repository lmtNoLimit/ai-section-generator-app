/**
 * Suggestion Engine - Generates context-aware suggestions based on section type
 *
 * 3-Tier System:
 * - Tier 1: Immediate actions (Copy, Apply) - always visible
 * - Tier 2: Section-specific refinements - based on detected type
 * - Tier 3: Conversation next-steps - after 2+ exchanges
 */

import { detectSectionType, type SectionType } from './section-type-detector';

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  tier: 1 | 2 | 3;
}

// Tier 1: Always visible immediate actions
const TIER1_SUGGESTIONS: Suggestion[] = [
  { id: 'copy', label: 'Copy code', prompt: '', icon: 'clipboard', tier: 1 },
  { id: 'apply', label: 'Apply to draft', prompt: '', icon: 'check', tier: 1 },
];

// Tier 2: Section-specific refinement suggestions
const SECTION_SUGGESTIONS: Record<SectionType, Suggestion[]> = {
  hero: [
    { id: 'add-cta', label: 'Add CTA', prompt: 'Add a prominent call-to-action button with customizable text, link, and color', tier: 2 },
    { id: 'add-overlay', label: 'Dark overlay', prompt: 'Add a semi-transparent dark overlay to the background for better text contrast', tier: 2 },
    { id: 'parallax', label: 'Parallax effect', prompt: 'Add a subtle parallax scrolling effect to the background image', tier: 2 },
    { id: 'video-bg', label: 'Video background', prompt: 'Replace image background with video background option', tier: 2 },
  ],
  productGrid: [
    { id: 'add-filters', label: 'Add filters', prompt: 'Add product filtering by tags, price range, and availability', tier: 2 },
    { id: 'sort-options', label: 'Sort options', prompt: 'Add sort by price, name, date, and bestselling', tier: 2 },
    { id: 'quick-add', label: 'Quick add', prompt: 'Add quick add-to-cart button that appears on hover', tier: 2 },
    { id: 'wishlist', label: 'Wishlist', prompt: 'Add wishlist/favorite button on each product', tier: 2 },
  ],
  testimonials: [
    { id: 'ratings', label: 'Star ratings', prompt: 'Add 5-star rating display to each testimonial', tier: 2 },
    { id: 'photos', label: 'Customer photos', prompt: 'Add customer photo avatars to testimonials', tier: 2 },
    { id: 'carousel', label: 'Carousel', prompt: 'Convert to horizontal carousel with navigation arrows', tier: 2 },
    { id: 'verified', label: 'Verified badge', prompt: 'Add verified purchase badge indicator', tier: 2 },
  ],
  newsletter: [
    { id: 'gdpr', label: 'GDPR checkbox', prompt: 'Add GDPR consent checkbox with customizable text', tier: 2 },
    { id: 'incentive', label: 'Discount offer', prompt: 'Add discount code incentive display (e.g., "Get 10% off")', tier: 2 },
    { id: 'segments', label: 'Interest options', prompt: 'Add interest selection checkboxes for email segmentation', tier: 2 },
    { id: 'double-optin', label: 'Double opt-in', prompt: 'Add double opt-in confirmation flow setup', tier: 2 },
  ],
  faq: [
    { id: 'categories', label: 'Categories', prompt: 'Add category tabs to group FAQs by topic', tier: 2 },
    { id: 'search', label: 'Search', prompt: 'Add search bar to filter FAQ questions', tier: 2 },
    { id: 'schema', label: 'FAQ schema', prompt: 'Add structured data markup for SEO FAQ rich snippets', tier: 2 },
    { id: 'icons', label: 'Add icons', prompt: 'Add expand/collapse icons with animation', tier: 2 },
  ],
  features: [
    { id: 'icons', label: 'Add icons', prompt: 'Add icon picker setting for each feature', tier: 2 },
    { id: 'animations', label: 'Animations', prompt: 'Add fade-in animations when features scroll into view', tier: 2 },
    { id: 'links', label: 'Feature links', prompt: 'Add optional links to each feature for more details', tier: 2 },
    { id: 'alt-layout', label: 'Alt layout', prompt: 'Add alternating left/right layout option', tier: 2 },
  ],
  gallery: [
    { id: 'lightbox', label: 'Lightbox', prompt: 'Add lightbox modal for fullscreen image viewing', tier: 2 },
    { id: 'captions', label: 'Captions', prompt: 'Add caption text overlay on each image', tier: 2 },
    { id: 'masonry', label: 'Masonry layout', prompt: 'Convert to masonry grid layout for varied image sizes', tier: 2 },
    { id: 'lazy-load', label: 'Lazy load', prompt: 'Add lazy loading for better performance', tier: 2 },
  ],
  header: [
    { id: 'sticky', label: 'Sticky header', prompt: 'Make header sticky on scroll with transparent-to-solid transition', tier: 2 },
    { id: 'mega-menu', label: 'Mega menu', prompt: 'Add mega menu dropdown with images and columns', tier: 2 },
    { id: 'search', label: 'Search bar', prompt: 'Add expandable search bar with product suggestions', tier: 2 },
    { id: 'mobile-menu', label: 'Mobile menu', prompt: 'Add hamburger menu with slide-out drawer for mobile', tier: 2 },
  ],
  footer: [
    { id: 'social', label: 'Social links', prompt: 'Add social media icon links section', tier: 2 },
    { id: 'newsletter', label: 'Newsletter', prompt: 'Add inline newsletter signup form', tier: 2 },
    { id: 'columns', label: 'More columns', prompt: 'Add additional customizable link columns', tier: 2 },
    { id: 'payment-icons', label: 'Payment icons', prompt: 'Add accepted payment method icons', tier: 2 },
  ],
  generic: [
    { id: 'mobile', label: 'Mobile optimize', prompt: 'Improve mobile responsiveness with better touch targets and stacking', tier: 2 },
    { id: 'animate', label: 'Add animations', prompt: 'Add subtle entrance animations when section comes into view', tier: 2 },
    { id: 'spacing', label: 'Adjust spacing', prompt: 'Add customizable padding/margin settings for the section', tier: 2 },
    { id: 'colors', label: 'More colors', prompt: 'Add more color customization options for text, background, and accents', tier: 2 },
  ],
};

// Tier 3: Conversation next-steps (shown after 2+ exchanges)
const TIER3_SUGGESTIONS: Suggestion[] = [
  { id: 'new-section', label: 'Create another section', prompt: 'I want to create a new section for...', tier: 3 },
  { id: 'preview-theme', label: 'Preview in theme', prompt: '', tier: 3 },
  { id: 'publish', label: 'Publish to theme', prompt: '', tier: 3 },
];

export interface GetSuggestionsOptions {
  /** The generated code to analyze for section type */
  code: string;
  /** Total message count in conversation */
  messageCount: number;
  /** Whether this is the latest/newest message */
  isLatestMessage: boolean;
  /** Whether streaming is currently active */
  isStreaming?: boolean;
}

/**
 * Get context-aware suggestions based on code and conversation state
 */
export function getSuggestions({
  code,
  messageCount,
  isLatestMessage,
  isStreaming = false,
}: GetSuggestionsOptions): Suggestion[] {
  // Don't show chips while streaming or on old messages
  if (isStreaming || !isLatestMessage) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  // Tier 1: Always show immediate actions if there's code
  if (code) {
    suggestions.push(...TIER1_SUGGESTIONS);
  }

  // Tier 2: Section-specific suggestions if code exists
  if (code) {
    const sectionType = detectSectionType(code);
    const typeSpecific = SECTION_SUGGESTIONS[sectionType] || SECTION_SUGGESTIONS.generic;
    // Limit to first 4 chips to avoid clutter
    suggestions.push(...typeSpecific.slice(0, 4));
  }

  // Tier 3: Conversation next-steps after 4+ messages (2 user + 2 AI)
  if (messageCount >= 4) {
    suggestions.push(...TIER3_SUGGESTIONS);
  }

  return suggestions;
}

/**
 * Get detected section type from code (for display purposes)
 */
export function getDetectedSectionType(code: string): SectionType {
  return detectSectionType(code);
}
