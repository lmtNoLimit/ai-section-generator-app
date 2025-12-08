/**
 * Default Section Templates
 *
 * Pre-built templates organized by category for the AI Section Generator.
 * Templates can include:
 * - prompt: AI prompt for generating variations (required)
 * - code: Pre-built Liquid code for instant use (optional)
 */

export interface DefaultTemplate {
  title: string;
  description: string;
  category: string;
  icon: string;
  prompt: string;
  code?: string; // Pre-built Liquid code for "Use As-Is" functionality
}


export const TEMPLATE_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "hero", label: "Hero" },
  { value: "features", label: "Features" },
  { value: "testimonials", label: "Testimonials" },
  { value: "pricing", label: "Pricing" },
  { value: "cta", label: "Call to Action" },
  { value: "faq", label: "FAQ" },
  { value: "team", label: "Team" },
  { value: "gallery", label: "Gallery" },
  { value: "content", label: "Content" },
  { value: "footer", label: "Footer" },
] as const;

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  // ============================================
  // HERO SECTIONS (12 templates)
  // ============================================
  {
    title: "Hero with Background Image",
    description: "Full-width hero with background image, headline, and CTA button",
    category: "hero",
    icon: "🖼️",
    prompt: "Create a hero section with a full-width background image, centered headline text with a subheading, and a prominent call-to-action button. Include overlay for text readability.",
    code: `{% comment %}
  Hero with Background Image
  A full-width hero section with background image, overlay, headline, and CTA
{% endcomment %}

{% schema %}
{
  "name": "Hero with Background",
  "settings": [
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome to Our Store"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Subheading",
      "default": "Discover amazing products crafted with care"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Shop Now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    },
    {
      "type": "range",
      "id": "overlay_opacity",
      "label": "Overlay Opacity",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 40
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#ffffff"
    }
  ],
  "presets": [
    {
      "name": "Hero with Background"
    }
  ]
}
{% endschema %}

<style>
  .hero-bg-section {
    position: relative;
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
  }

  .hero-bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, calc({{ section.settings.overlay_opacity }} / 100));
  }

  .hero-bg-content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 2rem;
    max-width: 800px;
    color: {{ section.settings.text_color }};
  }

  .hero-bg-heading {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .hero-bg-subheading {
    font-size: clamp(1rem, 2vw, 1.5rem);
    margin-bottom: 2rem;
    opacity: 0.9;
  }

  .hero-bg-button {
    display: inline-block;
    padding: 1rem 2.5rem;
    background: {{ section.settings.text_color }};
    color: #000;
    text-decoration: none;
    font-weight: 600;
    border-radius: 4px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .hero-bg-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
</style>

<section
  class="hero-bg-section"
  style="background-image: url('{{ section.settings.background_image | image_url: width: 1920 }}');"
>
  <div class="hero-bg-overlay"></div>
  <div class="hero-bg-content">
    <h1 class="hero-bg-heading">{{ section.settings.heading }}</h1>
    <p class="hero-bg-subheading">{{ section.settings.subheading }}</p>
    {% if section.settings.button_text != blank %}
      <a href="{{ section.settings.button_link }}" class="hero-bg-button">
        {{ section.settings.button_text }}
      </a>
    {% endif %}
  </div>
</section>`,
  },
  {
    title: "Hero with Video Background",
    description: "Eye-catching hero with looping video background",
    category: "hero",
    icon: "🎬",
    prompt: "Create a hero section with a looping video background. Include a dark overlay, large headline, brief description, and a CTA button. Video should be muted and autoplay.",
  },

  {
    title: "Split Hero",
    description: "Two-column hero with text on one side and image on the other",
    category: "hero",
    icon: "⬛",
    prompt: "Create a split hero section with two equal columns. Left side has headline, description text, and CTA button. Right side displays a large product or feature image.",
    code: `{% comment %}
  Split Hero
  Two-column hero with text on left and image on right
{% endcomment %}

{% schema %}
{
  "name": "Split Hero",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Elevate Your Style"
    },
    {
      "type": "textarea",
      "id": "description",
      "label": "Description",
      "default": "Discover our collection of premium products designed for the modern lifestyle."
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Explore Collection"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Hero Image"
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#f8f9fa"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#1a1a1a"
    },
    {
      "type": "color",
      "id": "button_color",
      "label": "Button Color",
      "default": "#1a1a1a"
    }
  ],
  "presets": [
    {
      "name": "Split Hero"
    }
  ]
}
{% endschema %}

<style>
  .split-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 80vh;
    background: {{ section.settings.bg_color }};
  }

  @media (max-width: 768px) {
    .split-hero {
      grid-template-columns: 1fr;
    }
  }

  .split-hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem;
    color: {{ section.settings.text_color }};
  }

  .split-hero__heading {
    font-size: clamp(2rem, 4vw, 3.5rem);
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }

  .split-hero__description {
    font-size: 1.125rem;
    line-height: 1.7;
    margin-bottom: 2rem;
    opacity: 0.8;
  }

  .split-hero__button {
    display: inline-block;
    padding: 1rem 2rem;
    background: {{ section.settings.button_color }};
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    border-radius: 4px;
    transition: opacity 0.2s;
    width: fit-content;
  }

  .split-hero__button:hover {
    opacity: 0.9;
  }

  .split-hero__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

<section class="split-hero">
  <div class="split-hero__content">
    <h1 class="split-hero__heading">{{ section.settings.heading }}</h1>
    <p class="split-hero__description">{{ section.settings.description }}</p>
    {% if section.settings.button_text != blank %}
      <a href="{{ section.settings.button_link }}" class="split-hero__button">
        {{ section.settings.button_text }}
      </a>
    {% endif %}
  </div>
  <div class="split-hero__media">
    {% if section.settings.image %}
      <img
        src="{{ section.settings.image | image_url: width: 1200 }}"
        alt="{{ section.settings.heading }}"
        class="split-hero__image"
        loading="lazy"
      >
    {% else %}
      {{ 'lifestyle-1' | placeholder_svg_tag: 'split-hero__image' }}
    {% endif %}
  </div>
</section>`,
  },
  {
    title: "Minimal Hero",
    description: "Clean, text-focused hero with subtle styling",
    category: "hero",
    icon: "✨",
    prompt: "Create a minimal hero section with clean typography. Large headline centered, brief tagline below, and a simple text link or button. White background with ample whitespace.",
  },
  {
    title: "Hero with Product Showcase",
    description: "Hero featuring a product image with details and buy button",
    category: "hero",
    icon: "🛍️",
    prompt: "Create a hero section showcasing a featured product. Include product image, product title, short description, price, and Add to Cart button. Modern e-commerce style.",
  },
  {
    title: "Animated Hero",
    description: "Hero with subtle CSS animations and transitions",
    category: "hero",
    icon: "🎭",
    prompt: "Create a hero section with subtle CSS animations. Fade-in text, floating elements, and smooth hover effects on buttons. Modern and engaging without being distracting.",
  },
  {
    title: "Hero with Countdown",
    description: "Urgency-driven hero with countdown timer",
    category: "hero",
    icon: "⏰",
    prompt: "Create a hero section with a countdown timer for sales or launches. Include headline, countdown display (days, hours, minutes, seconds), and CTA button.",
  },
  {
    title: "Hero with Search",
    description: "Hero section with prominent search functionality",
    category: "hero",
    icon: "🔍",
    prompt: "Create a hero section with a large search bar as the main focus. Include a compelling headline above and category links or popular searches below.",
  },
  {
    title: "Gradient Hero",
    description: "Modern hero with vibrant gradient background",
    category: "hero",
    icon: "🌈",
    prompt: "Create a hero section with a vibrant gradient background. Use modern color combinations, white text, and a contrasting CTA button. Clean and contemporary feel.",
  },
  {
    title: "Hero with Form",
    description: "Hero section with embedded signup or contact form",
    category: "hero",
    icon: "📝",
    prompt: "Create a hero section with an inline email signup form. Include headline, brief value proposition, email input field, and submit button. Clean two-column layout.",
  },
  {
    title: "Parallax Hero",
    description: "Hero with parallax scrolling effect",
    category: "hero",
    icon: "📜",
    prompt: "Create a hero section with parallax scrolling effect on the background image. Centered headline and CTA that stay fixed while background moves at different speed.",
  },
  {
    title: "Hero Carousel",
    description: "Rotating hero with multiple slides",
    category: "hero",
    icon: "🔄",
    prompt: "Create a hero carousel with multiple slides. Each slide has background image, headline, description, and CTA. Include navigation arrows and dot indicators.",
  },

  // ============================================
  // FEATURES SECTIONS (12 templates)
  // ============================================
  {
    title: "Feature Grid",
    description: "3-column grid showcasing key features with icons",
    category: "features",
    icon: "🔲",
    prompt: "Create a features section with a 3-column grid. Each feature has an icon, title, and description. Include a section headline. Clean, professional layout.",
    code: `{% comment %}
  Feature Grid
  3-column grid showcasing key features with icons
{% endcomment %}

{% schema %}
{
  "name": "Feature Grid",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Section Heading",
      "default": "Why Choose Us"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Section Subheading",
      "default": "Everything you need to succeed"
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#1a1a1a"
    }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "settings": [
        {
          "type": "text",
          "id": "icon",
          "label": "Icon (emoji)",
          "default": "✨"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Title",
          "default": "Feature Title"
        },
        {
          "type": "textarea",
          "id": "description",
          "label": "Description",
          "default": "Brief description of this amazing feature."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Feature Grid",
      "blocks": [
        {
          "type": "feature",
          "settings": {
            "icon": "🚀",
            "title": "Fast Performance",
            "description": "Lightning-fast loading speeds for the best user experience."
          }
        },
        {
          "type": "feature",
          "settings": {
            "icon": "🛡️",
            "title": "Secure & Reliable",
            "description": "Enterprise-grade security to keep your data safe."
          }
        },
        {
          "type": "feature",
          "settings": {
            "icon": "💎",
            "title": "Premium Quality",
            "description": "Crafted with attention to every detail."
          }
        }
      ]
    }
  ]
}
{% endschema %}

<style>
  .feature-grid {
    padding: 5rem 2rem;
    background: {{ section.settings.bg_color }};
    color: {{ section.settings.text_color }};
  }

  .feature-grid__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-grid__header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .feature-grid__heading {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .feature-grid__subheading {
    font-size: 1.125rem;
    opacity: 0.7;
    max-width: 600px;
    margin: 0 auto;
  }

  .feature-grid__items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2.5rem;
  }

  .feature-grid__item {
    text-align: center;
    padding: 2rem;
  }

  .feature-grid__icon {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }

  .feature-grid__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .feature-grid__description {
    font-size: 1rem;
    line-height: 1.6;
    opacity: 0.8;
  }
</style>

<section class="feature-grid">
  <div class="feature-grid__container">
    <div class="feature-grid__header">
      <h2 class="feature-grid__heading">{{ section.settings.heading }}</h2>
      {% if section.settings.subheading != blank %}
        <p class="feature-grid__subheading">{{ section.settings.subheading }}</p>
      {% endif %}
    </div>

    <div class="feature-grid__items">
      {% for block in section.blocks %}
        <div class="feature-grid__item" {{ block.shopify_attributes }}>
          <div class="feature-grid__icon">{{ block.settings.icon }}</div>
          <h3 class="feature-grid__title">{{ block.settings.title }}</h3>
          <p class="feature-grid__description">{{ block.settings.description }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</section>`,
  },
  {
    title: "Feature Cards",
    description: "Features displayed in elegant card format",
    category: "features",
    icon: "🃏",
    prompt: "Create a features section with card-style layout. Each card has subtle shadow, icon, title, and description. Cards should have hover effects. 3 or 4 column layout.",
  },
  {
    title: "Icon Features List",
    description: "Vertical list of features with icons",
    category: "features",
    icon: "📋",
    prompt: "Create a features section as a vertical list. Each feature has an icon on the left, title, and description on the right. Alternating or stacked layout.",
  },
  {
    title: "Features with Image",
    description: "Features list alongside a large image",
    category: "features",
    icon: "🖼️",
    prompt: "Create a features section with a two-column layout. One column has a large image, the other has a stacked list of features with icons and descriptions.",
  },
  {
    title: "Comparison Table",
    description: "Feature comparison across different options",
    category: "features",
    icon: "📊",
    prompt: "Create a feature comparison table section. Compare 3 products or plans across multiple features. Use checkmarks and X marks. Highlight recommended option.",
  },
  {
    title: "Numbered Features",
    description: "Features with step numbers or sequence",
    category: "features",
    icon: "🔢",
    prompt: "Create a features section with numbered items. Each feature has a large number, title, and description. Use as a process or how-it-works section.",
  },
  {
    title: "Features Tabs",
    description: "Tabbed interface showing different feature sets",
    category: "features",
    icon: "📑",
    prompt: "Create a features section with tab navigation. Each tab reveals different feature content with image and details. Interactive and space-efficient.",
  },
  {
    title: "Animated Features",
    description: "Features that animate in on scroll",
    category: "features",
    icon: "✨",
    prompt: "Create a features section where items animate in as user scrolls. Staggered fade-in effect for each feature card. Modern and engaging.",
  },
  {
    title: "Features with Stats",
    description: "Features combined with impressive statistics",
    category: "features",
    icon: "📈",
    prompt: "Create a features section that combines feature descriptions with key statistics. Large numbers for stats with feature explanations. Trust-building layout.",
  },
  {
    title: "Bento Grid Features",
    description: "Modern bento box style feature layout",
    category: "features",
    icon: "🍱",
    prompt: "Create a features section using bento grid layout. Mix of different sized cards creating visual interest. Some cards larger than others with images and text.",
  },
  {
    title: "Features Timeline",
    description: "Features presented as timeline or roadmap",
    category: "features",
    icon: "📅",
    prompt: "Create a features section as a vertical timeline. Each feature is a milestone with icon, title, and description. Connected by a vertical line.",
  },
  {
    title: "Hover Features",
    description: "Interactive features with hover reveal",
    category: "features",
    icon: "👆",
    prompt: "Create a features grid where additional content reveals on hover. Base state shows icon and title, hover reveals full description. Engaging interaction.",
  },

  // ============================================
  // TESTIMONIALS SECTIONS (12 templates)
  // ============================================
  {
    title: "Testimonial Cards",
    description: "Customer testimonials in card format",
    category: "testimonials",
    icon: "💬",
    prompt: "Create a testimonials section with card layout. Each card has customer quote, photo, name, and title/company. 3-column grid with subtle shadows.",
  },
  {
    title: "Testimonial Slider",
    description: "Rotating carousel of testimonials",
    category: "testimonials",
    icon: "🔄",
    prompt: "Create a testimonial carousel that auto-rotates. Large quote text, customer photo, name and title. Navigation dots and arrows. Elegant center-stage design.",
  },
  {
    title: "Video Testimonials",
    description: "Testimonials with video thumbnails",
    category: "testimonials",
    icon: "🎥",
    prompt: "Create a video testimonials section. Grid of video thumbnails with play buttons, customer names below. Click to play functionality.",
  },
  {
    title: "Quote Block",
    description: "Large single testimonial quote",
    category: "testimonials",
    icon: "❝",
    prompt: "Create a large single-quote testimonial section. Oversized quotation marks, prominent quote text, customer photo and details. Impactful and focused.",
  },
  {
    title: "Reviews Grid",
    description: "Product reviews with star ratings",
    category: "testimonials",
    icon: "⭐",
    prompt: "Create a reviews section with star ratings. Each review has stars, review text, reviewer name, and date. Show average rating at top. E-commerce style.",
  },
  {
    title: "Logo Cloud with Quotes",
    description: "Company logos with testimonial quotes",
    category: "testimonials",
    icon: "🏢",
    prompt: "Create a section showing client logos with associated testimonial quotes. Logos at top, clicking or hovering reveals their quote. B2B focused.",
  },
  {
    title: "Testimonial Masonry",
    description: "Masonry-style testimonial layout",
    category: "testimonials",
    icon: "🧱",
    prompt: "Create a testimonial section with masonry layout. Different height cards based on quote length. Pinterest-style arrangement. Visual variety.",
  },
  {
    title: "Before & After Testimonials",
    description: "Transformation stories with results",
    category: "testimonials",
    icon: "🔀",
    prompt: "Create testimonials focused on transformations. Before/after stats or images, customer story, and results achieved. Great for fitness, coaching, services.",
  },
  {
    title: "Social Proof Bar",
    description: "Compact testimonial ticker or bar",
    category: "testimonials",
    icon: "📢",
    prompt: "Create a compact social proof bar with scrolling testimonials. Continuous horizontal scroll showing short quotes and names. Subtle but effective.",
  },
  {
    title: "Testimonial with Metrics",
    description: "Testimonials paired with success metrics",
    category: "testimonials",
    icon: "📊",
    prompt: "Create testimonials that highlight specific results. Quote plus key metric achieved (e.g., '200% increase'). Data-driven social proof.",
  },
  {
    title: "Featured Testimonial",
    description: "Full-width featured customer story",
    category: "testimonials",
    icon: "🌟",
    prompt: "Create a full-width featured testimonial section. Large customer photo on one side, detailed quote and story on the other. Premium feel.",
  },
  {
    title: "Testimonial Wall",
    description: "Dense wall of many testimonials",
    category: "testimonials",
    icon: "🧱",
    prompt: "Create a testimonial wall showing many short quotes in a dense grid. Small cards with quote snippets. Hover to expand. Shows volume of happy customers.",
  },

  // ============================================
  // PRICING SECTIONS (10 templates)
  // ============================================
  {
    title: "Pricing Cards",
    description: "Classic 3-tier pricing comparison",
    category: "pricing",
    icon: "💰",
    prompt: "Create a 3-tier pricing section with cards. Each card has plan name, price, feature list, and CTA button. Highlight the middle/recommended plan.",
  },
  {
    title: "Pricing Table",
    description: "Detailed feature comparison table",
    category: "pricing",
    icon: "📋",
    prompt: "Create a pricing comparison table. Plans as columns, features as rows. Checkmarks for included features. Clear and detailed comparison.",
  },
  {
    title: "Toggle Pricing",
    description: "Monthly/yearly toggle pricing display",
    category: "pricing",
    icon: "🔀",
    prompt: "Create pricing cards with monthly/yearly toggle. Toggle switch at top changes all prices. Show savings percentage for yearly. Interactive.",
  },
  {
    title: "Single Plan Pricing",
    description: "Focus on one main pricing option",
    category: "pricing",
    icon: "1️⃣",
    prompt: "Create a single-plan pricing section. One prominent card with price, all features listed, strong CTA. Great for simple pricing structures.",
  },
  {
    title: "Pricing with Calculator",
    description: "Interactive pricing calculator",
    category: "pricing",
    icon: "🧮",
    prompt: "Create a pricing section with usage calculator. Sliders or inputs for usage metrics, dynamic price display. Great for usage-based pricing.",
  },
  {
    title: "Freemium Pricing",
    description: "Free vs paid plan comparison",
    category: "pricing",
    icon: "🆓",
    prompt: "Create a pricing section comparing Free and Paid plans. Emphasize value of paid with feature comparison. Clear upgrade path.",
  },
  {
    title: "Enterprise Pricing",
    description: "Custom enterprise plan with contact form",
    category: "pricing",
    icon: "🏢",
    prompt: "Create a pricing section with standard plans plus Enterprise custom option. Enterprise shows 'Contact Us' instead of price. B2B focused.",
  },
  {
    title: "Per-Seat Pricing",
    description: "Team-based pricing with seat counter",
    category: "pricing",
    icon: "👥",
    prompt: "Create a pricing section with per-seat model. Number input for team size, price updates dynamically. Common for SaaS tools.",
  },
  {
    title: "Pricing FAQ",
    description: "Pricing cards with FAQ section",
    category: "pricing",
    icon: "❓",
    prompt: "Create a pricing section with cards at top and frequently asked questions about pricing below. Addresses common concerns.",
  },
  {
    title: "Limited Time Pricing",
    description: "Promotional pricing with discount",
    category: "pricing",
    icon: "⏰",
    prompt: "Create a pricing section showing limited-time discount. Strikethrough original prices, show savings. Optional countdown timer. Urgency-driven.",
  },

  // ============================================
  // CTA SECTIONS (12 templates)
  // ============================================
  {
    title: "Newsletter Signup",
    description: "Email subscription with compelling copy",
    category: "cta",
    icon: "📧",
    prompt: "Create a newsletter signup section. Compelling headline about value, email input, subscribe button. Clean and focused design.",
  },
  {
    title: "Contact CTA",
    description: "Encourage users to get in touch",
    category: "cta",
    icon: "📞",
    prompt: "Create a contact CTA section. Headline, brief text about getting in touch, and prominent contact button or phone number. Professional.",
  },
  {
    title: "Download CTA",
    description: "Promote app or resource download",
    category: "cta",
    icon: "📥",
    prompt: "Create a download CTA section. Promote app download with app store badges, or resource download with preview image and download button.",
  },
  {
    title: "Announcement Bar",
    description: "Top-of-page announcement banner",
    category: "cta",
    icon: "📣",
    prompt: "Create a slim announcement bar for top of page. Short text about sale, new product, or announcement with link. Dismissible. Eye-catching color.",
  },
  {
    title: "Full-Width CTA",
    description: "Bold full-width call to action",
    category: "cta",
    icon: "🔲",
    prompt: "Create a full-width CTA section with bold background color. Large headline, subtext, and prominent button. High-impact and attention-grabbing.",
  },
  {
    title: "Split CTA",
    description: "Two-column CTA with image",
    category: "cta",
    icon: "⬛",
    prompt: "Create a split CTA section. One side has compelling image, other has headline, text, and action button. Balanced layout.",
  },
  {
    title: "Floating CTA",
    description: "Sticky floating action button",
    category: "cta",
    icon: "🎈",
    prompt: "Create a floating CTA button that stays visible while scrolling. Bottom-right position, icon, text on hover. Non-intrusive but always accessible.",
  },
  {
    title: "Exit Intent CTA",
    description: "Popup-style CTA for engagement",
    category: "cta",
    icon: "🚪",
    prompt: "Create a CTA overlay/popup section. Compelling offer, email capture, and close button. Could be triggered on exit intent or scroll depth.",
  },
  {
    title: "Multi-Step CTA",
    description: "Progressive CTA with steps",
    category: "cta",
    icon: "🔢",
    prompt: "Create a multi-step CTA form. Step 1: email, Step 2: preferences, Step 3: confirm. Progress indicator. Increased commitment technique.",
  },
  {
    title: "Social CTA",
    description: "Encourage social media follows",
    category: "cta",
    icon: "📱",
    prompt: "Create a social media CTA section. Encourage follows with social platform icons, follower counts, and compelling reason to follow.",
  },
  {
    title: "Quiz CTA",
    description: "Interactive quiz or assessment CTA",
    category: "cta",
    icon: "❓",
    prompt: "Create a CTA for a quiz or assessment. Engaging headline like 'Find Your Perfect...' with start button. Curiosity-driven engagement.",
  },
  {
    title: "Trial CTA",
    description: "Free trial signup CTA",
    category: "cta",
    icon: "🎁",
    prompt: "Create a free trial CTA section. Highlight trial benefits, no credit card messaging, and clear start trial button. SaaS focused.",
  },

  // ============================================
  // FAQ SECTIONS (10 templates)
  // ============================================
  {
    title: "Accordion FAQ",
    description: "Expandable accordion-style questions",
    category: "faq",
    icon: "📂",
    prompt: "Create an FAQ section with accordion items. Click question to expand/collapse answer. Plus/minus icons. Clean and space-efficient.",
  },
  {
    title: "Two-Column FAQ",
    description: "Questions arranged in two columns",
    category: "faq",
    icon: "📋",
    prompt: "Create a two-column FAQ layout. Questions and answers visible without clicking. Good for fewer questions. Clean grid layout.",
  },
  {
    title: "Searchable FAQ",
    description: "FAQ with search functionality",
    category: "faq",
    icon: "🔍",
    prompt: "Create an FAQ section with search bar at top. Filter questions as user types. Helpful for large FAQ sets.",
  },
  {
    title: "Categorized FAQ",
    description: "FAQ organized by category tabs",
    category: "faq",
    icon: "📑",
    prompt: "Create an FAQ section with category tabs. Different question sets per category (Shipping, Returns, Products, etc.). Organized and easy to navigate.",
  },
  {
    title: "FAQ with Contact",
    description: "FAQ section with contact fallback",
    category: "faq",
    icon: "💬",
    prompt: "Create FAQ section with contact option at bottom. 'Still have questions? Contact us' with email or chat button. Complete solution.",
  },
  {
    title: "Visual FAQ",
    description: "FAQ with icons or illustrations",
    category: "faq",
    icon: "🎨",
    prompt: "Create an FAQ section where each question has an associated icon. Visual interest while remaining informative. Icon grid layout.",
  },
  {
    title: "Timeline FAQ",
    description: "FAQ presented as process timeline",
    category: "faq",
    icon: "📅",
    prompt: "Create FAQ as a timeline/journey. Questions follow a process order (ordering, shipping, delivery, returns). Visual flow.",
  },
  {
    title: "Single Topic FAQ",
    description: "Focused FAQ on one topic",
    category: "faq",
    icon: "🎯",
    prompt: "Create a focused FAQ section on one topic (e.g., Shipping FAQ only). Deep coverage of single area. Sidebar navigation optional.",
  },
  {
    title: "FAQ Cards",
    description: "Questions in card format",
    category: "faq",
    icon: "🃏",
    prompt: "Create FAQ as clickable cards. Each card shows question, click reveals answer modal or expands card. Modern interaction.",
  },
  {
    title: "Chatbot FAQ",
    description: "FAQ styled like chat interface",
    category: "faq",
    icon: "🤖",
    prompt: "Create FAQ styled as a chat conversation. Questions as user messages, answers as bot responses. Friendly and approachable.",
  },

  // ============================================
  // TEAM SECTIONS (10 templates)
  // ============================================
  {
    title: "Team Grid",
    description: "Team members in photo grid",
    category: "team",
    icon: "👥",
    prompt: "Create a team section with photo grid. Each member has photo, name, title. 3 or 4 column layout. Clean and professional.",
  },
  {
    title: "Team Cards",
    description: "Team members with detailed cards",
    category: "team",
    icon: "🃏",
    prompt: "Create team cards with photo, name, role, short bio, and social links. Hover effects on cards. Detailed but clean.",
  },
  {
    title: "Team Carousel",
    description: "Rotating team member display",
    category: "team",
    icon: "🔄",
    prompt: "Create a team carousel for large teams. Scroll through members horizontally. Each has photo, name, role. Navigation arrows.",
  },
  {
    title: "Executive Team",
    description: "Leadership team spotlight",
    category: "team",
    icon: "👔",
    prompt: "Create an executive team section. Larger photos, names, titles, and brief bios. Premium look for leadership page.",
  },
  {
    title: "Team with Skills",
    description: "Team members with skill displays",
    category: "team",
    icon: "📊",
    prompt: "Create team section showing member skills. Photo, name, role, and skill bars or tags. Good for agencies and studios.",
  },
  {
    title: "Minimal Team",
    description: "Simple team member list",
    category: "team",
    icon: "✨",
    prompt: "Create a minimal team section. Small photos or avatars, names and roles only. Text-focused, clean design.",
  },
  {
    title: "Team with Quote",
    description: "Team members with personal quotes",
    category: "team",
    icon: "💬",
    prompt: "Create team section where each member has a personal quote or motto. Photo, name, role, and quote. Personal touch.",
  },
  {
    title: "Department Teams",
    description: "Team organized by department",
    category: "team",
    icon: "🏢",
    prompt: "Create team section organized by department. Section headers for each team, members below. Good for larger organizations.",
  },
  {
    title: "Team Hover Cards",
    description: "Interactive team cards with hover reveal",
    category: "team",
    icon: "👆",
    prompt: "Create team cards where additional info reveals on hover. Base shows photo and name, hover shows bio and links. Interactive.",
  },
  {
    title: "Founder Story",
    description: "Focus on founder or CEO",
    category: "team",
    icon: "👤",
    prompt: "Create a founder spotlight section. Large photo, detailed bio, company story, and personal message. About page hero.",
  },

  // ============================================
  // GALLERY SECTIONS (12 templates)
  // ============================================
  {
    title: "Product Gallery",
    description: "Grid showcase of products",
    category: "gallery",
    icon: "🛒",
    prompt: "Create a product gallery grid. Product images with name and price on hover. 4-column layout. Link to product pages.",
  },
  {
    title: "Masonry Gallery",
    description: "Pinterest-style image layout",
    category: "gallery",
    icon: "🧱",
    prompt: "Create a masonry-style image gallery. Mixed image sizes creating dynamic layout. Lightbox on click. Modern and artistic.",
  },
  {
    title: "Lightbox Gallery",
    description: "Gallery with fullscreen lightbox",
    category: "gallery",
    icon: "🔦",
    prompt: "Create an image gallery with lightbox functionality. Grid of thumbnails, click for fullscreen view with navigation arrows.",
  },
  {
    title: "Before & After Gallery",
    description: "Comparison slider images",
    category: "gallery",
    icon: "↔️",
    prompt: "Create a before/after comparison gallery. Slider to reveal before vs after images. Great for transformations, results.",
  },
  {
    title: "Instagram Feed",
    description: "Instagram-style photo grid",
    category: "gallery",
    icon: "📷",
    prompt: "Create an Instagram-style gallery section. Square images in grid, link to Instagram. Include follow CTA. Social proof.",
  },
  {
    title: "Video Gallery",
    description: "Grid of video thumbnails",
    category: "gallery",
    icon: "🎬",
    prompt: "Create a video gallery with thumbnail grid. Play button overlays, click to play in modal or inline. Clean video showcase.",
  },
  {
    title: "Portfolio Gallery",
    description: "Work samples with categories",
    category: "gallery",
    icon: "💼",
    prompt: "Create a portfolio gallery with category filters. Filter buttons to show different work types. Thumbnail grid with hover details.",
  },
  {
    title: "Lookbook Gallery",
    description: "Fashion lookbook style layout",
    category: "gallery",
    icon: "👗",
    prompt: "Create a lookbook-style gallery. Full-width images alternating with grids. Fashion and lifestyle focused. Editorial feel.",
  },
  {
    title: "Gallery Grid",
    description: "Simple uniform image grid",
    category: "gallery",
    icon: "🔲",
    prompt: "Create a simple uniform image gallery grid. Same-sized images in clean rows. Hover effect for interaction. Classic layout.",
  },
  {
    title: "Gallery Carousel",
    description: "Sliding image carousel",
    category: "gallery",
    icon: "🎠",
    prompt: "Create an image carousel/slider. Large images with navigation arrows and dots. Auto-advance optional. Featured images.",
  },
  {
    title: "Filtered Gallery",
    description: "Gallery with filter options",
    category: "gallery",
    icon: "🔍",
    prompt: "Create a filterable gallery. Filter buttons by category, animated filtering. Grid of images. Good for diverse content.",
  },
  {
    title: "Gallery with Captions",
    description: "Images with detailed captions",
    category: "gallery",
    icon: "📝",
    prompt: "Create a gallery where each image has a caption below or on hover. Title and description for each item. Informative.",
  },

  // ============================================
  // CONTENT SECTIONS (12 templates)
  // ============================================
  {
    title: "Blog Grid",
    description: "Grid of blog post cards",
    category: "content",
    icon: "📰",
    prompt: "Create a blog posts grid. Each card has featured image, title, excerpt, date, and read more link. 3-column layout.",
  },
  {
    title: "Article Cards",
    description: "Featured article showcase",
    category: "content",
    icon: "📄",
    prompt: "Create article cards with large feature image on top, title, excerpt, author info, and read time. Clean blog layout.",
  },
  {
    title: "Rich Text Section",
    description: "Formatted content area",
    category: "content",
    icon: "📝",
    prompt: "Create a rich text content section. Heading, formatted paragraphs, block quotes, and inline images. About page or story content.",
  },
  {
    title: "Stats Section",
    description: "Key numbers and statistics",
    category: "content",
    icon: "📊",
    prompt: "Create a statistics section with large numbers. 4 key metrics with labels. Animated counting effect optional. Trust-building.",
  },
  {
    title: "Timeline Section",
    description: "Chronological history display",
    category: "content",
    icon: "📅",
    prompt: "Create a timeline section for company history or milestones. Vertical line with dated events alternating sides. Storytelling.",
  },
  {
    title: "Logo Cloud",
    description: "Partner or client logos display",
    category: "content",
    icon: "🏢",
    prompt: "Create a logo cloud section. Row of client/partner logos. Grayscale with color on hover optional. 'Trusted by' headline.",
  },
  {
    title: "Marquee Logos",
    description: "Scrolling logos banner",
    category: "content",
    icon: "📜",
    prompt: "Create a scrolling logo marquee. Continuous horizontal scroll of partner logos. Smooth infinite animation. Social proof.",
  },
  {
    title: "Quote Block",
    description: "Large inspirational quote",
    category: "content",
    icon: "❝",
    prompt: "Create a large quote section. Oversized quote text with attribution. Decorative quotation marks. Statement piece.",
  },
  {
    title: "Latest News",
    description: "Recent news or updates",
    category: "content",
    icon: "📢",
    prompt: "Create a latest news section. List of recent updates with dates, titles, and excerpts. Compact or detailed layout options.",
  },
  {
    title: "Mission Statement",
    description: "Company mission and values",
    category: "content",
    icon: "🎯",
    prompt: "Create a mission statement section. Headline, mission paragraph, and optional value icons below. Inspiring and purposeful.",
  },
  {
    title: "Collapsible Content",
    description: "Expandable content sections",
    category: "content",
    icon: "📂",
    prompt: "Create collapsible content sections. Headers that expand to reveal content. Good for organizing lengthy information.",
  },
  {
    title: "Media Embed",
    description: "Video or podcast embed section",
    category: "content",
    icon: "🎧",
    prompt: "Create a media embed section. Featured video or podcast player with title and description. Full-width or contained.",
  },

  // ============================================
  // FOOTER SECTIONS (10 templates)
  // ============================================
  {
    title: "Multi-Column Footer",
    description: "Classic footer with link columns",
    category: "footer",
    icon: "📋",
    prompt: "Create a multi-column footer. Logo, 3-4 link columns (Shop, About, Support, etc.), and copyright. Dark or light theme.",
  },
  {
    title: "Simple Footer",
    description: "Minimal one-line footer",
    category: "footer",
    icon: "✨",
    prompt: "Create a minimal footer with logo, essential links inline, and copyright. Single row, clean and simple.",
  },
  {
    title: "Footer with Newsletter",
    description: "Footer including email signup",
    category: "footer",
    icon: "📧",
    prompt: "Create a footer with newsletter signup section at top, then link columns, then social and copyright. Complete footer.",
  },
  {
    title: "Social Links Footer",
    description: "Footer emphasizing social media",
    category: "footer",
    icon: "📱",
    prompt: "Create a footer with prominent social media icons. Large social links, essential site links, copyright. Social-focused.",
  },
  {
    title: "Contact Footer",
    description: "Footer with contact information",
    category: "footer",
    icon: "📞",
    prompt: "Create a footer with contact details. Address, phone, email prominently displayed. Link columns and social icons too.",
  },
  {
    title: "Footer with Map",
    description: "Footer including location map",
    category: "footer",
    icon: "🗺️",
    prompt: "Create a footer with embedded map section. Map on one side, contact info and links on other. Local business focused.",
  },
  {
    title: "Mega Footer",
    description: "Comprehensive large footer",
    category: "footer",
    icon: "📚",
    prompt: "Create a mega footer with many sections. Newsletter, multiple link columns, contact, social, legal links a, payment icons. Comprehensive.",
  },
  {
    title: "Minimal Dark Footer",
    description: "Dark theme minimal footer",
    category: "footer",
    icon: "🌙",
    prompt: "Create a minimal dark-themed footer. Dark background, light text. Logo, essential links, social icons, copyright. Elegant.",
  },
  {
    title: "Footer with App Download",
    description: "Footer promoting mobile app",
    category: "footer",
    icon: "📲",
    prompt: "Create a footer featuring app download. App store badges prominently displayed, plus standard footer links and social.",
  },
  {
    title: "Animated Footer",
    description: "Footer with subtle animations",
    category: "footer",
    icon: "✨",
    prompt: "Create a footer with subtle animations. Hover effects on links, animated social icons. Modern and engaging.",
  },
];

// Helper to get templates by category
export function getTemplatesByCategory(category: string): DefaultTemplate[] {
  if (!category) return DEFAULT_TEMPLATES;
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

// Category display info
export const CATEGORY_INFO: Record<string, { label: string; description: string; icon: string }> = {
  hero: {
    label: "Hero",
    description: "Main banner and intro sections",
    icon: "🦸",
  },
  features: {
    label: "Features",
    description: "Product and service highlights",
    icon: "⭐",
  },
  testimonials: {
    label: "Testimonials",
    description: "Customer reviews and social proof",
    icon: "💬",
  },
  pricing: {
    label: "Pricing",
    description: "Pricing tables and plan comparisons",
    icon: "💰",
  },
  cta: {
    label: "Call to Action",
    description: "Conversion-focused sections",
    icon: "🎯",
  },
  faq: {
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "❓",
  },
  team: {
    label: "Team",
    description: "Team member showcases",
    icon: "👥",
  },
  gallery: {
    label: "Gallery",
    description: "Image and media collections",
    icon: "🖼️",
  },
  content: {
    label: "Content",
    description: "Rich text and blog sections",
    icon: "📝",
  },
  footer: {
    label: "Footer",
    description: "Footer variations",
    icon: "📋",
  },
};
