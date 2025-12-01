# Shopify App Card Composition Pattern Research

**Date**: 2025-12-01
**Focus**: App Card component structure, props, use cases, and integration patterns
**Source**: https://shopify.dev/docs/api/app-home/patterns/compositions/app-card

---

## 1. App Card Component Structure

App cards are composition patterns in Polaris App Home that provide consistent layout for presenting related apps to merchants.

**Core Purpose**: Highlight apps that extend functionality or help merchants accomplish related tasks.

**Key Characteristics**:
- Consistent, repeatable card layout
- Clear educational messaging about app value
- Actionable call-to-action for app discovery/installation
- Merchant-focused benefit communication

---

## 2. Use Cases & Scenarios

App cards address three primary use cases:

1. **Suggest Complementary Apps**
   - Recommend apps solving adjacent problems
   - Example: Email marketing app for subscription service users

2. **Promote Integrations**
   - Highlight third-party integrations
   - Example: Social media scheduler connecting to main app

3. **Guide Merchant Exploration**
   - Introduce new solutions for advanced workflows
   - Example: Reporting/analytics tools for power users

---

## 3. Configuration & Props

Based on Polaris App Home API schema:

**Typical Card Structure**:
- Title/Heading (app name)
- Description (value proposition)
- Badge/Icon (visual identifier)
- Primary CTA Button (install/learn more)
- Optional metadata (features, benefits)

**Key Component Relationships**:
- Built on top of base Box/Stack layout primitives
- Compatible with Grid layouts for multi-card galleries
- Supports padding, borders, and styling through composition
- Dismissible variant option (relevant for marketing guidelines)

---

## 4. Marketing & Design Considerations

Per Shopify design guidelines:

**Required Behaviors**:
- Promotional app cards should be dismissible
- Once dismissed by user, should not reappear for same merchant
- Feature gating should be visually disabled + clearly labeled

**Best Practices**:
- Place promotional app cards on app homepage lower section
- OR create dedicated promotional/discovery page
- Avoid mixing app promotion with primary CTA
- Use light touch branding through illustration/imagery
- Don't oversell or use deceptive countdown timers

**Integration with Onboarding**:
- App cards help guide merchants to complementary solutions
- Educate about available ecosystem extensions
- Reduce discovery friction for related functionality

---

## 5. Implementation Patterns

**Component Composition Approach**:
App cards leverage Polaris web components (e.g., `s-box`, `s-button`, `s-link`, `s-stack`) composed together rather than single dedicated component.

**Typical Stack**:
```
Stack (direction: "block")
├── Image (app icon/screenshot)
├── Stack (direction: "block")
│   ├── Heading (app name)
│   ├── Paragraph (description)
│   └── Optional Badge (feature highlight)
└── ButtonGroup
    ├── Primary Button (CTA: Install/Learn More)
    └── Optional Link (Secondary action)
```

**Styling Considerations**:
- Use consistent spacing/gap patterns
- Card background (base/subdued)
- Border styling for visual separation
- Padding for internal spacing

---

## 6. Related Design Standards

**Built for Shopify Requirements**:
- App cards should not mislead or pressure merchants
- Avoid fake reviews or false special offers
- No countdown timers for limited-time offers
- Premium/paid features must be visually disabled
- Marketing messages must be non-obtrusive

---

## Unresolved Questions

1. What are the exact prop names and types for app cards (not documented in brief)?
2. Is there a ready-made app card component, or purely composition-based?
3. What analytics/tracking events are available for app card interactions?
4. How should app cards adapt to different viewport sizes?
