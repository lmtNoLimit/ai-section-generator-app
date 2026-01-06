# Test Suite Report: AI Service System Prompt Update

**Date:** 2026-01-06 | **Time:** 14:21
**Test Command:** `npm test`
**Change:** Added resource picker patterns documentation to SYSTEM_PROMPT (lines 174-220)

## Summary
- **Result:** FAILED - 17 tests failed, 684 passed
- **Test Suites:** 2 failed, 27 passed (29 total)
- **Execution Time:** 1.611s
- **Prompt Change Impact:** NONE - failures are pre-existing mock configuration issues

### ✗ Failed: 17 tests

#### 1. ChatService (2 failures)
**File:** `app/services/__tests__/chat.server.test.ts`

**Tests:**
- `addAssistantMessage › creates assistant message with code snapshot`
- `addAssistantMessage › increments totalTokens when tokenCount provided`

**Issue:** `prisma.message.findMany` not mocked. Line 106-112 in `chat.server.ts`:
```typescript
const recentMessages = await prisma.message.findMany({ ... });
if (recentMessages.length < 1) return null;  // Fails: undefined
```

**Error:** `TypeError: Cannot read properties of undefined (reading 'length')`

**Fix:** Add to mock setup (line 9-22):
```typescript
message: {
  findMany: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
}
```

---

#### 2. API Feedback Route (15 failures)
**File:** `app/routes/__tests__/api.feedback.test.tsx`

**Tests:** 15 failures across validation, storage, response handling, security, feedback data suites

**Pattern:**
- Tests expect `(result as any).init.status` & `(result as any).data` structure
- Implementation returns `data()` from React Router (different format)
- Mock assertions expect database calls that never fire
- Mock responses don't match test expectations

**Example Failures:**
- Status code returns 400 instead of expected 404 (lines 125, 251, 272, 305)
- Mock never called (lines 132, 146, 373)
- Property undefined: `data.success` (lines 262, 284)
- Array access fails: `calls[0]` undefined (lines 330, 345)

**Root:** Mock setup incompleteness vs. implementation mismatch:
1. Form validation logic reaches ObjectId check before db query
2. Response format doesn't match test structure expectations
3. Mock return objects incomplete

---

## Analysis

### Prompt Change Impact: NONE
- Lines 174-220 added: Pure documentation in string constant
- No logic changes, no new behavior
- Failures pre-exist (unrelated to this PR)

### Pre-existing Status
Git history shows last test file changes were from older commits. Failures are not caused by the resource picker patterns documentation.

### Coverage
Tests blocked on mock issues. Cannot generate coverage report until mocks fixed.

---

## Issues & Fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| ChatService: `findMany` unmocked | HIGH | Add mock return: `[]` |
| API Feedback: response format mismatch | HIGH | Review React Router 7 `data()` response structure |
| API Feedback: incomplete mocks | HIGH | Complete mock setup for all prisma calls |
| Test structure assumptions | MEDIUM | Verify actual return types match test expectations |

---

## Recommendations

**Immediate (Before Merge):**
1. Mock `prisma.message.findMany` with `mockResolvedValue([])`
2. Review actual vs. expected response format for `api.feedback`
3. Verify form parsing in authentication mock

**Ongoing:**
1. Create shared Prisma mock factory for tests
2. Document action function response formats
3. Add integration tests (not just mocked)

---

## Files

**Source:** `/Users/lmtnolimit/working/ai-section-generator/app/services/ai.server.ts` (lines 174-220)
**Failing Tests:**
- `/Users/lmtnolimit/working/ai-section-generator/app/services/__tests__/chat.server.test.ts` (2 failures)
- `/Users/lmtnolimit/working/ai-section-generator/app/routes/__tests__/api.feedback.test.tsx` (15 failures)

---

## Unresolved Questions

1. Should prompt content have unit tests? (Currently none)
2. What is correct React Router 7 `data()` response structure?
3. Was API feedback route fully tested before this PR?
4. Are ChatService duplicate prevention tests intentionally testing `checkForExistingAssistantResponse`?
