/**
 * Prompt Templates for Quick Section Generation
 * Pre-defined prompts for common Shopify section types
 */

export interface PromptTemplate {
  name: string;
  prompt: string;
  icon: string;
  category: 'marketing' | 'content' | 'commerce' | 'navigation';
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  hero: {
    name: 'Hero Banner',
    prompt: 'Create a hero section with a large heading, subheading, background image, and CTA button',
    icon: 'banner',
    category: 'marketing',
  },
  testimonials: {
    name: 'Testimonials',
    prompt: 'Create a testimonials section with 3 customer quotes, names, and star ratings',
    icon: 'star',
    category: 'content',
  },
  productGrid: {
    name: 'Product Grid',
    prompt: 'Create a product grid section that displays products in a 3-column responsive layout',
    icon: 'products',
    category: 'commerce',
  },
  newsletter: {
    name: 'Newsletter',
    prompt: 'Create a newsletter signup section with email input and subscribe button',
    icon: 'email',
    category: 'marketing',
  },
  faq: {
    name: 'FAQ',
    prompt: 'Create an FAQ section with expandable/collapsible question and answer pairs',
    icon: 'question-circle',
    category: 'content',
  },
  features: {
    name: 'Features',
    prompt: 'Create a features section with 3-4 feature blocks, each with icon, title, and description',
    icon: 'view',
    category: 'content',
  },
  imageGallery: {
    name: 'Image Gallery',
    prompt: 'Create an image gallery section with a grid of images and lightbox functionality',
    icon: 'image',
    category: 'content',
  },
  contactForm: {
    name: 'Contact Form',
    prompt: 'Create a contact form section with name, email, message fields and submit button',
    icon: 'compose',
    category: 'content',
  },
};

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES).filter(t => t.category === category);
}

/**
 * Get all template entries for iteration
 */
export function getTemplateEntries(): [string, PromptTemplate][] {
  return Object.entries(PROMPT_TEMPLATES);
}
