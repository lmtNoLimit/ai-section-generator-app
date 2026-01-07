# Phase 02: Hook Enhancement

**Effort**: 1.5h | **File**: `app/components/preview/hooks/usePreviewSettings.ts`

## Objective
Enhance `usePreviewSettings` hook to support bidirectional sync with callback.

## Current State
```typescript
// Current: One-way (schema → state)
const [settingsValues, setSettingsValues] = useState<SettingsState>(() =>
  buildInitialState(schemaSettings)
);
```

## Implementation

### 1. Add Sync Callback Prop

```typescript
interface UsePreviewSettingsOptions {
  onSettingsChange?: (settings: SettingsState, hasChanges: boolean) => void;
  debounceMs?: number;
}

export function usePreviewSettings(
  liquidCode: string,
  options: UsePreviewSettingsOptions = {}
) {
  const { onSettingsChange, debounceMs = 2000 } = options;
  // ... existing code
```

### 2. Add isDirty Tracking

```typescript
// Track if settings differ from schema defaults
const [isDirty, setIsDirty] = useState(false);

// Reference to initial state for comparison
const initialStateRef = useRef<SettingsState>(buildInitialState(schemaSettings));

// Update dirty state when settings change
useEffect(() => {
  const hasChanges = JSON.stringify(settingsValues) !==
    JSON.stringify(initialStateRef.current);
  setIsDirty(hasChanges);
}, [settingsValues]);
```

### 3. Add Debounced Sync Callback

```typescript
import { useDebouncedCallback } from 'use-debounce';

// Debounced callback for auto-save
const debouncedSync = useDebouncedCallback(
  (settings: SettingsState) => {
    onSettingsChange?.(settings, true);
  },
  debounceMs
);

// Enhanced settings change handler
const handleSettingsChange = useCallback((newValues: SettingsState) => {
  setSettingsValues(newValues);
  debouncedSync(newValues);
}, [debouncedSync]);
```

### 4. Reset Function Update

```typescript
// Reset to current schema defaults (not initial mount)
const resetToSchemaDefaults = useCallback(() => {
  const defaults = buildInitialState(schemaSettings);
  setSettingsValues(defaults);
  initialStateRef.current = defaults;
  setIsDirty(false);
  onSettingsChange?.(defaults, false); // Notify without dirty flag
}, [schemaSettings, onSettingsChange]);
```

### 5. Return Updated API

```typescript
return {
  // Existing
  parsedSchema,
  schemaSettings,
  settingsValues,
  setSettingsValues: handleSettingsChange, // Updated
  blocksState,
  // ...

  // New
  isDirty,
  resetToSchemaDefaults,

  // For parent to force sync
  forceSync: () => onSettingsChange?.(settingsValues, isDirty),
};
```

## Updated Hook Signature

```typescript
export function usePreviewSettings(
  liquidCode: string,
  options?: {
    onSettingsChange?: (settings: SettingsState, hasChanges: boolean) => void;
    debounceMs?: number;
  }
): {
  // Schema data
  parsedSchema: SchemaDefinition | null;
  schemaSettings: SchemaSetting[];

  // Settings state
  settingsValues: SettingsState;
  setSettingsValues: (values: SettingsState) => void;
  isDirty: boolean;

  // Blocks
  blocksState: BlockInstance[];
  handleBlockSettingChange: (idx: number, id: string, val: any) => void;

  // Resources
  resourceSelections: Record<string, SelectedResource | null>;
  handleResourceSelect: (id: string, rid: string | null, res: any) => void;
  isLoadingResource: boolean;

  // Actions
  resetToSchemaDefaults: () => void;
  forceSync: () => void;
};
```

## Testing Checklist
- [ ] Callback fires after debounce period
- [ ] isDirty true when settings differ from schema
- [ ] isDirty false after reset
- [ ] Reset restores current schema defaults
- [ ] Multiple rapid changes coalesce to single callback
