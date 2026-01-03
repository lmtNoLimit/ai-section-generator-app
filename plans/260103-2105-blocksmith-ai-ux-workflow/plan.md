---
title: "Blocksmith: AI Interaction & UX Workflow"
description: "Complete AI-powered section generation workflow with prompt enhancement, live build progress, element targeting, surgical diffs, and smart publishing"
status: pending
priority: P1
effort: 32h
branch: main
tags: [ai-ux, streaming, visual-editing, hmr, polaris]
created: 2026-01-03
---

# Blocksmith: AI Interaction & UX Workflow

## Overview

Implement a complete AI Interaction & UX Workflow system for Blocksmith, organized into 4 major "Acts" that transform the user experience from initial prompt to published section. This plan leverages existing SSE streaming infrastructure, extends the chat/version state management, and introduces new visual editing capabilities.

**Goal**: Create a seamless, delightful experience that guides merchants through AI section generation with contextual awareness, real-time feedback, and collaborative refinement.

## Current State

- SSE streaming via `ai.server.ts` with `generateSectionStream()` and `generateWithContext()`
- Version state management via `useVersionState` hook with auto-apply
- Chat panel with message rendering and code snapshots
- Preview iframe with `usePreviewMessaging` for postMessage communication
- 3-column layout via `PolarisEditorLayout` (Chat | Preview/Code | Settings)

## Architecture Principles

- **YAGNI**: Build only what's needed for each phase
- **KISS**: Simple solutions over complex abstractions
- **DRY**: Leverage existing hooks (`useVersionState`, `useEditorState`, `usePreviewMessaging`)
- **Polaris Web Components**: Maintain native Shopify admin UX

## Phases Overview

| Phase | Title | Priority | Effort | Description |
|-------|-------|----------|--------|-------------|
| 01 | [Prompt Enhancement](phase-01-prompt-enhancement.md) | P1 | 4h | "Enhance" button, prompt transformation, quick templates |
| 02 | [Live Build Progress](phase-02-live-build-progress.md) | P1 | 6h | Progress checklist, token-based progress, streaming improvements |
| 03 | [Element Targeting](phase-03-element-targeting.md) | P2 | 8h | Point-and-click element selection in preview iframe |
| 04 | [Diff Preview & HMR](phase-04-diff-preview-hmr.md) | P2 | 6h | Surgical diffs with highlighting, iframe refresh optimization |
| 05 | [Suggestion Chips](phase-05-suggestion-chips.md) | P2 | 4h | Context-aware follow-up action chips |
| 06 | [Publishing Flow](phase-06-publishing-flow.md) | P1 | 4h | Schema validation, sync button, feedback bridge |

## Dependencies & Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI UX Workflow System                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 01: Prompt Enhancement                                            │
│  ├─ ChatPanel.tsx (input area)                                          │
│  ├─ ai.server.ts (enhance endpoint)                                     │
│  └─ prompt-templates.ts (new)                                           │
│                                                                          │
│  Phase 02: Live Build Progress                                           │
│  ├─ useStreamingChat hook (extend)                                      │
│  ├─ BuildProgressIndicator (new component)                              │
│  └─ ChatMessage.tsx (integrate progress)                                │
│                                                                          │
│  Phase 03: Element Targeting                                             │
│  ├─ usePreviewMessaging.ts (extend)                                     │
│  ├─ ElementTargetingOverlay (new component)                             │
│  ├─ Preview iframe injection script                                      │
│  └─ ChatPanel.tsx (targeted editing UI)                                 │
│                                                                          │
│  Phase 04: Diff Preview & HMR                                            │
│  ├─ CodeDiffView (new component)                                        │
│  ├─ useCodeDiff hook (new)                                              │
│  ├─ CodePreviewPanel.tsx (integrate diff toggle)                        │
│  └─ Preview refresh optimization                                         │
│                                                                          │
│  Phase 05: Suggestion Chips                                              │
│  ├─ SuggestionChips (new component)                                     │
│  ├─ suggestion-engine.ts (context-aware logic)                          │
│  └─ ChatPanel.tsx (integrate chips after response)                      │
│                                                                          │
│  Phase 06: Publishing Flow                                               │
│  ├─ schema-validator.ts (extend validation)                             │
│  ├─ PublishModal.tsx (validation status)                                │
│  └─ FeedbackWidget (new component)                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Research Insights

### From AI Chat UX Patterns Research

1. **Multi-Stage Refinement**: Pre-generation enhancement + post-generation refinement chips
2. **Visual Milestone Markers**: Token-based progress (not artificial steps)
3. **Chunked Streaming**: Buffer 50-100ms of tokens to prevent DOM thrashing
4. **3-Tier Chip System**: Immediate actions, code refinement, conversation next-steps

### From Visual Editing Research

1. **postMessage Pattern**: Cross-iframe communication for element targeting
2. **Surgical Diffs**: Line-by-line comparison with color coding
3. **Pseudo-HMR**: Iframe refresh for Liquid (true HMR only for assets)
4. **Live Validation**: Real-time field validation with inline error messages

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cross-origin iframe issues | Medium | High | Same-origin preview via App Proxy |
| Token progress accuracy | Low | Medium | Use semantic detection fallback |
| Diff library performance | Low | Medium | Virtualize long diffs (>500 lines) |
| Polaris component limitations | Medium | Medium | Custom CSS where needed |

## Success Criteria

1. **Act 1**: Users can enhance prompts in <2s with visible improvement
2. **Act 2**: Users see real-time progress with <100ms visual latency
3. **Act 3**: Element targeting works for 95% of rendered elements
4. **Act 4**: Publishing flow validates schemas before allowing publish

## Security Considerations

- Validate postMessage origins for iframe communication
- Sanitize element selectors to prevent XSS
- Rate limit prompt enhancement API calls
- Validate schema JSON before publishing

## Next Steps

1. Begin with Phase 01 (Prompt Enhancement) - standalone, no blockers
2. Phase 02 can start in parallel (separate code paths)
3. Phases 03-04 depend on Phase 02 completion for streaming state
4. Phase 05-06 can proceed after Phase 02

---

## Validation Summary

**Validated:** 2026-01-03
**Questions asked:** 7

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Prompt enhancement method | AI-powered enhancement (Gemini call) |
| Progress calculation | Semantic detection ({% schema %}, {% style %}, closing tags) |
| Element targeting in MVP | Yes, include (core to "vibe coding" UX) |
| Validation strictness | Block on errors, warn on issues |
| Diff visualization | Inline unified (GitHub-style) |
| Suggestion chip count | 3-4 chips per section type |
| Feedback mechanism | Thumbs only (quick, low friction) |

### Action Items

- [x] Plan validated - no changes required to phase structure
- [ ] Phase 02: Update to use semantic detection (already planned)
- [ ] Phase 04: Confirm inline unified diff view (already planned)
- [ ] Phase 05: Limit to 4 chips max per tier (update SECTION_SUGGESTIONS)
- [ ] Phase 06: Keep thumbs-only feedback (already planned)

### Implementation Order (Validated)

All 6 phases included in MVP. Recommended execution:
1. **Parallel start**: Phase 01 + Phase 02 (no dependencies)
2. **After Phase 02**: Phase 03, 04, 05 can begin
3. **Anytime**: Phase 06 (standalone validation logic)

---

**Document Version**: 1.1
**Created**: 2026-01-03
**Validated**: 2026-01-03
**Author**: Planner Agent
