# AI Section Generator - App Directory Scout Report

**Date**: 2025-12-20  
**Project**: AI Section Generator (Shopify Remix App)  
**Focus**: Complete app/ directory structure and architecture

---

## 1. COMPONENTS DIRECTORY (`app/components/`)

Organized by feature domains with reusable shared utilities. All components use Polaris Web Components (`<s-*>` syntax).

### 1.1 Core Feature Domains

#### **Chat Components** (`app/components/chat/`)
Interactive AI chat UI with streaming support.

**Files**:
- `ChatInput.tsx` - User input field with send button
- `MessageItem.tsx` - Single message display (user/assistant)
- `MessageList.tsx` - Scrollable message thread
- `CodeBlock.tsx` - Syntax-highlighted code display
- `ChatStyles.tsx` - Shared CSS-in-JS styles
- `useChat.ts` - Core chat state management hook
- `useAutoScroll.ts` - Auto-scroll to latest message
- `ChatContainer.tsx` - Layout wrapper
- `index.ts` - Barrel export

**Dependencies**: react-router, AI service, TypeScript types

**Patterns**: 
- Compound component pattern (Input + List + Item)
- Custom hooks for state and side effects
- Message streaming with proper formatting

---

#### **Generate Components** (`app/components/generate/`)
Main UI for AI section generation workflow.

**Files**:
- `GenerateLayout.tsx` - Two-column responsive grid (2/3 + 1/3)
- `PromptInput.tsx` - Text area for section description
- `SectionNameInput.tsx` - Input field for section name
- `TemplateSuggestions.tsx` - Template suggestion cards
- `PromptExamples.tsx` - Example prompts gallery
- `ThemeSelector.tsx` - Shopify theme selection dropdown
- `GeneratePreviewColumn.tsx` - Right sidebar preview
- `GenerateActions.tsx` - Save/Cancel action buttons
- `EmptyState.tsx` - Placeholder when no input
- `LoadingState.tsx` - Skeleton loader during generation
- `CodePreview.tsx` - Syntax-highlighted code display
- `SaveTemplateModal.tsx` - Modal for saving as template
- `templates/template-data.ts` - Seed templates data
- `index.ts` - Barrel export

**Dependencies**: chat service, theme service, billing service, utilities

**Patterns**:
- Controlled form inputs with validation
- Modal dialogs for secondary actions
- Responsive grid layout
- Loading states and skeletons

---

#### **Preview Components** (`app/components/preview/`)
Powerful Liquid rendering engine with settings UI.

**Main Components**:
- `SectionPreview.tsx` - Root preview orchestrator
- `PreviewFrame.tsx` - iFrame wrapper for isolation
- `PreviewToolbar.tsx` - Theme/resource controls
- `ResourceSelector.tsx` - Product/collection picker
- `SelectedResourceDisplay.tsx` - Display selected resource
- `PreviewErrorBoundary.tsx` - Error fallback
- `PreviewSkeleton.tsx` - Loading placeholder
- `EmptyPreviewState.tsx` - No content message

**Settings Components** (`preview/settings/`):
- `SettingField.tsx` - Base wrapper (label + input)
- `TextSetting.tsx` - Text/textarea inputs
- `NumberSetting.tsx` - Number/range inputs
- `CheckboxSetting.tsx` - Boolean toggle
- `SelectSetting.tsx` - Dropdown selector
- `RadioSetting.tsx` - Radio group
- `ColorSetting.tsx` - Hex color picker
- `ImageSetting.tsx` - Image upload/picker
- `ImagePickerModal.tsx` - Image selection modal
- `TextAlignmentSetting.tsx` - Text alignment selector
- `VideoSetting.tsx` - Video upload
- `VideoUrlSetting.tsx` - Video URL input
- `ProductSetting.tsx` - Product selector
- `ProductListSetting.tsx` - Multiple product selector
- `CollectionSetting.tsx` - Collection selector
- `CollectionListSetting.tsx` - Multiple collection selector
- `ArticleSetting.tsx` - Blog article selector
- `BlogSetting.tsx` - Blog selector
- `PageSetting.tsx` - Shop page selector
- `LinkListSetting.tsx` - Link collection selector

