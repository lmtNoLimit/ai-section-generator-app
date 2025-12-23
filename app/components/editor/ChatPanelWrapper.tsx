import { ChatPanel } from '../chat';
import type { UIMessage } from '../../types';

interface ChatPanelWrapperProps {
  conversationId: string;
  initialMessages: UIMessage[];
  currentCode: string;
  onCodeUpdate: (code: string) => void;
}

// Flex container style for proper height propagation
const wrapperStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  height: '100%',
  minHeight: 0,
};

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
    <div className="chat-panel-wrapper" style={wrapperStyle}>
      <ChatPanel
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentCode={currentCode}
        onCodeUpdate={onCodeUpdate}
      />
    </div>
  );
}
