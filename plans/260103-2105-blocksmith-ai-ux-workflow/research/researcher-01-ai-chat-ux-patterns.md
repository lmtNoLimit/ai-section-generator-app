# AI Chat UX Patterns & Streaming Interfaces Research
**Blocksmith AI Section Generator**
Date: 2025-01-03 | Research for: Enhanced UX patterns with SSE streaming

---

## Executive Summary
Analyzed 4 primary UX dimensions across top AI tools (ChatGPT, Claude, v0.dev, Cursor, Bolt.new). Key finding: **context-aware progressive disclosure** works best for code generation. Implemented patterns show 3 concurrent streams: chat interaction, code generation progress, and follow-up suggestions.

---

## 1. PROMPT ENHANCEMENT UX

### Pattern: Multi-Stage Refinement
**Top tools**: ChatGPT (Memory + Image input), Claude (Artifacts sidebar), Cursor (Inline context highlighting)

**Implementation for Blocksmith**:
- **Pre-generation layer**: Show 2-3 "enhance" quick buttons below input:
  - "Add more details" → Expands input hints (height/width specs, color schemes)
  - "Generate variations" → Creates 3 prompt alternatives via LLM
  - "Use template" → Inserts example prompts (testimonial, product grid, etc.)

- **Post-generation layer**: After code streams, show refinement chips:
  - "Make it taller" / "Make shorter"
  - "Change color scheme"
  - "Add animations"
  - "Regenerate" (soft reset, keep conversation)

**Technical approach**:
```
Chat Input → Enhancement UI (chips) → Primary Prompt → Generation with Progress →
Refinement Chips (context-aware based on generated code)
```

**Timing**: Refinement chips appear after 100% of code received, preventing UX jank.

---

## 2. LIVE BUILD PROGRESS UX

### Pattern: Visual Milestone Markers (not steps)
**Top tools**: v0.dev (real-time preview), Cursor (type-aware progress), Bolt (project scaffolding checklist)

**Blocksmith-specific approach**:
Liquid code generation has distinct phases. Show **4 concurrent progress indicators**:

| Phase | Indicator | Visual |
|-------|-----------|--------|
| **Analyzing prompt** | Spinny dot + "Reading..." | Neutral gray |
| **Building markup** | Progress bar 0-60% | Blue accent |
| **Adding styles** | Progress bar 60-85% | Complementary color |
| **Schema + validation** | Progress bar 85-100% | Green check |

**Key implementation**:
- Stream tokens continuously, update progress % based on token count (not artificial steps)
- Show **code preview simultaneously** as it streams (not after completion)
- Keep progress visible in sidebar, not blocking main chat area
- Add subtle success animation when reaching 100%

**UX benefit**: Users see real work happening, not fake progress bars.

---

## 3. STREAMING CODE DISPLAY

### Pattern: Syntax-Highlighted Typewriter Effect with Context
**Top tools**: Code.Movie (declarative animation), Prism.js (lightweight highlighting)

**Implementation stack**:
```
Incoming SSE token stream →
Buffer 50-100ms chunks →
Append to DOM with Prism.js highlight() →
Apply CSS stagger animation for line-by-line appearance
```

**Specific techniques**:

1. **Chunked streaming**: Don't append every token. Buffer 50-100ms worth and append in groups (15-25 tokens). Prevents DOM thrashing.

2. **Syntax highlighting strategy**:
   - Use Prism.js (2KB minified) with only liquid + html + css languages (~1.2KB additional)
   - Highlight incrementally: `Prism.highlightElement(codeBlock)` after each append
   - For Liquid, use existing Prism grammar or extend with custom regex for `{% %}` blocks

3. **Visual typing effect**:
   - Use CSS `animation: streamIn 0.05s ease-out forwards;` with staggered `animation-delay`
   - Alternative: JS-based line-by-line reveal (better browser compatibility)
   - Apply delay = `(lineNumber * 30ms)` to create waterfall effect

4. **Performance optimization**:
   - Virtualize long code blocks (>500 lines) with scroll container
   - Pre-allocate fixed-height code block to prevent layout shift
   - Use `will-change: opacity` for animated lines

**Code block template**:
```jsx
<pre className="liquid-code" style={{ height: '400px', overflow: 'auto' }}>
  <code className="language-liquid" ref={codeRef}></code>
</pre>
```

---

## 4. AI SUGGESTION CHIPS / FOLLOW-UP BUTTONS

### Pattern: Context-Aware Suggestion Placement
**Top tools**: ChatGPT (Memory → suggestions), Claude (Artifact actions sidebar)