**Liquid Context Drops** (`preview/drops/`):
Provide Liquid template variables (mock data):
- `ShopifyDrop.ts` - Base drop class
- `ShopDrop.ts` - Shop object
- `ProductDrop.ts` - Product object
- `CollectionDrop.ts` - Collection object
- `ArticleDrop.ts` - Article/blog post
- `CustomerDrop.ts` - Customer object
- `CartDrop.ts` - Shopping cart
- `ImageDrop.ts` - Image object
- `MediaDrop.ts` - Media/video object
- `BlockDrop.ts` - Section block
- `ForloopDrop.ts` - Loop object
- `RequestDrop.ts` - HTTP request object
- `RoutesDrop.ts` - Route helpers
- `PaginateDrop.ts` - Pagination object
- `VariantDrop.ts` - Product variant
- `CollectionsDrop.ts` - Collections array

**Utilities** (`preview/utils/`):
- `buildPreviewContext.ts` - Build complete Liquid context
- `colorFilters.ts` - Color manipulation filters
- `liquidFilters.ts` - Shopify Liquid filters impl
- `htmlEscape.ts` - HTML escaping utilities
- Metafield, media, utility filter implementations
- Comprehensive test coverage

**Schema/Type Support** (`preview/schema/`):
- `SchemaTypes.ts` - TypeScript definitions for Liquid schema
- `index.ts` - Schema parsing/validation

**Hooks** (`preview/hooks/`):
- `usePreviewMessaging.ts` - iFrame communication
- `useLiquidRenderer.ts` - Liquid parsing/rendering
- `useResourceDetection.ts` - Detect Shopify resource types
- `useResourceFetcher.ts` - Fetch resource data

**Mock Data** (`preview/mockData/`):
- Test/demo data for preview rendering

**Key Patterns**:
- iFrame isolation for security
- Liquid template engine integration
- Dynamic settings UI generation
- Extensible drop system for Shopify objects
- Comprehensive Liquid filter library

---

#### **Home/Dashboard Components** (`app/components/home/`)
Landing page and onboarding.

**Files**:
- `SetupGuide.tsx` - Step-by-step onboarding wizard
- `News.tsx` - Featured news/updates feed
- `Analytics.tsx` - Usage analytics display
- `AnalyticsCard.tsx` - Individual stat card
- `index.ts` - Barrel export

**Tests**: SetupGuide.test.tsx, News.test.tsx

---

#### **Sections Components** (`app/components/sections/`)
Saved sections management and history.

**Files**:
- `HistoryTable.tsx` - Data table of saved sections
- `HistoryPreviewModal.tsx` - Section preview modal
- `DeleteConfirmModal.tsx` - Deletion confirmation
- `SectionsEmptyState.tsx` - No sections message
- `index.ts` - Barrel export

---

#### **Billing Components** (`app/components/billing/`)
Subscription and usage management.

**Files**:
- `UsageDashboard.tsx` - Overall usage display
- `QuotaProgressBar.tsx` - Usage progress visualization
- `UsageAlertBanner.tsx` - Quota warning banner
- `PlanSelector.tsx` - Plan upgrade selection
- `PlanCard.tsx` - Individual plan display
- `index.ts` - Barrel export

---

#### **Templates Components** (`app/components/templates/`)
Section template library.

**Files**:
- `TemplateGrid.tsx` - Grid of templates
- `TemplateCard.tsx` - Individual template card
- `TemplateEditorModal.tsx` - Template creation/editing
- `index.ts` - Barrel export

---

#### **Generations Components** (`app/components/generations/`)
Generated section history and management.

**Files**:
- `GenerationsEmptyState.tsx` - No generations message
- `DeleteConfirmModal.tsx` - Deletion confirmation
- `index.ts` - Barrel export

---

#### **Editor Components** (`app/components/editor/`)
Code editor integration.

**Files**: (Multiple editor-related components)

---

#### **Shared Components** (`app/components/shared/`)
Reusable UI primitives.

**Files**:
- `Button.tsx` - Styled button (primary/secondary)
- `Card.tsx` - Card container
- `Banner.tsx` - Info/warning/error banner
- `EmptyState.tsx` - Generic empty state
- `FilterButtonGroup.tsx` - Button group filter

---

### 1.2 Component Organization Patterns

- **Barrel exports**: Each domain has `index.ts` for grouped imports
- **Tests colocated**: `__tests__/` folders with `.test.ts(x)` files
- **Hooks colocated**: Feature-specific hooks stored with components
- **Settings pattern**: Extensible settings UI with individual types
- **Mock data**: Test data organized by concern

---

## 2. ROUTES DIRECTORY (`app/routes/`)

Remix/React Router file-based routing. Nested routes use dot notation.

### 2.1 Authentication Routes

**`auth.$.tsx`** - Auth catch-all fallback
**`auth.login/`** - Login flow
  - `route.tsx` - Main login page
  - `error.server.tsx` - Error handling

---

