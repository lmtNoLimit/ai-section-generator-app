# Phase 2: Integrate Modal with AppProxyPreviewFrame

**Context**: [plan.md](./plan.md) | **Effort**: 1h | **Dependencies**: Phase 1

## Overview

Modify `AppProxyPreviewFrame.tsx` to detect password errors and show the `PasswordConfigModal` instead of just displaying a banner. After successful password save, auto-trigger preview refresh.

## Requirements

1. Detect password-related error strings from `useNativePreviewRenderer`
2. Track modal open state
3. Render `PasswordConfigModal` conditionally
4. On success callback, call existing `refetch()` to reload preview
5. Keep banner for non-password errors (don't break existing behavior)

## Architecture

**Error Detection Logic**:
```tsx
const PASSWORD_ERROR_PATTERNS = [
  "password-protected",
  "configure password",
  "password expired",
  "Storefront password",
];

function isPasswordError(error: string | null): boolean {
  if (!error) return false;
  return PASSWORD_ERROR_PATTERNS.some((pattern) =>
    error.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

**Component Changes**:
- Add `useState` for modal visibility
- Add `isPasswordError()` helper function
- Conditionally render modal vs banner
- Wire `onSuccess` to `refetch()`

## Related Code Files

| File | Lines | Relevance |
|------|-------|-----------|
| `app/components/preview/AppProxyPreviewFrame.tsx` | 196-206 | Current error banner |
| `app/components/preview/hooks/useNativePreviewRenderer.ts` | - | Error state source |
| `app/routes/api.preview.render.tsx` | 189-205, 263-270 | Error message strings |

## Implementation Steps

### Step 1: Add imports and helper function

At top of `AppProxyPreviewFrame.tsx`:

```tsx
import { PasswordConfigModal } from "./PasswordConfigModal";

// Password error detection patterns
const PASSWORD_ERROR_PATTERNS = [
  "password-protected",
  "configure password",
  "password expired",
];

function isPasswordError(error: string | null): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return PASSWORD_ERROR_PATTERNS.some((p) => lowerError.includes(p));
}
```

### Step 2: Add state for modal visibility

Inside component:

```tsx
const [showPasswordModal, setShowPasswordModal] = useState(false);
```

### Step 3: Handle password error detection

```tsx
// Determine if error is password-related
const passwordError = isPasswordError(error);

// Auto-show modal on password error
useEffect(() => {
  if (passwordError && !showPasswordModal) {
    setShowPasswordModal(true);
  }
}, [passwordError, showPasswordModal]);
```

### Step 4: Update error display section

Replace lines 196-206:

```tsx
{/* Error display */}
{error && !passwordError && (
  <s-box padding="base">
    <s-banner tone="warning" dismissible>
      {error}
      <s-button slot="secondary-actions" variant="tertiary" onClick={refetch}>
        Retry
      </s-button>
    </s-banner>
  </s-box>
)}

{/* Password error - show configure button instead of just banner */}
{error && passwordError && (
  <s-box padding="base">
    <s-banner tone="warning">
      {error}
      <s-button
        slot="secondary-actions"
        variant="tertiary"
        onClick={() => setShowPasswordModal(true)}
      >
        Configure Password
      </s-button>
    </s-banner>
  </s-box>
)}
```

### Step 5: Add modal component

Before closing `</s-box>` at end of component:

```tsx
{/* Password Configuration Modal */}
<PasswordConfigModal
  isOpen={showPasswordModal}
  onClose={() => setShowPasswordModal(false)}
  onSuccess={() => {
    setShowPasswordModal(false);
    // Auto-reload preview after password configured
    refetch();
  }}
/>
```

## Complete Diff Preview

```diff
 import { useState, useEffect, useRef, useMemo } from "react";
 import { useNativePreviewRenderer } from "./hooks/useNativePreviewRenderer";
 import { generateTargetingScript } from "./targeting/iframe-injection-script";
+import { PasswordConfigModal } from "./PasswordConfigModal";
 import type { DeviceSize } from "./types";
 import type { SettingsState, BlockInstance } from "./schema/SchemaTypes";
 import type { MockProduct, MockCollection } from "./mockData/types";

+// Password error detection patterns
+const PASSWORD_ERROR_PATTERNS = [
+  "password-protected",
+  "configure password",
+  "password expired",
+];
+
+function isPasswordError(error: string | null): boolean {
+  if (!error) return false;
+  const lowerError = error.toLowerCase();
+  return PASSWORD_ERROR_PATTERNS.some((p) => lowerError.includes(p));
+}

 // ... existing code ...

 export function AppProxyPreviewFrame({ ... }) {
   const containerRef = useRef<HTMLDivElement>(null);
   const [containerWidth, setContainerWidth] = useState<number>(0);
   const [iframeHeight, setIframeHeight] = useState<number>(400);
+  const [showPasswordModal, setShowPasswordModal] = useState(false);
   // ... rest of state ...

+  // Detect password errors
+  const passwordError = isPasswordError(error);
+
+  // Auto-show modal on password error (first occurrence)
+  useEffect(() => {
+    if (passwordError && !showPasswordModal) {
+      setShowPasswordModal(true);
+    }
+  }, [passwordError, showPasswordModal]);

   return (
     <s-box ...>
       <div ref={containerRef} ...>
-        {/* Error display */}
-        {error && (
+        {/* Non-password errors */}
+        {error && !passwordError && (
           <s-box padding="base">
             <s-banner tone="warning" dismissible>
               {error}
               <s-button slot="secondary-actions" variant="tertiary" onClick={refetch}>
                 Retry
               </s-button>
             </s-banner>
           </s-box>
         )}

+        {/* Password error - show configure option */}
+        {error && passwordError && (
+          <s-box padding="base">
+            <s-banner tone="warning">
+              {error}
+              <s-button
+                slot="secondary-actions"
+                variant="tertiary"
+                onClick={() => setShowPasswordModal(true)}
+              >
+                Configure Password
+              </s-button>
+            </s-banner>
+          </s-box>
+        )}

         {/* ... existing code ... */}
       </div>
+
+      {/* Password Configuration Modal */}
+      <PasswordConfigModal
+        isOpen={showPasswordModal}
+        onClose={() => setShowPasswordModal(false)}
+        onSuccess={() => {
+          setShowPasswordModal(false);
+          refetch();
+        }}
+      />
     </s-box>
   );
 }
```

## Todo List

- [x] Add import for PasswordConfigModal
- [x] Add helper function `isPasswordError()`
- [x] Add `showPasswordModal` state
- [x] Add useEffect for auto-show on password error
- [x] Split error display into password vs non-password
- [x] Add PasswordConfigModal render with callbacks
- [x] Test error detection with actual password errors

## Success Criteria

- [x] Password errors trigger modal visibility
- [x] Non-password errors still show banner as before
- [x] "Configure Password" button opens modal
- [x] Modal success triggers `refetch()` automatically
- [x] Modal close resets state correctly

## Phase 2 Completion Summary

**Status:** ✅ COMPLETE | **Date:** 2026-01-10

All todos completed successfully. Integration of PasswordConfigModal with AppProxyPreviewFrame verified:
- Error detection working for password-protected store scenarios
- Modal auto-opens on password errors, skipped for other errors
- Password modal and non-password banner logic properly separated
- onSuccess callback correctly triggers refetch() for auto-reload
- Modal state management clean with proper open/close handlers

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Error pattern mismatch | Medium | High | Test with all 3 error strings from api.preview.render |
| Modal auto-show loop | Low | Medium | Boolean check prevents re-trigger |
| Banner missing dismiss | Low | Low | Password banner intentionally non-dismissible |
