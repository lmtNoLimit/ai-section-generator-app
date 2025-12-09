# Plan: Improve AI System Prompt for Shopify Section Generation

**Created**: 2025-12-09
**Updated**: 2025-12-09
**Target File**: `/Users/lmtnolimit/working/ai-section-generator/app/services/ai.server.ts`
**Status**: 75% Complete (Phase 3 Manual Testing Pending)

## Problem

Current 65-line system prompt produces Liquid sections with schema errors due to:
- Missing input type validation rules (35 types, only ~5 documented)
- No block configuration guidance
- No default value rules per type
- No richtext/range/select validation rules

## Solution

Rewrite SYSTEM_PROMPT with comprehensive Shopify documentation-compliant guidance (~200 lines).

## Phases

| Phase | Title | File | Effort | Status |
|-------|-------|------|--------|--------|
| 1 | Rewrite SYSTEM_PROMPT | [phase-01-rewrite-prompt.md](./phase-01-rewrite-prompt.md) | High | ✅ DONE (Implemented 2025-12-09) |
| 2 | Add Validation Examples | [phase-02-add-examples.md](./phase-02-add-examples.md) | Medium | ✅ DONE (Implemented 2025-12-09) |
| 3 | Testing & Validation | [phase-03-testing.md](./phase-03-testing.md) | Low | ⏳ Pending Manual Testing |

## Key Changes Summary

**Add**:
- Complete input type catalog (35 types)
- Per-type validation rules (range requires min/max/step, select requires options, etc.)
- Block configuration guidance (type, name, settings, title precedence)
- Default value rules per type (number vs string, richtext wrapping, etc.)
- Template restriction guidance (enabled_on/disabled_on)

**Remove**:
- Overly brief input type coverage
- Ambiguous default value guidance

**Preserve**:
- CSS scoping with section.id
- Plain text labels (no translation keys)
- Section name 25-char limit
- Semantic HTML, responsive, ai- prefix rules

## Success Criteria

1. Generated sections pass Shopify theme check validation
2. No runtime schema errors in theme editor
3. Prompt under 250 lines (token efficiency)
4. All 35 input types documented with validation rules

## Dependencies

- Research documents in `./research/` directory
- No external dependencies

## Risk Assessment

| Risk | Mitigation | Status |
|------|------------|--------|
| Prompt too long (token bloat) | Keep under 250 lines, use concise format | ✅ Met (157 lines) |
| AI ignores rules | Test with edge cases, iterate on wording | ⏳ Pending Phase 3 Testing |
| Missing edge cases | Include common error patterns to avoid | ✅ Included |

## Code Review Summary

**Reviewed**: 2025-12-09
**Report**: [code-reviewer-251209-ai-system-prompt-review.md](./reports/code-reviewer-251209-ai-system-prompt-review.md)

**Status**: GOOD WITH CRITICAL GAP ⚠️

**Findings**:
- Critical Issues: 0 ✅
- High Priority: 2 (Test coverage missing, token efficiency)
- Medium Priority: 3 (Maintainability, validation, consistency)
- Low Priority: 3 (Minor fixes)

**Key Results**:
- ✅ Security: No vulnerabilities detected
- ✅ Type Safety: 100% coverage
- ✅ Build: Passes all checks
- ⚠️ Tests: 0% coverage for AIService (critical gap)

**Next Actions**:
1. **P1**: Create test suite at `/app/services/__tests__/ai.server.test.ts`
2. **P2**: Fix JSON comment inconsistency (lines 82-102)
3. **P2**: Add input validation to `generateSection()`
4. **P2**: Monitor token usage/API costs
