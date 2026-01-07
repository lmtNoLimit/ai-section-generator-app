# Scout Report: Section Slots/Limits, Billing, and Usage System
**Date**: 2025-01-07 | **Created**: 11:17 | **Scope**: Billing, section CRUD, usage tracking

## Executive Summary
Comprehensive analysis of the AI Section Generator's billing system, section management, and usage tracking. System implements hybrid billing (base recurring + usage-based), multi-tier plans (free/pro/agency), trial period, and quota enforcement via database models and service layer.

---

## 1. DATABASE MODELS (Prisma Schema)
**File**: `/Users/lmtnolimit/working/ai-section-generator/prisma/schema.prisma`

### Core Models for Section Limits & Billing

#### A. Section Model
- **Location**: Lines 35-58
- **Fields**: id, shop, name, prompt, code, themeId, themeName, fileName, tone, style, status, createdAt
- **Indexes**: `[shop]`, `[createdAt]`, `[status]`
- **Purpose**: Stores AI-generated sections with draft/active/inactive/archive states
- **Soft Delete**: Uses `status="archive"` for soft deletes

#### B. Subscription Model
- **Location**: Lines 119-148
- **Key Fields**:
  - `shopifySubId` (unique): Shopify GraphQL subscription ID
  - `planName`: "free", "pro", "agency"
  - `status`: "active", "cancelled", "expired", "pending"
  - `basePrice`: Monthly base charge (USD)
  - `includedQuota`: Generations per billing cycle
  - `overagePrice`: USD per additional generation
  - `cappedAmount`: Max monthly overage charge (USD)
  - `usageThisCycle`: Int (resets on new period)
  - `overagesThisCycle`: Int (resets on new period)
  - `trialEndsAt`: For trial period tracking
  - `usageLineItemId`: Cache for Shopify usage line item
- **Indexes**: `[shop, status, createdAt]`, `[status]`, `[currentPeriodEnd]`

#### C. UsageRecord Model
- **Location**: Lines 150-175
- **Purpose**: Log each usage charge sent to Shopify
- **Key Fields**:
  - `idempotencyKey` (unique): Prevents duplicate charges
  - `subscriptionId`: Links to Subscription
  - `sectionId`: Links to Section
  - `amount`: Charge amount (USD)
  - `chargeStatus`: "pending", "accepted", "declined", "error"
  - `shopifyChargeId`: Shopify's charge ID
- **Index**: `[shop]`, `[subscriptionId]`, `[chargeStatus]`

#### D. PlanConfiguration Model
- **Location**: Lines 177-203
- **Purpose**: Pricing tier definitions
- **Key Fields**:
  - `planName` (unique): "free", "pro", "agency"
  - `displayName`, `description`
  - `basePrice`, `includedQuota`, `overagePrice`, `cappedAmount`
  - `features[]`: Feature descriptions for UI
  - `featureFlags[]`: "live_preview", "publish_theme", "chat_refinement", "team_seats", "batch_generation", "custom_templates"
  - `badge`, `sortOrder`, `isActive`

#### E. Trial Model
- **Location**: Lines 290-305
- **Purpose**: Track 7-day free trial (10 generations, Pro-tier features)
- **Key Fields**:
  - `shop` (unique): One trial per shop
  - `startedAt`, `endsAt`: 7-day duration
  - `usageCount`, `maxUsage` (default 10)
  - `status`: "active", "expired", "converted"
  - `convertedTo`: Plan name if converted

#### F. FailedUsageCharge Model
- **Location**: Lines 205-218
- **Purpose**: Recovery log for failed charges
- **Fields**: shop, sectionId, errorMessage, retryCount, createdAt, retriedAt

---

