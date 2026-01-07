# Review: Free User Slot Tracking Workflow

**Date**: 2026-01-07 | **Type**: Code Review | **Status**: Analysis Complete

---

## Executive Summary

**Current Behavior**: Free users get 5 generations/month counted by **`Section` records created since start of calendar month** — this includes ALL sections regardless of status (draft, active, archive).

**Critical Finding**: **Deleted (archived) sections STILL count toward quota.** Free users cannot recover slots by deleting sections.

---

## 1. Current Implementation Analysis

### Quota Counting Logic
**File**: `app/services/billing.server.ts:453-463`

```typescript
// Count free tier usage (sections created this calendar month)
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const freeUsageCount = await prisma.section.count({
  where: {
    shop,
    createdAt: { gte: startOfMonth },  // ALL sections this month
  },
});
```

**Key Observation**: Query counts **all sections** created this month regardless of status.

### Section Creation Flow

1. **`/app/sections/new` route** (`app/routes/app.sections.new.tsx:74`)
   - Creates empty section record immediately on form submit
   - No quota check here — section created before AI generates

2. **AI Generation** (`/api/chat/stream`)
   - Trial check: `incrementTrialUsage()` only if `trialStatus.isInTrial`
   - No `trackGeneration()` call for free tier
   - Free tier: No billing, just log message

3. **Section Deletion** (`app/services/section.server.ts:174-176`)
   - `archive()` = soft delete (status = ARCHIVE)
   - `delete()` = hard delete (permanent removal)

### What Counts as "Used Slot"?

| Action | Counts? | Notes |
|--------|---------|-------|
| Create section (empty) | ✅ Yes | `createdAt` recorded on creation |
| Generate code via AI | ❌ No extra | Section already exists |
| Archive section | ✅ Still counts | Soft delete, record remains |
| Hard delete section | ❌ No longer counts | Record removed from DB |

---

## 2. User Scenarios

### Scenario A: Normal Usage
1. Free user creates 5 sections → All 5 count
2. User archives 2 sections → Still 5/5 used
3. User tries to create 6th → **BLOCKED** (quota exceeded)

### Scenario B: User "Trick" Attempt
1. Free user creates 5 sections → 5/5 used
2. User hard-deletes all 5 sections → 0/5 used
3. User creates 5 more → 5/5 used
4. **Result**: User gets 10 generations for free!

### Scenario C: Abuse Pattern
1. User creates section, generates, deletes
2. Repeat 100 times in a month
3. **Current**: Each create counts = blocked after 5
4. **With hard delete**: Unlimited generations possible

---

## 3. Should We Allow Slot Recovery?

### Option A: NO Recovery (Current Behavior)
**Pros**:
- Prevents abuse (delete-create loop)
- Simple to explain: "5 sections per month"
- Encourages upgrades

**Cons**:
- User complaints if they delete early
- Feels punitive for honest mistakes
- No way to "undo" accidental creation

### Option B: Allow Recovery via Hard Delete
**Pros**:
- Users can fix mistakes
- More user-friendly

**Cons**:
- **ABUSE VECTOR**: Create-generate-delete loop = unlimited generations
- Lose data for support investigations
- Makes quota meaningless

### Option C: Track Generations, Not Sections (Recommended)
**Pros**:
- **Accurate tracking**: Count AI generations, not section records
- Fair: Delete section? Slot still used (generation happened)
- Clear audit trail

**Cons**:
- Requires migration
- More complex logic

---

## 4. How to Track Precisely (Anti-Fraud)

### Current State: Section-Based Counting
```
Query: prisma.section.count({ shop, createdAt >= startOfMonth })
```
- **Flaw**: Counts record creation, not AI generation
- **Flaw**: Hard delete removes evidence

### Recommended: Generation Log Table

Create immutable `GenerationLog` table:
```prisma
model GenerationLog {
  id          String   @id @default(cuid())
  shop        String
  sectionId   String?  // Can be null if section deleted
  generatedAt DateTime @default(now())
  prompt      String
  tokenCount  Int?
  billingCycle DateTime // Start of month

  @@index([shop, billingCycle])
}
```

**Counting Query**:
```typescript
const freeUsageCount = await prisma.generationLog.count({
  where: {
    shop,
    billingCycle: startOfMonth,
  },
});
```

**Benefits**:
- Immutable record — cannot be deleted by user
- Tracks actual generations, not section records
- Audit trail for disputes
- Section deletion doesn't affect count

### Implementation Changes

1. **On AI generation success** (`api.chat.stream.tsx`):
   ```typescript
   // After code extraction succeeds
   if (extraction.hasCode) {
     await prisma.generationLog.create({
       data: {
         shop,
         sectionId: conversation.sectionId,
         generatedAt: new Date(),
         prompt: sanitizedContent.slice(0, 500),
         tokenCount,
         billingCycle: getStartOfMonth(),
       }
     });
   }
   ```

2. **Update `checkQuota()`** to use GenerationLog:
   ```typescript
   const freeUsageCount = await prisma.generationLog.count({
     where: { shop, billingCycle: startOfMonth },
   });
   ```

---

## 5. Handling User Complaints

### User Says: "I deleted sections but still blocked"

**Response Options**:

1. **With Current System**:
   - "Your 5 monthly generations have been used. Deleting sections doesn't restore slots because AI resources were already consumed."
   - Offer: Upgrade to Pro ($X/month) for more generations

2. **With GenerationLog (Recommended)**:
   - Query: `SELECT * FROM GenerationLog WHERE shop = ? AND billingCycle = ?`
   - Show user: "You generated 5 sections on [dates]. Here are the prompts used."
   - Irrefutable evidence

### Fraud Detection Query
```sql
SELECT shop, COUNT(*) as gen_count
FROM GenerationLog
WHERE billingCycle = '2026-01-01'
GROUP BY shop
HAVING gen_count > 10
ORDER BY gen_count DESC;
```

---

## 6. Recommendations

### Immediate (No Code Change)
- Document current behavior in user-facing help
- Update error message: "You've used all 5 free generations this month. Deleting sections doesn't restore slots."

### Short-Term (Migration)
1. Create `GenerationLog` model
2. Insert record on successful AI generation
3. Update `checkQuota()` to use GenerationLog
4. Keep Section-based counting as fallback

### Long-Term
- Add admin dashboard showing GenerationLog
- Add "generation history" in billing page
- Consider "generation refund" feature for paid plans only

---

## 7. Current Code Gaps

| Issue | Location | Impact |
|-------|----------|--------|
| No quota check before section creation | `app.sections.new.tsx:74` | User can create empty section, waste slot |
| Hard delete removes evidence | `section.server.ts:292` | No audit trail |
| No GenerationLog table | `prisma/schema.prisma` | Can't track actual generations |
| Free tier has no `trackGeneration()` call | `usage-tracking.server.ts:44-48` | No billing integration |

---

## 8. Unresolved Questions

1. **Should empty sections (no AI generation) count toward quota?**
   - Current: Yes (section created = slot used)
   - Suggested: No (only count when AI generates code)

2. **Should we allow hard delete for free users?**
   - Current: Yes (but archive is default)
   - Suggested: No hard delete for free tier; only paid users can permanently delete

3. **Should we show generation history to users?**
   - Would help with transparency
   - But reveals prompt content (privacy concern?)

4. **Billing cycle: Calendar month vs rolling 30 days?**
   - Current: Calendar month (1st - 31st)
   - Pro: Simpler to understand
   - Con: User joining on 28th gets only 3 days

---

**Report Generated**: 2026-01-07 11:17
**Files Analyzed**: 6 service files, 3 routes, 1 schema
