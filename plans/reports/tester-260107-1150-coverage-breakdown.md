# Code Coverage Breakdown by Component

**Overall Coverage**: 25.91% Statements | 23.24% Branches | 19.86% Functions | 26.49% Lines

---

## Coverage by Directory

### 🟢 Well-Tested (>70%)

#### `app/components/chat/hooks/`
- **useAutoScroll.ts**: 100% ✅ (Complete coverage)
  - All code paths tested
  - Branch and function coverage complete

### 🟡 Moderately Tested (40-70%)

#### `app/components/chat/`
| Component | Statements | Branches | Functions | Lines | Status |
|-----------|-----------|----------|-----------|-------|--------|
| MessageItem.tsx | 83.75% | 72.81% | 69.23% | 85.91% | ✅ Good |
| VersionCard.tsx | 83.33% | 95.83% | 50% | 80.95% | ✅ Good |
| useChat.ts | 76.29% | 59.32% | 71.42% | 77.34% | ✅ Decent |
| CodeBlock.tsx | 64.7% | 75% | 50% | 68.75% | ✅ Decent |
| ChatInput.tsx | 47.54% | 47.16% | 33.33% | 48.27% | ⚠️ Basic |
| PromptEnhancer.tsx | 58.13% | 29.26% | 36.36% | 59.52% | ⚠️ Basic |
| PromptTemplates.tsx | 53.33% | 41.66% | 16.66% | 57.14% | ⚠️ Basic |

#### `app/components/chat/utils/`
- suggestion-engine.ts: 42.1% | 23.07% | 50% | 42.1% (Basic)
- section-type-detector.ts: 12.5% | 0% | 0% | 12.5% (⚠️ Critical gap)

### 🔴 Poorly Tested (<40%)

#### `app/components/chat/` (continued)
| Component | Statements | Branches | Functions | Lines | Status |
|-----------|-----------|----------|-----------|-------|--------|
| SuggestionChips.tsx | 3.57% | 0% | 0% | 4% | 🔴 Almost untested |
| ThemeContextBadge.tsx | 20% | 0% | 0% | 25% | 🔴 Nearly untested |
| useStreamingProgress.ts | 43.33% | 0% | 37.5% | 50% | ⚠️ Low coverage |

#### `app/components/common/` (0% coverage)
- EmptySearchResult.tsx: 0%

#### `app/components/editor/` (Mostly 0%)
| Component | Status | Impact |
|-----------|--------|--------|
| CodeDiffView.tsx | 0% | User-facing diff view untested |
| CodePreviewPanel.tsx | 0% | User-facing preview untested |
| SchemaValidation.tsx | 0% | Critical validation logic untested |
| FeedbackWidget.tsx | 0% | User feedback collection untested |
| ChatPanelWrapper.tsx | 0% | Wrapper component untested |

#### `app/components/billing/` (0% coverage - CRITICAL)
| Component | Purpose | Coverage |
|-----------|---------|----------|
| CostProjection.tsx | Cost estimation UI | 0% 🔴 |
| PlanCard.tsx | Plan selection display | 0% 🔴 |
| PlanSelector.tsx | Plan picker component | 0% 🔴 |
| QuotaProgressBar.tsx | Usage quota visualization | 0% 🔴 |
| TrialBanner.tsx | Trial status display | 0% 🔴 |
| UpgradePrompt.tsx | Upgrade modal | 0% 🔴 |
| UsageAlertBanner.tsx | Usage alert display | 0% 🔴 |
| UsageDashboard.tsx | Usage overview | 0% 🔴 |
| UsageHistory.tsx | Usage history view | 0% 🔴 |

#### `app/components/home/`
- News.tsx: 0%
- SetupGuide.tsx: 0%

#### `app/components/preview/` (Mostly 0%)
- Preview hooks & schemas: Mostly untested
- usePreviewRenderer.ts: 0%
- usePreviewSettings.ts: 0%
- parseSchema.ts: 0%

#### `app/services/` (Minimal coverage)
- chat.server.ts: Partial (has tests but incomplete mocks)
- Other services: Mostly 0%

#### `app/routes/` (Almost all 0%)
- Most route files have 0% coverage
- Critical paths: api.chat, api.generate, api.publish, api.feedback all untested
- Database operations not covered

---

## Coverage Gaps Analysis

### 🔴 CRITICAL GAPS (Business Impact)

**1. Billing System (0% coverage)**
- **Risk**: Payment processing untested
- **Impact**: Revenue, usage tracking, plan management
- **Files**:
  - PlanCard.tsx (plan selection)
  - QuotaProgressBar.tsx (usage limits)
  - UpgradePrompt.tsx (user upgrade flow)
  - UsageDashboard.tsx (usage display)
  - UsageHistory.tsx (usage tracking history)
- **Required Tests**:
  - Plan selection flow
  - Usage quota validation
  - Upgrade modal interactions
  - Cost projection calculations
  - Trial period handling

