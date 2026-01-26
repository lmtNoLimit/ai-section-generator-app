# AI Truncation Issue Debug Report

**Date**: 2026-01-26 19:56
**Status**: Investigation Complete
**Severity**: P1 - User-visible data loss
**Reporter**: Screenshot analysis + codebase investigation

---

## Executive Summary

User reports AI-generated Shopify Liquid sections appear "completed" but contain truncated/incomplete code. System has 4-phase anti-truncation architecture (maxOutputTokens, validation, auto-continuation, UI feedback) but issue persists. Root cause identified as **feature flag misconfiguration** preventing auto-continuation and validation from activating.

**Impact**: Users receive incomplete sections that fail when saved to theme, losing work and trust.

**Fix Complexity**: Low - single environment variable change.

---

## Symptoms (from Screenshot)

1. FAQ accordion section generation
2. Code panel shows truncated Liquid (ends mid-element: `<span>{{ block.settings.question }}</span>`)
3. AI message includes "CHANGES" comment (system thinks complete)
4. User sees "v1" version created
5. No warning badges/indicators visible
6. No continuation attempt occurred

**Expected Behavior**:
- Validation detects unclosed tags
- Auto-continuation triggered (1-2 additional API calls)
- UI shows "Auto-completed" badge OR "Potentially Incomplete" warning
- Final code contains complete closing tags

---

## Architecture Overview

### 4-Phase Anti-Truncation System (Jan 26, 2026)

```
Phase 01: Token Limits (DEPLOYED)
├─ maxOutputTokens: 65536 in GENERATION_CONFIG
├─ Prevents truncation at default ~8K limit
└─ Feature Flag: FLAG_MAX_OUTPUT_TOKENS (default: true)

Phase 02: Validation (DEPLOYED)
├─ validateLiquidCompleteness() stack-based tag matching
├─ Detects: unclosed Liquid tags, unclosed HTML tags, invalid schema JSON
└─ Feature Flag: FLAG_VALIDATE_LIQUID (REQUIRED: 'true')

Phase 03: Auto-Continuation (DEPLOYED)
├─ Checks finishReason from Gemini API
├─ If MAX_TOKENS or validation fails → continuation prompt
├─ Merges responses with overlap detection
├─ Max 2 continuation attempts
└─ Feature Flag: FLAG_AUTO_CONTINUE (REQUIRED: 'true')

Phase 04: UI Feedback (DEPLOYED)
├─ CodeBlock badges: "Potentially Incomplete", "Auto-completed"
├─ MessageList continuation indicators
└─ Depends on Phases 02+03 metadata
```

---

## Root Cause Analysis

### Finding 1: Feature Flags Disabled by Default

**File**: `app/routes/api.chat.stream.tsx`
**Lines**: 145-221 (Auto-continuation block)

```typescript
// Line 145
if (process.env.FLAG_AUTO_CONTINUE === 'true') {
  let validation = validateLiquidCompleteness(fullContent);

  // Continue if truncated (MAX_TOKENS) or validation fails, max 2 attempts
  while (!validation.isComplete && continuationCount < MAX_CONTINUATIONS) {
    // ... continuation logic ...
  }
}
```

**Issue**: Block only executes if `FLAG_AUTO_CONTINUE === 'true'` (exact string match).

**Default Behavior**: Environment variables default to `undefined`, not `'true'`.

**Result**: System **skips entire auto-continuation block** for every generation.

---

### Finding 2: Validation Also Feature-Flagged

**File**: `app/utils/code-extractor.ts`
**Lines**: 381-385

```typescript
export function validateLiquidCompleteness(code: string): LiquidValidationResult {
  // Feature flag check - return valid if disabled
  if (process.env.FLAG_VALIDATE_LIQUID !== 'true') {
    return { isComplete: true, errors: [], warnings: [] };
  }
  // ... validation logic ...
}
```

**Issue**: Validator always returns `isComplete: true` when flag not set.

**Result**: Even if auto-continuation enabled, validator never reports errors.

---

### Finding 3: UI Feedback Relies on Backend Metadata