### 2.2 App Routes (Protected by `app.tsx`)

**`app.tsx`** - Root layout (navigation, AppProvider wrapper)

**`app._index.tsx`** - Home/dashboard page (GET)

**`app.settings.tsx`** - Settings page (GET/POST)

**`app.billing.tsx`** - Billing/subscription page (GET/POST)

**`app.sections.*`** - Section management:
  - `app.sections._index.tsx` - List all sections (GET)
  - `app.sections.$id.tsx` - View/edit section (GET/POST)
  - `app.sections.new.tsx` - Create new section (GET/POST)

**`app.templates.tsx`** - Template library page (GET)

**`app.additional.tsx`** - Additional resources (GET)

---

### 2.3 Public Routes

**`_index/route.tsx`** - Landing/home page (before login)

---

### 2.4 API Routes (Server-only, no UI)

**`api.chat.messages.tsx`** - POST messages, GET history (streaming)
**`api.chat.stream.tsx`** - Streaming chat responses
**`api.files.tsx`** - File upload/download
**`app.api.resource.tsx`** - Shopify resource queries (products, collections)

---

### 2.5 Webhook Routes (Shopify events)

**`webhooks.app.uninstalled.tsx`** - App uninstall event
**`webhooks.app.scopes_update.tsx`** - Scopes updated
**`webhooks.app.subscriptions_update.tsx`** - Billing updated

---

### 2.6 Route Patterns

- **Loaders** (`loader` function): Load data server-side
- **Actions** (`action` function): Handle form submissions
- **Error boundaries** (`ErrorBoundary` function): Catch errors
- **Headers** (`headers` function): Set response headers
- **Streaming**: Some routes use streaming (chat, large data)

---

## 3. SERVICES DIRECTORY (`app/services/`)

Business logic and external integrations, server-only (`.server.ts` suffix).

### 3.1 Core Services

**`ai.server.ts`**
- Google Gemini API integration
- System prompts for section generation
- Streaming response handling
- Code extraction and validation

**`chat.server.ts`**
- Multi-turn conversation management
- Message persistence
- Streaming support
- Context building for prompts

**`section.server.ts`**
- CRUD operations for saved sections
- Database queries (Prisma)
- Validation and error handling

**`template.server.ts`**
- Template library management
- Persistence and caching
- Seed data loading

**`theme.server.ts`**
- Shopify theme API integration
- List available themes
- Fetch theme files
- Upsert sections to themes

---

### 3.2 Integration Services

**`shopify-data.server.ts`**
- Shopify GraphQL queries
- Product, collection, article fetching
- Data formatting for preview

**`files.server.ts`**
- File upload handling
- Image processing
- Storage management

---

### 3.3 Admin/Business Logic

**`billing.server.ts`**
- Subscription management
- Usage tracking and quota checks
- Plan configuration
- Webhook handling for billing events

**`usage-tracking.server.ts`**
- Record AI generation usage
- Track section saves
- Analytics data

**`news.server.ts`**
- Fetch or manage news/updates
- Home page content

**`settings.server.ts`**
- User/shop settings persistence
- Preferences management

---

### 3.4 Adapter Pattern Services

**`adapters/`** - Dependency injection for swappable implementations:
- `ai-adapter.ts` - AI service interface
- `theme-adapter.ts` - Theme service interface
- `shopify-data-adapter.ts` - Shopify data interface

---

### 3.5 Feature Management

**`flags/`** - Feature flag system:
- `feature-flags.ts` - Flag definitions and logic
- `flag-utils.ts` - Helper utilities

---

### 3.6 Utilities

**`template-seeder.server.ts`** - Initialize template database

**Tests**: `__tests__/chat.server.test.ts` (unit tests)

---

## 4. TYPES DIRECTORY (`app/types/`)

TypeScript type definitions organized by domain.

### 4.1 Type Files

**`index.ts`** - Central barrel export of all types

**`shopify-api.types.ts`**
- `Theme`, `ThemeEdge`, `ThemesQueryResponse` - Theme types
- `ThemeFile`, `ThemeFileMetadata` - File structures
- `UserError`, `ThemeFilesUpsertResponse` - API responses
- `ServiceResult<T>` - Generic result wrapper

**`service.types.ts`**
- `AIGenerationOptions`, `AIGenerationResult` - AI generation
- `AIServiceInterface`, `ThemeServiceInterface` - Service contracts
- `GeneratedSectionRecord` - Database model
- `GenerateActionData`, `SaveActionData` - Route action types

