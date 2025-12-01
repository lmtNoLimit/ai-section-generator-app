# AI Section Generator Homepage Implementation Plan

**Date**: 2025-12-01
**Target File**: `/app/routes/app._index.tsx`
**Framework**: Polaris Web Components (`s-*` tags)

---

## 1. Executive Summary

Build a modern App Home page for AI Section Generator that combines:
- **Setup Guide** for first-time user onboarding (dismissible)
- **Feature-Focused Dashboard** for quick navigation and stats
- **Media Card / Interstitial Nav** patterns where content fits naturally

**Current State**: Generic Shopify template with product demo content
**Target State**: Guided onboarding + feature dashboard with stats

---

## 2. Chosen Approach: Hybrid (Setup Guide + Feature Dashboard)

### Concept
First-time users see a Setup Guide to guide them through app features. After completion or dismissal, they see the feature dashboard. Returning users see dashboard with quick stats.

### Homepage Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ s-page (heading="AI Section Generator")                             │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ PRIMARY ACTION: Generate New Section →                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ SETUP GUIDE (dismissible, shows if not completed)               │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ Progress: 1 of 3 complete                                   │ │ │
│ │ ├─────────────────────────────────────────────────────────────┤ │ │
│ │ │ ✓ Step 1: Generate your first section      [Completed]      │ │ │
│ │ │ ○ Step 2: Save a template for reuse        [Start →]        │ │ │
│ │ │ ○ Step 3: Check your generation history    [View →]         │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ │ [Dismiss setup guide]                                           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ FEATURE NAVIGATION (Interstitial Nav pattern)                   │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ Generate Sections                                        ›  │ │ │
│ │ │ AI-powered Liquid code from natural language                │ │ │
│ │ ├─────────────────────────────────────────────────────────────┤ │ │
│ │ │ Template Library                                         ›  │ │ │
│ │ │ Save and reuse your best prompts                            │ │ │
│ │ ├─────────────────────────────────────────────────────────────┤ │ │
│ │ │ Generation History                                       ›  │ │ │
│ │ │ Track all your generated sections                           │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌───────────────────────────────┐ ┌─────────────────────────────┐   │
│ │ ASIDE: Quick Stats            │ │ ASIDE: Resources            │   │
│ │ ┌───────────────────────────┐ │ │ ┌─────────────────────────┐ │   │
│ │ │ Sections Generated: 12    │ │ │ │ Documentation        ›  │ │   │
│ │ │ Templates Saved: 5        │ │ │ │ Support              ›  │ │   │
│ │ │ This Week: 3              │ │ │ └─────────────────────────┘ │   │
│ │ └───────────────────────────┘ │ └─────────────────────────────┘   │
│ └───────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Composition Patterns Used

| Pattern | Usage | Components |
|---------|-------|------------|
| **Setup Guide** | Onboarding checklist (3 steps) | `s-section`, `s-stack`, `s-box`, `s-button`, `s-icon`, `s-badge` |
| **Interstitial Nav** | Feature navigation | `s-clickable`, `s-grid`, `s-icon (chevron-right)`, `s-divider` |
| **Metrics Card** | Quick stats in sidebar | `s-section`, `s-stack`, `s-text` |

---

## 3. Implementation Details

### 3.1 Setup Guide Component

**Purpose**: Guide first-time users through app features (max 3 steps per Shopify guidelines)

**Steps**:
1. **Generate your first section** - Complete when `GenerationHistory.count > 0`
2. **Save a template** - Complete when `SectionTemplate.count > 0`
3. **View history** - Complete when user visits history page (tracked in DB)

**Smart State Tracking (Database-Derived)**:

Instead of storing separate onboarding state, we **derive completion from existing data**:

| Step | Completion Check | Storage |
|------|-----------------|---------|
| Generate section | `GenerationHistory.count > 0` | Existing table |
| Save template | `SectionTemplate.count > 0` | Existing table |
| View history | `ShopSettings.hasViewedHistory` | New model |
| Dismissed | `ShopSettings.onboardingDismissed` | New model |

**Benefits**:
- 2 of 3 steps auto-complete from existing actions
- No duplicate state tracking
- Single source of truth
- Minimal DB additions

**New Prisma Model**:
```prisma
// Shop-level settings (onboarding, preferences)
model ShopSettings {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  shop                 String   @unique
  hasViewedHistory     Boolean  @default(false)
  onboardingDismissed  Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([shop])
}
```

**Onboarding State Interface**:
```tsx
interface OnboardingState {
  hasGeneratedSection: boolean;  // Derived from GenerationHistory
  hasSavedTemplate: boolean;     // Derived from SectionTemplate
  hasViewedHistory: boolean;     // From ShopSettings
  isDismissed: boolean;          // From ShopSettings
}
```