## 2. BILLING SERVICE
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/billing.server.ts`

### Core Functions

#### checkQuota(shop: string) → Promise<QuotaCheck>
- **Lines**: 427-495
- **Logic**:
  1. Check trial first → return trial quota if active
  2. No subscription → Free tier (5 generations/month, counted from sections table)
  3. With subscription → Check `usageThisCycle < includedQuota || overagesRemaining > 0`
- **Returns**: `hasQuota`, `usageThisCycle`, `includedQuota`, `overagesThisCycle`, `percentUsed`, `isInTrial`, `trialEndsAt`
- **Free Tier Logic**: Counts sections created since start of calendar month (`createdAt >= startOfMonth`)

#### recordUsage(admin, input) → Promise<RecordUsageResult>
- **Lines**: 213-421
- **Flow**:
  1. Get subscription
  2. Check if generation is within quota: `isOverage = subscription.usageThisCycle >= includedQuota`
  3. Set charge amount: `0` if within quota, `overagePrice` if overage
  4. Save UsageRecord locally with `chargeStatus="pending"`
  5. If amount = 0 → mark accepted, increment counter
  6. If amount > 0 → send to Shopify via GraphQL mutation
  7. On error → save to FailedUsageCharge table for recovery
- **Idempotency**: Uses key format `${shop}-${sectionId}-${timestamp}`
- **Graceful Degradation**: Returns success even if Shopify call fails; increments counters locally

#### createSubscription(admin, input) → Promise<CreateSubscriptionResult>
- **Lines**: 50-160
- **Actions**:
  1. Cancel existing pending/declined subscriptions
  2. Query plan config
  3. Create hybrid GraphQL subscription with 2 line items:
     - Recurring charge (EVERY_30_DAYS)
     - Usage-based charge with capped amount
  4. Save to database with `status="pending"` (until merchant approves)
  5. Convert trial if active

#### changeSubscription(admin, input) → Promise<CreateSubscriptionResult>
- **Lines**: 590-605
- **Workflow**: Cancel existing → Create new (upgrade/downgrade)

#### getSubscription(shop) → Promise<Subscription | null>
- **Lines**: 501-512
- **Filters**: `status = "active"` (case-insensitive)
- **Returns**: Most recent active subscription

#### updateSubscriptionStatus(shopifySubId, status, currentPeriodEnd?)
- **Lines**: 524-543
- **Called by**: Webhook handlers
- **Resets**: `usageThisCycle` and `overagesThisCycle` to 0 on new period

---

## 3. SECTION CRUD SERVICE
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/section.server.ts`

### Core Operations

#### create(input: CreateSectionInput) → Promise<Section>
- **Lines**: 115-137
- **Flow**:
  1. Sanitize Liquid code (remove hallucinations like new_comment forms)
  2. Extract section name from schema JSON (fallback to prompt)
  3. Save with `status=DRAFT`
- **Always Draft**: Sections always start as draft, never published on creation

#### update(id, shop, input: UpdateSectionInput) → Promise<Section | null>
- **Lines**: 142-168
- **Validates**: Status transitions using `isValidTransition()` function
- **Prevents**: Invalid state flows (e.g., ARCHIVE → ACTIVE not allowed)

#### archive(id, shop) → Promise<Section | null>
- **Lines**: 174-176
- **Purpose**: Soft delete by setting `status=ARCHIVE`
- **Can Archive From**: DRAFT or ACTIVE

#### restore(id, shop) → Promise<Section | null>
- **Lines**: 181-197
- **Purpose**: Restore archived/inactive section to DRAFT
- **Validation**: Only works on ARCHIVE or INACTIVE sections

#### publish(id, shop, themeData) → Promise<Section | null>
- **Lines**: 202-211
- **Sets**: `status=ACTIVE` + `themeId`, `themeName`, `fileName`

#### unpublish(id, shop) → Promise<Section | null>
- **Lines**: 216-223
- **Sets**: `status=DRAFT` + clears theme data

#### getByShop(shop, options) → Promise<{items, total, page, totalPages}>
- **Lines**: 229-278
- **Pagination**: page, limit (default 20)
- **Filters**: status, search (in prompt+name), includeInactive
- **Default**: Excludes ARCHIVE unless explicitly included
- **Soft Delete**: Archived sections hidden by default

#### delete(id, shop) → Promise<boolean>
- **Lines**: 292-301
- **Hard Delete**: Permanently removes section (use for old cleanup)

#### getTotalCount(shop) → Promise<number>
- **Lines**: 322-329
- **Purpose**: Active section count (excludes ARCHIVE) for empty state logic

---

## 4. TRIAL SERVICE
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/trial.server.ts`

### Core Functions

#### startTrial(shop) → Promise<TrialStatus>
- **Lines**: 32-51
- **Duration**: 7 days (168 hours)
- **Max Usage**: 10 generations
- **One Trial Per Shop**: Returns existing status if already started

#### getTrialStatus(shop) → Promise<TrialStatus>
- **Lines**: 56-98
- **Auto-Expiry**: Marks trial as "expired" if past end date
- **Returns**:
  - `isInTrial`: true only if active, not expired, usage not exhausted
  - `daysRemaining`, `usageRemaining`, `usageCount`, `status`

#### incrementTrialUsage(shop) → Promise<boolean>
- **Lines**: 104-131
- **Called Before**: Generation
- **Returns**: `true` if allowed, `false` if exhausted/expired
- **Auto-Expires**: If past end date

#### convertTrial(shop, planName) → void
- **Lines**: 137-149
- **Called**: When subscribing to paid plan
- **Updates**: `status="converted"`, `convertedTo=planName`

---

## 5. FEATURE GATE SERVICE
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/feature-gate.server.ts`

