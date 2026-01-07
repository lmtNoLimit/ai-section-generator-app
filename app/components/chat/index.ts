/**
 * Chat components barrel export
 * Provides centralized imports for chat UI components
 */

// Main component
export { ChatPanel } from './ChatPanel';
export type { ChatPanelProps } from './ChatPanel';

// Sub-components
export { MessageList } from './MessageList';
export type { MessageListProps } from './MessageList';

export { MessageItem } from './MessageItem';
export type { MessageItemProps } from './MessageItem';

export { ChatInput } from './ChatInput';
export type { ChatInputProps } from './ChatInput';

export { CodeBlock } from './CodeBlock';
export type { CodeBlockProps } from './CodeBlock';

export { TypingIndicator } from './TypingIndicator';

// Streaming/Progress components
export { BuildProgressIndicator } from './BuildProgressIndicator';
export type { BuildProgressIndicatorProps } from './BuildProgressIndicator';

export { StreamingCodeBlock } from './StreamingCodeBlock';
export type { StreamingCodeBlockProps } from './StreamingCodeBlock';

// Version components
export { VersionBadge } from './VersionBadge';
export type { VersionBadgeProps } from './VersionBadge';

export { VersionCard } from './VersionCard';
export type { VersionCardProps } from './VersionCard';

export { VersionTimeline } from './VersionTimeline';
export type { VersionTimelineProps } from './VersionTimeline';

// Hooks
export { useChat } from './hooks/useChat';
export type { UseChatOptions, ChatState, ChatAction, StreamingProgress } from './hooks/useChat';

export { useAutoScroll } from './hooks/useAutoScroll';
export type { UseAutoScrollOptions } from './hooks/useAutoScroll';

export { useStreamingProgress } from './hooks/useStreamingProgress';
export type { BuildPhase, StreamingProgressState } from './hooks/useStreamingProgress';

// Suggestion Chips (Phase 05)
export { SuggestionChips } from './SuggestionChips';
export type { SuggestionChipsProps } from './SuggestionChips';

// Suggestion utilities (Phase 05)
export { getSuggestions, getDetectedSectionType } from './utils/suggestion-engine';
export type { Suggestion, GetSuggestionsOptions } from './utils/suggestion-engine';

export { detectSectionType } from './utils/section-type-detector';
export type { SectionType } from './utils/section-type-detector';