**File**: `app/components/chat/hooks/useChat.ts`
**Lines**: 233-293 (message_complete event handling)

```typescript
// Phase 4: Track completion metadata from server
let wasComplete = true;
let continuationCount = 0;

// ... later in message_complete event ...
wasComplete = event.data.wasComplete ?? true;
continuationCount = event.data.continuationCount ?? 0;
```

**File**: `app/routes/api.chat.stream.tsx`
**Lines**: 279-283

```typescript
// Determine completion status for Phase 4 UI feedback
const validation = process.env.FLAG_AUTO_CONTINUE === 'true'
  ? validateLiquidCompleteness(fullContent)
  : { isComplete: true };
const wasComplete = validation.isComplete;
```

**Issue**: If `FLAG_AUTO_CONTINUE !== 'true'`, server always sends `wasComplete: true`.

**Result**: UI never shows warning badges, even for truncated code.

---

## Flow Diagram: Current vs. Expected

### Current Flow (Flags Disabled)

```
User sends prompt
    ↓
Gemini generates response (may hit MAX_TOKENS at ~8K default)
    ↓
FLAG_MAX_OUTPUT_TOKENS check → maxOutputTokens: 65536 APPLIED ✓
    ↓
Stream tokens to client
    ↓
Response completes (finishReason: MAX_TOKENS or STOP)
    ↓
FLAG_AUTO_CONTINUE check → SKIPPED ✗ (env var undefined)
    ↓
Extract code (extractCodeFromResponse)
    ↓
Validation SKIPPED (FLAG_VALIDATE_LIQUID undefined)
    ↓
Save message with wasComplete: true (default)
    ↓
Send message_complete event { wasComplete: true, continuationCount: 0 }
    ↓
UI displays code WITHOUT warning badges
    ↓
User sees incomplete code, thinks it's complete ✗
```

### Expected Flow (Flags Enabled)

```
User sends prompt
    ↓
Gemini generates (with maxOutputTokens: 65536)
    ↓
Stream tokens
    ↓
Response completes (finishReason: MAX_TOKENS)
    ↓
FLAG_AUTO_CONTINUE === 'true' → ENTER continuation block ✓
    ↓
validateLiquidCompleteness(fullContent)
    ↓
FLAG_VALIDATE_LIQUID === 'true' → RUN validators ✓
    ↓
Stack-based tag matching finds unclosed tags
    ↓
validation.isComplete = false, errors = [...]
    ↓
WHILE loop enters (continuationCount < 2)
    ↓
Emit continuation_start event → UI shows "Continuing..." ✓
    ↓
buildContinuationPrompt(original, partial, errors)
    ↓
Gemini continuation request
    ↓
Stream continuation tokens
    ↓
mergeResponses(original, continuation) → overlap detection ✓
    ↓
Re-validate merged content
    ↓
validation.isComplete = true OR continuationCount = 2
    ↓
Emit continuation_complete event
    ↓
Save message with wasComplete: true, continuationCount: 1
    ↓
UI shows "Auto-completed" badge ✓
    ↓
User sees complete code with feedback ✓
```

---

## Code Locations

### AI Service (ai.server.ts)

**Line 11-13**: GENERATION_CONFIG with maxOutputTokens
```typescript
const GENERATION_CONFIG = process.env.FLAG_MAX_OUTPUT_TOKENS !== 'false'
  ? { maxOutputTokens: 65536, temperature: 0.7 }
  : { temperature: 0.7 };
```
**Status**: ✓ Working (defaults to enabled, uses !== 'false')

**Line 577-587**: finishReason callback in generateWithContext
```typescript
// Get finish reason and expose via callback for auto-continuation
const aggregatedResponse = await result.response;
const finishReason = aggregatedResponse.candidates?.[0]?.finishReason;

// Log non-STOP finish reasons for monitoring
if (finishReason && finishReason !== 'STOP') {
  console.warn(`[ai.server] generateWithContext finishReason: ${finishReason}`);
}

// Expose finish reason to caller for continuation logic
options?.onFinishReason?.(finishReason);
```
**Status**: ✓ Working (exposes finishReason to stream endpoint)

