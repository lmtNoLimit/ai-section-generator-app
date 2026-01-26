/**
 * ChatPanelWrapper - Minimal wrapper for ChatPanel
 * Uses inline styles for flex layout (s-scroll-box unavailable in app-home)
 * Passes through version props for version display in messages
 */
import { ChatPanel } from "../chat";
import type { UIMessage, CodeVersion } from "../../types";

// Flex container style - enables ChatPanel to use flex:1 for scrollable messages
const wrapperStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
};

interface ChatPanelWrapperProps {
  conversationId: string;
  initialMessages: UIMessage[];
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  /** Callback when messages change (for syncing with parent state) */
  onMessagesChange?: (messages: UIMessage[]) => void;
  // Version props
  versions?: CodeVersion[];
  selectedVersionId?: string | null;
  activeVersionId?: string | null;
  onVersionSelect?: (versionId: string | null) => void;
  onVersionApply?: (versionId: string) => void;
  /** Show loading indicator during initial AI generation */
  isInitialGeneration?: boolean;
}

export function ChatPanelWrapper({
  conversationId,
  initialMessages,
  currentCode,
  onCodeUpdate,
  onMessagesChange,
  versions,
  selectedVersionId,
  activeVersionId,
  onVersionSelect,
  onVersionApply,
  isInitialGeneration = false,
}: ChatPanelWrapperProps) {
  return (
    <div style={wrapperStyle}>
      {/* Loading indicator during initial AI generation */}
      {isInitialGeneration && (
        <div role="status" aria-live="polite">
          <s-box padding="base" background="subdued">
            <s-stack gap="small" alignItems="center">
              <s-spinner size="base" accessibilityLabel="Loading" />
              <s-text color="subdued">Generating your section...</s-text>
            </s-stack>
          </s-box>
        </div>
      )}
      <ChatPanel
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentCode={currentCode}
        onCodeUpdate={onCodeUpdate}
        onMessagesChange={onMessagesChange}
        versions={versions}
        selectedVersionId={selectedVersionId}
        activeVersionId={activeVersionId}
        onVersionSelect={onVersionSelect}
        onVersionApply={onVersionApply}
      />
    </div>
  );
}