### 3.2 Interstitial Nav Component

**Purpose**: Clean navigation to main app features with descriptions

**Implementation**:
```tsx
<s-section heading="Features">
  <s-box border="base" borderRadius="base">
    {features.map((feature, i) => (
      <>
        <s-clickable href={feature.href} padding="base">
          <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
            <s-box>
              <s-heading>{feature.title}</s-heading>
              <s-paragraph color="subdued">{feature.description}</s-paragraph>
            </s-box>
            <s-icon type="chevron-right" />
          </s-grid>
        </s-clickable>
        {i < features.length - 1 && (
          <s-box paddingInline="base">
            <s-divider />
          </s-box>
        )}
      </>
    ))}
  </s-box>
</s-section>
```

### 3.3 Quick Stats Component

**Purpose**: Show user's activity metrics in sidebar

**Data Source**: Query from existing history and template tables

```tsx
interface Stats {
  sectionsGenerated: number;
  templatesSaved: number;
  generationsThisWeek: number;
}
```

---

## 4. Data Requirements

### Loader Data
```tsx
interface HomepageLoaderData {
  stats: {
    sectionsGenerated: number;
    templatesSaved: number;
    generationsThisWeek: number;
  };
  onboarding: {
    hasGeneratedSection: boolean;
    hasSavedTemplate: boolean;
    hasViewedHistory: boolean;
    isDismissed: boolean;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch stats and onboarding state in parallel
  const [historyCount, templateCount, weeklyCount, shopSettings] = await Promise.all([
    prisma.generationHistory.count({ where: { shop } }),
    prisma.sectionTemplate.count({ where: { shop } }),
    prisma.generationHistory.count({
      where: {
        shop,
        createdAt: { gte: getStartOfWeek() },
      },
    }),
    prisma.shopSettings.findUnique({ where: { shop } }),
  ]);

  return {
    stats: {
      sectionsGenerated: historyCount,
      templatesSaved: templateCount,
      generationsThisWeek: weeklyCount,
    },
    onboarding: {
      hasGeneratedSection: historyCount > 0,
      hasSavedTemplate: templateCount > 0,
      hasViewedHistory: shopSettings?.hasViewedHistory ?? false,
      isDismissed: shopSettings?.onboardingDismissed ?? false,
    },
  };
}
```

### Action Handler (for dismiss and mark steps)
```tsx
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "dismissOnboarding") {
    await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      update: { onboardingDismissed: true },
      create: { shop: session.shop, onboardingDismissed: true },
    });
  }

  return { success: true };
}
```

### Mark History Viewed (in app.history.tsx loader)
```tsx
// Add to history page loader
await prisma.shopSettings.upsert({
  where: { shop: session.shop },
  update: { hasViewedHistory: true },
  create: { shop: session.shop, hasViewedHistory: true },
});
```

---

## 5. File Structure

### New Files
```
/app/components/home/
├── index.ts                 # Barrel export
├── SetupGuide.tsx           # Onboarding checklist component
├── FeatureNav.tsx           # Interstitial navigation component
└── QuickStats.tsx           # Stats display component

/app/services/
└── settings.server.ts       # Shop settings service (onboarding state)
```

### Modified Files
```
/app/routes/app._index.tsx       # Complete rewrite
/app/routes/app.history.tsx      # Add hasViewedHistory tracking
/prisma/schema.prisma            # Add ShopSettings model
```

### Database Migration
```bash
# After updating schema.prisma
npx prisma db push
```

---

## 6. Implementation Phases

### Phase 1: Database Setup (30 min)

**Step 1.1: Add ShopSettings model to schema.prisma**
```prisma
// Shop-level settings (onboarding, preferences)
model ShopSettings {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  shop                 String   @unique
  hasViewedHistory     Boolean  @default(false)
  onboardingDismissed  Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([shop])
}
```

**Step 1.2: Run migration**
```bash
npx prisma db push
npx prisma generate
```

**Step 1.3: Create settings.server.ts service**
```tsx
// app/services/settings.server.ts
import prisma from "../db.server";

export const settingsService = {
  async get(shop: string) {
    return prisma.shopSettings.findUnique({ where: { shop } });
  },

  async markHistoryViewed(shop: string) {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { hasViewedHistory: true },
      create: { shop, hasViewedHistory: true },
    });
  },

  async dismissOnboarding(shop: string) {
    return prisma.shopSettings.upsert({
      where: { shop },
      update: { onboardingDismissed: true },
      create: { shop, onboardingDismissed: true },
    });
  },
};
```

