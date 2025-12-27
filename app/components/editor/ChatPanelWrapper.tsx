/**
 * ChatPanelWrapper - Minimal wrapper for ChatPanel
 * Uses CSS class for flex layout (defined in ChatStyles)
 * Passes through version props for version display in messages
 */
import { ChatPanel } from "../chat";
import type { UIMessage, CodeVersion } from "../../types";

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
}: ChatPanelWrapperProps) {
  return (
    <div className="chat-panel-wrapper">
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
