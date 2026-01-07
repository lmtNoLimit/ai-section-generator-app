# Phase 1: Schema Changes

**Effort**: 1.5h | **Priority**: Critical | **Status**: Pending

## Context
- Parent: [plan.md](plan.md)
- Docs: `docs/codebase-summary.md`, `prisma/schema.prisma`

## Overview

Add `GenerationLog` model for immutable usage tracking. Mark `Trial` model as deprecated (keep for historical data).

## Key Insights

- Current free tier counts `Section.count()` which allows abuse via hard-delete
- `GenerationLog` provides immutable audit trail that survives section deletion
- Trial model has 158 lines of code that can be removed in Phase 2

## Requirements

**Functional**:
- GenerationLog record created on every successful AI generation
- Record includes shop, sectionId, prompt, tier, billing cycle
- Immutable: no update/delete operations

**Non-functional**:
- Indexed for fast quota queries
- Efficient counting by shop + billing cycle

## Architecture

```
GenerationLog
├── id (MongoDB ObjectId - @default(auto()))
├── shop (indexed)
├── sectionId (nullable - section may be deleted)
├── messageId (optional - links to conversation)
├── prompt (truncated to 500 chars)
├── tokenCount (optional)
├── modelId ("gemini-2.5-flash")
├── userTier (enum: free | pro | agency)
├── billingCycle (date - start of current billing period)
├── wasCharged (boolean - true if overage)
├── generatedAt (auto timestamp)
└── indexes: [shop, billingCycle], [shop, generatedAt], [generatedAt]
```

## Related Code Files

**Modify**:
- `prisma/schema.prisma` - Add GenerationLog model

## Implementation Steps

### 1. Add UserTier Enum

Add to `prisma/schema.prisma` (before GenerationLog model):

```prisma
/// User tier types for billing
enum UserTier {
  free
  pro
  agency
}
```

### 2. Add GenerationLog Model

Add to `prisma/schema.prisma`:

```prisma
/// Immutable log of all AI generations - for quota tracking & audit trail
/// Never update or delete these records
model GenerationLog {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  shop         String
  sectionId    String?  @db.ObjectId // No @relation - log survives section deletion
  messageId    String?  @db.ObjectId // No @relation - log survives message deletion
  prompt       String   // Truncated to 500 chars in application code
  tokenCount   Int?
  modelId      String   @default("gemini-2.5-flash")
  userTier     UserTier // Type-safe enum
  billingCycle DateTime // Start of current billing period (ISO 8601 from Subscription)
  wasCharged   Boolean  @default(false)
  generatedAt  DateTime @default(now())

  @@index([shop, billingCycle])
  @@index([shop, generatedAt])
  @@index([generatedAt]) // For admin dashboard queries
}
```

### 3. Add Deprecation Comment to Trial

Add comment to Trial model (keep for historical data):

```prisma
/// @deprecated (2026-01-07) - Trial system removed. Keep for historical data only.
/// New users go directly to Free tier. See phase-02-remove-trial.md for cleanup.
/// Safe to delete this model after 90 days (2026-04-07) if no migration script needs it.
model Trial {
  // ... existing fields
}
```

### 4. Run Migration

```bash
npx prisma migrate dev --name add-generation-log
```

## Todo List

- [x] Define UserTier enum (free, pro, agency)
- [x] Add GenerationLog model with MongoDB ObjectId pattern
- [x] Add deprecation comment to Trial model
- [ ] Run prisma migrate dev
- [ ] Verify migration success
- [ ] Generate updated Prisma client

## Success Criteria

- [x] UserTier enum defined for type safety
- [x] GenerationLog table schema uses MongoDB ObjectId pattern
- [x] Three indexes created for quota and admin queries
- [x] No-relation comments added for nullable foreign keys
- [ ] Migration executed successfully
- [ ] Prisma client regenerated with new types
- [ ] No breaking changes to existing models

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration fails | Low | High | Test on dev DB first |
| Index performance | Low | Medium | Monitor query times |

## Security Considerations

- GenerationLog is append-only (no update/delete in code)
- Prompt stored truncated (500 chars) to limit data exposure
- Shop-scoped queries prevent cross-tenant access

## Next Steps

→ Phase 2: Remove Trial code
