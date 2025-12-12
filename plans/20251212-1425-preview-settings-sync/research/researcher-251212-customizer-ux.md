# Research: Shopify Theme Customizer & Section Settings UX

**Date**: 2025-12-12
**Status**: Complete
**Scope**: Current preview UI patterns, settings handling, and recommended architecture

## Executive Summary

App has comprehensive live preview infrastructure with working settings panel. Pattern mirrors Shopify theme customizer: settings form on left/top → live preview iframe. Architecture supports single section settings, blocks (repeatable groups), and resource pickers. Ready for enhancement but needs synchronized state management to handle customizer-level editing.

## Current Preview UI Components

### Architecture Layer
```
SectionPreview (main orchestrator)
├── SettingsPanel (collapsible form)
│   ├── SettingField (router component)
│   └── 20+ setting type components (TextSetting, ColorSetting, etc.)
├── PreviewFrame (sandboxed iframe)
│   └── embedded IFRAME_HTML with postMessage protocol
└── Resource fetchers (useResourceFetcher hook)
```

### Key Files
- **SectionPreview.tsx**: Main component (~295 lines) orchestrates settings → preview flow
- **SettingsPanel.tsx**: Collapsible settings form UI with device size controls
- **SettingField.tsx**: Router dispatching settings to type-specific components (303 lines)
- **PreviewFrame.tsx**: Sandboxed iframe with srcDoc + postMessage (~230 lines)
- **types.ts**: Core preview types (PreviewSettings, PreviewMessage, DeviceSize)

## Current Settings Input Handling

### State Management (SectionPreview)
- **settingsValues**: SettingsState stores all section-level settings
- **blocksState**: BlockInstance[] array for repeatable block settings
- **settingsResourceSelections**: Tracks selected product/collection for resource pickers
- **settingsResources**: Cached resource data (MockProduct/MockCollection)

### Change Flow
```
User modifies input (TextSetting, ColorSetting, etc.)
  ↓
SettingField onChange() called
  ↓
SectionPreview.handleSettingsChange() updates state
  ↓
useEffect triggers debounced render (100ms)
  ↓
useLiquidRenderer renders Liquid + context
  ↓
sendMessage() posts HTML/CSS to iframe via postMessage
  ↓
Iframe receives, updates DOM, calculates height
```

**Note**: Settings changes automatically trigger preview render. No manual refresh required for basic types. Resource pickers have async fetch (setIsLoadingSettingsResource).

## UI Patterns for Settings Forms

### Polaris Web Components Integration
```jsx
// SettingsPanel renders:
<s-stack gap="large" direction="block">
  <div> {/* Preview controls toolbar */}
    <s-button variant="primary|secondary"> Mobile/Tablet/Desktop
    <s-button loading={isRendering}> Refresh
  </div>
  {/* Settings form fields */}
</s-stack>
```

### Setting Type Coverage (26+ types)
1. **Basic**: text, textarea, richtext, url, html, liquid, number, range
2. **Selection**: select, radio, checkbox
3. **Design**: color, color_background, font_picker, text_alignment
4. **Media**: image_picker, video, video_url
5. **Resources**: product, collection, article, blog, page, link_list
6. **Multi-select**: product_list, collection_list

### Block Rendering Pattern
Settings panel auto-detects blocks in schema and renders collapsible sections:
```
Main Settings (expanded by default)
  Setting 1: Text input
  Setting 2: Color picker

Block "Testimonial" (collapsible)
  Setting 1: Text input
  Setting 2: Product picker

Block "Feature Item" (collapsible)
  Setting 1: ...
```

## Resource Picker Architecture

### Resource Fetching (useResourceFetcher hook)
```ts
const { fetchProduct, fetchCollection, error: fetchError } = useResourceFetcher();
```
- Async fetches MockProduct/MockCollection from Shopify API
- Returns structured data with variants/products arrays
- Used in ProductSetting, CollectionSetting components

### Settings vs. Resource Contexts
Two data flows:
1. **Resource for preview context**: settingsResources → buildPreviewContext → Liquid renderer
2. **Resource selection UI state**: settingsResourceSelections → displayed in form

Pattern allows showing "Selected: Product Name" while data loads asynchronously.

## Best Practices Evident in Codebase

