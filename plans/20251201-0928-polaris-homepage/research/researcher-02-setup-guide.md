# Shopify Setup Guide Composition Pattern Research

## Overview

Setup Guide is a Polaris App Home composition pattern that provides an interactive checklist for merchant onboarding and configuration task tracking. It guides merchants through essential setup steps with visual progress tracking.

**Primary Use Cases:**
- Merchant onboarding during initial app setup
- Multi-step process completion tracking
- Essential configuration task guidance

---

## Component Structure

### Purpose & Behavior
- Interactive checklist design for sequential task completion
- Visual progress indicator showing completion status
- Helps merchants understand what remains to be done
- Promotes higher usage retention through clear guidance

### Composition Characteristics
- **Pattern Type**: Composition (composable from smaller Polaris components)
- **Surface**: App Home
- **Rendered By**: Polaris web components / React components
- **Framework**: Uses standard Polaris component library

---

## Key Configuration Options

### Recommended Properties
1. **Steps/Tasks**
   - Discrete, completable steps
   - Auto-mark steps as complete
   - Clear action triggers for each step

2. **Progress Indicator**
   - Visual progress bar showing step completion
   - Encourages merchant engagement
   - Shows current step (e.g., "Step 6 of 8")

3. **Dismissal Behavior**
   - Optional dismissibility for non-essential onboarding
   - Cancel button/icon for flexible workflows
   - "Remind me later" option for complex setups

4. **Information Gathering**
   - Request only necessary merchant information
   - Minimize friction in setup process
   - Primary actions for step completion

### Step Constraints
- **Maximum 5 steps** recommended (prevents merchant drop-off)
- Steps should be focused and clear
- Each step should have distinct completion criteria

---

## Use Cases & Integration Patterns

### When to Use Setup Guide
1. **Initial App Onboarding** - Welcome merchants with clear next steps
2. **Configuration Workflows** - Multi-step setup (e.g., connect account, configure settings, test integration)
3. **Required Setup Steps** - Essential app configuration before full feature access
4. **Post-Install Guidance** - Help merchants get value quickly after installation

### When NOT to Use
- Single-step processes (use simpler patterns)
- Optional, non-essential features (may overwhelm)
- Continuous/ongoing tasks (not designed for iteration)

### Integration with Polaris
- **Composable**: Built from standard Polaris components (Section, Stack, Button, etc.)
- **Component Foundation**: Card layout, List items, Buttons, Icons, Progress indicators
- **Styling**: Follows Polaris design tokens and spacing system

---

## Design Best Practices

### UX Recommendations
1. **Welcome & Orient** - Brief context on app benefits and setup importance
2. **Clear Instructions** - Direct guidance with action buttons
3. **Task Isolation** - Keep steps focused and independently meaningful
4. **Visual Feedback** - Use checkmarks, badges, or progress bars
5. **Flexibility** - Allow "Remind me later" for complex setups
6. **Information Minimization** - Request only what's essential

### Visual Hierarchy
- Prominent primary button for main action
- Secondary buttons for supplementary actions
- Clear step numbering or progress indicators
- Descriptive headers and body text

---

## Implementation Considerations

### Component Props (Typical Pattern)
- Steps array with: title, description, completed status, action callback
- onStepComplete handler
- onDismiss handler
- Optional: progress display, step count display

### Polaris Components Used
- `<Section>` - Step container
- `<Stack>` - Vertical/horizontal layout
- `<Button>` - Action triggers
- `<Icon>` - Visual indicators
- `<Text>` - Descriptions and labels
- `<Box>` - Spacing and layout control

### State Management
- Track completed steps
- Persist completion state (local storage or backend)
- Handle step navigation/skipping if applicable

---

## Related Patterns & References

- **Polaris Onboarding Guidance**: `/docs/apps/design/user-experience/onboarding`
- **Pattern Location**: `/docs/api/app-home/patterns/compositions/setup-guide`
- **Built for Shopify Requirements**: Setup guides often align with app launch requirements

---

## Key Takeaways

1. Setup Guide is a **composition pattern** (not a single component) built from Polaris components
2. **Optimal for 2-5 steps** with clear completion criteria
3. **Visual progress tracking** is essential for merchant motivation
4. **Flexibility** (dismissible, "remind later") improves UX for optional setups
5. **Minimalist approach** to information gathering prevents friction
6. **Well-suited for post-install onboarding** to accelerate time-to-value