**2. Editor Components (0% coverage)**
- **Risk**: Core user editing experience untested
- **Impact**: Section editing, code preview, schema validation
- **Files**:
  - CodeDiffView.tsx (show changes to user)
  - CodePreviewPanel.tsx (preview edited code)
  - SchemaValidation.tsx (validate section schema)
  - FeedbackWidget.tsx (collect user feedback)
- **Required Tests**:
  - Schema validation logic
  - Diff rendering
  - Preview updates
  - Validation error messages

**3. Route Handlers (0% coverage)**
- **Risk**: API endpoints untested
- **Impact**: Data consistency, error handling, security
- **Files**:
  - api.chat.tsx (chat endpoint)
  - api.generate.tsx (generation endpoint)
  - api.publish.tsx (save to theme)
  - api.feedback.tsx (already has tests but mostly failing)
  - Other API routes
- **Required Tests**:
  - Request validation
  - Authentication checks
  - Error handling
  - Response formats
  - Database transactions

**4. Preview System (0% coverage)**
- **Risk**: Live preview feature untested
- **Impact**: User sees accurate previews before saving
- **Files**:
  - usePreviewRenderer.ts
  - usePreviewSettings.ts
  - parseSchema.ts
  - Schema parsing and rendering logic
- **Required Tests**:
  - Schema parsing
  - Settings transformation
  - Preview context injection
  - Error handling

---

## Component Test Status Matrix

### Chat Components
```
✅ MessageItem .................. 83.75%
✅ VersionCard .................. 83.33%
✅ useChat hook ................. 76.29%
✅ CodeBlock .................... 64.7%
⚠️  ChatInput ................... 47.54%
⚠️  PromptEnhancer .............. 58.13%
⚠️  PromptTemplates ............. 53.33%
⚠️  useStreamingProgress ........ 43.33%
🔴 SuggestionChips ............. 3.57%
🔴 ThemeContextBadge ........... 20%
🔴 VersionBadge ................ 0%
🔴 VersionTimeline ............. 0%
🔴 MessageList ................. 0%
🔴 ChatPanel ................... 0%
```

### Billing Components (All 0%)
```
🔴 All 9 billing components ... 0%
```

### Editor Components (All 0%)
```
🔴 CodeDiffView ................ 0%
🔴 CodePreviewPanel ............ 0%
🔴 SchemaValidation ............ 0%
🔴 FeedbackWidget .............. 0%
🔴 ChatPanelWrapper ............ 0%
```

### Preview Components (Mostly 0%)
```
🔴 usePreviewRenderer .......... 0%
🔴 usePreviewSettings .......... 0%
🔴 parseSchema ................. 0%
```

### Services
```
⚠️  chat.server ................ Partial (failing tests)
🔴 Other services .............. 0%
```

### Routes
```
🔴 Most routes ................. 0%
```

---

## Coverage by Test Type

### Unit Tests
- **Components**: ~30% (mostly chat components)
- **Utilities**: ~40% (code extractors, sanitizers, context builders)
- **Hooks**: ~75% (useChat, useAutoScroll)
- **Services**: ~20% (chat.server partial, others missing)

### Integration Tests
- **Routes**: ~0% (api endpoints untested)
- **Database operations**: ~0% (Prisma operations untested in context)
- **API flows**: ~0% (end-to-end paths untested)

### E2E Tests
- **Status**: Unknown (Playwright configured but not run)

---

## Highest Priority Coverage Improvements

### Must Test (Critical Path)
1. **Billing Flow** (0% → 70%)
   - Test files needed: 9 test files (one per component)
   - Estimated effort: 40-50 hours
   - Impact: Revenue-critical functionality

2. **API Route Handlers** (0% → 70%)
   - Test files needed: 8+ route test files
   - Estimated effort: 50-60 hours
   - Impact: System reliability, data integrity

3. **Preview System** (0% → 70%)
   - Test files needed: 3-5 test files
   - Estimated effort: 25-30 hours
   - Impact: User experience, preview accuracy

### Should Test (Important Path)
4. **Editor Components** (0% → 50%)
   - Test files needed: 4-5 test files
   - Estimated effort: 20-25 hours
   - Impact: User editing experience

### Could Test (Nice to Have)
5. **Remaining Chat Components** (30% → 80%)
   - Test files needed: 5-6 test files
   - Estimated effort: 15-20 hours
   - Impact: Chat feature reliability

---

## Notes

- **Coverage Tool**: Jest with code coverage report
- **Baseline**: 25.91% overall (very low for production)
- **Industry Standard**: 70-80% for critical paths
- **Project Target**: Recommend 70%+ for new code, 60%+ for existing
- **Test Count**: 779 tests is good quantity, but distributed unevenly
- **Quality**: Some tests failing due to mock misalignment

---

**Report Generated**: 2026-01-07
**Coverage Data From**: `npm run test:coverage` output
**Last Updated**: 2026-01-07 11:50