### Phase 2: Components (2-3 hours)

**Step 2.1: Create component directory and barrel export**
```bash
mkdir -p app/components/home
```

**Step 2.2: Implement SetupGuide component**
- 3 steps with progress indicator
- Derive completion from loader data (no hooks needed)
- Dismiss button triggers form action
- Shows only if not completed/dismissed

**Step 2.3: Implement FeatureNav component**
- Interstitial Nav pattern
- 3 features: Generate, Templates, History
- Chevron icons for navigation affordance

**Step 2.4: Implement QuickStats component**
- Display 3 metrics
- Handle zero-state gracefully

### Phase 3: Route Integration (1-2 hours)

**Step 3.1: Update app._index.tsx**
- Import new components
- Implement loader with stats + onboarding state
- Add action for dismiss
- Pass onboarding data to SetupGuide

**Step 3.2: Update app.history.tsx**
- Add `settingsService.markHistoryViewed()` to loader
- Auto-marks step complete on page visit

### Phase 4: Polish (30 min)

**Step 4.1: Responsive layout**
- Stack layout on mobile
- Sidebar collapses below main content

**Step 4.2: Testing**
- Verify all states render correctly
- Test dismiss persistence
- Verify stats accuracy
- Test onboarding auto-completion

---

## 7. Component Code Previews

### SetupGuide.tsx
```tsx
import { Fragment } from "react";
import { useFetcher } from "react-router";

interface OnboardingState {
  hasGeneratedSection: boolean;
  hasSavedTemplate: boolean;
  hasViewedHistory: boolean;
  isDismissed: boolean;
}

interface SetupGuideProps {
  onboarding: OnboardingState;
}

const SETUP_STEPS = [
  {
    id: "generate",
    title: "Generate your first section",
    description: "Describe what you want, get production-ready Liquid code",
    href: "/app/generate",
    completionKey: "hasGeneratedSection" as const,
  },
  {
    id: "template",
    title: "Save a template for reuse",
    description: "Store your best prompts in the template library",
    href: "/app/templates",
    completionKey: "hasSavedTemplate" as const,
  },
  {
    id: "history",
    title: "Check your generation history",
    description: "Track all sections you've created",
    href: "/app/history",
    completionKey: "hasViewedHistory" as const,
  },
];

export function SetupGuide({ onboarding }: SetupGuideProps) {
  const fetcher = useFetcher();

  // Don't show if dismissed
  if (onboarding.isDismissed) return null;

  // Calculate completion
  const completedCount = SETUP_STEPS.filter(
    (s) => onboarding[s.completionKey]
  ).length;
  const allComplete = completedCount === SETUP_STEPS.length;

  // Don't show if all complete
  if (allComplete) return null;

  const handleDismiss = () => {
    fetcher.submit(
      { intent: "dismissOnboarding" },
      { method: "post" }
    );
  };

  return (
    <s-section heading="Get Started">
      <s-stack gap="base" direction="block">
        <s-text color="subdued">
          {completedCount} of {SETUP_STEPS.length} complete
        </s-text>

        <s-box border="base" borderRadius="base">
          {SETUP_STEPS.map((step, i) => {
            const completed = onboarding[step.completionKey];
            return (
              <Fragment key={step.id}>
                <s-clickable href={step.href} padding="base">
                  <s-grid gridTemplateColumns="auto 1fr auto" alignItems="center" gap="base">
                    <s-icon type={completed ? "checkmark" : "circle"} />
                    <s-box>
                      <s-heading>{step.title}</s-heading>
                      <s-paragraph color="subdued">{step.description}</s-paragraph>
                    </s-box>
                    <s-icon type="chevron-right" />
                  </s-grid>
                </s-clickable>
                {i < SETUP_STEPS.length - 1 && (
                  <s-box paddingInline="base">
                    <s-divider />
                  </s-box>
                )}
              </Fragment>
            );
          })}
        </s-box>

        <s-button variant="tertiary" onClick={handleDismiss}>
          Dismiss setup guide
        </s-button>
      </s-stack>
    </s-section>
  );
}
```

### FeatureNav.tsx
```tsx
const FEATURES = [
  {
    title: "Generate Sections",
    description: "AI-powered Liquid code from natural language",
    href: "/app/generate",
  },
  {
    title: "Template Library",
    description: "Save and reuse your best prompts",
    href: "/app/templates",
  },
  {
    title: "Generation History",
    description: "Track all your generated sections",
    href: "/app/history",
  },
];

export function FeatureNav() {
  return (
    <s-section heading="Features">
      <s-box border="base" borderRadius="base">
        {FEATURES.map((feature, i) => (
          <Fragment key={feature.title}>
            <s-clickable href={feature.href} padding="base">
              <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
                <s-box>
                  <s-heading>{feature.title}</s-heading>
                  <s-paragraph color="subdued">{feature.description}</s-paragraph>
                </s-box>
                <s-icon type="chevron-right" />
              </s-grid>
            </s-clickable>
            {i < FEATURES.length - 1 && (
              <s-box paddingInline="base">
                <s-divider />
              </s-box>
            )}
          </Fragment>
        ))}
      </s-box>
    </s-section>
  );
}
```

