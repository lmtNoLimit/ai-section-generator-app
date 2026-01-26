# Brainstorm Report: Auto-Apply & Version Restore (bolt.new Style)

**Date**: 2026-01-26
**Session**: Auto-Apply Latest Changes with Version Restore
**Status**: Consensus Reached

---

## Problem Statement

Current "Apply to Draft" manual action has issues:

1. **Extra click feels unnecessary** - User asked for changes, why click again?
2. **Confusion about what's applied** - Users unsure if preview shows new or old version
3. **Workflow interruption** - Manual apply breaks conversational flow

**Goal**: Implement bolt.new-style auto-apply with non-destructive version restore.

---

## Research: bolt.new Version Management

**Source**: [Backups, restore, and version history - Bolt.new](https://support.bolt.new/building/using-bolt/rollback-backup)

### bolt.new Patterns

| Feature | Behavior |
|---------|----------|
| **Rollback** | Click message → revert (destructive, removes later versions) |
| **Backups** | Restore creates fork, original timeline preserved |
| **Version History** | Timeline view, one-click restore in settings |
| **Token Cost** | Rollback is FREE (no token consumption) |

### Key Observation
When user restores a version in bolt.new:
1. AI responds with message: "I've restored your project to version X"
2. New version card appears with "(Restore)" prefix
3. History fully preserved (non-destructive)

---

## Final Recommended Solution

### 1. Auto-Apply Behavior

**Trigger**: AI generation completes
**Action**: Automatically apply to preview
**Feedback**: Update "Active: vN" badge (no toast/notification)

```
Generation Complete
       ↓
Auto-apply to preview
       ↓
Badge updates: "Active: v3"
```

### 2. Version Card Redesign

**Before (Manual Apply):**
```
┌─────────────────────────────────────┐
│ Version 2           [Preview] [Apply]│
│ 2 min ago                            │
└─────────────────────────────────────┘
```

**After (Auto-Apply + Restore):**
```
┌─────────────────────────────────────────┐
│ Version 2 ✓ Active                      │
│ 2 min ago                    [Restore]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Version 1                               │
│ 5 min ago                    [Restore]  │
└─────────────────────────────────────────┘
```

**Key Changes:**
- Remove `[Apply]` button (auto-applied)
- Add `✓ Active` badge to current version
- Show `[Restore]` on non-active versions only

### 3. Restore Flow

```
User clicks [Restore] on v2
       ↓
System message: "Restoring to version 2..."
       ↓
AI responds: "I've restored your section to version 2"
       ↓
New version card: "(Restore) Version 4 ✓ Active"
       ↓
Preview auto-updates with restored code
```

**Restore Version Card:**
```
┌─────────────────────────────────────────┐
│ (Restore) Version 4 ✓ Active            │
│ Restored from v2 · just now  [Restore]  │
└─────────────────────────────────────────┘
```

### 4. Data Model Changes

```typescript
// app/types/chat.types.ts
interface CodeVersion {
  id: string;
  versionNumber: number;
  code: string;
  createdAt: Date;
  // NEW fields for restore tracking
  isRestore?: boolean;           // true if restore operation
  restoredFromVersion?: number;  // original version number
}

// app/types/chat.types.ts
interface UIMessage {
  // ... existing fields
  isRestoreMessage?: boolean;    // true for system restore messages
}
```

### 5. State Management

```typescript
// Active version tracking
const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

// Auto-apply on generation complete
useEffect(() => {
  if (!isStreaming && latestVersion) {
    setActiveVersionId(latestVersion.id);
    applyToPreview(latestVersion.code);
  }
}, [isStreaming, latestVersion]);

// Restore handler
const handleRestore = async (versionId: string) => {
  const version = versions.find(v => v.id === versionId);
  if (!version) return;

  // Create restore message
  await createRestoreMessage({
    restoredFromVersion: version.versionNumber,
    code: version.code,
  });

  // Auto-apply restored version
  setActiveVersionId(newVersion.id);
  applyToPreview(version.code);
};
```

---

## Implementation Scope

### Files to Modify

| File | Changes |
|------|---------|
| `app/components/chat/VersionCard.tsx` | Remove Apply, add Active badge, Restore button |
| `app/components/chat/ChatPanel.tsx` | Add auto-apply on generation complete |
| `app/components/chat/MessageList.tsx` | Handle restore message rendering |
| `app/types/chat.types.ts` | Add `isRestore`, `restoredFromVersion` fields |
| `app/services/chat.server.ts` | Add `createRestoreMessage()` method |
| `app/routes/api.chat.restore.tsx` | **NEW** - Restore API endpoint |

### New Components

```
app/components/chat/
├── VersionCard.tsx          # Modified: Active badge, Restore button
├── RestoreMessage.tsx       # NEW: Restore confirmation message
└── ActiveVersionBadge.tsx   # NEW: "Active: v3" badge for header
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Restore during streaming | Disabled. Show tooltip "Wait for generation to complete" |
| Restore same version | No-op. Show toast "Already on this version" |
| First generation | Auto-apply as v1, no restore available |
| Network error on restore | Show error banner, keep current version active |
| Page reload | Apply latest version, preserve all history |

---

## Comparison: Current vs. New

| Aspect | Current | New (bolt.new style) |
|--------|---------|----------------------|
| Apply action | Manual click required | Auto-apply on complete |
| Version indicator | Selected vs. not | Active badge (✓) |
| Restore | Via Apply on old version | Dedicated Restore button |
| History | Preserved | Preserved + restore tracking |
| AI involvement | None on apply | Message on restore |

---

## Success Metrics

1. **Reduced clicks**: 0 clicks to apply (was 1)
2. **Version clarity**: Users always know which version is active
3. **Restore confidence**: Clear "(Restore)" prefix on restored versions
4. **History preservation**: No data loss on restore

---

## Next Steps

1. `/plan` - Create detailed implementation plan with phases
2. `/cook` - Start implementing auto-apply + version card changes
3. `/fix` - Address specific issues in current version system

---

## Unresolved Questions

1. **Restore cost**: Should restore consume AI tokens or be free like bolt.new?
2. **Max versions**: Should we cap version history (e.g., 20 versions)?
3. **Restore from preview**: Should clicking preview panel version restore it?
4. **Keyboard shortcut**: Add Cmd+Z for undo/restore?
5. **Bulk restore**: Allow restoring multiple versions at once?

---

## Session Metadata

- **Auto-apply timing**: Immediately on generation complete
- **Feedback**: Version badge update only (no toast)
- **Restore model**: Non-destructive, creates new version
- **Restore flow**: AI message + "(Restore) vN" card
- **Version access**: Restore button in each AI response card

---

## Sources

- [Backups, restore, and version history - Bolt.new](https://support.bolt.new/building/using-bolt/rollback-backup)
- [Using Bolt - Bolt](https://support.bolt.new/building/using-bolt)
- [Undo a revert - GitHub Issue](https://github.com/stackblitz/bolt.new/issues/7814)
