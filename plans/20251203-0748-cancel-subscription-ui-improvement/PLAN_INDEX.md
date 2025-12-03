# Cancel Subscription UI Improvement - Plan Index

**Plan ID:** 20251203-0748
**Created:** 2025-12-03
**Status:** ✅ Ready for Implementation

---

## Document Structure

```
plans/20251203-0748-cancel-subscription-ui-improvement/
├── README.md ⭐ START HERE
├── PLAN_INDEX.md (this file)
├── plan.md
├── phase-01-implement-cancel-modal.md
├── IMPLEMENTATION_NOTES.md
└── research/
    ├── researcher-01-polaris-web-component-modals.md
    └── researcher-02-cancel-ux-best-practices.md
```

---

## Reading Guide

### For Quick Understanding (5 min)
1. **README.md** - Problem, solution, quick summary
2. **IMPLEMENTATION_NOTES.md** - Visual diagrams, code snippets

### For Full Context (15 min)
1. **README.md** - Overview
2. **plan.md** - Architecture, design decisions, specs
3. **phase-01-implement-cancel-modal.md** - Detailed steps

### For Implementation (30-45 min)
1. **phase-01-implement-cancel-modal.md** - Follow step-by-step
2. **IMPLEMENTATION_NOTES.md** - Copy-paste code snippets
3. Test using checklists in both documents

### For Research & Background (30 min)
1. **research/researcher-01-polaris-web-component-modals.md**
2. **research/researcher-02-cancel-ux-best-practices.md**

---

## Document Summaries

### 📄 README.md (6.7 KB)
**Purpose:** Entry point, quick context
**Contains:**
- Problem statement
- Solution overview
- Before/after code comparison
- Key design decisions
- Quick start guide

**Read if:** You need context fast or are deciding whether to implement

---

### 📄 plan.md (10.8 KB)
**Purpose:** Comprehensive plan overview
**Contains:**
- Solution architecture
- Implementation phases
- Technical specifications
- Design system compliance
- Testing checklist
- Security & performance considerations

**Read if:** You need full architectural context before coding

---

### 📄 phase-01-implement-cancel-modal.md (17.3 KB)
**Purpose:** Detailed implementation guide
**Contains:**
- Step-by-step instructions (4 steps)
- Complete code snippets with annotations
- TypeScript considerations
- Testing plan (manual, keyboard, screen reader)
- Edge case handling
- Rollback strategy

**Read if:** You're actively implementing the feature

---

### 📄 IMPLEMENTATION_NOTES.md (17.0 KB)
**Purpose:** Quick reference for developers
**Contains:**
- Visual flow diagrams (ASCII art)
- Copy-paste code snippets
- Common mistakes to avoid
- Polaris component cheat sheet
- TypeScript hints
- Debugging tips
- Git commit message template

**Read if:** You need quick answers while coding

---

### 📄 research/researcher-01-polaris-web-component-modals.md (11.2 KB)
**Purpose:** Technical research on Polaris modals
**Contains:**
- `<s-modal>` vs `<ui-modal>` comparison
- 2025 Polaris updates
- Component API reference
- Destructive action patterns
- Best practices from Shopify docs
- Event handling examples

**Read if:** You need to understand WHY we chose `<s-modal>` or need deeper API knowledge

---

### 📄 research/researcher-02-cancel-ux-best-practices.md (11.1 KB)
**Purpose:** UX research on cancellation flows
**Contains:**
- Confirmation dialog design patterns
- Button labeling best practices
- Retention strategies (out of scope for v1)
- Shopify billing patterns
- Dark patterns to avoid
- Multi-step flow examples

**Read if:** You want UX rationale or planning future retention features

---

