/**
 * Template and example data for the Generate screen
 * Static data - no API calls needed
 */

export interface SectionTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'marketing' | 'product' | 'content' | 'layout';
  prompt: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'hero',
    title: 'Hero Section',
    description: 'Full-width banner with headline and CTA',
    icon: '🎯',
    category: 'marketing',
    prompt: 'A hero section with a full-width background image, centered headline, subtext, and a primary call-to-action button. Include settings for image upload, text alignment, and button customization.'
  },
  {
    id: 'product-grid',
    title: 'Product Grid',
    description: 'Responsive grid of featured products',
    icon: '🛍️',
    category: 'product',
    prompt: 'A responsive product grid section displaying featured products in a 3-column layout. Include product image, title, price, and "Add to Cart" button. Make it responsive (2 columns on tablet, 1 on mobile).'
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description: 'Customer reviews with ratings',
    icon: '⭐',
    category: 'marketing',
    prompt: 'A testimonials section with customer quotes, star ratings, and customer names. Display 3 testimonials in a row with avatar images. Include schema settings for each testimonial.'
  },
  {
    id: 'faq',
    title: 'FAQ Accordion',
    description: 'Expandable questions and answers',
    icon: '❓',
    category: 'content',
    prompt: 'An FAQ section with collapsible accordion items. Each item has a question (clickable header) and answer (expandable content). Include settings to add/remove FAQ items with custom text.'
  },
  {
    id: 'cta-banner',
    title: 'CTA Banner',
    description: 'Call-to-action with background',
    icon: '📣',
    category: 'marketing',
    prompt: 'A call-to-action banner section with background color, headline, description text, and a prominent button. Include settings for text content, colors, and button link.'
  },
  {
    id: 'feature-columns',
    title: 'Feature Columns',
    description: '3-column features with icons',
    icon: '✨',
    category: 'content',
    prompt: 'A features section with 3 columns, each containing an icon, heading, and description. Include schema settings to customize icon, text, and link for each column.'
  },
  {
    id: 'image-gallery',
    title: 'Image Gallery',
    description: 'Responsive image grid',
    icon: '🖼️',
    category: 'layout',
    prompt: 'An image gallery section displaying images in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile). Include lightbox functionality on click. Schema settings for adding/removing images.'
  },
  {
    id: 'newsletter',
    title: 'Newsletter Signup',
    description: 'Email subscription form',
    icon: '📧',
    category: 'marketing',
    prompt: 'A newsletter signup section with heading, description, email input field, and subscribe button. Include settings for form action URL, success message, and styling options.'
  }
];

export interface PromptExample {
  id: string;
  label: string;
  prompt: string;
}

export const PROMPT_EXAMPLES: PromptExample[] = [
  {
    id: 'before-after',
    label: 'Before/After Slider',
    prompt: 'A before-and-after image slider section with draggable divider to compare two images side-by-side'
  },
  {
    id: 'countdown',
    label: 'Countdown Timer',
    prompt: 'A countdown timer section for limited-time offers, displaying days, hours, minutes, and seconds until a target date'
  },
  {
    id: 'logo-list',
    label: 'Logo List',
    prompt: 'A section displaying partner or client logos in a horizontal scrolling row with hover effects'
  },
  {
    id: 'video-embed',
    label: 'Video Hero',
    prompt: 'A hero section with background video (YouTube or Vimeo embed), overlay text, and CTA button with semi-transparent backdrop'
  }
];