**`billing.ts`**
- `PlanTier` - "starter" | "growth" | "professional"
- `SubscriptionStatus` - Various subscription states
- `ChargeStatus` - Charge states
- `PlanConfig`, `CreateSubscriptionInput`, `RecordUsageInput` - Config types
- `BillingCycle`, `BillingSummary` - Reporting types
- Re-exports Prisma-generated types

**`chat.types.ts`**
- `MessageRole` - "user" | "assistant" | "system"
- `UIMessage`, `ModelMessage` - Message structures
- `ConversationState`, `SendMessageRequest/Response` - API types
- `StreamEventType`, `StreamEvent` - Streaming event types
- `ConversationMeta` - Metadata

**`ai.types.ts`**
- `StreamingOptions` - Configuration for streaming
- `ConversationContext` - Current conversation state
- `CodeExtractionResult` - Parsed code output

**`dashboard.types.ts`** (recent)
- `DashboardStats` - Metrics (generations, sections, usage)
- `OnboardingState` - Onboarding progress
- `NewsItem` - News feed item
- `CTAState`, `CTAConfig` - Call-to-action state
- `DashboardLoaderData` - Route loader return type

---

## 5. UTILS DIRECTORY (`app/utils/`)

Shared utility functions, mostly pure.

### 5.1 Utility Modules

**`context-builder.ts`**
- `buildConversationPrompt()` - Format messages as prompt string
- `getChatSystemPrompt()` - Prepare system prompt
- `summarizeOldMessages()` - Compress older messages

**`code-extractor.ts`**
- `extractCodeFromResponse()` - Parse Liquid from AI response
- `isCompleteLiquidSection()` - Validate section completeness
- Returns `CodeExtractionResult` with code + metadata

**`input-sanitizer.ts`**
- `sanitizeUserInput()` - Remove XSS/injection risks
- `validateLiquidCode()` - Check Liquid syntax
- `sanitizeLiquidCode()` - Clean Liquid code

**`error-handler.ts`**
- `parseError()` - Normalize error objects
- `formatErrorMessage()` - User-friendly error text
- `withRetry<T>()` - Retry logic with exponential backoff

---

### 5.2 Testing

Tests colocated in `__tests__/` with corresponding source:
- `context-builder.test.ts`
- `code-extractor.test.ts`
- `input-sanitizer.test.ts`

---

## 6. HOOKS DIRECTORY (`app/hooks/`)

Custom React hooks (client-side only).

### 6.1 Hooks

**`useKeyboardShortcuts.ts`**
- `useKeyboardShortcuts()` - Attach keyboard event listeners
- `useChatInputShortcuts()` - Chat-specific shortcuts (Cmd+Enter send)
- `ShortcutConfig` - Type for shortcut definition

**Exports**:
```typescript
export function useKeyboardShortcuts({
  shortcuts: ShortcutConfig[],
  enabled?: boolean,
}): void

export function useChatInputShortcuts({
  onSend: () => void,
}): void
```

---

## 7. ARCHITECTURAL PATTERNS & DEPENDENCIES

### 7.1 Component Architecture

```
app.tsx (Root Layout)
├── Navigation (s-app-nav)
├── AppProvider (Shopify context)
└── Outlet (Nested routes)
    ├── Home Dashboard
    │   ├── SetupGuide
    │   ├── Analytics
    │   └── News
    ├── Sections
    │   ├── HistoryTable
    │   └── HistoryPreviewModal
    ├── Chat/Generate
    │   ├── GenerateLayout (2 column)
    │   ├── PromptInput
    │   └── CodePreview/SectionPreview
    ├── Preview
    │   ├── PreviewFrame (iFrame)
    │   ├── PreviewToolbar
    │   ├── ResourceSelector
    │   └── SettingsUI (dynamic)
    └── Billing
        ├── UsageDashboard
        └── PlanSelector
```

### 7.2 Data Flow

**Generation Flow**:
1. User enters prompt (GenerateLayout + PromptInput)
2. Form submission → api.chat.stream
3. AI service generates Liquid code
4. Code extracted and validated
5. Preview renders in iFrame (Liquid engine)
6. User can adjust settings → iFrame re-renders
7. Save action → theme.server.ts → Shopify API

**Chat Flow**:
1. Message input (ChatInput)
2. useChat hook manages state
3. POST api.chat.messages (streaming)
4. chat.server.ts processes with AI
5. Results streamed to client
6. MessageList displays with formatting

### 7.3 Service Dependencies