## Implementation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Understand Context (5-10 min)                       │
│ ├─ Read README.md                                           │
│ └─ Skim plan.md (sections 1-3)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Review Implementation Plan (10 min)                │
│ ├─ Read phase-01-implement-cancel-modal.md                 │
│ └─ Bookmark IMPLEMENTATION_NOTES.md for reference          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Code (20-30 min)                                   │
│ ├─ Open app/routes/app.billing.tsx                         │
│ ├─ Follow phase-01 steps 1-4                               │
│ └─ Copy snippets from IMPLEMENTATION_NOTES.md              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Test (10 min)                                      │
│ ├─ Manual testing (phase-01 section 7)                     │
│ ├─ Keyboard/A11y testing (IMPLEMENTATION_NOTES)            │
│ └─ Check all scenarios pass                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Commit                                             │
│ └─ Use commit message from IMPLEMENTATION_NOTES.md         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Decisions Reference

| Decision | Chosen Approach | Rationale | Document |
|----------|----------------|-----------|----------|
| Modal component | `<s-modal>` | Simpler, no iframe, better performance | research/01 |
| Button labels | "Yes, cancel subscription" vs "Keep my subscription" | Clear, no confusion | research/02, plan.md |
| Conditional render | `{subscription && ...}` | Hide for free plan users | plan.md |
| Modal control | Command-based (`commandFor`) | Declarative, Polaris pattern | research/01, phase-01 |
| Modal close | Automatic on navigation | No manual control needed | phase-01 |

---

## Code Locations

| Element | File | Lines (After) |
|---------|------|--------------|
| Handler function | `app/routes/app.billing.tsx` | ~129-135 |
| Cancel button | `app/routes/app.billing.tsx` | ~247-257 |
| Modal component | `app/routes/app.billing.tsx` | ~258-307 |
| Action handler | `app/routes/app.billing.tsx` | 83-92 (exists) |

---

## Testing Matrix

| Scenario | Expected Result | Test Location |
|----------|----------------|---------------|
| Free plan user | Button hidden | phase-01 Test 1 |
| Paid plan user | Button visible, modal opens | phase-01 Test 2 |
| "Keep subscription" | Modal closes, no action | phase-01 Test 3 |
| "Yes, cancel" | Form submits, success banner | phase-01 Test 4 |
| Network error | Error banner | phase-01 Test 5 |
| Keyboard nav | Works correctly | phase-01 Test 6 |

---

## Metrics & Success Criteria

**Lines Changed:** ~60-80 lines (in 1 file)
**Time Estimate:** 30-45 minutes
**Breaking Changes:** None
**Database Changes:** None

**Success:**
- ✅ No native `confirm()` dialog
- ✅ Button hidden for free plans
- ✅ Polaris design consistency
- ✅ Clear consequences shown
- ✅ All tests pass

---

## Dependencies

**Required Knowledge:**
- React Router (useSubmit, useLoaderData)
- TypeScript basics
- Polaris web components (basic)

**No External Dependencies:**
- Polaris loaded via CDN (already in app)
- No npm packages to install
- No database migrations

---

## Future Work (Out of Scope)

**Not in this plan:**
- Retention offers (pause, discount)
- Cancellation reason survey
- Email confirmation
- Multi-step flow
- Analytics tracking

**Reference:** `research/researcher-02-cancel-ux-best-practices.md` sections 2-4 for ideas

---

## Quick Commands

```bash
# Navigate to plan
cd plans/20251203-0748-cancel-subscription-ui-improvement

# View all documents
ls -lh

# Read specific doc
cat README.md
cat phase-01-implement-cancel-modal.md

# Search for specific pattern
grep -r "s-modal" .
grep -r "commandFor" .

# Open in editor
code .  # VS Code
vim phase-01-implement-cancel-modal.md
```

---

## Support & Questions

**Unclear implementation steps?**
→ Read `phase-01-implement-cancel-modal.md` step-by-step section

**Need code examples?**
→ Check `IMPLEMENTATION_NOTES.md` snippets section

**Why this pattern?**
→ Review `plan.md` design decisions + `research/*.md`

**Component API questions?**
→ See `research/researcher-01-polaris-web-component-modals.md`

**UX rationale?**
→ See `research/researcher-02-cancel-ux-best-practices.md`

---

**Document Version:** 1.0
**Created:** 2025-12-03
**Total Docs:** 7 files (51.9 KB)
**Completeness:** ✅ 100%