### QuickStats.tsx
```tsx
interface QuickStatsProps {
  stats: {
    sectionsGenerated: number;
    templatesSaved: number;
    generationsThisWeek: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <s-stack gap="base" direction="block">
      <s-stack gap="small" direction="block">
        <s-text fontWeight="bold">{stats.sectionsGenerated}</s-text>
        <s-text color="subdued">Sections generated</s-text>
      </s-stack>
      <s-divider />
      <s-stack gap="small" direction="block">
        <s-text fontWeight="bold">{stats.templatesSaved}</s-text>
        <s-text color="subdued">Templates saved</s-text>
      </s-stack>
      <s-divider />
      <s-stack gap="small" direction="block">
        <s-text fontWeight="bold">{stats.generationsThisWeek}</s-text>
        <s-text color="subdued">This week</s-text>
      </s-stack>
    </s-stack>
  );
}
```

### Homepage Route (app._index.tsx)
```tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { settingsService } from "~/services/settings.server";
import { SetupGuide, FeatureNav, QuickStats } from "~/components/home";

// Helper to get start of current week
function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch stats and onboarding state in parallel
  const [historyCount, templateCount, weeklyCount, shopSettings] = await Promise.all([
    prisma.generationHistory.count({ where: { shop } }),
    prisma.sectionTemplate.count({ where: { shop } }),
    prisma.generationHistory.count({
      where: {
        shop,
        createdAt: { gte: getStartOfWeek() },
      },
    }),
    settingsService.get(shop),
  ]);

  return {
    stats: {
      sectionsGenerated: historyCount,
      templatesSaved: templateCount,
      generationsThisWeek: weeklyCount,
    },
    onboarding: {
      hasGeneratedSection: historyCount > 0,
      hasSavedTemplate: templateCount > 0,
      hasViewedHistory: shopSettings?.hasViewedHistory ?? false,
      isDismissed: shopSettings?.onboardingDismissed ?? false,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "dismissOnboarding") {
    await settingsService.dismissOnboarding(session.shop);
  }

  return { success: true };
}

export default function Homepage() {
  const { stats, onboarding } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <s-page heading="AI Section Generator" inlineSize="large">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/generate")}
      >
        Generate Section
      </s-button>

      <s-stack gap="large" direction="block">
        <SetupGuide onboarding={onboarding} />
        <FeatureNav />
      </s-stack>

      <s-section slot="aside" heading="Activity">
        <QuickStats stats={stats} />
      </s-section>
    </s-page>
  );
}
```

---

## 8. Testing Checklist

- [ ] Setup Guide displays for new users
- [ ] Steps mark complete when visited
- [ ] Dismiss button hides guide permanently
- [ ] Guide hidden after all steps complete
- [ ] Feature nav links work correctly
- [ ] Stats display correct numbers
- [ ] Zero-state handled gracefully
- [ ] Responsive layout on mobile
- [ ] Works in Shopify admin context
- [ ] localStorage persists across sessions

---

## 9. Effort Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Core components (Setup Guide, Feature Nav, Stats) | 2-3 hrs |
| 2 | Route integration + service methods | 1-2 hrs |
| 3 | Polish + responsive + testing | 1 hr |
| **Total** | | **4-6 hrs** |

---

## 10. Resolved Questions

1. **Stats Methods**: Will use `prisma.count()` directly in loader - no new service methods needed
2. **Onboarding Persistence**: Using DB (`ShopSettings` model) - persists across devices
3. **Auto-completion**:
   - Generate section: Auto-detected via `GenerationHistory.count > 0`
   - Save template: Auto-detected via `SectionTemplate.count > 0`
   - View history: Marked when visiting history page via `settingsService.markHistoryViewed()`

---

## References

- Research: `/plans/20251201-0928-polaris-homepage/research/`
- Scout: `/plans/20251201-0928-polaris-homepage/scout/`
- Shopify Homepage Docs: https://shopify.dev/docs/api/app-home/patterns/templates/homepage
- Setup Guide: https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide
- Interstitial Nav: https://shopify.dev/docs/api/app-home/patterns/compositions/interstitial-nav