```
Routes
├── use AI.server (generation, streaming)
├── use Chat.server (conversation state)
├── use Theme.server (save to Shopify)
├── use Section.server (CRUD local sections)
├── use Shopify-data.server (queries)
├── use Billing.server (quota checks)
└── use Settings.server (preferences)

Components
├── use Preview utilities (Liquid rendering)
├── use Chat hooks (message state)
├── use Keyboard hooks (shortcuts)
└── use Shopify AppProvider (auth)
```

### 7.4 Technology Stack

- **Framework**: React Router (Remix) on Node.js
- **UI**: Shopify Polaris Web Components (`<s-*>`)
- **Styling**: CSS-in-JS (component scoped)
- **Templating**: Custom Liquid engine
- **ORM**: Prisma (SQLite default)
- **External APIs**: Google Gemini, Shopify Admin/GraphQL
- **TypeScript**: Full type safety across services

---

## 8. FILE ORGANIZATION SUMMARY

```
app/
├── components/
│   ├── billing/          (5 files) - Usage and plan management
│   ├── chat/             (12 files) - AI chat UI + hooks
│   ├── editor/           (multiple) - Code editor
│   ├── generate/         (13 files) - Main generation workflow
│   ├── generations/      (3 files) - Generation history
│   ├── home/             (4 files) - Dashboard
│   ├── preview/          (45+ files) - Liquid rendering engine
│   │   ├── drops/        (15 drops) - Liquid variable objects
│   │   ├── settings/     (18 files) - Dynamic form inputs
│   │   ├── schema/       (schemas) - Type definitions
│   │   ├── utils/        (filters + tests) - Liquid filters
│   │   ├── mockData/     (test data)
│   │   ├── hooks/        (preview-specific)
│   │   └── [main files]  (core components)
│   ├── sections/         (4 files) - Saved sections UI
│   ├── shared/           (5 files) - Reusable primitives
│   ├── templates/        (3 files) - Template library
│   └── index.ts          (central export)
│
├── hooks/
│   └── useKeyboardShortcuts.ts
│
├── routes/
│   ├── auth.$.tsx
│   ├── auth.login/
│   │   ├── route.tsx
│   │   └── error.server.tsx
│   ├── app.tsx           (layout)
│   ├── app._index.tsx    (home)
│   ├── app.billing.tsx
│   ├── app.settings.tsx
│   ├── app.sections.*    (CRUD)
│   ├── app.templates.tsx
│   ├── _index/route.tsx  (public)
│   ├── api.chat.*        (streaming)
│   ├── api.files.tsx
│   ├── api.resource.tsx
│   └── webhooks.*        (Shopify events)
│
├── services/
│   ├── adapters/         (interface contracts)
│   ├── flags/            (feature flags)
│   ├── __tests__/        (unit tests)
│   ├── ai.server.ts      (Gemini)
│   ├── chat.server.ts    (conversation)
│   ├── section.server.ts (CRUD)
│   ├── template.server.ts
│   ├── theme.server.ts   (Shopify API)
│   ├── shopify-data.server.ts
│   ├── files.server.ts
│   ├── billing.server.ts
│   ├── usage-tracking.server.ts
│   ├── settings.server.ts
│   ├── news.server.ts
│   └── template-seeder.server.ts
│
├── types/
│   ├── index.ts          (central export)
│   ├── shopify-api.types.ts
│   ├── service.types.ts
│   ├── billing.ts
│   ├── chat.types.ts
│   ├── ai.types.ts
│   └── dashboard.types.ts
│
└── utils/
    ├── __tests__/
    ├── context-builder.ts
    ├── code-extractor.ts
    ├── input-sanitizer.ts
    └── error-handler.ts
```

---

## 9. KEY CONVENTIONS & BEST PRACTICES OBSERVED

1. **Server-only suffix**: `.server.ts` for server-side code (Prisma, API keys)
2. **Barrel exports**: Every directory has `index.ts` for grouped imports
3. **Tests colocated**: `__tests__/` folders alongside source
4. **Type safety**: Full TypeScript, no `any` types
5. **Adapter pattern**: Feature services use adapters for flexibility
6. **Separation of concerns**: Routes → Services → Utilities → Types
7. **Polaris Web Components**: Modern Shopify UI (`<s-*>` syntax)
8. **Hooks pattern**: Feature-specific hooks colocated with components
9. **Error boundaries**: Graceful error handling in components
10. **Responsive design**: CSS grid for adaptive layouts

---

## 10. UNRESOLVED QUESTIONS

- Does `/app/components/editor/` exist with additional components?
- What is the exact structure of mock data in `preview/mockData/`?
- Are there any utility functions shared across preview/drops?
- How are Prisma models structured in `prisma/schema.prisma`?

