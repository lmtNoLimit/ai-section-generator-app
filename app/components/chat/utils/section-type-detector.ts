/**
 * Section Type Detector - Analyzes Liquid code to detect section type
 * Uses pattern matching with weighted scoring to identify section types
 * Falls back to 'generic' when no strong match found
 */

export type SectionType =
  | 'hero'
  | 'productGrid'
  | 'testimonials'
  | 'newsletter'
  | 'faq'
  | 'features'
  | 'gallery'
  | 'header'
  | 'footer'
  | 'generic';

interface DetectionRule {
  type: SectionType;
  patterns: RegExp[];
  weight: number;
}

/**
 * Detection rules for each section type
 * Each pattern match adds the weight to the type's score
 *
 * SECURITY: Patterns use length-limited character classes to prevent ReDoS
 * - Use {0,N} quantifiers instead of unbounded *
 * - Avoid nested quantifiers
 */
const DETECTION_RULES: DetectionRule[] = [
  {
    type: 'hero',
    patterns: [
      /class="[^"]{0,100}hero/i,
      /hero[\s\S]{0,20}section/i,
      /banner/i,
      /background-image[\s\S]{0,30}cover/i,
      /full[\s\S]{0,20}width[\s\S]{0,20}image/i,
      /section\.settings\.image/i,
    ],
    weight: 1,
  },
  {
    type: 'productGrid',
    patterns: [
      /product[\s\S]{0,20}grid/i,
      /for product in/i,
      /product\.title/i,
      /collection\.products/i,
      /product-card/i,
      /add[\s\S]{0,10}to[\s\S]{0,10}cart/i,
    ],
    weight: 1,
  },
  {
    type: 'testimonials',
    patterns: [
      /testimonial/i,
      /review/i,
      /quote/i,
      /customer[\s\S]{0,20}said/i,
      /rating/i,
      /blockquote/i,
    ],
    weight: 1,
  },
  {
    type: 'newsletter',
    patterns: [
      /newsletter/i,
      /subscribe/i,
      /email[\s\S]{0,20}input/i,
      /signup/i,
      /form[\s\S]{0,20}email/i,
      /mailing[\s\S]{0,10}list/i,
    ],
    weight: 1,
  },
  {
    type: 'faq',
    patterns: [
      /faq/i,
      /accordion/i,
      /question[\s\S]{0,20}answer/i,
      /collapsible/i,
      /expand/i,
      /frequently[\s\S]{0,20}asked/i,
    ],
    weight: 1,
  },
  {
    type: 'features',
    patterns: [
      /feature/i,
      /benefit/i,
      /icon[\s\S]{0,20}grid/i,
      /service/i,
      /highlight/i,
      /icon[\s\S]{0,20}box/i,
    ],
    weight: 1,
  },
  {
    type: 'gallery',
    patterns: [
      /gallery/i,
      /lightbox/i,
      /image[\s\S]{0,20}grid/i,
      /masonry/i,
      /photo[\s\S]{0,20}grid/i,
      /image[\s\S]{0,20}carousel/i,
    ],
    weight: 1,
  },
  {
    type: 'header',
    patterns: [
      /header/i,
      /navigation/i,
      /nav[\s\S]{0,20}menu/i,
      /site[\s\S]{0,20}logo/i,
      /main[\s\S]{0,20}nav/i,
      /menu[\s\S]{0,20}toggle/i,
    ],
    weight: 1,
  },
  {
    type: 'footer',
    patterns: [
      /footer/i,
      /copyright/i,
      /social[\s\S]{0,20}links/i,
      /site[\s\S]{0,20}info/i,
      /legal[\s\S]{0,20}links/i,
      /bottom[\s\S]{0,20}nav/i,
    ],
    weight: 1,
  },
];

/**
 * Detect section type from Liquid code
 * @param code - The Liquid section code to analyze
 * @returns The detected section type or 'generic' if no strong match
 */
export function detectSectionType(code: string): SectionType {
  if (!code || typeof code !== 'string') {
    return 'generic';
  }

  // Initialize scores for all types
  const scores: Record<SectionType, number> = {
    hero: 0,
    productGrid: 0,
    testimonials: 0,
    newsletter: 0,
    faq: 0,
    features: 0,
    gallery: 0,
    header: 0,
    footer: 0,
    generic: 0,
  };

  // Score each type based on pattern matches
  for (const rule of DETECTION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(code)) {
        scores[rule.type] += rule.weight;
      }
    }
  }

  // Find highest scoring type
  let maxType: SectionType = 'generic';
  let maxScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as SectionType;
    }
  }

  // Require minimum score of 2 to avoid false positives
  return maxScore >= 2 ? maxType : 'generic';
}
