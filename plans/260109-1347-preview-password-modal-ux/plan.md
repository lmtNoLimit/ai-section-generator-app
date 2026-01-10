---
title: "Preview Password Modal UX"
description: "In-context password modal for password-protected stores in section preview"
status: in-progress
phase-2-completed: 2026-01-10
priority: P2
effort: 4h
branch: main
tags: [ux, preview, password, modal]
created: 2026-01-09
updated: 2026-01-10
---

# Preview Password Modal UX

## Problem Statement

When users preview a section on a password-protected store without a configured password:
1. Preview shows error banner: "Store is password-protected - configure password in settings"
2. User must navigate AWAY from editor to Settings page
3. User enters password, navigates BACK to editor
4. User manually retries preview

**Poor UX**: 5-step flow with context switching.

## Solution

In-context modal that appears directly in the editor when password error detected:
1. Preview detects password error
2. Modal opens with password input field
3. User enters password, clicks Save
4. Password validated and saved via existing service layer
5. Preview auto-reloads

**Improved UX**: 3-step flow, no navigation away from editor.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ AppProxyPreviewFrame                                        │
│  ├─ useNativePreviewRenderer() → error state               │
│  ├─ isPasswordError() → detect specific error strings      │
│  ├─ <PasswordConfigModal> (conditional render)             │
│  └─ onPasswordSaved() → refetch() auto-reload             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PasswordConfigModal                                         │
│  ├─ useFetcher() → POST /api/preview/configure-password    │
│  ├─ <s-modal> with password input                          │
│  └─ onSuccess callback → triggers refetch                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ api.preview.configure-password.tsx (NEW)                   │
│  ├─ authenticate.admin()                                    │
│  ├─ validateAndSaveStorefrontPassword()                    │
│  └─ Returns { success, error }                             │
└─────────────────────────────────────────────────────────────┘
```

## Phases Overview

| Phase | Description | Effort | Status | Report |
|-------|-------------|--------|--------|--------|
| 1 | Create PasswordConfigModal component | 1h | ✅ DONE | `plans/reports/code-reviewer-260109-1423-phase-01-password-modal.md` |
| 2 | Integrate modal with AppProxyPreviewFrame | 1h | ✅ DONE | `plans/reports/code-reviewer-260109-1431-phase-02-integrate.md` |
| 3 | Create API route for password save | 1h | ✅ DONE | `plans/reports/code-reviewer-260109-1442-phase-03-api-route.md` |
| 4 | Add toast notification & finalize | 1h | ⏳ TODO | - |

## Key Decisions

1. **New API route vs existing**: Create dedicated `/api/preview/configure-password`
   - Cleaner separation from settings page
   - Specific response format for modal use case
   - Reuses existing `validateAndSaveStorefrontPassword()` service

2. **Modal trigger**: Programmatic via `showOverlay()` method
   - Not declarative (`commandFor`) since triggered by error state
   - Follows PublishModal.tsx pattern with `modalRef`

3. **Error detection**: String matching on known error messages
   - "Store is password-protected"
   - "Storefront password expired or invalid"
   - "configure password in settings"

4. **Auto-reload**: Call existing `refetch()` after successful save
   - Already exposed via hook
   - No additional complexity

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `app/components/preview/PasswordConfigModal.tsx` | Create | Modal component |
| `app/components/preview/AppProxyPreviewFrame.tsx` | Modify | Integrate modal |
| `app/routes/api.preview.configure-password.tsx` | Create | API route |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Invalid password loop | Medium | Clear error message, retain modal open |
| Modal z-index conflict | Low | Use Polaris `<s-modal>` handles layering |
| Race condition on refetch | Low | Modal closes only after confirmed save |

## Success Criteria

- [x] Password error triggers modal instead of just banner (Phase 2 ✅)
- [x] Password saves successfully via modal (Phase 3 ✅)
- [x] Preview auto-reloads after password save (Phase 2 ✅)
- [ ] Toast notification on success/failure (Phase 4)
- [x] No navigation away from editor required (Phase 2 ✅)

## Phase Completion Status

### Phase 1: PasswordConfigModal Component ✅
- Component created with Polaris Web Components
- 29/29 tests passing
- Exports: PasswordConfigModal, PASSWORD_MODAL_ID
- Report: `plans/reports/code-reviewer-260109-1423-phase-01-password-modal.md`

### Phase 2: AppProxyPreviewFrame Integration ✅
**STATUS:** Complete | **DATE:** 2026-01-10
- Import PasswordConfigModal ✅
- Add PASSWORD_ERROR_PATTERNS ✅
- Add isPasswordError() helper ✅
- Add showPasswordModal state ✅
- Add auto-show useEffect ✅
- Split error banners (password vs non-password) ✅
- Add modal render with callbacks ✅
- Auto-reload on success ✅
- Report: `plans/reports/code-reviewer-260109-1431-phase-02-integrate.md`

### Phase 3: API Route ✅
- **STATUS:** Complete
- **FILES:**
  - `app/routes/api.preview.configure-password.tsx` (86 lines)
  - `app/routes/__tests__/api.preview.configure-password.test.tsx` (305 lines, 22/22 tests passing)
- **IMPLEMENTATION:**
  - POST endpoint requires authenticated admin session
  - Validates and saves storefront password via existing service layer
  - Returns `{ success: boolean; error?: string }` JSON response
  - Comprehensive security: no password leaks, session tampering prevention, encrypted storage
  - Zero critical issues, production-ready
- **REPORT:** `plans/reports/code-reviewer-260109-1442-phase-03-api-route.md`

### Phase 4: Toast Notification ⏳
- **STATUS:** Not started
- **ACTION:** Add toast on success/error response
