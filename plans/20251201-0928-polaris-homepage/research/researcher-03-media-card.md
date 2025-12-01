# Shopify Polaris Media Card Research

## Executive Summary

Media Card is a composition pattern in Shopify Polaris App Home designed to present visual information (images, videos, or other media) paired with complementary text content. It provides merchants with context through visual demonstration, ideal for tutorials, feature showcase, and action prompts.

---

## 1. Component Structure

### Purpose
Media Cards educate merchants and provide clear calls-to-action by combining visual media with supporting text/actions.

### Primary Use Cases
- **Education**: Demonstrate key actions (e.g., "How to connect a social account" with demo image)
- **Action Prompts**: Show visual previews with CTAs (e.g., campaign preview with "Send campaign" button)

### Layout Model
- Media section (left/top): Image, video, or embedded content
- Content section (right/bottom): Heading, description, optional actions
- Responsive: Adapts to stacked layout on mobile

---

## 2. Props and Configuration Options

### Core Properties
- **Media source**: Image, video, or external video (YouTube/Vimeo)
- **Alt text**: Accessibility support for images
- **Media sizing**: Responsive width/height via aspect ratio control
- **Heading**: Section title
- **Description**: Supporting text (limited length for focus)
- **Actions**: Primary/secondary buttons or links

### Media Type Support

#### Image Media
- Formats: PNG, GIF, JPG
- Max size: 4472 x 4472 px (20MP)
- Recommended: 2048 x 2048 px for square content
- Props: `alt`, `src`, `objectFit` (contain/cover)

#### Video Media (Shopify-hosted)
- Format: MP4
- Runtime: Max 10 minutes
- File size: Max 1 GB
- Props: `video-autoplay`, `video-controls`, `video-loop`, `video-muted`, `video-playsinline`

#### External Video (YouTube/Vimeo)
- Embedded via iframe
- Responsive container required
- Auto-responsive via embed URL

#### 3D Models
- Formats: GLB or USDZ
- File size: Max 500 MB
- Built-in model viewer component

### Layout Configuration
- **Aspect ratio**: Defined via CSS or property (prevents layout shift)
- **Border radius**: Polaris token spacing (small, base, large)
- **Background**: Transparent, subdued, base, strong
- **Padding**: Configurable via Polaris spacing system

---

## 3. Use Cases for Different Media Types

### Images
- Product previews/screenshots
- Tutorial step illustrations
- Feature showcase diagrams
- Social proof graphics
- Before/after comparisons

### Videos
- **Tutorial videos**: Step-by-step feature walkthroughs
- **Demo videos**: Product feature demonstrations
- **Onboarding**: Getting started animations
- **Comparison videos**: Feature comparisons
- **Loop videos**: Ambient background motion

### YouTube/Vimeo Embeds
- Long-form educational content
- Webinar recordings
- Marketing videos
- Third-party hosted content

---

## 4. Integration Examples

### Basic Image Card
```html
<s-section>
  <s-grid gap="base" gridTemplateColumns="1fr 1fr">
    <s-box>
      <s-image
        src="path/to/image.png"
        alt="Feature demonstration"
        objectFit="cover"
        aspectRatio="16/9"
      />
    </s-box>
    <s-stack gap="base">
      <s-heading>Title</s-heading>
      <s-paragraph>Description text</s-paragraph>
      <s-button-group>
        <s-button variant="primary">Action</s-button>
      </s-button-group>
    </s-stack>
  </s-grid>
</s-section>
```

### Video Card with Controls
```html
<s-section>
  <s-stack gap="base">
    <s-box aspectRatio="16/9">
      <video
        width="100%"
        controls
        autoplay
        muted
      >
        <source src="path/to/video.mp4" type="video/mp4" />
      </video>
    </s-box>
    <s-stack gap="small">
      <s-heading>Video Tutorial</s-heading>
      <s-paragraph>Supporting text</s-paragraph>
    </s-stack>
  </s-stack>
</s-section>
```

### Responsive Mobile Adaptation
- Desktop: Grid layout (media left, content right)
- Mobile: Stack layout (media top, content bottom)
- CSS media queries or `gridTemplateColumns="auto"`

---

## 5. Configuration Best Practices

### Accessibility
- Always include `alt` text for images
- Use semantic HTML (heading hierarchy)
- Ensure video controls are accessible
- High color contrast for text overlays
- Keyboard navigation support for interactive elements

### Performance
- **Image optimization**: Use `srcSet` for responsive images
- **Video handling**:
  - Use preview/poster images for videos
  - Lazy-load below-the-fold content
  - Provide preview image as fallback
- **3D models**: Use preview images with fallback UI

### UX Considerations
- **Aspect ratio boxes**: Prevent layout shift (use CSS padding-bottom trick)
- **Video interaction**: Only play active video in carousels
- **Touch targets**: Ensure buttons are 44px+ for mobile
- **Media preview images**: Every media type has preview_image attribute for thumbnails

### Content Guidelines
- Keep heading concise (<60 chars)
- Description should be 1-2 sentences
- Use 1-2 action buttons max
- Maintain consistent media dimensions

---

## 6. Known Constraints

- **Video runtime**: Shopify-hosted videos limited to 10 minutes
- **3D model file size**: 500 MB maximum
- **Storage limits**: Depend on Shopify plan (100-300GB per shop)
- **Media limits**: Basic Shopify (250), Shopify (1,000), Advanced (5,000) videos/3D models
- **Responsive containers**: Required for 3D models and embedded videos (not responsive by default)

---

## 7. Implementation Checklist

- [ ] Choose media type (image/video/embedded/3D)
- [ ] Define aspect ratio (prevents layout shift)
- [ ] Add alt text or captions
- [ ] Configure responsive container for non-image media
- [ ] Add media preview image for video fallback
- [ ] Implement lazy-loading for performance
- [ ] Test on mobile (stack vs. grid layout)
- [ ] Verify video controls are accessible
- [ ] Add proper heading/description text
- [ ] Include 1-2 action buttons with clear labels
- [ ] Validate color contrast (WCAG AA minimum)
- [ ] Test keyboard navigation

---

## References

- Shopify Media Card Pattern: https://shopify.dev/docs/api/app-home/patterns/compositions/media-card
- Product Media Management: https://shopify.dev/docs/apps/build/online-store/product-media
- Media Support Guide: https://shopify.dev/docs/storefronts/themes/product-merchandising/media/support-media
- Polaris Components: Web components with extensive media support