---

### Stream Endpoint (api.chat.stream.tsx)

**Line 126-128**: onFinishReason callback registration
```typescript
const generator = aiService.generateWithContext(sanitizedContent, context, {
  onFinishReason: (reason) => { lastFinishReason = reason; }
});
```
**Status**: ✓ Working (captures finishReason)

**Line 145-221**: Auto-continuation block
```typescript
// Auto-continuation logic (feature flag controlled)
if (process.env.FLAG_AUTO_CONTINUE === 'true') {
  let validation = validateLiquidCompleteness(fullContent);

  // Continue if truncated (MAX_TOKENS) or validation fails, max 2 attempts
  while (!validation.isComplete && continuationCount < MAX_CONTINUATIONS) {
    continuationCount++;

    // Notify client of continuation attempt
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'continuation_start',
      data: {
        attempt: continuationCount,
        reason: lastFinishReason === 'MAX_TOKENS' ? 'token_limit' : 'incomplete_code',
        errors: validation.errors.map(e => e.message)
      }
    })}\n\n`));

    // ... continuation logic ...

    // Merge responses with overlap detection
    fullContent = mergeResponses(fullContent, continuationContent);

    // Re-validate merged content
    validation = validateLiquidCompleteness(fullContent);

    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'continuation_complete',
      data: {
        attempt: continuationCount,
        isComplete: validation.isComplete,
        totalLength: fullContent.length
      }
    })}\n\n`));
  }
}
```
**Status**: ✗ BLOCKED (flag check prevents execution)

**Line 279-296**: Completion metadata
```typescript
// Determine completion status for Phase 4 UI feedback
const validation = process.env.FLAG_AUTO_CONTINUE === 'true'
  ? validateLiquidCompleteness(fullContent)
  : { isComplete: true };
const wasComplete = validation.isComplete;

// Send completion event with Phase 4 metadata
controller.enqueue(encoder.encode(`data: ${JSON.stringify({
  type: 'message_complete',
  data: {
    messageId: assistantMessage.id,
    codeSnapshot: sanitizedCode,
    hasCode: extraction.hasCode,
    changes: extraction.changes,
    wasComplete, // Phase 4: true if code complete after all continuations
    continuationCount, // Phase 4: number of continuation attempts
  },
})}\n\n`));
```
**Status**: ✗ Defaults to `{ isComplete: true }` when flag disabled

---

### Validation (code-extractor.ts)

**Line 381-385**: Feature flag check
```typescript
export function validateLiquidCompleteness(code: string): LiquidValidationResult {
  // Feature flag check - return valid if disabled
  if (process.env.FLAG_VALIDATE_LIQUID !== 'true') {
    return { isComplete: true, errors: [], warnings: [] };
  }
  // ... validation logic ...
}
```
**Status**: ✗ Returns false positive when flag disabled

**Line 226-274**: Liquid tag validation (stack-based)
```typescript
function validateLiquidTags(code: string): LiquidValidationError[] {
  const stack: Array<{ tag: string; index: number }> = [];
  const tagPattern = /\{%[-\s]*(end)?(\w+)(?:[^%]*?)%\}/g;

  // ... stack-based matching ...

  // Report remaining unclosed tags
  for (const { tag } of stack) {
    errors.push({
      type: 'unclosed_liquid_tag',
      tag,
      message: `Unclosed Liquid tag: {% ${tag} %} missing {% end${tag} %}`
    });
  }
}
```
**Status**: ✓ Logic correct, but never called

---

### UI Feedback (CodeBlock.tsx)