1. **Debounced Rendering**: 100ms debounce prevents excessive iframe postMessages
2. **Unique IDs for Blocks**: blockId generation handles duplicate setting.ids across block instances
3. **Lazy Loading**: Resource fetchers load only when explicitly selected
4. **Error Boundaries**: PreviewErrorBoundary + error state management
5. **Device Size Switching**: Hardcoded device widths, CSS transform scaling for preview
6. **Keyboard Shortcuts**: Ctrl+R refresh, Ctrl+1/2/3 device size (implemented in SectionPreview)
7. **Polaris Web Components**: Uses `<s-*>` elements for admin consistency
8. **Type Safety**: Full TypeScript with SchemaSetting, SettingsState, SchemaTypes interfaces

## Preview-Customizer Sync Challenges

### Current Limitations
- **Single-section preview only**: No cross-section preview
- **Local state management**: Settings live only in component state, not persisted
- **No undo/redo**: State changes not tracked
- **Manual resource selection**: Pickers require clicking, no bulk operations

### For Customizer Integration
To align with Shopify customizer model:
- Need **centralized settings store** (React Context or state management library)
- Settings must be **serializable** for draft persistence
- Need **publish workflow** (save draft vs. publish to theme)
- May need **validation schema** to match Shopify constraints

## Recommended Settings Panel Architecture

### Current Strengths
- **Modular**: 20+ reusable setting components
- **Type-driven**: SettingField router eliminates switch logic sprawl
- **Async-friendly**: Built-in loading states for resource pickers
- **Accessible**: Polaris components handle keyboard/ARIA

### For Phase 4+ Enhancement
```
SettingsPanel (existing, no major changes)
  ↓
CustomizerStateManager (new)
  ├── Provides: current settings, history, validation
  ├── Handles: undo/redo, draft persistence
  └── Syncs: with theme.sections[] in Shopify Admin API
```

### Minimal Changes Required
1. Lift state from SectionPreview → route loader (if part of app.sections.$id route)
2. Wrap SettingsPanel in context provider for customizer state
3. Add publish button triggering API save
4. No major changes to SettingField or setting components needed

## File Organization Reference

```
app/components/preview/
├── SectionPreview.tsx (orchestrator, 295 lines)
├── settings/
│   ├── SettingsPanel.tsx (form wrapper, expandable)
│   ├── SettingField.tsx (router, 303 lines)
│   ├── TextSetting.tsx, ColorSetting.tsx, etc. (20+ components)
│   └── index.ts (barrel export)
├── PreviewFrame.tsx (iframe wrapper, 230 lines)
├── PreviewToolbar.tsx (legacy, may be deprecated)
├── schema/
│   ├── SchemaTypes.ts (type definitions)
│   └── parseSchema.ts (Liquid schema extraction)
├── hooks/
│   ├── useLiquidRenderer.ts (Liquid → HTML/CSS rendering)
│   ├── usePreviewMessaging.ts (postMessage protocol)
│   └── useResourceFetcher.ts (Shopify API calls)
├── mockData/ (test/preview data fixtures)
└── drops/ (Liquid variable context providers)
```

## Integration Points for Customizer

### Routes
- `app.sections._index.tsx`: List of saved sections
- `app.sections.new.tsx`: Generate new section
- `app.sections.$id.tsx`: Edit/preview existing section

**Missing**: Direct customizer URL pattern. May need `app.sections.$id.customize.tsx` for full-page customizer mode.

### Data Flow
Settings → SectionPreview → [SettingsPanel + PreviewFrame] → Live Render

**Gap**: No clear "publish to theme" action in preview flow. Currently only Save Draft/Publish exist in generate route.

## Unresolved Questions

1. **Customizer Mode vs. Preview Mode**: Should full-page customizer be separate route or mode flag in $id route?
2. **Settings Persistence**: Store draft settings in DB, localStorage, or ephemeral React state?
3. **Multi-block Editing UI**: Current block expansion works but UI could be cramped with 5+ blocks
4. **Resource Picker Scale**: How does picker perform with 1000+ products? Any pagination needed?
5. **Mobile Preview in Customizer**: Should mobile preview be side-by-side or modal overlay?

---

**Report Author**: Claude Research Agent
**Token Usage**: Research-phase investigation
**Confidence Level**: High (code review based, not speculative)
