# Visual Editing & Element Targeting UX Research
**Blocksmith AI Section Generator** | 2026-01-03

## Executive Summary
Visual editing UX is technically feasible for Blocksmith using proven patterns from Webflow, Framer, and Shopify ecosystem. Key pattern: **postMessage-based cross-iframe communication** for element targeting + **surgical diffs with inline highlighting** for code preview. HMR is viable via Volt (Vite plugin) but applies to asset pipeline, not real-time Liquid template HMR. Schema validation UX aligns with no-code builder patterns (live feedback, inline errors).

---

## 1. Element Targeting in Previews

### Technical Approach
**Cross-iframe Communication Pattern** (proven by Webflow/Framer)
- Parent frame sends `postMessage()` event to preview iframe on click
- Preview iframe attaches click listeners to all elements, returns element metadata (selector, tag, classes, position)
- Parent frame highlights element in viewport using overlay div or border
- Bidirectional: iframe → parent for element info, parent → iframe for highlights

**Implementation Strategy**
```
User clicks element in preview →
  Preview iframe captures click →
  Postmessage { type: 'elementSelected', target: DOMElement, selector: '.css-class' } →
  Parent receives → highlights + shows in UI panel
```

**Why This Works**
- No iframe sandbox restrictions if same-origin
- Avoids DOM access violations (cross-origin iframes block direct DOM queries)
- Matches Figma Dev Mode's "inspect element" UX

### Limitations
- Cross-origin previews (different domain) require `sandbox="allow-same-origin"` + CORS headers
- Mobile touch events need special handling vs click
- Performance: DOM traversal on every click needs debouncing

---

## 2. Diff Visualization

### Surgical Diff Pattern (GitHub/GitLab Standard)
**Inline Highlighting Approach**
- Line-by-line comparison with color coding: red (removed), green (added), gray (unchanged)
- Side-by-side vs inline view toggle
- Syntax highlighting applied per language (Liquid + embedded CSS/JS)

**Implementation for Blocksmith**
```
Before: <div class="section">...
After:  <div class="section" id="hero">...
Display: red background on deleted line, green on added
```

**Code Review Tools Reference**
- GitHub: unified diff with +/- prefix, color-coded backgrounds
- GitLab: diff customization options for color preferences
- Cursor/Copilot: inline code suggestions with insertion markers

### Advanced Pattern: Context-aware Diff
- Show 3 lines of context before/after change
- Collapse unchanged sections (fold/unfold)
- Diff stats: +2 lines, -1 line, 3 changed blocks

### Feasibility
**High** - can be built with difflib (JS), highlight.js (syntax coloring), and custom CSS. No external dependencies required.

---

## 3. Hot Module Replacement (HMR)

### Shopify Liquid + HMR Reality Check

**CRITICAL FINDING**: True HMR for Liquid templates is NOT standard. Liquid is server-side templated. Options:

#### Option A: Asset HMR (Recommended)
- Use **Volt** (vite-plugin-shopify) for CSS/JS HMR in Shopify themes
- Volt injects Vite dev server script into theme during development
- CSS/JS changes reflect instantly; Liquid changes require page reload
- **Status**: Production-ready in Shopify ecosystem

#### Option B: Pseudo-HMR for Blocksmith
- Live preview iframe refreshes on section Liquid changes (not true HMR)
- CSS/JS changes use Vite HMR → iframe reloads only CSS/JS
- User sees "Live Preview Updating..." indicator
- **Status**: Feasible, but hybrid approach

#### Option C: Custom HMR via WebSocket
- Blocksmith server watches Liquid file changes
- Sends diff + new HTML to preview iframe via WebSocket
- Iframe morphs DOM (not reload)
- **Status**: High complexity, diminishing returns over Option B

### Recommendation
**Use Volt pattern for assets + iframe refresh for Liquid**. Matches Shopify Dev workflow expectations.

---

## 4. Schema Validation UX

### No-Code Builder Standard (Airtable, Bubble, Fillout)

**Live Validation Pattern**
- Real-time field validation as user types
- Inline error messages below/beside field
- Red border + error icon on invalid state
- Success checkmark on valid completion

**Implementation**
```
User enters value →
  On blur/onChange →
  Run validation rules (required, type, length, pattern) →
  Display result (green checkmark, red error, amber warning)
```

**Error Feedback Hierarchy**
1. **In-form errors**: Red text under field, icon indicator
2. **Form-level errors**: Summary bar at top (red bg, dismissible)
3. **Success state**: Green checkmark, optional toast notification

### Blocksmith-Specific
- Validate Liquid syntax in schema fields (curly braces, filters, tags)
- Show variable preview on hover (e.g., `{{ product.title }}` → "Example Product")
- Block publishing if schema has errors

### Precedent
Airtable forms + Zapier integrations use this exact pattern for field validation. Fillout adds payment validation. Low implementation overhead.

---

## Technical Recommendations

### Stack for Blocksmith
1. **Element Targeting**: postMessage API + MutationObserver for DOM changes
2. **Diff Preview**: diff-match-patch (JS lib) + custom syntax highlighter for Liquid
3. **HMR**: Vite + Volt pattern (asset-focused)
4. **Schema Validation**: Zod/Yup for client-side rules + inline feedback UI

### Cross-Cutting Concerns
- **Performance**: Debounce element clicks (200ms), virtualize diff views (render visible lines only)
- **Accessibility**: ARIA labels for validation states, keyboard navigation in diffs
- **Browser Support**: Requires postMessage (IE9+), ResizeObserver (modern browsers)

---

## Unresolved Questions
1. What is Blocksmith's cross-origin preview URL strategy? (affects postMessage security)
2. Should diff preview show full file or block-level changes only?
3. Does HMR need to work for Liquid includes/snippets, or just section template?
4. Are there Shopify-specific schema validation rules to enforce? (e.g., block/setting name constraints)

---

## Sources
- [Communication with embedded frames - MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API/Fenced_frame_API/Communication_with_embedded_frames)
- [Volt - Vite Plugin for Shopify Development](https://shopify-vite.barrelny.com/guide/)
- [Best-in-Class Developer Experience with Vite and Hydrogen - Shopify Engineering](https://shopify.engineering/developer-experience-with-hydrogen-and-vite)
- [Hydrogen Update March 2025](https://hydrogen.shopify.dev/update/march-2025)
- [Form Validation Best Practices - Zapforms](https://zapforms.io/blog/form-validation-best-practices)
- [SaaS UI Workflow Patterns - GitHub Gist](https://gist.github.com/mpaiva-cc/d4ef3a652872cb5a91aa529db98d62dd)