**Line 82-93**: Completion badges
```typescript
{/* Phase 4: Completion status badges */}
{completionStatus === 'potentially-incomplete' && (
  <s-tooltip id="incomplete-tooltip">
    <span slot="content">AI output may be incomplete. Some code may be missing.</span>
    <s-badge tone="warning">Potentially Incomplete</s-badge>
  </s-tooltip>
)}
{completionStatus === 'complete' && continuationCount > 0 && (
  <s-tooltip id="autocomplete-tooltip">
    <span slot="content">AI continued {continuationCount} time(s) to complete this section.</span>
    <s-badge tone="success">Auto-completed</s-badge>
  </s-tooltip>
)}
```
**Status**: ✓ Logic correct, but never receives `continuationCount > 0`

---

## Environment Configuration Issues

### Current State (Inferred)

```bash
# .env (ASSUMED - not confirmed due to privacy block)
GEMINI_API_KEY=<key>
# FLAG_MAX_OUTPUT_TOKENS=<not set or 'false'> → Defaults to enabled (good)
# FLAG_VALIDATE_LIQUID=<not set> → Defaults to disabled (BAD)
# FLAG_AUTO_CONTINUE=<not set> → Defaults to disabled (BAD)
```

### Required State

```bash
# .env (REQUIRED for full anti-truncation system)
GEMINI_API_KEY=<key>
FLAG_MAX_OUTPUT_TOKENS=true    # Enable 65K token limit (default: enabled)
FLAG_VALIDATE_LIQUID=true      # Enable stack-based validation (CRITICAL)
FLAG_AUTO_CONTINUE=true        # Enable auto-continuation (CRITICAL)
```

---

## Detection Gaps

### 1. No Runtime Warning for Disabled Flags

**Issue**: System silently degrades when flags disabled. No logs, warnings, or admin alerts.

**Example**: When `FLAG_AUTO_CONTINUE !== 'true'`, stream endpoint logs nothing.

**Impact**: Operators don't know system is degraded until user complaints.

### 2. Default Values Unsafe

**Issue**: Code uses `=== 'true'` checks, requiring explicit opt-in.

**Design Choice**: Intentional safety during development/rollout, but dangerous in production.

**Impact**: Forgetting to set flag = silent feature disable.

### 3. Flag Coupling Not Documented in Code

**Issue**: Phase 04 UI requires Phase 03 auto-continuation, but no runtime check.

**Example**: Setting `FLAG_AUTO_CONTINUE=false` breaks Phase 04 UI without error.

**Impact**: Partial feature disablement causes confusing UX.

---

## Potential Fixes (Not Implemented)

### Fix 1: Enable Required Flags (IMMEDIATE)

**Change**: Add to `.env`:
```bash
FLAG_VALIDATE_LIQUID=true
FLAG_AUTO_CONTINUE=true
```

**Impact**: Activates all 4 phases, restores intended behavior.

**Risk**: Low - system designed for this configuration.

**Testing**: Generate complex section (FAQ, carousel), verify:
- No truncated code
- "Auto-completed" badge appears if continuation occurred
- Server logs show `continuation_start`/`continuation_complete` events

---

### Fix 2: Change Default Behavior (MEDIUM TERM)

**Change**: Invert flag logic to opt-out instead of opt-in:

```typescript
// Current (unsafe default)
if (process.env.FLAG_AUTO_CONTINUE === 'true') { ... }

// Proposed (safe default)
if (process.env.FLAG_AUTO_CONTINUE !== 'false') { ... }
```

**Impact**: Features enabled by default, can be disabled for debugging.

**Risk**: Medium - requires testing all flag combinations.

**Files to Change**:
- `app/routes/api.chat.stream.tsx` (line 145)
- `app/utils/code-extractor.ts` (line 382)

---

### Fix 3: Add Runtime Health Checks (LONG TERM)

**Change**: Log warnings at server startup:

```typescript
// app/entry.server.tsx or shopify.server.ts
if (process.env.FLAG_VALIDATE_LIQUID !== 'true') {
  console.warn('[HEALTH] FLAG_VALIDATE_LIQUID disabled - truncation detection off');
}
if (process.env.FLAG_AUTO_CONTINUE !== 'true') {
  console.warn('[HEALTH] FLAG_AUTO_CONTINUE disabled - auto-continuation off');
}
```

**Impact**: Operators see warnings in logs at startup.

**Risk**: Low - adds observability.