**Blocksmith approach** - **3-tier chip system**:

#### Tier 1: Immediate Actions (Below code block)
Always show 2 persistent buttons:
- `Copy Code` (gray)
- `Preview in Editor` (primary)

#### Tier 2: Code Refinement Chips (Scrollable row)
Appear after code fully streams. Context-aware based on `codeType`:

For **product grids**:
- "Add sort/filter"
- "Show prices"
- "Add wishlist button"

For **testimonials**:
- "Add ratings"
- "Include images"
- "Show company logos"

For **headers**:
- "Add nav menu"
- "Include search"
- "Add cart badge"

**Implementation**: Maintain `generatedSectionType` state, map to suggestion pool.

#### Tier 3: Conversation Next-Steps
After user's next message, suggest:
- "Create another section"
- "Edit this section"
- "View theme sections"
- "Publish changes"

**Placement rules**:
- Tier 1: Always visible, sticky
- Tier 2: Auto-scroll into view after generation, persist
- Tier 3: Appear only after 1+ additional exchanges

**Timing**: Tier 2 chips render at 80% code completion to feel responsive.

---

## 5. CHAT STREAMING STATE MANAGEMENT

### Recommended architecture:
```
useStreamingChat(prompt) → {
  status: 'idle' | 'streaming' | 'complete'
  tokens: string[]         // Raw tokens from SSE
  displayText: string      // Chunked for display
  codeContent: string      // Liquid code only
  progress: number         // 0-100%
  suggestions: Suggestion[] // Context-aware
  error?: string
}
```

**Event sequence**:
1. User submits prompt
2. Create SSE connection, set `status: 'streaming'`
3. Receive tokens, accumulate in buffer
4. Every 50-100ms: append chunk to DOM, highlight, calculate progress
5. On SSE close: set `status: 'complete'`, render Tier 2 chips
6. On user action (copy/preview): log analytics

---

## Key Sources & References

**UX Pattern Sources**:
- [The Shape of AI - AI UX Patterns](https://www.shapeof.ai/)
- [AI UI Patterns - React Patterns](https://www.patterns.dev/react/ai-ui-patterns/)
- [Ultimate Guide to AI Chatbots](https://www.mockplus.com/blog/post/guide-to-ai-chatbots-best-practices-examples)
- [Chatbot UX Tips 2025](https://www.netguru.com/blog/chatbot-ux-tips)

**Code Generation Tool Analysis**:
- [v0.dev vs Cursor - BitCot Comparison](https://www.bitcot.com/v0-dev-vs-cursor-ai-full-comparison-use-cases-and-best-choice/)
- [Cursor vs v0 - 2026 Comparison](https://blog.tooljet.com/v0-vs-cursor/)
- [Medium: Cursor AI, v0, Bolt Comparison](https://carlrannaberg.medium.com/cursor-ai-v0-and-bolt-new-an-honest-comparison-of-todays-ai-coding-tools-b4277e1eb1f9)

**Streaming & Syntax Highlighting**:
- [Code.Movie - Animated Syntax Highlighter](https://code.movie/)
- [Prism.js Documentation](https://prismjs.com/)
- [Real-time Syntax Highlighting Techniques](https://gomakethings.com/how-to-add-syntax-highlighting-to-code-as-a-user-types-in-realtime-with-vanilla-javascript/)

**AI Chat Features**:
- [ChatGPT vs Claude 2025 Comparison](https://zapier.com/blog/claude-vs-chatgpt/)
- [Claude Extended Thinking & Artifacts](https://creatoreconomy.so/p/chatgpt-vs-claude-vs-gemini-the-best-ai-model-for-each-use-case-2025)

---

## Unresolved Questions

1. **Progress calculation**: Should progress % be based on token count estimate or semantic detection (when HTML, CSS, schema complete)?
2. **Refinement chip context**: For edge cases (header with testimonials), which chip set shows? Need decision on precedence.
3. **Syntax highlighting for Liquid**: Does Prism have native Liquid support, or build custom grammar?
4. **Suggestion analytics**: Track which chips users click vs ignore? Inform future UX tuning?

---

## Recommended Next Steps

1. **Design spec**: Create Figma wireframe with 3 progress indicators + 3 chip tiers
2. **Prototype**: Build React component using Prism.js + SSE streaming (1-2 day effort)
3. **User testing**: A/B test chip placement (below code vs sidebar) with 10 merchant users
4. **Technical validation**: Confirm Liquid syntax support in Prism or implement custom grammar