### Key Functions

#### hasFeature(shop, feature: FeatureFlag) → Promise<boolean>
- **Lines**: 45-58
- **Trial Access**: Trial users get Pro-tier features
- **Features**: "live_preview", "publish_theme", "chat_refinement", "team_seats", "batch_generation", "custom_templates"

#### checkRefinementAccess(shop, conversationId) → Promise<FeatureGateResult>
- **Lines**: 126-168
- **Free**: No refinement (limit=0)
- **Pro/Trial**: 5 turns per conversation
- **Agency**: Unlimited

#### getFeaturesSummary(shop, conversationId?) → Promise<FeaturesSummary>
- **Lines**: 174-214
- **Returns**: All feature flags + trial info for UI display
- **Note**: Live preview available for ALL to drive conversion

---

## 6. USAGE TRACKING & ANALYTICS

### Usage Tracking Service
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/usage-tracking.server.ts`

#### canGenerate(shop) → Promise<{allowed, quota, reason?}>
- **Lines**: 14-34
- **Checks**: `checkQuota()` → `hasQuota`
- **Warning**: Logs if usage >= 90%

#### trackGeneration(admin, shop, sectionId, prompt) → void
- **Lines**: 39-85
- **Calls**: `recordUsage()` to charge Shopify
- **Graceful Degradation**: Saves to FailedUsageCharge if error, doesn't block generation

#### getUsageSummary(shop) → Summary
- **Lines**: 90-121
- **Returns**: Plan, usage, estimated charge, days until renewal

### Usage Analytics Service
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/usage-analytics.server.ts`

#### getUsageStats(shop) → Promise<UsageStats>
- **Lines**: 33-106
- **Calculations**:
  - Billing cycle: last 30 days from `currentPeriodEnd`
  - Recent generations (20 recent sections in cycle)
  - Daily average & projection (estimated total usage if rate continues)
  - Trend: "increasing" (>1.5/day), "stable", "decreasing" (<0.5/day)
  - Overage marking: Most recent `overagesThisCycle` gens marked as overages
- **Fields**: `currentCycle`, `recentGenerations`, `projection`, `trend`

---

## 7. ROUTING & UI ENDPOINTS

### Billing Routes
**File**: `/Users/lmtnolimit/working/ai-section-generator/app/routes/app.billing.tsx`

#### loader()
- **Data**: Plans, active subscription, current quota, usage stats
- **Query Params**: `status` (success/declined), `charge_id`

#### action()
- **Actions**: `subscribe` (create subscription), `cancel`
- **Return URL**: Embedded app URL for post-approval redirect

### Section Routes

#### `/app/sections` (List)
**File**: `app.sections._index.tsx`
- **View Tabs**: All, Draft, Active, Inactive, Archive (5 tabs)
- **Features**: Pagination, search, filtering, sorting
- **Delete Modal**: Soft delete via archive

#### `/app/sections/new` (Create)
**File**: `app.sections.new.tsx`
- **Action**: Creates empty section + conversation
- **Redirect**: To `/$id` for AI generation

#### `/app/sections/$id` (Detail/Edit)
**File**: `app.sections.$id.tsx`
- **Features**: Edit, preview, chat refinement, publish/unpublish
- **AI Chat**: Iterative refinement via SSE streaming

---

## 8. TYPES & INTERFACES

**File**: `/Users/lmtnolimit/working/ai-section-generator/app/types/billing.ts`

### Key Types
```typescript
type PlanTier = "free" | "pro" | "agency"
type FeatureFlag = "live_preview" | "publish_theme" | "chat_refinement" | "team_seats" | "batch_generation" | "custom_templates"
type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending" | "frozen" | "declined"
type ChargeStatus = "pending" | "accepted" | "declined" | "error"

interface QuotaCheck {
  hasQuota: boolean
  usageThisCycle: number
  includedQuota: number
  overagesThisCycle: number
  percentUsed: number (0-100)
  isInTrial: boolean
  trialEndsAt: Date | null
}

interface FeaturesSummary {
  canPublish: boolean
  canLivePreview: boolean
  canChatRefine: boolean
  refinementLimit: number
  isInTrial: boolean
  trialDaysRemaining: number
}
```

---

## 9. FREE TIER IMPLEMENTATION

### Free Tier Details
- **Default Quota**: 5 generations/month (configurable in PlanConfiguration)
- **Counting Method**: Calendar month (sections created since 1st of month)
- **Query**: `prisma.section.count({ where: { shop, createdAt: { gte: startOfMonth } } })`
- **No Billing**: No Subscription record, no charges sent to Shopify
- **Trial Priority**: If trial active, trial quota takes precedence
- **Limits**: Cannot refine (chat_refinement disabled), cannot publish

