# Chat Components Test Suite

Comprehensive unit tests for Phase 02 Chat Components implementation.

## Test Files

### 1. useChat.test.ts
Tests the `useChat` hook - main state management for chat messaging.

**Coverage:**
- Message state initialization
- Loading existing messages
- Sending messages with optimistic updates
- Streaming response handling
- Error handling (network, HTTP errors)
- Code snapshot callbacks
- Stop streaming functionality

**Key Test Scenarios:**
- Empty message prevention
- Whitespace trimming
- Concurrent message blocking
- Stream event parsing
- AbortController cleanup

### 2. useAutoScroll.test.ts
Tests the `useAutoScroll` hook - handles automatic scroll-to-bottom behavior.

**Coverage:**
- Container reference management
- Scroll-to-bottom (smooth and instant)
- Scroll position detection
- Threshold-based auto-scroll enable/disable
- Custom threshold configuration
- Missing container graceful handling

**Key Test Scenarios:**
- User scroll detection (near bottom vs. scrolled away)
- Scroll re-engagement on new content
- Distance calculation accuracy

### 3. ChatInput.test.tsx
Tests the `ChatInput` component - message input with send/stop buttons.

**Coverage:**
- Text input rendering and value management
- Textarea auto-resize behavior
- Message send on button click
- Message send on Enter key
- Shift+Enter for newline
- Send/Stop button state toggling
- Disabled state handling
- Empty/whitespace message rejection
- Accessibility (aria-labels)

**Key Test Scenarios:**
- Keyboard shortcuts (Enter vs Shift+Enter)
- Streaming state UI updates
- Textarea height adjustment
- Integration flow (type, modify, send)

### 4. CodeBlock.test.tsx
Tests the `CodeBlock` component - syntax-highlighted code display.

**Coverage:**
- Code rendering with language labels
- Default language fallback (liquid)
- Copy button functionality
- Copy feedback (✓ Copied)
- Line numbers display/hiding
- Multi-line code handling
- Various language support (JS, liquid, HTML, CSS, etc.)
- Special character handling
- Long code handling
- Empty code handling
- Accessibility (aria-labels)
- CSS class structure

**Key Test Scenarios:**
- Copy to clipboard integration
- Language detection
- Line number rendering
- Code block structure validation

### 5. MessageItem.test.tsx
Tests the `MessageItem` component - individual message rendering.

**Coverage:**
- User message rendering with avatar (👤)
- Assistant message rendering with avatar (🤖)
- Plain text content
- Code block detection and extraction
- Language tag parsing
- Multiple code blocks per message
- Mixed text and code content
- Streaming indicator (cursor animation)
- Error state display
- Memo optimization verification
- Edge cases (very long content, whitespace, empty)

**Key Test Scenarios:**
- Content parsing with regex
- Avatar selection by role
- Cursor position on streaming
- Code block detection accuracy

## Running Tests

```bash
# Run all chat component tests
npm test -- chat

# Run specific test file
npm test -- ChatInput.test.tsx

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

## Test Statistics

- **Total Tests:** 117
- **Test Suites:** 5
- **Execution Time:** ~1.7 seconds
- **Coverage:** All interactive components and hooks

## Implementation Notes

### Mocking Strategy
- Fetch API mocked for streaming scenarios
- Clipboard API mocked for copy functionality
- Timer mocking for timeout-based feedback
- userEvent for realistic user interactions

### Testing Patterns
- Arrange-Act-Assert for clarity
- Data factories for consistent test data
- Separate describe blocks by feature
- Integration tests for user flows

### Edge Cases Tested
- Empty/whitespace input
- Very long content
- Multiple rapid interactions
- Error recovery
- Accessibility compliance

## Future Improvements

1. **E2E Tests:** Add Playwright tests for full user flows
2. **Performance:** Add benchmarks for large message lists
3. **Snapshots:** Consider for complex parsing scenarios
4. **Integration:** Full chat flow with mock API

## Related Files

- Components: `/app/components/chat/`
- Hooks: `/app/components/chat/hooks/`
- Types: `/app/types/chat.types.ts`
- Server API: `/app/services/chat.server.ts`