---

### Fix 4: Add Admin Dashboard Indicator (FUTURE)

**Change**: Show feature flag status in `/app/settings` or dashboard.

**UI Example**:
```
Anti-Truncation System Status:
✓ Token Limits: Enabled (65,536 max)
✗ Validation: Disabled (FLAG_VALIDATE_LIQUID)
✗ Auto-Continuation: Disabled (FLAG_AUTO_CONTINUE)
✗ UI Feedback: Degraded (depends on validation)
```

**Impact**: Users/admins can verify system health.

**Risk**: Low - UI-only change.

---

## Testing Strategy (for Fixes)

### Test 1: Generate Complex Section

**Prompt**: "Create an FAQ accordion section with 8 questions and answers, rich HTML descriptions, icon support, and collapsible sections."

**Expected**:
- Code > 4K characters
- All Liquid tags closed (validate manually)
- Schema JSON valid
- If continuation occurred: "Auto-completed" badge visible

**Validation**:
```bash
# Server logs should show:
[ai.server] generateWithContext finishReason: STOP
# OR (if hit limit):
[ai.server] generateWithContext finishReason: MAX_TOKENS
# continuation_start event logged
# continuation_complete event logged
```

---

### Test 2: Verify Flag Behavior

**Steps**:
1. Disable flag: `FLAG_AUTO_CONTINUE=false`
2. Generate section
3. Check: No continuation events in logs
4. Enable flag: `FLAG_AUTO_CONTINUE=true`
5. Generate section
6. Check: Continuation events appear (if needed)

**Expected**: Flag controls behavior as documented.

---

### Test 3: UI Badge Rendering

**Steps**:
1. Find existing message with `continuationCount > 0` in DB
2. Load editor page
3. Check: CodeBlock shows "Auto-completed" badge
4. Find message with `wasComplete: false` (if exists)
5. Check: CodeBlock shows "Potentially Incomplete" badge

**Expected**: UI reflects backend metadata.

---

## Unresolved Questions

1. **Environment Parity**: Are flags enabled in development but disabled in production? (Check deployment config)
2. **Feature Flag Strategy**: Should flags default to enabled or disabled post-launch?
3. **Monitoring**: Are server logs aggregated for `finishReason` analysis? (Track MAX_TOKENS frequency)
4. **User Data**: How many existing sections in DB are truncated? (Query for `wasComplete: false` or short content length)
5. **Rollback Plan**: If auto-continuation causes issues, how quickly can flags be disabled? (Restart required?)
6. **Documentation**: Is flag configuration documented in deployment guide? (Check `docs/deployment-guide.md`)
7. **Testing Coverage**: Do integration tests verify flag behavior? (Check `tests/` directory)

---

## References

**Related Plans**:
- `plans/260126-1009-ai-section-incomplete-output/plan.md` - Master plan (4 phases)
- `plans/260126-1009-ai-section-incomplete-output/phase-01-token-limits.md`
- `plans/260126-1009-ai-section-incomplete-output/phase-02-liquid-validation.md`
- `plans/260126-1009-ai-section-incomplete-output/phase-03-auto-continuation.md`
- `plans/260126-1009-ai-section-incomplete-output/phase-04-ui-feedback.md`

**Recent Commits** (all Jan 26, 2026):
- `06f5ddf` - Phase 04 UI feedback
- `d3c749a` - Phase 03 auto-continuation
- `a28395f` - Phase 02 validation
- `0223efb` - Phase 01 maxOutputTokens

**Key Files**:
- `app/services/ai.server.ts` - Lines 11-13 (config), 577-587 (finishReason)
- `app/routes/api.chat.stream.tsx` - Lines 145-221 (continuation), 279-296 (metadata)
- `app/utils/code-extractor.ts` - Lines 381-465 (validation + merging)
- `app/components/chat/CodeBlock.tsx` - Lines 82-93 (badges)
- `app/components/chat/hooks/useChat.ts` - Lines 233-328 (event handling)

---

**Report End** | Next Steps: User decision on fix implementation
