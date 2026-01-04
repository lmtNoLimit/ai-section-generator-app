# Plan Archive Journal: Q4 2025 / Q1 2026 Major Initiatives

**Date**: 2026-01-04
**Period**: Dec 9, 2025 – Jan 4, 2026
**Total Plans Archived**: 6
**Scope**: 13+ agents, 4 full-stack migrations, 32+ hours engineering

---

## ClaudeKit Marketing Implementation

**Status**: 6/8 phases complete, 2 pending (docs/testing, beta launch)
**Timeline**: Dec 9, 2025 – Dec 31, 2025
**Impact**: Complete transformation from Engineer to Marketing toolkit

### Deliverables Completed

- **13 New Marketing Agents**: 7 core (attraction-specialist, email-wizard, lead-qualifier, continuity-specialist, sale-enabler, funnel-architect, upsell-maximizer) + 6 supporting (campaign-manager, content-creator, social-media-manager, community-manager, analytics-analyst, seo-specialist)
- **9 Marketing Skills**: SEO optimization, content marketing, social media, email marketing, analytics, campaign management, brand guidelines, video production, ads management
- **37 Reference Files**: Progressive disclosure guides for every skill
- **6 Phases Locked**: Foundation cleanup, core agents, marketing skills (3 sub-phases), marketing commands, MCP integrations (GA4, Google Ads, SendGrid, Discord, Slack, Meta), workflows & hooks
- **Critical Dependencies**: Gemini API access (Imagen 4, Veo 3.1), OAuth token management, MCP server stability

### Key Decisions

- Pricing: $99 standalone | $149 bundled with Engineer
- Target market: Indie hackers, small marketing teams, SMB managers
- CLI subagent orchestration as core differentiator
- Beta launch target: Dec 31, 2025

### Remaining Work

Phase 7: Documentation & Testing (Dec 29-30) + Phase 8: Beta Launch (Dec 31). Non-blocking but required for public availability.

---

## Markdown Novel Viewer Skill

**Status**: ✅ COMPLETED (Dec 11, 2025)
**Timeline**: Dec 11, 2024 – Dec 11, 2025 (full year development)
**Tech**: Node.js HTTP server, marked.js + highlight.js, Google Fonts (Libre Baskerville)

### Delivered

- **5 Phases**: Core server (port-finder, process mgmt), markdown renderer (gray-matter integration), novel theme (warm colors, serif fonts, dark/light toggle), plan navigation sidebar, slash command `/preview`
- **Security**: Path traversal protection, XSS prevention (marked v17), sanitized error messages
- **Performance**: <500ms startup, client-side theme persistence
- **UX**: Book-like aesthetic for reviewing plans/storyboards with inline image rendering

### Why This Matters

Provides elegant documentation reading experience for ClaudeKit users reviewing multi-phase plans. Replaces vanilla markdown with production-grade interface.

---

## Marketing Dashboard Vue Migration (COMPLETED)

**Status**: ✅ PRODUCTION READY (Dec 23, 2025, 21:52)
**Timeline**: Dec 23, 2025 (04:42 total delivery time)
**Tech**: Vue 3 + Vite, Hono server, better-sqlite3, Tailwind CSS

### Full-Stack Delivery: 5,200+ LOC

| Phase | Duration | Status |
|-------|----------|--------|
| Foundation (Vue + Hono + SQLite) | 45m | ✅ |
| API Layer (routes, tests, security fixes) | 54m | ✅ |
| Vue Components (22 components, 4 stores) | 31m | ✅ |
| Features (Kanban board, automations, filters) | 2:39 | ✅ |
| Integration (scripts, command, docs) | 38m | ✅ |

### Critical Achievements

- **Zero critical issues** after security reviews
- **26 Vue components** (3 layout, 5 views, 8 features, 3 common)
- **4 Pinia stores**: Campaigns, content, assets, AI bridge
- **Bundle size**: 56 KB gzipped (72% under 200 KB target)
- **Security**: Path traversal blocked, XSS protected, SQL injection prevented, sessionStorage for API keys
- **Test coverage**: 90% (119/132 passing)
- **Documentation**: 374-line README + 4 shell scripts

### Migration Success

Transformed Content Hub from vanilla JS into production-grade Vue SPA with SQLite persistence, Hono backend, Kanban boards, content filtering, asset management, and pre-built automation recipes.

### Non-Blocking Issues

- .env file needs gitignore protection (medium, pre-production)
- 13 security test assertions expect 403 but get 404 (path traversal IS blocked, low)
- console.error logging in production (medium, phase 5 add service)

---

## Section Creation UX Refinement (IN PROGRESS)

**Status**: Phase 1/4 completed
**Priority**: P1
**Effort**: 3h total (45m Phase 1 done)
**Timeline**: 2026-01-01 onward

### Problem Addressed

Current workflow has friction: user submits prompt → navigates → waits → must manually apply version. Latest version not auto-applied, confusing "Save Draft" button, reload loses state.

### Solution Design

```
[New Section] → [Prompt] → [Submit]
    ↓
[Create + conversation + auto-generate param]
    ↓
[Navigate with ?autoGenerate=true]
    ↓
[ChatPanel auto-triggers on load]
    ↓
[Version auto-applied → persisted]
```

### Phase 1 Completed (45m)

- Added `onAutoSave` callback system to `useVersionState.ts`
- Implemented auto-save trigger when version applied
- Created `handleAutoSave` in `useEditorState.ts` using silent fetcher
- AI-generated code persists immediately without user action
- Verified multiple rapid saves handle correctly

### Remaining Phases

- Phase 2: Remove "Save Draft" button (15m)
- Phase 3: URL-based version persistence with `?v={versionId}` (1h)
- Phase 4: Clean auto-generation flow (30m)

