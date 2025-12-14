import { ChatPanel } from '../chat';
import type { UIMessage } from '../../types';

interface ChatPanelWrapperProps {
  conversationId: string;
  initialMessages: UIMessage[];
  currentCode: string;
  onCodeUpdate: (code: string) => void;
}

/**
 * Wrapper for ChatPanel - minimal wrapper as ChatPanel has its own header
 */
export function ChatPanelWrapper({
  conversationId,
  initialMessages,
  currentCode,
  onCodeUpdate,
}: ChatPanelWrapperProps) {
  return (
    <div className="chat-panel-wrapper">
      <ChatPanel
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentCode={currentCode}
        onCodeUpdate={onCodeUpdate}
      />
    </div>
  );
}
