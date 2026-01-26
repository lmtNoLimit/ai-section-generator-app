# AI Chat Panel UX Research: Streaming, Phase Indicators, Progress Feedback
**Date:** 2026-01-26 | **Status:** Complete

---

## Executive Summary

Modern AI code generation interfaces (Bolt.new, Lovable, Claude) use **streaming + phase indicators** pattern to reduce perceived latency. Key finding: psychological progress feedback (phase labels) combined with genuine streaming latency reduction creates optimal UX.

---

## 1. Streaming UX Patterns

### Why Streaming Matters
- **Problem:** Traditional blocking UIs force users to wait 5-40 seconds for complete LLM responses
- **Solution:** Stream partial responses as they generate
- **Impact:** Users see progress immediately, perception of speed increases dramatically

### Implementation Reality
- Streaming reduces actual user-perceived latency (not just psychological)
- Faster models + no streaming sometimes simpler than slow models + streaming
- Sweet spot: medium models + streaming for code generation

### Pattern: Incremental Display
```
User submits → Immediate feedback (spinner)
→ Phase label appears ("Analyzing...")
→ Streamed output arrives in chunks
→ Next phase ("Generating...") appears
→ Final phase ("Styling...")
```

---

## 2. Phase Indicators: Best Practices

### Lovable Approach (Verified)
- **Planning phase first**: Generates design inspiration, lists visual elements, explains features
- **Then code generation**: Begins coding with context established
- **Psychology:** Users understand "thinking time" = analysis happening
- **Benefit:** Complex projects feel more structured, less chaotic

### Multi-Phase Strategy
Phase order matters for code generation:
1. **Analyzing** (0-2s) - Processing request, checking context
2. **Planning** (1-3s) - Structuring approach, determining tech stack
3. **Generating** (2-10s) - Code streaming begins here
4. **Styling** (1-5s) - CSS/UI polish streaming
5. **Ready** - Full completion

### Phase Indicators vs. Simple Spinner
- **Spinners alone:** Feels slow, unclear if work happening
- **Phase labels:** Dramatically reduces anxiety, provides mental model
- **Combined:** Spinner + current phase name = optimal UX
- **Data:** Phase indicators mostly psychological effect, but effect is powerful

---

## 3. Progress Bars vs. Spinners

### For Unknown-Duration Tasks (AI Generation)
- **Indeterminate progress bar** > spinner (subtle motion better than constant spin)
- **Why:** Indicates work happening without false precision
- **Avoid:** Determinate bars (unreliable in AI, breed distrust when inaccurate)

### For Code Generation Specifically
- **Best:** Phase indicator (text label) + indeterminate spinner
- **Alternative:** Multi-segment progress (3-5 phases lit up progressively)
- **Worst:** Percentage bars (can't estimate LLM output duration)

### Design Principles
- Keep simple: one metric is better than many
- Minimize information density (avoid clutter)
- Use color psychologically: blue/purple for processing, green for success

---

## 4. Bolt.new & Lovable Comparative Insights

### Bolt.new Strategy
- **Core advantage:** Diffs feature (incremental updates only)
- **UX pattern:** Real-time preview + incremental code updates
- **Perceived speed:** Faster due to visible changes only
- **Phase feedback:** Implicit through code diff visualization

### Lovable Strategy
- **Core advantage:** Planning-first approach
- **UX pattern:** Detailed planning → code generation → live preview
- **Perceived speed:** Feels slower but more predictable
- **Phase feedback:** Explicit text description of analysis phase

### Common Thread
Both use **streaming + multi-phase execution**, but differ in:
- Visibility of planning phase (Lovable explicit, Bolt implicit)
- Code update strategy (Bolt diffs, Lovable full re-render)
- Feedback mechanism (Bolt visual, Lovable textual)

---

## 5. Actionable Implementation Insights

### For Blocksmith Chat Panel

**Immediate priorities:**
1. Implement phase-aware streaming display
2. Add phase labels: "Analyzing", "Planning", "Generating", "Styling"
3. Use indeterminate spinner + phase text combination
4. Stream code chunks incrementally (not full file at once)

**Phase Label Placement**
- Above spinner text
- Update every 0.5-2s as phase changes
- Color code phases (optional): analysis=blue, generation=purple, complete=green

**Streaming Architecture**
- First chunk: Enables initial UI state ("analysis started")
- Middle chunks: Triggers phase changes (via metadata)
- Final chunk: Marks complete, shows ready state

**Token Efficiency**
- Send minimal phase metadata with each stream (50-100 bytes)
- Use predictable phase sequence (no branching logic in UI)
- Cache common phase transition timings

---

## 6. User Psychology Factors

### Why Phase Indicators Work
- **Mental model clarity:** Users understand what's happening
- **Reduced anxiety:** Action items create engagement points
- **Trust building:** Transparent process signals reliability
- **Completion prediction:** Users can estimate "when will this finish?"

### Effective Phase Names
- ✅ "Analyzing request" / "Planning solution" / "Generating code"
- ❌ "Processing" / "Working" / "Thinking" (too vague)
- ✅ Show actual operation: "Installing dependencies" / "Running tests"
- ❌ Generic spinners without context

---

## 7. Technical Considerations

### Streaming Protocol
- Use SSE (Server-Sent Events) or WebSocket for true streaming
- Emit phase change events as metadata (not inline with code)
- Example: `{type: "phase_change", phase: "generating"}` before code chunks

### Client-Side Display
- Debounce phase updates (avoid flicker: 200ms min between phase changes)
- Keep spinner running until complete (no jump to "ready" then blank)
- Preserve all streamed content in UI (append-only pattern)

### Error Handling
- Don't hide phase on error (user sees what failed)
- Show error message with phase context: "Error during **Generating** phase"
- Allow retry at specific phase (UX win: don't start over)

---

## Unresolved Questions

1. Should phase timing be consistent (hardcoded) or dynamic (based on actual processing)?
2. How to handle multi-modal outputs (code + preview + explanation)?
3. Is estimated completion time helpful or harmful for AI tasks?
4. Best phase granularity (3 phases vs 7 phases)?

---

## Sources

- [Streaming Foundations - AI SDK](https://ai-sdk.dev/docs/foundations/streaming)
- [Bolt.new GitHub Repository](https://github.com/stackblitz/bolt.new)
- [Bolt vs Lovable Comparison](https://www.nocode.mba/articles/bolt-vs-lovable)
- [Lovable vs Bolt 2025 Guide](https://techpoint.africa/guide/lovable-vs-bolt/)
- [AI Coding Best Practices 2025 - DEV Community](https://dev.to/ranndy360/ai-coding-best-practices-in-2025-4eel)
- [Comparing Conversational AI UIs 2025](https://intuitionlabs.ai/articles/conversational-ai-ui-comparison-2025)