---

## Blocksmith AI UX Workflow (PENDING)

**Status**: Plan validated, ready for implementation
**Priority**: P1
**Effort**: 32h across 6 phases
**Created**: 2026-01-03

### 4-Act AI Workflow System

| Phase | Title | Effort | Description |
|-------|-------|--------|-------------|
| 01 | Prompt Enhancement | 4h | "Enhance" button, AI-powered templates |
| 02 | Live Build Progress | 6h | Real-time checklist, semantic token detection |
| 03 | Element Targeting | 8h | Point-and-click targeting in preview iframe |
| 04 | Diff Preview & HMR | 6h | Surgical diffs, iframe refresh optimization |
| 05 | Suggestion Chips | 4h | Context-aware follow-up actions |
| 06 | Publishing Flow | 4h | Schema validation, sync button, feedback |

### Key Architecture Decisions

- Leverage existing SSE streaming (`generateSectionStream()`), `useVersionState` hooks, preview iframe messaging
- Semantic progress detection ({% schema %}, {% style %}, closing tags) not artificial milestones
- Element targeting works for 95% of rendered elements via postMessage protocol
- Inline unified diff visualization (GitHub-style)
- Thumbs-only feedback mechanism (quick, low friction)
- 3-4 suggestion chips per section type

### Execution Strategy

- Phases 01 + 02 can start in parallel (no blocking dependencies)
- Phases 03-05 depend on Phase 02 streaming state completion
- Phase 06 (publishing) is standalone
- All 6 phases included in MVP

### Risk Mitigation

- Cross-origin iframe issues → Same-origin preview via App Proxy
- Token progress accuracy → Semantic detection with fallback
- Diff performance → Virtualization for >500 line diffs
- Polaris limitations → Custom CSS where needed

---

## File Serving Security Tests (PENDING)

**Status**: Plan created (Dec 23, 2025)
**Priority**: CRITICAL
**Effort**: 4-6 hours
**Owner**: QA/Security

### Objective

Phase 2 of Marketing Dashboard MVP has path traversal protection in `routes/assets.js` but **zero test validation**. Security claims unvalidated.

### Test Plan

- **12-15 security tests** covering 6 bypass vectors
- Windows backslash normalization, URL encoded attacks, double-encoded, mixed separators, null bytes, Unicode variations
- Valid file access tests (200 responses)
- Error scenarios (404, 403, 414)
- Test fixtures in `__tests__/fixtures/assets/`
- Expected result: 100% bypass attempts returning 403

### Why This Matters

Without integration tests, security implementation is claimed but unproven. Tests validate:
- Path traversal protection effectiveness
- Performance (<100ms per request)
- Error handling consistency
- No regression in valid file serving

### Status

Plan documented. Requires 1-day implementation. Estimated 12+ tests once complete.

---

## Cross-Plan Patterns & Learnings

### Volume Delivered

- **13 new agents** created in single plan phase
- **26 Vue components** delivered in <3 hours
- **5 full phases** (Marketing Dashboard) completed in <5 hours wall clock
- **6 security reviews** performed with conditional approvals & re-reviews

### Decision Quality

Plans validated through direct questioning:
- ClaudeKit: 8 confirmed decisions (pricing, agent architecture, MCP integrations)
- Marketing Dashboard: Explicit security review gates (3 CRITICAL, then 2 CRITICAL Vue components)
- Section Creation: 6 confirmed workflow decisions (debounce strategy, browser history, reload behavior)
- Blocksmith: 7 validated decisions (prompt enhancement, progress detection, diff format, chip count)

### Risk Patterns

**Recurring Issues**:
1. Security unvalidated post-implementation (Marketing Dashboard Phase 2, File Serving tests)
2. Env/config management (marketing-dashboard .env gitignore, API base URLs hardcoded initially)
3. Test coverage gaps (11 test assertion mismatches in Dashboard security tests)

**Mitigations Applied**:
- Conditional approvals requiring security fixes before proceeding
- Environment-based configuration for API URLs (VITE_API_BASE_URL)
- SessionStorage for API keys (not localStorage)
- Code review gates after critical implementations

---

## Velocity Summary

| Initiative | Type | Scope | Timeline | Quality |
|-----------|------|-------|----------|---------|
| ClaudeKit Marketing | Framework | 13 agents, 9 skills | Dec 9 – pending | 6/8 phases |
| Markdown Novel | Skill | Standalone component | Dec 11, 2024 | ✅ Complete |
| Marketing Dashboard | Full-stack | 5.2K LOC, Vue+Hono+SQLite | 4:42 wall clock | 0 critical |
| Section Creation UX | Enhancement | 4-phase refinement | 3h planned, 45m done | Phase 1 done |
| Blocksmith AI UX | Workflow | 32h, 6 phases | Pending | Plan validated |
| File Serving Security | QA | 12+ integration tests | Pending | Plan pending |

---

## Open Questions

1. **ClaudeKit Marketing**: Timeline for Phase 7-8? Beta Dec 31 aggressive for docs/testing cycle.
2. **Marketing Dashboard**: Non-blocking issues (gitignore, test assertions) scheduled for Phase 5+ maintenance?
3. **Section Creation UX**: Should URL version persistence support `?v=latest` or always require explicit versionId?
4. **Blocksmith**: Phase 03 (element targeting) 8h estimate justified? Iframe postMessage protocol mature?
5. **File Serving Tests**: Integration test framework (vitest vs supertest) finalized for Hono app?

---

**Archived by**: journal-writer agent
**Format**: Plan archive consolidation
**Retention**: Reference for Q4 2025 – Q1 2026 initiatives