### Upgrade Path
1. Free user hits quota
2. App shows upgrade modal
3. User selects plan → `createSubscription()` action
4. Merchant confirms on Shopify → webhook updates `status="active"`
5. Next generation charges against subscription

---

## 10. BILLING CYCLE & OVERAGE LOGIC

### Billing Cycle Calculations
- **Period End**: `subscription.currentPeriodEnd` (set by Shopify)
- **Reset Trigger**: Webhook sends new `currentPeriodEnd`
- **Counters Reset**: `usageThisCycle=0`, `overagesThisCycle=0` on new period

### Overage Determination
```typescript
isOverage = subscription.usageThisCycle >= subscription.includedQuota
charge = isOverage ? overagePrice : 0
```

### Max Overage Cap
```typescript
maxOverages = Math.floor(cappedAmount / overagePrice)
overagesRemaining = maxOverages - overagesThisCycle
hasQuota = usageThisCycle < includedQuota || overagesRemaining > 0
```

---

## 11. SECTION STATUS FLOW

### Valid State Transitions
- **DRAFT** → ACTIVE (publish), ARCHIVE (delete)
- **ACTIVE** → DRAFT (unpublish), INACTIVE (auto-unpublished by Shopify), ARCHIVE (delete)
- **INACTIVE** → DRAFT (restore), ARCHIVE (delete)
- **ARCHIVE** → DRAFT (restore)

### Soft Delete Strategy
- Archive = soft delete (section hidden, recoverable)
- `getTotalCount()` excludes ARCHIVE
- `getByShop()` excludes ARCHIVE by default unless `includeInactive=true`
- Hard delete available via `delete()` method (for cleanup)

---

## 12. KEY IMPLEMENTATION PATTERNS

### Quota Enforcement
1. **Check Before Action**: `canGenerate()` before section creation
2. **Record After Success**: `trackGeneration()` after AI succeeds
3. **Graceful Fallback**: Charges fail silently; generation succeeds anyway

### Trial → Paid Conversion
1. Trial user calls `createSubscription()`
2. `createSubscription()` calls `convertTrial()` internally
3. Trial status updated to "converted"
4. Future calls to `hasFeature()` use subscription plan instead of trial

### Quota Priority Order
1. **Trial Active** → Use trial quota (10 gens, 7 days, Pro features)
2. **Subscription Active** → Use subscription quota
3. **Neither** → Use free tier quota (5 gens/month)

### Idempotent Charges
- Uses `idempotencyKey` unique index to prevent duplicate Shopify charges
- Format: `${shop}-${sectionId}-${timestamp}`
- Safe for retry logic

---

## CRITICAL FILES SUMMARY

| File | Purpose | Key Exports |
|------|---------|------------|
| `prisma/schema.prisma` | DB schema | Section, Subscription, Trial, PlanConfiguration, UsageRecord |
| `services/billing.server.ts` | Billing logic | checkQuota, recordUsage, createSubscription, getSubscription |
| `services/section.server.ts` | Section CRUD | create, publish, unpublish, archive, restore, getByShop, delete |
| `services/trial.server.ts` | Trial management | startTrial, getTrialStatus, incrementTrialUsage, convertTrial |
| `services/feature-gate.server.ts` | Feature gating | hasFeature, checkRefinementAccess, getFeaturesSummary |
| `services/usage-tracking.server.ts` | Usage metering | canGenerate, trackGeneration, getUsageSummary |
| `services/usage-analytics.server.ts` | Analytics | getUsageStats (projections, trends, recent gens) |
| `types/billing.ts` | Type definitions | QuotaCheck, FeatureFlag, PlanTier, FeaturesSummary |
| `routes/app.billing.tsx` | Billing UI | Plan selector, usage dashboard, subscription actions |
| `routes/app.sections._index.tsx` | Section list | Pagination, tabs, soft delete |
| `routes/app.sections.new.tsx` | Create section | Initial prompt → section + conversation |
| `routes/app.sections.$id.tsx` | Section detail | Edit, preview, chat refinement, publish |

---

## UNRESOLVED QUESTIONS
1. Shopify webhook endpoint handling for billing events - confirm location
2. Exact handling of subscription status uppercase vs lowercase from Shopify
3. Admin API context authentication flow for billing mutations
4. Stripe integration (if planned beyond Shopify billing) - not found in codebase
5. Free tier usage reset - using calendar month; confirm if per-30-day-cycle preferred
6. FailedUsageCharge recovery mechanism - currently logged but not automatically retried

---

**Scout Report Generated**: 2025-01-07 11:17
**Codebase Version**: 1.0-beta (Phase 4 Complete)
