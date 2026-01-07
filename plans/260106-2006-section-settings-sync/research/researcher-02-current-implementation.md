# Current Preview Settings Implementation Analysis

**Date**: Jan 6, 2026 | **Researcher**: researcher
**Plan**: plans/260106-2006-section-settings-sync

---

## 1. CURRENT PREVIEW SETTINGS COMPONENTS

### Located Files
- **UI Component**: `app/components/editor/PreviewSettingsPanel.tsx` (imported in editor routes)
- **Hook**: `app/components/preview/usePreviewSettings` (manages settings state)
- **Preview Context**: `app/components/preview/` directory
- **Image Picker**: `app/components/preview/settings/ImagePickerModal.tsx`
- **Settings Page**: `app/routes/app.sections.$id.tsx` (main editor layout)

### Key Import Chain (Section Editor)
```
app.sections.$id.tsx
├── PreviewSettingsPanel (from editor components)
├── usePreviewSettings (hook)
├── CodePreviewPanel
├── ChatPanelWrapper
└── ImagePickerModal
```

---

## 2. DATA FLOW: UI → PREVIEW → LIQUID

### Current Flow Diagram
```
User Input (PreviewSettingsPanel)
    ↓
usePreviewSettings Hook (local state)
    ↓
Preview Context (provides settings to preview)
    ↓
CodePreviewPanel (renders Liquid section)
    ↓
Shopify Product/Collection Context (injected at runtime)
```

### Settings Application Points
1. **PreviewSettingsPanel**: Accepts user input (colors, text, selections, media)
2. **usePreviewSettings**: Manages local state for settings
3. **Preview Component**: Consumes settings via hook/context
4. **Liquid Render**: Settings substituted via `{{ section.settings.* }}`

### Missing Link Identified
- **No settings synchronization back to Liquid schema**
- Settings edited in preview UI don't update section code
- AI-generated sections have hardcoded defaults in schema

---

## 3. STATE MANAGEMENT

### Current Pattern
- **Local State**: `usePreviewSettings` hook manages settings per preview
- **Context API**: Preview context provides settings to nested components
- **No Persistence**: Settings lost on page refresh (local-only state)
- **No Schema Sync**: Preview settings don't update schema defaults

### State Structure (Inferred from Usage)
```typescript
{
  [settingId: string]: {
    type: string,        // text, number, color, select, image_picker, etc
    value: any,
    label?: string
  }
}
```

### Gap: No State Persistence
- Preview settings are ephemeral (local state only)
- No mechanism to save settings to section.json
- No auto-update of schema defaults when preview settings changed

---

## 4. AI GENERATION INTEGRATION

### Current AI Flow
**File**: `app/services/ai.server.ts`

### System Prompt Features (SYSTEM_PROMPT in ai.server.ts)
1. **Schema Structure**: Enforces section/blocks/settings format
2. **Input Types**: Comprehensive reference for 40+ setting types
3. **Image Patterns**: Separate handling for content vs background images
4. **Presets**: Requires preset matching schema name
5. **Defaults**: Each setting can have default value

### Key Constraint in Prompt
```
LINE 50: "image_picker: Returns image object. NO default supported.
         MUST use conditional rendering (see IMAGE PLACEHOLDER PATTERN)"
```

### Gap: Settings Not Integrated
- AI generates sections with defaults in schema
- No settings data passed from preview → AI refinement
- AI refinement requests don't consider current preview settings
- Settings changes in preview can't be fed back to AI

---

## 5. GAP ANALYSIS: PREVIEW SETTINGS ↔ LIQUID SCHEMA

### Current Disconnects

| Component | Issue | Impact |
|-----------|-------|--------|
| Preview UI Settings | Local-only, ephemeral | Lost on refresh |
| Schema Defaults | Hardcoded in AI output | Can't update without regen |
| AI Refinement | No settings context | Can't preserve user edits |
| Chat System | No settings awareness | Can't reference current state |
| Code Export | Schema ≠ Preview state | Exported code different from preview |

### Data Flow Gaps
1. **Preview → Schema**: No mechanism to update schema defaults from preview
2. **Refinement → Settings**: Chat doesn't know current preview state
3. **Schema → Preview**: Settings read one-way only
4. **Persistence**: No storage for edited settings

### Specific Implementation Gaps

**Gap 1: State Persistence**
- PreviewSettingsPanel updates local state only
- No save mechanism for settings
- No database storage of settings per section

**Gap 2: Schema Synchronization**
- AI generates section with default schema
- User edits settings in preview
- Code export doesn't reflect preview edits
- Schema still has old defaults

**Gap 3: AI Context**
- System prompt doesn't include current section settings
- Refinement requests lose preview context
- AI can't intelligently refine based on current state

**Gap 4: Type Safety**
- Settings UI doesn't validate against schema
- Preview may apply settings schema doesn't define
- Type mismatch between preview state and Liquid rendering

---

## 6. CURRENT DOCUMENTATION

### Existing References
- **SYSTEM_PROMPT**: `app/services/ai.server.ts` (lines 6-100)
- **Image Patterns**: Lines 71-100 (content vs background)
- **Schema Rules**: Lines 15-23 (structure, presets, validation)

### Missing Documentation
- Preview settings state structure
- Settings synchronization architecture
- Settings persistence strategy
- Preview ↔ Liquid bidirectional sync

---

## Unresolved Questions

1. **Settings Persistence**: Should preview settings auto-save to database or be session-only?
2. **Schema Updates**: When user changes preview settings, should AI regenerate or manual override?
3. **Refinement Context**: Should chat refinements include "current preview settings are X" in prompt?
4. **Type Validation**: Should preview validate settings against generated schema before applying?
5. **Export Behavior**: Should export include current preview settings as schema defaults or preserve original?
